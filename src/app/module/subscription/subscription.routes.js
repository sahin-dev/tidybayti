const express = require("express");
const subscriptionController = require("./subscription.controller");
const webhookHandler = require("./webhook.handler");
const auth = require("../../middleware/auth");
const config = require("../../../config");

const router = express.Router();

// Webhook routes (no authentication required for webhooks)
router.post("/webhook/revenuecat", webhookHandler.handleRevenueCatWebhook);
router.get("/webhook/health", webhookHandler.webhookHealthCheck);

// Public plan catalog routes.
router.get("/plans", subscriptionController.getPlans);
router.get("/plans/:planId", subscriptionController.getPlanDetails);

// User routes.
router.post(
  "/create",
  auth(config.auth_level.user),
  subscriptionController.createSubscription
);
router.get(
  "/active",
  auth(config.auth_level.user),
  subscriptionController.getActiveSubscription
);
router.get(
  "/history",
  auth(config.auth_level.user),
  subscriptionController.getSubscriptionHistory
);
router.post(
  "/cancel",
  auth(config.auth_level.user),
  subscriptionController.cancelSubscription
);
router.post(
  "/pause",
  auth(config.auth_level.user),
  subscriptionController.pauseSubscription
);
router.post(
  "/resume",
  auth(config.auth_level.user),
  subscriptionController.resumeSubscription
);
router.post(
  "/upgrade-downgrade",
  auth(config.auth_level.user),
  subscriptionController.updateSubscriptionPlan
);
router.get(
  "/check-entitlements",
  auth(config.auth_level.user),
  subscriptionController.checkEntitlements
);

// Admin routes.
router.get(
  "/stats",
  auth(config.auth_level.admin),
  subscriptionController.getSubscriptionStats
);
router.post(
  "/admin/plans/create",
  auth(config.auth_level.admin),
  subscriptionController.createPlan
);
router.put(
  "/admin/plans/:planId",
  auth(config.auth_level.admin),
  subscriptionController.updatePlanDetails
);

module.exports = router;
