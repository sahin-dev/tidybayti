# RevenueCat Subscription Integration

This document provides a complete guide to the RevenueCat subscription system implemented in this project.

## Overview

This subscription system provides:
- Subscription plan management
- User subscription lifecycle management
- RevenueCat webhook integration
- Trial period management
- Cancellation and pause functionality
- Entitlements management
- Subscription statistics

## Environment Setup

Add the following environment variables to your `.env` file:

```
# RevenueCat Configuration
REVENUECAT_API_KEY=your_revenuecat_api_key
REVENUECAT_SECRET_KEY=your_revenuecat_secret_key
REVENUECAT_WEBHOOK_SECRET=your_revenuecat_webhook_secret

# Stripe Configuration (if using Stripe integration)
STRIPE_SECRET_KEY=your_stripe_secret_key
```

## Database Models

### SubscriptionPlan
Represents a subscription plan available in the system.

Fields:
- `planName` - Name of the plan (e.g., "Premium", "Basic")
- `revenuecat_product_id` - RevenueCat product identifier
- `stripe_price_id` - Stripe price identifier
- `entitlements` - Array of features included in the plan
- `billing_period` - "Monthly" or "Yearly"
- `amount` - Price of the subscription
- `currency` - Currency code (default: "BHD")
- `description` - Plan description
- `isActive` - Whether the plan is active

### Subscription
Represents a user's subscription.

Key Fields:
- `user` - Reference to the User
- `revenuecat_customer_id` - RevenueCat customer ID
- `revenuecat_product_id` - Product ID
- `revenuecat_subscription_id` - Subscription ID in RevenueCat
- `subscription_status` - "active", "inactive", "cancelled", "pending", "paused", "expired"
- `subscription_start_date` - When the subscription started
- `subscription_end_date` - When the subscription ends
- `trial_start_date` - Trial period start
- `trial_end_date` - Trial period end
- `trial_used` - Whether trial was used
- `active_entitlements` - Array of active features
- `cancellation_reason` - Reason for cancellation
- `refund_amount` & `refund_date` - Refund information

## API Endpoints

### Public Endpoints

#### Get All Plans
```
GET /subscription/plans
Response: Array of subscription plans
```

#### Get Plan Details
```
GET /subscription/plans/:planId
Response: Specific subscription plan details
```

### User Endpoints (Authenticated)

#### Create Subscription
```
POST /subscription/create
Body: {
  planId: "plan_id",
  stripeToken: "stripe_token"
}
Response: Created subscription
```

#### Get Active Subscription
```
GET /subscription/active
Response: User's active subscription
```

#### Get Subscription History
```
GET /subscription/history
Response: Array of all user subscriptions
```

#### Cancel Subscription
```
POST /subscription/cancel
Body: {
  reason: "user_cancelled" // optional
}
Response: Cancelled subscription
```

#### Pause Subscription
```
POST /subscription/pause
Response: Paused subscription
```

#### Resume Subscription
```
POST /subscription/resume
Response: Resumed subscription
```

#### Upgrade/Downgrade Plan
```
POST /subscription/upgrade-downgrade
Body: {
  newPlanId: "new_plan_id"
}
Response: Updated subscription
```

#### Check Entitlements
```
GET /subscription/check-entitlements
Response: {
  hasAccess: boolean,
  entitlements: [array of features],
  planName: string,
  subscriptionStatus: string,
  expiresAt: date
}
```

### Admin Endpoints

#### Get Subscription Statistics
```
GET /subscription/stats
Response: {
  total_subscriptions: number,
  active_subscriptions: number,
  cancelled_subscriptions: number,
  paused_subscriptions: number,
  expired_subscriptions: number,
  pending_subscriptions: number
}
```

#### Create Subscription Plan
```
POST /subscription/admin/plans/create
Body: {
  planName: "Premium",
  revenuecat_product_id: "premium_monthly",
  stripe_price_id: "price_123",
  entitlements: ["feature1", "feature2"],
  billing_period: "Monthly",
  amount: 9.99,
  currency: "BHD",
  description: "Premium plan description"
}
Response: Created plan
```

#### Update Subscription Plan
```
PUT /subscription/admin/plans/:planId
Body: {
  planName: "Premium Plus",
  entitlements: ["feature1", "feature2", "feature3"],
  billing_period: "Monthly",
  amount: 12.99,
  currency: "BHD",
  description: "Updated description",
  isActive: true
}
Response: Updated plan
```

## Webhook Events

RevenueCat sends webhooks for various subscription events. The webhook endpoint is:
```
POST /subscription/webhook/revenuecat
```

### Supported Events

1. **INITIAL_PURCHASE**
   - Triggered when user creates new subscription
   - Updates subscription status to "active"
   - Updates user's subscription fields

2. **RENEWAL**
   - Triggered on subscription renewal
   - Extends subscription period
   - Updates next payment date

3. **EXPIRATION**
   - Triggered when subscription expires
   - Updates status to "expired"
   - Removes subscription from active

4. **CANCELLATION**
   - Triggered when subscription is cancelled
   - Updates status to "cancelled"
   - Records cancellation reason

5. **BILLING_ISSUE**
   - Triggered when payment fails
   - Updates status to "inactive"
   - Marks payment as failed

6. **REFUND**
   - Triggered when refund is issued
   - Records refund amount and date

7. **TRANSFER**
   - Triggered when subscription transferred between accounts

### Webhook Configuration

To set up webhooks in RevenueCat dashboard:

1. Go to RevenueCat Dashboard > Settings > Integrations
2. Configure webhooks with your endpoint:
   - URL: `https://your-api.com/subscription/webhook/revenuecat`
   - Method: POST
   - Add custom header: `X-Platform: stripe`

3. RevenueCat will send webhook requests with signature in headers
4. Validate signature using: `validateWebhookSignature(signature, body, webhook_secret)`

## Service Methods

### Subscription Service

#### createOrGetRevenueCatCustomer(userId, email)
Creates or retrieves a RevenueCat customer.

#### getSubscriptionPlans()
Returns all active subscription plans.

#### createSubscription(userId, planId, stripeToken)
Creates a new subscription for a user.

#### getUserSubscription(userId)
Gets user's active subscription.

#### updateSubscriptionStatus(revenuecatCustomerId, data)
Updates subscription status based on webhook event.

#### cancelSubscription(userId, reason)
Cancels a user's subscription.

#### pauseSubscription(userId)
Pauses a user's subscription.

#### resumeSubscription(userId)
Resumes a paused subscription.

#### updateSubscriptionPlan(userId, newPlanId)
Upgrades or downgrades subscription plan.

#### checkEntitlements(userId)
Checks active entitlements for a user.

#### hasActiveSubscription(userId)
Returns boolean indicating if user has active subscription.

#### validateWebhookSignature(signature, body, secret)
Validates RevenueCat webhook signature.

## Usage Examples

### Create a Subscription Plan (Admin)
```javascript
POST /subscription/admin/plans/create
{
  "planName": "Premium",
  "revenuecat_product_id": "premium_monthly",
  "stripe_price_id": "price_123abc",
  "entitlements": ["advanced_recipes", "meal_planning", "grocery_integration"],
  "billing_period": "Monthly",
  "amount": 9.99,
  "currency": "BHD",
  "description": "Premium subscription with advanced features"
}
```

### Subscribe User to Plan
```javascript
POST /subscription/create
{
  "planId": "60d5ec49f5c4a500f8c0d1a1",
  "stripeToken": "tok_visa_123"
}
```

### Check User Entitlements
```javascript
const entitlements = await subscriptionService.checkEntitlements(userId);

if (entitlements.hasAccess && entitlements.entitlements.includes("meal_planning")) {
  // Allow access to meal planning feature
}
```

### Handle Failed Payments
```javascript
// Triggered by BILLING_ISSUE webhook event
// Subscription automatically marked as inactive
// Send notification to user about payment failure
```

## Middleware Integration

To protect routes with subscription requirements:

```javascript
// In your middleware
const { checkEntitlements } = require('./subscription.service');

const requireSubscription = async (req, res, next) => {
  const entitlements = await checkEntitlements(req.user.id);
  
  if (!entitlements.hasAccess) {
    return res.status(403).json({
      message: "This feature requires an active subscription"
    });
  }
  
  req.entitlements = entitlements;
  next();
};

// Usage in routes
router.post("/meal-plan", requireSubscription, mealPlanController.create);
```

## Testing Webhooks Locally

For local testing with ngrok:

```bash
# Terminal 1: Start ngrok
ngrok http 3000

# Terminal 2: Update RevenueCat webhook URL to ngrok URL
# https://your-ngrok-url/subscription/webhook/revenuecat
```

Then test with:
```bash
curl -X POST http://localhost:3000/subscription/webhook/revenuecat \
  -H "Content-Type: application/json" \
  -H "X-RevenueCat-Signature: your_signature" \
  -d '{
    "event": {
      "type": "INITIAL_PURCHASE",
      "data": {...}
    }
  }'
```

## Error Handling

Common error responses:

```javascript
// Plan not found
{ statusCode: 404, message: "Plan not found" }

// User already has active subscription
{ statusCode: 409, message: "User already has an active subscription" }

// No active subscription
{ statusCode: 404, message: "No active subscription found" }

// Invalid webhook signature
{ statusCode: 401, message: "Invalid webhook signature" }
```

## Future Enhancements

- [ ] Subscription trial period countdown
- [ ] Automatic invoice generation
- [ ] Multiple payment method support
- [ ] Subscription analytics dashboard
- [ ] Automated email notifications
- [ ] Promo code/discount support
- [ ] Usage-based billing
- [ ] Subscription tier recommendations

## Support

For issues or questions:
1. Check RevenueCat documentation: https://docs.revenuecat.com
2. Review webhook logs in RevenueCat dashboard
3. Check application logs for errors

## References

- RevenueCat Docs: https://docs.revenuecat.com
- Stripe Integration: https://docs.revenuecat.com/docs/stripe
- Webhook Events: https://docs.revenuecat.com/docs/webhooks
