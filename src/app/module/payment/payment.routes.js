const express = require("express");
const auth = require("../../middleware/auth");
const { PaymentController } = require("./payment.controller");
const config = require("../../../config");

const router = express.Router();

router
  .get("/success", PaymentController.successPage)
  .get("/cancel", PaymentController.cancelPage)
  .post(
    "/checkout-subscription",
    auth(config.auth_level.user),
    PaymentController.postCheckoutForSubscription
  )
  .post(
    "/google-play/verify-subscription",
    auth(config.auth_level.user),
    PaymentController.verifyGooglePlaySubscription
  )
  .post(
    "/google-play/verify-product",
    auth(config.auth_level.user),
    PaymentController.verifyGooglePlayProduct
  )
  .post(
    "/google-play/webhook",
    PaymentController.handleGooglePlayWebhook
  )
  .post(
    "/apple/verify-subscription",
    auth(config.auth_level.user),
    PaymentController.verifyAppleSubscription
  )
  .post(
    "/apple/webhook",
    PaymentController.handleAppleWebhook
  )
  .post(
    "/generate/payment-link",
    auth(config.auth_level.user),
    PaymentController.generatePaymentLink
  )
  .get(
    "/user/subscription",
    auth(config.auth_level.user),
    PaymentController.getUserSubscriptionInfo
  );

module.exports = router;
