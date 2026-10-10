# Subscription Routes with Authentication Middleware

This file shows how to add authentication middleware to the subscription routes.

## Authentication Middleware Integration

Update your `subscription.routes.js` to include authentication middleware:

```javascript
const express = require("express");
const subscriptionController = require("./subscription.controller");
const webhookHandler = require("./webhook.handler");
const { verifyAuth } = require("../../middleware/auth"); // Your auth middleware
const { authorizeRoles } = require("../../middleware/authorization"); // Your role middleware

const router = express.Router();

// ====================================
// Webhook Routes (NO authentication)
// ====================================
router.post("/webhook/revenuecat", webhookHandler.handleRevenueCatWebhook);
router.get("/webhook/health", webhookHandler.webhookHealthCheck);

// ====================================
// Public Routes (NO authentication)
// ====================================
router.get("/plans", subscriptionController.getPlans);
router.get("/plans/:planId", subscriptionController.getPlanDetails);

// ====================================
// Protected User Routes (requires authentication)
// ====================================
router.use(verifyAuth); // All routes after this require authentication

router.post("/create", subscriptionController.createSubscription);
router.get("/active", subscriptionController.getActiveSubscription);
router.get("/history", subscriptionController.getSubscriptionHistory);
router.post("/cancel", subscriptionController.cancelSubscription);
router.post("/pause", subscriptionController.pauseSubscription);
router.post("/resume", subscriptionController.resumeSubscription);
router.post("/upgrade-downgrade", subscriptionController.updateSubscriptionPlan);
router.get("/check-entitlements", subscriptionController.checkEntitlements);

// ====================================
// Admin Routes (requires admin role)
// ====================================
router.use(authorizeRoles("ADMIN", "SUPER_ADMIN")); // All routes after this require admin role

router.get("/stats", subscriptionController.getSubscriptionStats);
router.post("/admin/plans/create", subscriptionController.createPlan);
router.put("/admin/plans/:planId", subscriptionController.updatePlanDetails);

module.exports = router;
```

## Auth Middleware Examples

### Basic JWT Authentication

```javascript
// middleware/auth.js
const jwt = require("jsonwebtoken");
const config = require("../../config");
const ApiError = require("../../error/ApiError");
const http_status = require("http-status");

const verifyAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      throw new ApiError(http_status.UNAUTHORIZED, "No token provided");
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (error) {
    next(new ApiError(http_status.UNAUTHORIZED, "Invalid token"));
  }
};

module.exports = { verifyAuth };
```

### Role-Based Authorization

```javascript
// middleware/authorization.js
const http_status = require("http-status");
const ApiError = require("../../error/ApiError");

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(http_status.UNAUTHORIZED, "User not authenticated");
    }

    if (!roles.includes(req.user.role)) {
      throw new ApiError(
        http_status.FORBIDDEN,
        `Only ${roles.join(", ")} can access this resource`
      );
    }

    next();
  };
};

module.exports = { authorizeRoles };
```

### Subscription Access Control

```javascript
// middleware/subscriptionGuard.js
const { checkEntitlements } = require("../module/subscription/subscription.service");
const ApiError = require("../../error/ApiError");
const http_status = require("http-status");

const requireSubscription = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const entitlements = await checkEntitlements(userId);

    if (!entitlements.hasAccess) {
      return next(
        new ApiError(
          http_status.PAYMENT_REQUIRED,
          "Active subscription required to access this feature"
        )
      );
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
      let entitlements = req.entitlements;

      if (!entitlements) {
        const userId = req.user.id || req.user._id;
        entitlements = await checkEntitlements(userId);
      }

      if (!entitlements.entitlements.includes(requiredEntitlement)) {
        return next(
          new ApiError(
            http_status.FORBIDDEN,
            `This feature requires "${requiredEntitlement}" entitlement`
          )
        );
      }

      req.entitlements = entitlements;
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { requireSubscription, requireEntitlement };
```

## Protected Route Examples

### Using in Recipe Routes

```javascript
// In your recipe.routes.js
const express = require("express");
const { verifyAuth } = require("../../middleware/auth");
const { requireSubscription, requireEntitlement } = require("../../middleware/subscriptionGuard");
const recipeController = require("./recipe.controller");

const router = express.Router();

// Public routes - anyone can access
router.get("/public", recipeController.getPublicRecipes);
router.get("/:id", recipeController.getRecipeById);

// Protected routes - requires subscription
router.post("/", verifyAuth, requireSubscription, recipeController.createRecipe);

// Routes with specific entitlements
router.get(
  "/advanced",
  verifyAuth,
  requireSubscription,
  requireEntitlement("advanced_recipes"),
  recipeController.getAdvancedRecipes
);

router.post(
  "/meal-plan",
  verifyAuth,
  requireSubscription,
  requireEntitlement("meal_planning"),
  recipeController.createMealPlan
);

router.post(
  "/shopping-list",
  verifyAuth,
  requireSubscription,
  requireEntitlement("grocery_integration"),
  recipeController.generateShoppingList
);

module.exports = router;
```

### Using in Meal Planning Routes

```javascript
// In your meal.routes.js
const express = require("express");
const { verifyAuth } = require("../../middleware/auth");
const { requireSubscription, requireEntitlement } = require("../../middleware/subscriptionGuard");
const mealController = require("./meal.controller");

const router = express.Router();

// Free tier - basic meal suggestions
router.get("/suggestions", verifyAuth, mealController.getBasicSuggestions);

// Premium tier - advanced meal planning
router.post(
  "/plan",
  verifyAuth,
  requireSubscription,
  requireEntitlement("meal_planning"),
  mealController.createMealPlan
);

router.get(
  "/plan/weekly",
  verifyAuth,
  requireSubscription,
  requireEntitlement("meal_planning"),
  mealController.getWeeklyPlan
);

// Pro tier - nutrition tracking
router.post(
  "/track-nutrition",
  verifyAuth,
  requireSubscription,
  requireEntitlement("nutrition_tracker"),
  mealController.trackNutrition
);

router.get(
  "/nutrition-report",
  verifyAuth,
  requireSubscription,
  requireEntitlement("nutrition_tracker"),
  mealController.getNutritionReport
);

module.exports = router;
```

### Using in Grocery Routes

```javascript
// In your grocery.routes.js
const express = require("express");
const { verifyAuth } = require("../../middleware/auth");
const { requireSubscription, requireEntitlement } = require("../../middleware/subscriptionGuard");
const groceryController = require("./grocery.controller");

const router = express.Router();

// Public - browse items
router.get("/items", groceryController.getBrowseItems);
router.get("/categories", groceryController.getCategories);

// Premium - create shopping lists
router.post(
  "/shopping-list",
  verifyAuth,
  requireSubscription,
  requireEntitlement("grocery_integration"),
  groceryController.createShoppingList
);

router.get(
  "/shopping-list/:id",
  verifyAuth,
  requireSubscription,
  requireEntitlement("grocery_integration"),
  groceryController.getShoppingList
);

// Premium - price comparison
router.get(
  "/compare-prices",
  verifyAuth,
  requireSubscription,
  requireEntitlement("grocery_integration"),
  groceryController.comparePrices
);

module.exports = router;
```

## API Response with Subscription Info

Update your response wrapper to include subscription status:

```javascript
// In shared/sendResponse.js
const sendResponse = (res, data) => {
  const response = {
    statusCode: data.statusCode,
    success: data.success,
    message: data.message,
    data: data.data,
  };

  // Add subscription status if available
  if (res.req?.entitlements) {
    response.subscription = {
      hasAccess: res.req.entitlements.hasAccess,
      planName: res.req.entitlements.planName,
      expiresAt: res.req.entitlements.expiresAt,
    };
  }

  res.status(data.statusCode).send(response);
};

module.exports = sendResponse;
```

## Error Handler for Subscription Errors

```javascript
// Update your globalErrorHandler.js
const globalErrorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Handle subscription-specific errors
  if (statusCode === 402) {
    // Payment Required
    message = "Subscription required. Please upgrade your plan.";
  }

  if (statusCode === 403 && message.includes("entitlement")) {
    message = `Feature not available in your plan. ${message}`;
  }

  const errorResponse = {
    statusCode,
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  };

  res.status(statusCode).send(errorResponse);
};

module.exports = globalErrorHandler;
```

## Testing Authentication

```javascript
// Test authenticated requests
test("should reject request without token", async () => {
  const response = await request(app)
    .post("/subscription/create")
    .send({ planId: "123" });

  expect(response.statusCode).toBe(401);
  expect(response.body.message).toContain("No token provided");
});

test("should reject request with invalid token", async () => {
  const response = await request(app)
    .post("/subscription/create")
    .set("Authorization", "Bearer invalid_token")
    .send({ planId: "123" });

  expect(response.statusCode).toBe(401);
});

test("should allow request with valid token", async () => {
  const token = generateValidToken(userId);
  
  const response = await request(app)
    .post("/subscription/create")
    .set("Authorization", `Bearer ${token}`)
    .send({ planId: validPlanId });

  expect(response.statusCode).toBe(201);
});

test("should reject admin route without admin role", async () => {
  const token = generateTokenWithRole("USER");
  
  const response = await request(app)
    .post("/subscription/admin/plans/create")
    .set("Authorization", `Bearer ${token}`)
    .send(planData);

  expect(response.statusCode).toBe(403);
});
```

## Environment Variables for Auth

```env
# JWT Secrets
JWT_SECRET=your_super_secret_key_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_key_min_32_chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Token Types
TOKEN_TYPE=Bearer
```

## Security Best Practices

1. ✅ Always use HTTPS in production
2. ✅ Validate token expiry
3. ✅ Implement rate limiting on auth endpoints
4. ✅ Use secure token generation
5. ✅ Implement token refresh mechanism
6. ✅ Log failed auth attempts
7. ✅ Validate user permissions for each resource
8. ✅ Never expose sensitive data in responses
9. ✅ Implement CORS properly
10. ✅ Use helmet middleware for HTTP headers

## Common Auth Patterns

### Pattern 1: Optional Authentication
```javascript
// Some endpoints work for both authenticated and unauthenticated users
router.get("/items", 
  (req, res, next) => {
    if (req.headers.authorization) {
      verifyAuth(req, res, next);
    } else {
      next(); // Allow unauthenticated access
    }
  },
  controller.getItems
);
```

### Pattern 2: Conditional Middleware
```javascript
// Require subscription only for certain actions
const conditionalSubscription = (req, res, next) => {
  if (req.body.action === "create") {
    requireSubscription(req, res, next);
  } else {
    next();
  }
};
```

### Pattern 3: Rate Limited Auth Attempts
```javascript
const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: "Too many login attempts, please try again later"
});

router.post("/login", authLimiter, authController.login);
```
