const axios = require("axios");
const crypto = require("crypto-js");
const { Subscription, SubscriptionPlan } = require("./subscription.model");
const config = require("../../../config");
const ApiError = require("../../../error/ApiError");
const http_status = require("http-status");

// RevenueCat API Configuration
const RC_API_BASE = "https://api.revenuecat.com/v1";
const RC_HEADERS = {
  "X-Platform": "stripe",
  Authorization: `Bearer ${config.revenuecat.secret_key}`,
};

/**
 * Create or get RevenueCat customer
 */
const createOrGetRevenueCatCustomer = async (userId, email) => {
  try {
    const response = await axios.get(`${RC_API_BASE}/customers/${userId}`, {
      headers: RC_HEADERS,
    });
    return response.data.customer;
  } catch (error) {
    if (error.response?.status === 404) {
      // Customer doesn't exist, create new one
      const createResponse = await axios.post(
        `${RC_API_BASE}/customers`,
        {
          app_user_id: userId,
          email: email,
        },
        { headers: RC_HEADERS }
      );
      return createResponse.data.customer;
    }
    throw error;
  }
};

/**
 * Get available subscription plans from RevenueCat
 */
const getSubscriptionPlans = async () => {
  try {
    const plans = await SubscriptionPlan.find({ isActive: true });
    return plans;
  } catch (error) {
    throw new ApiError(
      http_status.INTERNAL_SERVER_ERROR,
      "Failed to fetch subscription plans"
    );
  }
};

/**
 * Get plan details from RevenueCat
 */
const getPlanDetails = async (productId) => {
  try {
    const plan = await SubscriptionPlan.findOne({ revenuecat_product_id: productId });
    if (!plan) {
      throw new ApiError(http_status.NOT_FOUND, "Plan not found");
    }
    return plan;
  } catch (error) {
    throw error;
  }
};

/**
 * Create subscription
 */
const createSubscription = async (userId, planId, stripeToken) => {
  try {
    // Get plan details
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      throw new ApiError(http_status.NOT_FOUND, "Plan not found");
    }

    // Create RevenueCat customer
    const user = await require("../user/User").findById(userId);
    const rcCustomer = await createOrGetRevenueCatCustomer(userId.toString(), user.email);

    // Check existing subscription
    const existingSubscription = await Subscription.findOne({
      user: userId,
      subscription_status: { $in: ["active", "pending"] },
    });

    if (existingSubscription) {
      throw new ApiError(
        http_status.CONFLICT,
        "User already has an active subscription"
      );
    }

    // Create subscription in database
    const subscription = new Subscription({
      user: userId,
      revenuecat_customer_id: rcCustomer.id,
      revenuecat_product_id: plan.revenuecat_product_id,
      stripe_price_id: plan.stripe_price_id,
      plan_name: plan.planName,
      billing_period: plan.billing_period.toLowerCase(),
      subscription_status: "pending",
      original_purchase_date: new Date(),
      active_entitlements: plan.entitlements || [],
      trial_used: false,
    });

    await subscription.save();

    return subscription;
  } catch (error) {
    throw error;
  }
};

/**
 * Get user subscription
 */
const getUserSubscription = async (userId) => {
  try {
    const subscription = await Subscription.findOne({
      user: userId,
      subscription_status: { $in: ["active", "pending", "paused"] },
    }).populate("user");

    if (!subscription) {
      throw new ApiError(http_status.NOT_FOUND, "No active subscription found");
    }

    return subscription;
  } catch (error) {
    throw error;
  }
};

/**
 * Update subscription status
 */
const updateSubscriptionStatus = async (revenuecatCustomerId, data) => {
  try {
    const subscription = await Subscription.findOne({
      revenuecat_customer_id: revenuecatCustomerId,
    });

    if (!subscription) {
      throw new ApiError(http_status.NOT_FOUND, "Subscription not found");
    }

    // Update subscription based on event type
    if (data.type === "INITIAL_PURCHASE") {
      subscription.subscription_status = "active";
      subscription.subscription_start_date = new Date(data.purchase_date);
      subscription.next_payment_date = new Date(data.expiration_date);
      subscription.original_purchase_date = new Date(data.purchase_date);
    } else if (data.type === "RENEWAL") {
      subscription.subscription_status = "active";
      subscription.last_payment_date = new Date(data.purchase_date);
      subscription.next_payment_date = new Date(data.expiration_date);
      subscription.last_payment_status = "succeed";
    } else if (data.type === "EXPIRATION") {
      subscription.subscription_status = "expired";
      subscription.subscription_end_date = new Date(data.expiration_date);
    } else if (data.type === "CANCELLATION") {
      subscription.subscription_status = "cancelled";
      subscription.cancellation_date = new Date();
      subscription.cancellation_reason = data.cancellation_reason || "user_cancelled";
      subscription.subscription_end_date = new Date();
    } else if (data.type === "BILLING_ISSUE") {
      subscription.subscription_status = "inactive";
      subscription.last_payment_status = "failed";
    } else if (data.type === "REFUND") {
      subscription.refund_amount = data.refund_amount;
      subscription.refund_date = new Date();
    }

    subscription.last_webhook_event_id = data.event_id;
    subscription.last_webhook_date = new Date();

    await subscription.save();

    return subscription;
  } catch (error) {
    throw error;
  }
};

/**
 * Cancel subscription
 */
const cancelSubscription = async (userId, reason = "user_cancelled") => {
  try {
    const subscription = await Subscription.findOne({
      user: userId,
      subscription_status: "active",
    });

    if (!subscription) {
      throw new ApiError(http_status.NOT_FOUND, "No active subscription found");
    }

    subscription.subscription_status = "cancelled";
    subscription.cancellation_date = new Date();
    subscription.cancellation_reason = reason;
    subscription.subscription_end_date = new Date();

    await subscription.save();

    return subscription;
  } catch (error) {
    throw error;
  }
};

/**
 * Pause subscription
 */
const pauseSubscription = async (userId) => {
  try {
    const subscription = await Subscription.findOne({
      user: userId,
      subscription_status: "active",
    });

    if (!subscription) {
      throw new ApiError(http_status.NOT_FOUND, "No active subscription found");
    }

    subscription.subscription_status = "paused";

    await subscription.save();

    return subscription;
  } catch (error) {
    throw error;
  }
};

/**
 * Resume subscription
 */
const resumeSubscription = async (userId) => {
  try {
    const subscription = await Subscription.findOne({
      user: userId,
      subscription_status: "paused",
    });

    if (!subscription) {
      throw new ApiError(http_status.NOT_FOUND, "No paused subscription found");
    }

    subscription.subscription_status = "active";

    await subscription.save();

    return subscription;
  } catch (error) {
    throw error;
  }
};

/**
 * Upgrade/Downgrade subscription
 */
const updateSubscriptionPlan = async (userId, newPlanId) => {
  try {
    const newPlan = await SubscriptionPlan.findById(newPlanId);
    if (!newPlan) {
      throw new ApiError(http_status.NOT_FOUND, "Plan not found");
    }

    const subscription = await Subscription.findOne({
      user: userId,
      subscription_status: "active",
    });

    if (!subscription) {
      throw new ApiError(http_status.NOT_FOUND, "No active subscription found");
    }

    subscription.revenuecat_product_id = newPlan.revenuecat_product_id;
    subscription.stripe_price_id = newPlan.stripe_price_id;
    subscription.plan_name = newPlan.planName;
    subscription.billing_period = newPlan.billing_period.toLowerCase();
    subscription.active_entitlements = newPlan.entitlements || [];

    await subscription.save();

    return subscription;
  } catch (error) {
    throw error;
  }
};

/**
 * Get subscription history
 */
const getSubscriptionHistory = async (userId) => {
  try {
    const history = await Subscription.find({ user: userId })
      .populate("user")
      .sort({ createdAt: -1 });

    return history;
  } catch (error) {
    throw new ApiError(
      http_status.INTERNAL_SERVER_ERROR,
      "Failed to fetch subscription history"
    );
  }
};

/**
 * Check if user has active subscription
 */
const hasActiveSubscription = async (userId) => {
  try {
    const subscription = await Subscription.findOne({
      user: userId,
      subscription_status: "active",
    });

    return !!subscription;
  } catch (error) {
    return false;
  }
};

/**
 * Check entitlements
 */
const checkEntitlements = async (userId) => {
  try {
    const subscription = await Subscription.findOne({
      user: userId,
      subscription_status: "active",
    });

    if (!subscription) {
      return {
        hasAccess: false,
        entitlements: [],
      };
    }

    return {
      hasAccess: true,
      entitlements: subscription.active_entitlements || [],
      planName: subscription.plan_name,
      subscriptionStatus: subscription.subscription_status,
      expiresAt: subscription.subscription_end_date,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Validate RevenueCat webhook signature
 */
const validateWebhookSignature = (signature, body, secret) => {
  try {
    const computed = crypto
      .HmacSHA256(JSON.stringify(body), secret)
      .toString(crypto.enc.Base64);
    return computed === signature;
  } catch (error) {
    return false;
  }
};

/**
 * Create subscription plan
 */
const createSubscriptionPlan = async (planData) => {
  try {
    const existingPlan = await SubscriptionPlan.findOne({
      revenuecat_product_id: planData.revenuecat_product_id,
    });

    if (existingPlan) {
      throw new ApiError(http_status.CONFLICT, "Plan already exists");
    }

    const plan = new SubscriptionPlan({
      planName: planData.planName,
      revenuecat_product_id: planData.revenuecat_product_id,
      stripe_price_id: planData.stripe_price_id,
      entitlements: planData.entitlements || [],
      billing_period: planData.billing_period,
      amount: planData.amount,
      currency: planData.currency,
      description: planData.description,
      isActive: true,
    });

    await plan.save();

    return plan;
  } catch (error) {
    throw error;
  }
};

/**
 * Update subscription plan
 */
const updateSubscriptionPlanDetails = async (planId, planData) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndUpdate(
      planId,
      {
        planName: planData.planName,
        entitlements: planData.entitlements,
        billing_period: planData.billing_period,
        amount: planData.amount,
        currency: planData.currency,
        description: planData.description,
        isActive: planData.isActive,
      },
      { new: true }
    );

    if (!plan) {
      throw new ApiError(http_status.NOT_FOUND, "Plan not found");
    }

    return plan;
  } catch (error) {
    throw error;
  }
};

/**
 * Get subscription stats
 */
const getSubscriptionStats = async () => {
  try {
    const stats = {
      total_subscriptions: await Subscription.countDocuments(),
      active_subscriptions: await Subscription.countDocuments({
        subscription_status: "active",
      }),
      cancelled_subscriptions: await Subscription.countDocuments({
        subscription_status: "cancelled",
      }),
      paused_subscriptions: await Subscription.countDocuments({
        subscription_status: "paused",
      }),
      expired_subscriptions: await Subscription.countDocuments({
        subscription_status: "expired",
      }),
      pending_subscriptions: await Subscription.countDocuments({
        subscription_status: "pending",
      }),
    };

    return stats;
  } catch (error) {
    throw new ApiError(
      http_status.INTERNAL_SERVER_ERROR,
      "Failed to fetch subscription stats"
    );
  }
};

module.exports = {
  createOrGetRevenueCatCustomer,
  getSubscriptionPlans,
  getPlanDetails,
  createSubscription,
  getUserSubscription,
  updateSubscriptionStatus,
  cancelSubscription,
  pauseSubscription,
  resumeSubscription,
  updateSubscriptionPlan,
  getSubscriptionHistory,
  hasActiveSubscription,
  checkEntitlements,
  validateWebhookSignature,
  createSubscriptionPlan,
  updateSubscriptionPlanDetails,
  getSubscriptionStats,
};
