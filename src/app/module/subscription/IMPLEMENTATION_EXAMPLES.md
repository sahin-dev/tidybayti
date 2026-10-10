# RevenueCat Subscription - Implementation Examples

## Integration Examples

### 1. Protect Routes with Subscription Check

```javascript
// In your middleware file (middleware/subscriptionGuard.js)
const { checkEntitlements } = require('../module/subscription/subscription.service');
const ApiError = require('../error/ApiError');

const requireSubscription = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const entitlements = await checkEntitlements(userId);

    if (!entitlements.hasAccess) {
      throw new ApiError(403, "Active subscription required to access this feature");
    }

    req.entitlements = entitlements;
    next();
  } catch (error) {
    next(error);
  }
};

const requireEntitlement = (requiredEntitlement) => {
  return async (req, res, next) => {
    try {
      const entitlements = req.entitlements || await checkEntitlements(req.user.id);

      if (!entitlements.entitlements.includes(requiredEntitlement)) {
        throw new ApiError(403, `This feature requires "${requiredEntitlement}" entitlement`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { requireSubscription, requireEntitlement };
```

### 2. Use Middleware in Routes

```javascript
// In your recipe routes
const { requireSubscription, requireEntitlement } = require('../middleware/subscriptionGuard');

router.post(
  '/meal-plan',
  requireSubscription,
  requireEntitlement('meal_planning'),
  mealPlanController.create
);

router.post(
  '/shopping-list',
  requireSubscription,
  requireEntitlement('grocery_integration'),
  shoppingListController.create
);

router.get(
  '/premium-recipes',
  requireSubscription,
  requireEntitlement('advanced_recipes'),
  recipeController.getPremiumRecipes
);
```

### 3. Update User Model with Subscription Info

```javascript
// In User.js model
const userSchema = new Schema({
  // ... existing fields ...
  
  isSubscribed: {
    type: Boolean,
    default: false
  },
  subscriptionExpires: {
    type: Date
  },
  revenuecat_customer_id: {
    type: String,
    unique: true,
    sparse: true
  },
  subscription_tier: {
    type: String,
    enum: ['free', 'premium', 'pro'],
    default: 'free'
  },
  trial_ends: {
    type: Date
  },
  last_subscription_status: {
    type: String,
    default: 'inactive'
  }
});

// Add method to check if user has active subscription
userSchema.methods.hasActiveSubscription = async function() {
  const { checkEntitlements } = require('./subscription/subscription.service');
  const entitlements = await checkEntitlements(this._id);
  return entitlements.hasAccess;
};

// Add method to get user's subscription tier
userSchema.methods.getSubscriptionTier = async function() {
  const { getUserSubscription } = require('./subscription/subscription.service');
  try {
    const subscription = await getUserSubscription(this._id);
    return subscription.plan_name || 'free';
  } catch {
    return 'free';
  }
};
```

### 4. Email Notification on Subscription Events

```javascript
// In webhook.handler.js (add to handlers)
const sendEmail = require('../../util/sendEmail');
const emailTemplates = require('../../mail');

const handleInitialPurchase = async (eventData) => {
  try {
    const subscription = await subscriptionService.updateSubscriptionStatus(...);
    
    // Send welcome email
    const user = await require("../user/User").findById(subscription.user);
    await sendEmail({
      to: user.email,
      subject: 'Welcome to Premium Subscription',
      html: emailTemplates.subscriptionWelcomeTemplate({
        userName: user.firstName,
        planName: subscription.plan_name,
        expiryDate: subscription.subscription_end_date,
        entitlements: subscription.active_entitlements
      })
    });

    return subscription;
  } catch (error) {
    logger.error("Error in initial purchase:", error);
    throw error;
  }
};

const handleCancellation = async (eventData) => {
  try {
    const subscription = await subscriptionService.updateSubscriptionStatus(...);
    
    // Send cancellation confirmation email
    const user = await require("../user/User").findById(subscription.user);
    await sendEmail({
      to: user.email,
      subject: 'Subscription Cancelled',
      html: emailTemplates.subscriptionCancelledTemplate({
        userName: user.firstName,
        planName: subscription.plan_name,
        reason: eventData.cancellation_reason
      })
    });

    return subscription;
  } catch (error) {
    logger.error("Error in cancellation:", error);
    throw error;
  }
};

const handleBillingIssue = async (eventData) => {
  try {
    const subscription = await subscriptionService.updateSubscriptionStatus(...);
    
    // Send payment failed email
    const user = await require("../user/User").findById(subscription.user);
    await sendEmail({
      to: user.email,
      subject: 'Payment Failed - Action Required',
      html: emailTemplates.paymentFailedTemplate({
        userName: user.firstName,
        planName: subscription.plan_name,
        updatePaymentUrl: `${config.base_url}/subscription/update-payment`
      })
    });

    return subscription;
  } catch (error) {
    logger.error("Error in billing issue:", error);
    throw error;
  }
};
```

### 5. Dashboard Statistics

```javascript
// Create subscription stats endpoint
const router = require('express').Router();
const { Subscription, SubscriptionPlan } = require('./subscription.model');

router.get('/dashboard/stats', async (req, res) => {
  try {
    const totalRevenue = await Subscription.aggregate([
      {
        $match: {
          subscription_status: 'active',
          last_payment_status: 'succeed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$last_payment_amount' }
        }
      }
    ]);

    const churnRate = await Subscription.aggregate([
      {
        $match: {
          subscription_status: 'cancelled'
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 }
        }
      }
    ]);

    const subscriptionsByPlan = await Subscription.aggregate([
      {
        $match: { subscription_status: 'active' }
      },
      {
        $group: {
          _id: '$plan_name',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      totalRevenue: totalRevenue[0]?.total || 0,
      churnRate: churnRate[0]?.count || 0,
      subscriptionsByPlan
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### 6. Trial Period Countdown

```javascript
// Add to subscription controller
const getTrialInfo = catchAsync(async (req, res) => {
  const userId = req.user.id || req.user._id;
  const subscription = await Subscription.findOne({
    user: userId,
    subscription_status: { $in: ['active', 'pending'] }
  });

  if (!subscription || !subscription.trial_end_date) {
    return sendResponse(res, {
      statusCode: 200,
      success: true,
      data: {
        hasTrialActive: false,
        daysRemaining: 0
      }
    });
  }

  const now = new Date();
  const daysRemaining = Math.ceil((subscription.trial_end_date - now) / (1000 * 60 * 60 * 24));
  const hasTrialActive = daysRemaining > 0 && !subscription.trial_used;

  sendResponse(res, {
    statusCode: 200,
    success: true,
    data: {
      hasTrialActive,
      daysRemaining: Math.max(0, daysRemaining),
      trialStartDate: subscription.trial_start_date,
      trialEndDate: subscription.trial_end_date,
      message: hasTrialActive 
        ? `Your trial expires in ${daysRemaining} days` 
        : 'Trial period has ended'
    }
  });
});
```

### 7. Promo Code Support

```javascript
// Add to subscription model
const subscriptionSchema = new Schema({
  // ... existing fields ...
  
  promo_code: {
    type: String,
    sparse: true
  },
  discount_amount: {
    type: Number,
    default: 0
  },
  discount_percentage: {
    type: Number,
    default: 0
  },
  final_amount: {
    type: Number
  }
});

// Add promo code validation
const applyPromoCode = catchAsync(async (req, res) => {
  const { promoCode, planId } = req.body;
  
  // Verify promo code exists and is valid
  const promo = await PromoCode.findOne({
    code: promoCode,
    isActive: true,
    expiryDate: { $gt: new Date() }
  });

  if (!promo) {
    throw new ApiError(404, 'Invalid or expired promo code');
  }

  // Calculate discount
  const plan = await SubscriptionPlan.findById(planId);
  const discountAmount = plan.amount * (promo.discountPercentage / 100);
  const finalAmount = plan.amount - discountAmount;

  sendResponse(res, {
    statusCode: 200,
    success: true,
    data: {
      originalAmount: plan.amount,
      discountPercentage: promo.discountPercentage,
      discountAmount,
      finalAmount,
      code: promoCode
    }
  });
});
```

### 8. Handle Subscription Expiry with Cron Job

```javascript
// In agenda/jobs.js
const { agenda } = require('./init');
const { Subscription } = require('../subscription/subscription.model');
const User = require('../user/User');

agenda.define('check-subscription-expiry', async (job) => {
  try {
    const expiringSubscriptions = await Subscription.find({
      subscription_status: 'active',
      subscription_end_date: {
        $lt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        $gt: new Date()
      }
    }).populate('user');

    for (const subscription of expiringSubscriptions) {
      // Send reminder email
      await sendEmail({
        to: subscription.user.email,
        subject: 'Your Subscription is Expiring Soon',
        html: `Your subscription will expire on ${subscription.subscription_end_date}`
      });
    }

    console.log(`Processed ${expiringSubscriptions.length} expiring subscriptions`);
  } catch (error) {
    console.error('Expiry check job failed:', error);
  }
});

// Schedule job to run daily at 8 AM
agenda.every('0 8 * * *', 'check-subscription-expiry');
```

### 9. Subscription Upgrade/Downgrade Analytics

```javascript
const trackSubscriptionChange = async (userId, oldPlan, newPlan, changeType) => {
  try {
    const analyticsData = {
      user_id: userId,
      timestamp: new Date(),
      change_type: changeType, // 'upgrade', 'downgrade', 'sidegrade'
      from_plan: oldPlan,
      to_plan: newPlan,
      price_difference: newPlan.amount - oldPlan.amount
    };

    // Log to database or analytics service
    await SubscriptionAnalytics.create(analyticsData);

    // Send analytics to external service (Mixpanel, Amplitude, etc.)
    if (config.analytics) {
      await analyticsService.track(userId, 'subscription_changed', analyticsData);
    }
  } catch (error) {
    logger.error('Failed to track subscription change:', error);
  }
};
```

### 10. Test Data Setup Script

```javascript
// scripts/setup-subscription-plans.js
const mongoose = require('mongoose');
const { SubscriptionPlan } = require('./src/app/module/subscription/subscription.model');

const plans = [
  {
    planName: "Free",
    revenuecat_product_id: "free",
    entitlements: ["basic_recipes", "meal_search"],
    billing_period: "Monthly",
    amount: 0,
    currency: "BHD",
    description: "Free plan with basic features"
  },
  {
    planName: "Premium",
    revenuecat_product_id: "premium_monthly",
    stripe_price_id: "price_1234",
    entitlements: ["advanced_recipes", "meal_planning", "grocery_integration", "nutrition_tracker"],
    billing_period: "Monthly",
    amount: 9.99,
    currency: "BHD",
    description: "Monthly premium plan"
  },
  {
    planName: "Premium Yearly",
    revenuecat_product_id: "premium_yearly",
    stripe_price_id: "price_5678",
    entitlements: ["advanced_recipes", "meal_planning", "grocery_integration", "nutrition_tracker"],
    billing_period: "Yearly",
    amount: 99.99,
    currency: "BHD",
    description: "Yearly premium plan with 20% discount"
  }
];

async function setupPlans() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    
    for (const plan of plans) {
      await SubscriptionPlan.findOneAndUpdate(
        { revenuecat_product_id: plan.revenuecat_product_id },
        plan,
        { upsert: true, new: true }
      );
      console.log(`✓ Created/Updated plan: ${plan.planName}`);
    }

    console.log('✓ All subscription plans setup completed');
    process.exit(0);
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

setupPlans();
```

## Common Patterns

### Pattern 1: Feature Access Control
```javascript
if (user.entitlements.includes('meal_planning')) {
  // Show meal planning UI
}
```

### Pattern 2: Trial vs Paid
```javascript
const isTrialUser = subscription?.trial_used === false;
const isPaidUser = subscription?.subscription_status === 'active';
```

### Pattern 3: Subscription Status Display
```javascript
const getStatusDisplay = (subscription) => {
  if (!subscription) return 'No Subscription';
  if (subscription.subscription_status === 'active') {
    return `Active until ${subscription.subscription_end_date.toLocaleDateString()}`;
  }
  if (subscription.subscription_status === 'paused') return 'Paused';
  if (subscription.subscription_status === 'cancelled') return 'Cancelled';
  return subscription.subscription_status;
};
```
