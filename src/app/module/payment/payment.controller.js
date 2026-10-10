const sendResponse = require("../../../shared/sendResponse");
const catchAsync = require("../../../shared/catchAsync");
const PaypalService = require("./paypal.service");
const GooglePlayService = require("./googlePlay.service");
const AppleStoreService = require("./appleStore.service");
const paymentService = require("./payment.service");

const successPage = catchAsync(async (req, res) => {
  res.render("success.ejs");
});

const cancelPage = catchAsync(async (req, res) => {
  res.render("cancel.ejs");
});

const postCheckoutForSubscription = catchAsync(async (req, res) => {
  const result = await PaypalService.postCheckoutForSubscription(
    req.user,
    req.body
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payment for subscription initialized",
    data: result,
  });
});

const verifyGooglePlaySubscription = catchAsync(async (req, res) => {
  const result = await GooglePlayService.verifySubscriptionPurchase(
    req.user,
    req.body
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Google Play subscription verified successfully",
    data: result,
  });
});

const verifyGooglePlayProduct = catchAsync(async (req, res) => {
  const result = await GooglePlayService.verifyProductPurchase(
    req.user,
    req.body
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Google Play product verified successfully",
    data: result,
  });
});

const handleGooglePlayWebhook = catchAsync(async (req, res) => {
  const result = await GooglePlayService.handleGooglePlayWebhook(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Google Play webhook notification processed",
    data: result,
  });
});

const verifyAppleSubscription = catchAsync(async (req, res) => {
  const result = await AppleStoreService.verifySubscriptionPurchase(
    req.user,
    req.body
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Apple App Store subscription verified successfully",
    data: result,
  });
});

const handleAppleWebhook = catchAsync(async (req, res) => {
  const result = await AppleStoreService.handleAppleWebhook(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Apple App Store webhook notification processed",
    data: result,
  });
});

const generatePaymentLink = catchAsync(async (req, res) => {
  const { price_id } = req.body;
  const { userId } = req.user;

  const paymentLink = await paymentService.generatePaymentLink(userId, price_id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payment link generated successfully",
    data: paymentLink,
  });
});

const getUserSubscriptionInfo = catchAsync(async (req, res) => {
  const { userId } = req.user;

  const subscriptionInfo = await paymentService.getUserSubscriptionInfo(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Subscription info retrieved successfully",
    data: subscriptionInfo,
  });
});

const PaymentController = {
  successPage,
  cancelPage,
  postCheckoutForSubscription,
  verifyGooglePlaySubscription,
  verifyGooglePlayProduct,
  handleGooglePlayWebhook,
  verifyAppleSubscription,
  handleAppleWebhook,
  generatePaymentLink,
  getUserSubscriptionInfo,
};

module.exports = { PaymentController };
