const http_status = require("http-status");
const subscriptionService = require("./subscription.service");
const ApiError = require("../../../error/ApiError");
const catchAsync = require("../../../shared/catchAsync");
const sendResponse = require("../../../shared/sendResponse");
const { logger } = require("../../../shared/logger");
const config = require("../../../config");

/**
 * Process RevenueCat Webhook Events
 * Event types:
 * - INITIAL_PURCHASE: New subscription created
 * - RENEWAL: Subscription renewed
 * - EXPIRATION: Subscription expired
 * - CANCELLATION: Subscription cancelled
 * - BILLING_ISSUE: Payment failed
 * - REFUND: Subscription refunded
 * - TRANSFER: Subscription transferred
 */
const handleRevenueCatWebhook = catchAsync(async (req, res) => {
  try {
    const { signature } = req.headers;
    const body = req.body;

    // Validate webhook signature
    const isValid = subscriptionService.validateWebhookSignature(
      signature,
      body,
      config.revenuecat.webhook_secret
    );

    if (!isValid) {
      logger.error("Invalid RevenueCat webhook signature");
      throw new ApiError(http_status.UNAUTHORIZED, "Invalid webhook signature");
    }

    logger.info(`Processing RevenueCat webhook: ${body.event?.type}`);

    // Process different event types
    const eventType = body.event?.type;
    const eventData = body.event?.data || {};

    switch (eventType) {
      case "INITIAL_PURCHASE":
        await handleInitialPurchase(eventData);
        break;
      case "RENEWAL":
        await handleRenewal(eventData);
        break;
      case "EXPIRATION":
        await handleExpiration(eventData);
        break;
      case "CANCELLATION":
        await handleCancellation(eventData);
        break;
      case "BILLING_ISSUE":
        await handleBillingIssue(eventData);
        break;
      case "REFUND":
        await handleRefund(eventData);
        break;
      case "TRANSFER":
        await handleTransfer(eventData);
        break;
      default:
        logger.warn(`Unknown event type: ${eventType}`);
    }

    // Return success response
    sendResponse(res, {
      statusCode: http_status.OK,
      success: true,
      message: "Webhook processed successfully",
      data: {
        eventType,
        processed: true,
      },
    });
  } catch (error) {
    logger.error("Webhook processing error:", error);
    throw error;
  }
});

/**
 * Handle initial purchase event
 */
const handleInitialPurchase = async (eventData) => {
  try {
    const customerData = eventData.subscriber || {};
    const subscription = await subscriptionService.updateSubscriptionStatus(
      customerData.app_user_id,
      {
        type: "INITIAL_PURCHASE",
        purchase_date: customerData.original_purchase_date,
        expiration_date: customerData.expiration_date,
        event_id: eventData.event_id,
      }
    );

    logger.info(`Initial purchase processed for customer: ${customerData.app_user_id}`);

    // Update user subscription status
    const User = require("../user/User");
    await User.findByIdAndUpdate(
      subscription.user,
      {
        isSubscribed: true,
        subscriptionExpires: subscription.subscription_end_date,
      }
    );

    return subscription;
  } catch (error) {
    logger.error("Error handling initial purchase:", error);
    throw error;
  }
};

/**
 * Handle renewal event
 */
const handleRenewal = async (eventData) => {
  try {
    const customerData = eventData.subscriber || {};
    const subscription = await subscriptionService.updateSubscriptionStatus(
      customerData.app_user_id,
      {
        type: "RENEWAL",
        purchase_date: customerData.purchase_date,
        expiration_date: customerData.expiration_date,
        event_id: eventData.event_id,
      }
    );

    logger.info(`Renewal processed for customer: ${customerData.app_user_id}`);

    // Update user subscription status
    const User = require("../user/User");
    await User.findByIdAndUpdate(
      subscription.user,
      {
        isSubscribed: true,
        subscriptionExpires: subscription.subscription_end_date,
      }
    );

    return subscription;
  } catch (error) {
    logger.error("Error handling renewal:", error);
    throw error;
  }
};

/**
 * Handle expiration event
 */
const handleExpiration = async (eventData) => {
  try {
    const customerData = eventData.subscriber || {};
    const subscription = await subscriptionService.updateSubscriptionStatus(
      customerData.app_user_id,
      {
        type: "EXPIRATION",
        expiration_date: customerData.expiration_date,
        event_id: eventData.event_id,
      }
    );

    logger.info(`Expiration processed for customer: ${customerData.app_user_id}`);

    // Update user subscription status
    const User = require("../user/User");
    await User.findByIdAndUpdate(
      subscription.user,
      {
        isSubscribed: false,
      }
    );

    return subscription;
  } catch (error) {
    logger.error("Error handling expiration:", error);
    throw error;
  }
};

/**
 * Handle cancellation event
 */
const handleCancellation = async (eventData) => {
  try {
    const customerData = eventData.subscriber || {};
    const cancellationReason = eventData.cancellation_reason || "user_cancelled";

    const subscription = await subscriptionService.updateSubscriptionStatus(
      customerData.app_user_id,
      {
        type: "CANCELLATION",
        cancellation_reason: cancellationReason,
        event_id: eventData.event_id,
      }
    );

    logger.info(
      `Cancellation processed for customer: ${customerData.app_user_id} (${cancellationReason})`
    );

    // Update user subscription status
    const User = require("../user/User");
    await User.findByIdAndUpdate(
      subscription.user,
      {
        isSubscribed: false,
      }
    );

    return subscription;
  } catch (error) {
    logger.error("Error handling cancellation:", error);
    throw error;
  }
};

/**
 * Handle billing issue event
 */
const handleBillingIssue = async (eventData) => {
  try {
    const customerData = eventData.subscriber || {};
    const subscription = await subscriptionService.updateSubscriptionStatus(
      customerData.app_user_id,
      {
        type: "BILLING_ISSUE",
        event_id: eventData.event_id,
      }
    );

    logger.warn(
      `Billing issue for customer: ${customerData.app_user_id} - Subscription paused`
    );

    // Send email notification to user about billing issue
    // This would integrate with your email service
    // await emailService.sendBillingIssueEmail(subscription.user);

    return subscription;
  } catch (error) {
    logger.error("Error handling billing issue:", error);
    throw error;
  }
};

/**
 * Handle refund event
 */
const handleRefund = async (eventData) => {
  try {
    const customerData = eventData.subscriber || {};
    const subscription = await subscriptionService.updateSubscriptionStatus(
      customerData.app_user_id,
      {
        type: "REFUND",
        refund_amount: eventData.refund_amount,
        event_id: eventData.event_id,
      }
    );

    logger.info(
      `Refund processed for customer: ${customerData.app_user_id} - Amount: ${eventData.refund_amount}`
    );

    return subscription;
  } catch (error) {
    logger.error("Error handling refund:", error);
    throw error;
  }
};

/**
 * Handle transfer event (subscription transferred between accounts)
 */
const handleTransfer = async (eventData) => {
  try {
    const fromCustomerId = eventData.from_app_user_id;
    const toCustomerId = eventData.to_app_user_id;

    logger.info(
      `Subscription transfer from ${fromCustomerId} to ${toCustomerId}`
    );

    // Handle subscription transfer logic here
    // This would involve updating subscription to point to new customer

    return {
      transferredFrom: fromCustomerId,
      transferredTo: toCustomerId,
    };
  } catch (error) {
    logger.error("Error handling transfer:", error);
    throw error;
  }
};

/**
 * Webhook health check endpoint
 */
const webhookHealthCheck = catchAsync(async (req, res) => {
  sendResponse(res, {
    statusCode: http_status.OK,
    success: true,
    message: "Webhook endpoint is healthy",
    data: {
      status: "operational",
      timestamp: new Date(),
    },
  });
});

module.exports = {
  handleRevenueCatWebhook,
  webhookHealthCheck,
  handleInitialPurchase,
  handleRenewal,
  handleExpiration,
  handleCancellation,
  handleBillingIssue,
  handleRefund,
  handleTransfer,
};
