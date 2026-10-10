const http_status = require("http-status");
const subscriptionService = require("./subscription.service");
const sendResponse = require("../../../shared/sendResponse");
const catchAsync = require("../../../shared/catchAsync");

/**
 * Get all available subscription plans
 */
const getPlans = catchAsync(async (req, res) => {
  const plans = await subscriptionService.getSubscriptionPlans();

  sendResponse(res, {
    statusCode: http_status.OK,
    success: true,
    message: "Subscription plans retrieved successfully",
    data: plans,
  });
});

/**
 * Get specific plan details
 */
const getPlanDetails = catchAsync(async (req, res) => {
  const { planId } = req.params;
  const plan = await subscriptionService.getPlanDetails(planId);

  sendResponse(res, {
    statusCode: http_status.OK,
    success: true,
    message: "Plan details retrieved successfully",
    data: plan,
  });
});

/**
 * Create subscription
 */
const createSubscription = catchAsync(async (req, res) => {
  const userId = req.user.id || req.user._id;
  const { planId, stripeToken } = req.body;

  const subscription = await subscriptionService.createSubscription(
    userId,
    planId,
    stripeToken
  );

  sendResponse(res, {
    statusCode: http_status.CREATED,
    success: true,
    message: "Subscription created successfully",
    data: subscription,
  });
});

/**
 * Get user's active subscription
 */
const getActiveSubscription = catchAsync(async (req, res) => {
  const userId = req.user.id || req.user._id;
  const subscription = await subscriptionService.getUserSubscription(userId);

  sendResponse(res, {
    statusCode: http_status.OK,
    success: true,
    message: "Active subscription retrieved successfully",
    data: subscription,
  });
});

/**
 * Get user's subscription history
 */
const getSubscriptionHistory = catchAsync(async (req, res) => {
  const userId = req.user.id || req.user._id;
  const history = await subscriptionService.getSubscriptionHistory(userId);

  sendResponse(res, {
    statusCode: http_status.OK,
    success: true,
    message: "Subscription history retrieved successfully",
    data: history,
  });
});

/**
 * Cancel subscription
 */
const cancelSubscription = catchAsync(async (req, res) => {
  const userId = req.user.id || req.user._id;
  const { reason } = req.body;

  const subscription = await subscriptionService.cancelSubscription(
    userId,
    reason
  );

  sendResponse(res, {
    statusCode: http_status.OK,
    success: true,
    message: "Subscription cancelled successfully",
    data: subscription,
  });
});

/**
 * Pause subscription
 */
const pauseSubscription = catchAsync(async (req, res) => {
  const userId = req.user.id || req.user._id;
  const subscription = await subscriptionService.pauseSubscription(userId);

  sendResponse(res, {
    statusCode: http_status.OK,
    success: true,
    message: "Subscription paused successfully",
    data: subscription,
  });
});

/**
 * Resume subscription
 */
const resumeSubscription = catchAsync(async (req, res) => {
  const userId = req.user.id || req.user._id;
  const subscription = await subscriptionService.resumeSubscription(userId);

  sendResponse(res, {
    statusCode: http_status.OK,
    success: true,
    message: "Subscription resumed successfully",
    data: subscription,
  });
});

/**
 * Update subscription plan (upgrade/downgrade)
 */
const updateSubscriptionPlan = catchAsync(async (req, res) => {
  const userId = req.user.id || req.user._id;
  const { newPlanId } = req.body;

  const subscription = await subscriptionService.updateSubscriptionPlan(
    userId,
    newPlanId
  );

  sendResponse(res, {
    statusCode: http_status.OK,
    success: true,
    message: "Subscription plan updated successfully",
    data: subscription,
  });
});

/**
 * Check user's entitlements
 */
const checkEntitlements = catchAsync(async (req, res) => {
  const userId = req.user.id || req.user._id;
  const entitlements = await subscriptionService.checkEntitlements(userId);

  sendResponse(res, {
    statusCode: http_status.OK,
    success: true,
    message: "Entitlements checked successfully",
    data: entitlements,
  });
});

/**
 * Get subscription stats (admin only)
 */
const getSubscriptionStats = catchAsync(async (req, res) => {
  const stats = await subscriptionService.getSubscriptionStats();

  sendResponse(res, {
    statusCode: http_status.OK,
    success: true,
    message: "Subscription statistics retrieved successfully",
    data: stats,
  });
});

/**
 * Create subscription plan (admin only)
 */
const createPlan = catchAsync(async (req, res) => {
  const {
    planName,
    revenuecat_product_id,
    stripe_price_id,
    entitlements,
    billing_period,
    amount,
    currency,
    description,
  } = req.body;

  const plan = await subscriptionService.createSubscriptionPlan({
    planName,
    revenuecat_product_id,
    stripe_price_id,
    entitlements,
    billing_period,
    amount,
    currency,
    description,
  });

  sendResponse(res, {
    statusCode: http_status.CREATED,
    success: true,
    message: "Subscription plan created successfully",
    data: plan,
  });
});

/**
 * Update subscription plan details (admin only)
 */
const updatePlanDetails = catchAsync(async (req, res) => {
  const { planId } = req.params;
  const {
    planName,
    entitlements,
    billing_period,
    amount,
    currency,
    description,
    isActive,
  } = req.body;

  const plan = await subscriptionService.updateSubscriptionPlanDetails(
    planId,
    {
      planName,
      entitlements,
      billing_period,
      amount,
      currency,
      description,
      isActive,
    }
  );

  sendResponse(res, {
    statusCode: http_status.OK,
    success: true,
    message: "Subscription plan updated successfully",
    data: plan,
  });
});

module.exports = {
  getPlans,
  getPlanDetails,
  createSubscription,
  getActiveSubscription,
  getSubscriptionHistory,
  cancelSubscription,
  pauseSubscription,
  resumeSubscription,
  updateSubscriptionPlan,
  checkEntitlements,
  getSubscriptionStats,
  createPlan,
  updatePlanDetails,
};
