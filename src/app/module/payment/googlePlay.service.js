const { google } = require("googleapis");
const status = require("http-status");
const config = require("../../../config");
const ApiError = require("../../../error/ApiError");
const User = require("../user/User");
const Payment = require("./payment.model");
const Subscription = require("./subscription.model");
const validateFields = require("../../../util/validateFields");
const { logger, errorLogger } = require("../../../shared/logger");

// Helper to initialize Google Play Publisher Client
const getAndroidPublisherClient = async () => {
  const { clientEmail, privateKey } = config.googlePlay || {};

  if (!clientEmail || !privateKey) {
    throw new ApiError(
      status.INTERNAL_SERVER_ERROR,
      "Google Play Billing is not configured. Missing clientEmail or privateKey."
    );
  }

  // Format private key correctly in case newlines were escaped
  const formattedPrivateKey = privateKey;

  logger.info("Initializing Google Play Publisher Client");

  const auth = new google.auth.JWT({
    email:clientEmail,
    key:formattedPrivateKey,
    scopes:["https://www.googleapis.com/auth/androidpublisher"]}
  );

  try {
    await auth.authorize();
  } catch (err) {
    errorLogger.error("Google Play authorization failed:", err);
  }

  return google.androidpublisher({
    version: "v3",
    auth,
  });
};
  
/**
 * Verify an Android subscription purchase token with Google Play Developer API
 */
const verifySubscriptionPurchase = async (userData, payload) => {
  validateFields(payload, ["subscriptionId", "purchaseToken", "packageType"]);
  
  const { subscriptionId, purchaseToken, packageType } = payload;
  const packageName = payload.packageName || config.googlePlay.packageName;

  if (!packageName) {
    throw new ApiError(
      status.BAD_REQUEST,
      "Package name is required (either in payload or config)."
    );
  }

  const client = await getAndroidPublisherClient();
  let response;

  try {
    response = await client.purchases.subscriptions.get({
      packageName,
      subscriptionId,
      token: purchaseToken,
    });
  } catch (error) {
    errorLogger.error("Google Play Subscription Verification API error:", error);
    throw new ApiError(
      status.BAD_REQUEST,
      `Failed to verify subscription with Google: ${error.message}`
    );
  }

  const subscriptionDetails = response.data;
  const expiryTimeMillis = parseInt(subscriptionDetails.expiryTimeMillis, 10);
  const isExpired = expiryTimeMillis < Date.now();

  const user = await User.findById(userData.userId);
  if (!user) {
    throw new ApiError(status.NOT_FOUND, "User not found");
  }

  // Update User subscription details
  user.isSubscribed = !isExpired;
  user.subscriptionExpires = new Date(expiryTimeMillis);
  await user.save();

  // Parse amount in standard units if available (priceAmountMicros is in millionths)
  let amount = 0;
  if (subscriptionDetails.priceAmountMicros) {
    amount = parseInt(subscriptionDetails.priceAmountMicros, 10) / 1000000;
  }

    // Log/Create Payment record
    let payment = await Payment.findOne({ purchaseToken });
    if (!payment) {
      payment = new Payment({
        user: user._id,
        packageType,
        amount,
        gateway: "google_play",
        purchaseToken,
        productId: subscriptionId,
        packageName,
        status: isExpired ? "unpaid" : "succeeded",
      });
    } else {
      payment.status = isExpired ? "unpaid" : "succeeded";
      payment.amount = amount;
      payment.packageType = packageType;
    }
    await payment.save();

    // Create/Update Subscription record
    const startDate = subscriptionDetails.startTimeMillis
      ? new Date(parseInt(subscriptionDetails.startTimeMillis, 10))
      : new Date();
    const endDate = new Date(expiryTimeMillis);
    const nextPaymentDate = endDate; // Simplified; adjust if needed

    let subscription = await Subscription.findOne({ purchaseToken });
    if (!subscription) {
      subscription = new Subscription({
        user: user._id,
        productId: subscriptionId,
        purchaseToken,
        startDate,
        endDate,
        nextPaymentDate,
        status: isExpired ? "expired" : "activated",
        autoRenewing: subscriptionDetails.autoRenewing,
        amount,
        gateway: "google_play",
      });
    } else {
      subscription.status = isExpired ? "expired" : "activated";
      subscription.startDate = startDate;
      subscription.endDate = endDate;
      subscription.nextPaymentDate = nextPaymentDate;
      subscription.autoRenewing = subscriptionDetails.autoRenewing;
      subscription.amount = amount;
    }
    await subscription.save();

  return {
    verified: !isExpired,
    expiryDate: user.subscriptionExpires,
    autoRenewing: subscriptionDetails.autoRenewing,
    paymentState: subscriptionDetails.paymentState,
    payment,
  };
};

/**
 * Verify an Android one-time product purchase token with Google Play Developer API
 */
const verifyProductPurchase = async (userData, payload) => {

  validateFields(payload, ["productId", "purchaseToken"]);

  const { productId, purchaseToken } = payload;
  const packageName = payload.packageName || config.googlePlay.packageName;

  if (!packageName) {
    throw new ApiError(
      status.BAD_REQUEST,
      "Package name is required (either in payload or config)."
    );
  }

  const client = await getAndroidPublisherClient();
  let response;

  try {
    response = await client.purchases.products.get({
      packageName,
      productId,
      token: purchaseToken,
    });
  } catch (error) {
    errorLogger.error("Google Play Product Verification API error:", error);
    throw new ApiError(
      status.BAD_REQUEST,
      `Failed to verify product purchase with Google: ${error.message}`
    );
  }

  const productDetails = response.data;
  
  // purchaseState: 0 = purchased, 1 = canceled, 2 = pending
  const isPurchased = productDetails.purchaseState === 0;

  if (!isPurchased) {
    throw new ApiError(
      status.BAD_REQUEST,
      "Product purchase is not in completed/purchased state."
    );
  }

  const user = await User.findById(userData.userId);
  if (!user) {
    throw new ApiError(status.NOT_FOUND, "User not found");
  }

  // Grant Lifetime Access for one-time product purchases (e.g. 100 years subscription expiry)
  const lifetimeExpiry = new Date();
  lifetimeExpiry.setFullYear(lifetimeExpiry.getFullYear() + 100);

  user.isSubscribed = true;
  user.subscriptionExpires = lifetimeExpiry;
  await user.save();

  // Log/Create Payment record
  let payment = await Payment.findOne({ purchaseToken });
  if (!payment) {
    payment = new Payment({
      user: user._id,
      packageType: "yearly", // Map lifetime/one-time to yearly or custom package type
      amount: 0, // In products get response, price is not always available in standard properties, default 0
      gateway: "google_play",
      purchaseToken,
      productId,
      packageName,
      status: "succeeded",
    });
    await payment.save();
  }

  return {
    verified: true,
    expiryDate: user.subscriptionExpires,
    purchaseState: productDetails.purchaseState,
    consumptionState: productDetails.consumptionState,
    acknowledgementState: productDetails.acknowledgementState,
    payment,
  };
};

/**
 * Handle Google Play Real-Time Developer Notifications (RTDN) webhook
 */
const handleGooglePlayWebhook = async (payload) => {
  if (!payload || !payload.message || !payload.message.data) {
    throw new ApiError(
      status.BAD_REQUEST,
      "Invalid webhook payload: missing message data."
    );
  }

  let decodedDataString;
  try {
    decodedDataString = Buffer.from(payload.message.data, "base64").toString("utf-8");
  } catch (error) {
    throw new ApiError(
      status.BAD_REQUEST,
      "Failed to decode base64 webhook message data."
    );
  }

  let notificationData;
  try {
    notificationData = JSON.parse(decodedDataString);
  } catch (error) {
    throw new ApiError(
      status.BAD_REQUEST,
      "Decoded webhook message data is not valid JSON."
    );
  }

  logger.info("Received Google Play RTDN Webhook Notification:", notificationData);

  const { packageName, subscriptionNotification } = notificationData;

  if (!subscriptionNotification) {
    // We only process subscription notifications for user subscriptions in this handler
    logger.info("Ignored non-subscription Google Play RTDN notification.");
    return { success: true, message: "Ignored non-subscription event." };
  }

  const { purchaseToken, subscriptionId, notificationType } = subscriptionNotification;

  // Find the original payment record using the purchase token
  const payment = await Payment.findOne({ purchaseToken });
  if (!payment) {
    logger.warn("No payment record found for Google Play webhook token. Webhook cannot match to user.");
    return { success: false, message: "No matching payment record found." };
  }

  // Get current status directly from Google Play API to be sure we have the latest state
  const client = await getAndroidPublisherClient();
  let googleResponse;

  try {
    googleResponse = await client.purchases.subscriptions.get({
      packageName,
      subscriptionId,
      token: purchaseToken,
    });
  } catch (error) {
    errorLogger.error("Error querying Google Play API for webhook token:", error);
    return { success: false, message: "Failed to fetch state from Google." };
  }

  const subscriptionDetails = googleResponse.data;
  const expiryTimeMillis = parseInt(subscriptionDetails.expiryTimeMillis, 10);
  const isExpired = expiryTimeMillis < Date.now();

  // Update associated user
    const user = await User.findById(payment.user);
    if (user) {
      user.isSubscribed = !isExpired;
      user.subscriptionExpires = new Date(expiryTimeMillis);
      await user.save();
      logger.info(`Updated user ${user._id} subscription status: isSubscribed=${user.isSubscribed}, expiry=${user.subscriptionExpires}`);
    }

    // Update or create Subscription record
    const startDate = subscriptionDetails.startTimeMillis
      ? new Date(parseInt(subscriptionDetails.startTimeMillis, 10))
      : new Date();
    const endDate = new Date(expiryTimeMillis);
    const nextPaymentDate = endDate;
    let subscription = await Subscription.findOne({ purchaseToken });
    if (!subscription) {
      subscription = new Subscription({
        user: payment.user,
        productId: subscriptionId,
        purchaseToken,
        startDate,
        endDate,
        nextPaymentDate,
        status: isExpired ? "expired" : "activated",
        autoRenewing: subscriptionDetails.autoRenewing,
        amount: subscriptionDetails.priceAmountMicros
          ? parseInt(subscriptionDetails.priceAmountMicros, 10) / 1000000
          : 0,
        gateway: "google_play",
      });
    } else {
      subscription.status = isExpired ? "expired" : "activated";
      subscription.startDate = startDate;
      subscription.endDate = endDate;
      subscription.nextPaymentDate = nextPaymentDate;
      subscription.autoRenewing = subscriptionDetails.autoRenewing;
      if (subscriptionDetails.priceAmountMicros) {
        subscription.amount = parseInt(subscriptionDetails.priceAmountMicros, 10) / 1000000;
      }
    }
    await subscription.save();

    // Update payment record status
    payment.status = isExpired ? "unpaid" : "succeeded";
    if (subscriptionDetails.priceAmountMicros) {
      payment.amount = parseInt(subscriptionDetails.priceAmountMicros, 10) / 1000000;
    }
    await payment.save();

  return {
    success: true,
    notificationType,
    isExpired,
    expiryDate: new Date(expiryTimeMillis),
  };
};

const GooglePlayService = {
  verifySubscriptionPurchase,
  verifyProductPurchase,
  handleGooglePlayWebhook,
};

module.exports = GooglePlayService;
