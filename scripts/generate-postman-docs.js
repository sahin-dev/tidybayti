const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join(process.cwd(), "docs", "postman");
const COLLECTION_PATH = path.join(OUT_DIR, "tidy-bity.postman_collection.json");
const ENVIRONMENT_PATH = path.join(OUT_DIR, "tidy-bity.local.postman_environment.json");
const GUIDE_PATH = path.join(OUT_DIR, "README.md");

const BASE = "{{baseUrl}}{{apiPrefix}}";
const commonQuery = [
  { key: "page", value: "1", description: "Pagination page." },
  { key: "limit", value: "10", description: "Pagination size." },
  { key: "sort", value: "-createdAt", description: "Comma-separated sort fields." },
  { key: "fields", value: "", description: "Comma-separated response fields." },
  { key: "searchTerm", value: "", description: "Search term for supported list endpoints." },
];

const authToken = {
  type: "bearer",
  bearer: [{ key: "token", value: "{{authToken}}", type: "string" }],
};

const adminToken = {
  type: "bearer",
  bearer: [{ key: "token", value: "{{adminToken}}", type: "string" }],
};

const noAuth = { type: "noauth" };

function jsonBody(body) {
  return {
    mode: "raw",
    raw: JSON.stringify(body, null, 2),
    options: { raw: { language: "json" } },
  };
}

function formBody(fields) {
  return {
    mode: "formdata",
    formdata: fields.map((field) => ({
      key: field.key,
      value: field.value || "",
      type: field.type || "text",
      src: field.src || undefined,
      description: field.description || "",
    })),
  };
}

function url(pathname, query = []) {
  const enabled = query.filter((q) => !q.disabled);
  const rawQuery = enabled.length
    ? `?${enabled.map((q) => `${q.key}=${encodeURIComponent(q.value || "")}`).join("&")}`
    : "";

  return {
    raw: `${BASE}${pathname}${rawQuery}`,
    host: ["{{baseUrl}}{{apiPrefix}}"],
    path: pathname.replace(/^\//, "").split("/"),
    query,
  };
}

function item({
  name,
  method,
  path: pathname,
  auth = authToken,
  description,
  query = [],
  body,
  tests,
}) {
  const request = {
    method,
    header: body
      ? [{ key: "Content-Type", value: body.mode === "raw" ? "application/json" : "multipart/form-data" }]
      : [],
    auth,
    url: url(pathname, query),
    description,
  };

  if (body) request.body = body;

  const event = [];
  if (tests) {
    event.push({
      listen: "test",
      script: {
        type: "text/javascript",
        exec: tests.split("\n"),
      },
    });
  }

  return { name, request, event };
}

function folder(name, description, items, auth = authToken) {
  return {
    name,
    description,
    auth,
    item: items,
  };
}

const saveAuthTokenTest = `
const response = pm.response.json();
const data = response.data || response;
if (data.accessToken) pm.environment.set("authToken", data.accessToken);
if (data.token) pm.environment.set("authToken", data.token);
if (data.refreshToken) pm.environment.set("refreshToken", data.refreshToken);
`;

const collectionItems = [
  folder(
    "Auth",
    "Account registration, activation, login, password reset, and password change. Most endpoints are public; change password requires a bearer token.",
    [
      item({
        name: "Register Account",
        method: "POST",
        path: "/auth/register",
        auth: noAuth,
        description: "Creates a USER or EMPLOYEE auth account and sends an activation code. Roles accepted by the current model are USER and EMPLOYEE.",
        body: jsonBody({
          role: "USER",
          firstName: "Tidy",
          lastName: "Bity",
          email: "user@example.com",
          password: "Password123!",
          confirmPassword: "Password123!",
          phoneNumber: "+97330000000",
        }),
      }),
      item({
        name: "Resend Activation Code",
        method: "POST",
        path: "/auth/activation-code-resend",
        auth: noAuth,
        description: "Sends a fresh account activation code to the user email.",
        body: jsonBody({ email: "user@example.com" }),
      }),
      item({
        name: "Activate Account",
        method: "POST",
        path: "/auth/activate-account",
        auth: noAuth,
        description: "Activates an account with the emailed activation code and returns access and refresh tokens.",
        body: jsonBody({ email: "user@example.com", activationCode: "123" }),
        tests: saveAuthTokenTest,
      }),
      item({
        name: "Login",
        method: "POST",
        path: "/auth/login",
        auth: noAuth,
        description: "Authenticates an active user and returns access and refresh tokens. Optional role helps detect wrong-role login attempts.",
        body: jsonBody({ email: "user@example.com", password: "Password123!", role: "USER" }),
        tests: saveAuthTokenTest,
      }),
      item({
        name: "Forgot Password",
        method: "POST",
        path: "/auth/forgot-password",
        auth: noAuth,
        description: "Sends a password reset verification code.",
        body: jsonBody({ email: "user@example.com" }),
      }),
      item({
        name: "Verify Forgot Password OTP",
        method: "POST",
        path: "/auth/forget-pass-otp-verify",
        auth: noAuth,
        description: "Verifies the password reset code before reset.",
        body: jsonBody({ email: "user@example.com", code: "123" }),
      }),
      item({
        name: "Reset Password",
        method: "POST",
        path: "/auth/reset-password",
        auth: noAuth,
        description: "Sets a new password after OTP verification.",
        body: jsonBody({
          email: "user@example.com",
          newPassword: "NewPassword123!",
          confirmPassword: "NewPassword123!",
        }),
      }),
      item({
        name: "Change Password",
        method: "PATCH",
        path: "/auth/change-password",
        description: "Changes the password for the authenticated USER, EMPLOYEE, ADMIN, or SUPER_ADMIN.",
        body: jsonBody({
          oldPassword: "Password123!",
          newPassword: "NewPassword123!",
          confirmPassword: "NewPassword123!",
        }),
      }),
    ],
    noAuth
  ),
  folder("User", "Authenticated user profile, employee management, and subscription status endpoints.", [
    item({ name: "Get Profile", method: "GET", path: "/user/profile", description: "Returns the authenticated user's profile." }),
    item({
      name: "Edit Profile",
      method: "PATCH",
      path: "/user/edit-profile",
      description: "Updates the authenticated profile. Supports optional profile_image upload.",
      body: formBody([
        { key: "firstName", value: "Tidy" },
        { key: "lastName", value: "Bity" },
        { key: "phoneNumber", value: "+97330000000" },
        { key: "dateOfBirth", value: "1995-01-01" },
        { key: "address", value: "Manama, Bahrain" },
        { key: "profile_image", type: "file", description: "Profile image file." },
      ]),
    }),
    item({
      name: "Delete My Account",
      method: "DELETE",
      path: "/user/delete-account",
      description: "Deletes the account after verifying email and password.",
      body: jsonBody({ email: "user@example.com", password: "Password123!" }),
    }),
    item({
      name: "Add Employee",
      method: "POST",
      path: "/user/add-employee",
      description: "Creates an employee under the authenticated USER account. Requires multipart form data with profile_image.",
      body: formBody([
        { key: "firstName", value: "Employee" },
        { key: "lastName", value: "One" },
        { key: "email", value: "employee@example.com" },
        { key: "password", value: "Password123!" },
        { key: "phoneNumber", value: "+97331111111" },
        { key: "jobType", value: "Cleaner" },
        { key: "CPRNumber", value: "123456789" },
        { key: "CPRExpDate", value: "12/31/2028" },
        { key: "passportNumber", value: "A1234567" },
        { key: "passportExpDate", value: "12/31/2030" },
        { key: "note", value: "Morning shift" },
        { key: "dutyTime", value: "8 hours" },
        { key: "breakTimeStart", value: "01:00 PM" },
        { key: "breakTimeEnd", value: "02:00 PM" },
        { key: "workingDay", value: "Monday,Tuesday,Wednesday,Thursday,Friday" },
        { key: "offDay", value: "Saturday" },
        { key: "designation", value: "Housekeeper" },
        { key: "address", value: "Manama, Bahrain" },
        { key: "profile_image", type: "file", description: "Employee profile image." },
      ]),
    }),
    item({
      name: "Edit Employee",
      method: "PATCH",
      path: "/user/edit-employee",
      description: "Updates employee profile fields. Email and password cannot be changed here.",
      body: formBody([
        { key: "userId", value: "{{employeeUserId}}" },
        { key: "authId", value: "{{employeeAuthId}}" },
        { key: "firstName", value: "Employee" },
        { key: "lastName", value: "Updated" },
        { key: "workingDay", value: "Monday,Tuesday,Wednesday" },
        { key: "profile_image", type: "file" },
      ]),
    }),
    item({
      name: "Delete Employee",
      method: "DELETE",
      path: "/user/delete-employee",
      description: "Deletes an employee owned by the authenticated USER.",
      body: jsonBody({ userId: "{{employeeUserId}}", authId: "{{employeeAuthId}}" }),
    }),
    item({
      name: "Get My Employees",
      method: "GET",
      path: "/user/get-my-employee",
      description: "Lists employees for the authenticated USER. Supports QueryBuilder pagination, sort, fields, filters, and searchTerm.",
      query: commonQuery,
    }),
    item({
      name: "Get Single Employee",
      method: "GET",
      path: "/user/get-single-employee",
      description: "Returns one employee by userId.",
      query: [{ key: "userId", value: "{{employeeUserId}}" }],
    }),
    item({
      name: "Get User Subscription Status",
      method: "GET",
      path: "/user/subscription_status",
      description: "Returns basic subscription and trial status for the authenticated USER.",
    }),
  ]),
  folder(
    "Admin",
    "Admin profile endpoints. Use adminToken for these requests.",
    [
      item({ name: "Get Admin Profile", method: "GET", path: "/admin/profile", auth: adminToken, description: "Returns the authenticated admin profile." }),
      item({
        name: "Edit Admin Profile",
        method: "PATCH",
        path: "/admin/edit-profile",
        auth: adminToken,
        description: "Updates admin profile details. Supports optional profile_image upload.",
        body: formBody([
          { key: "firstName", value: "Admin" },
          { key: "lastName", value: "User" },
          { key: "profile_image", type: "file" },
        ]),
      }),
      item({
        name: "Delete Admin Account",
        method: "DELETE",
        path: "/admin/delete-account",
        auth: adminToken,
        description: "Deletes an admin account after email/password verification.",
        body: jsonBody({ email: "admin@example.com", password: "Password123!" }),
      }),
    ],
    adminToken
  ),
  folder("Rooms And Houses", "House and room metadata endpoints for authenticated USER accounts.", [
    item({ name: "Create House", method: "POST", path: "/room/post-house", description: "Creates a house for the authenticated USER.", body: jsonBody({ name: "My House" }) }),
    item({ name: "Get Single House", method: "GET", path: "/room/get-single-house", description: "Fetches a house by houseId.", query: [{ key: "houseId", value: "{{houseId}}" }] }),
    item({ name: "Get My Houses", method: "GET", path: "/room/get-my-houses", description: "Lists houses for the authenticated USER." }),
    item({
      name: "Create Room",
      method: "POST",
      path: "/room/post-room",
      description: "Creates a room. If houseId does not match a house, houseName is required and a house is created.",
      body: formBody([
        { key: "houseId", value: "{{houseId}}" },
        { key: "houseName", value: "My House" },
        { key: "roomName", value: "Kitchen" },
        { key: "roomImage", type: "file" },
      ]),
    }),
    item({ name: "Get My Rooms", method: "GET", path: "/room/get-my-room", description: "Lists rooms for the authenticated USER. Optional houseId filters by house.", query: [{ key: "houseId", value: "{{houseId}}" }] }),
    item({ name: "Get Single Room", method: "GET", path: "/room/get-single-room", description: "Fetches a room by roomId.", query: [{ key: "roomId", value: "{{roomId}}" }] }),
    item({
      name: "Edit Single Room",
      method: "PATCH",
      path: "/room/edit-single-room",
      description: "Updates room data. Supports optional roomImage upload.",
      body: formBody([
        { key: "roomId", value: "{{roomId}}" },
        { key: "roomName", value: "Updated Kitchen" },
        { key: "roomImage", type: "file" },
      ]),
    }),
    item({ name: "Delete Single Room", method: "DELETE", path: "/room/delete-single-room", description: "Deletes a room by roomId.", body: jsonBody({ roomId: "{{roomId}}" }) }),
  ]),
  folder("Tasks", "Task assignment, status updates, grocery workflow, notifications, and presets.", [
    item({
      name: "Create Task",
      method: "POST",
      path: "/task/post-task",
      description: "Creates one task per roomId for an employee. Recurrence values vary in the conflicted code; ONE_TIME and RECURRENT are documented from the latest branch.",
      body: jsonBody({
        assignedTo: "{{employeeUserId}}",
        roomIds: ["{{roomId}}"],
        taskName: "Clean kitchen",
        recurrence: "ONE_TIME",
        startDateStr: "10/08/2026",
        startTimeStr: "09:00 AM",
        endDateStr: "10/08/2026",
        endTimeStr: "10:00 AM",
        taskDetails: "Wipe counters and mop floor",
        additionalMessage: "Use eco cleaner",
      }),
    }),
    item({ name: "Get Task", method: "GET", path: "/task/get-task", description: "Fetches a task by taskId.", query: [{ key: "taskId", value: "{{taskId}}" }] }),
    item({ name: "Get My Tasks", method: "GET", path: "/task/get-my-task", description: "Lists tasks owned by the authenticated USER. Supports filters like status and recurrence plus QueryBuilder params.", query: [...commonQuery, { key: "status", value: "PENDING" }, { key: "recurrence", value: "ONE_TIME" }] }),
    item({ name: "Get Employee Specific Tasks", method: "GET", path: "/task/get-employee-specific-task", description: "Lists future tasks assigned to the authenticated employee.", query: commonQuery }),
    item({ name: "Get Employee Current Tasks", method: "GET", path: "/task/get-employee-specific-current-task", description: "Lists today's tasks assigned to the authenticated employee. This endpoint appears in one side of an unresolved merge conflict.", query: commonQuery }),
    item({ name: "Get All Tasks", method: "GET", path: "/task/get-all-task", description: "Lists all tasks. Route auth differs across conflict branches; usually USER or employee-level auth.", query: commonQuery }),
    item({
      name: "Update Task",
      method: "PATCH",
      path: "/task/update-task",
      description: "Updates mutable task fields. Schedule fields are rejected by the service.",
      body: jsonBody({ taskId: "{{taskId}}", taskName: "Clean kitchen deeply", taskDetails: "Include cabinet handles" }),
    }),
    item({
      name: "Update Task Or Grocery Status",
      method: "PATCH",
      path: "/task/update-task-or-grocery-status",
      description: "Updates status on either a task or a grocery item. Provide taskId or groceryId, not both.",
      body: jsonBody({ taskId: "{{taskId}}", status: "COMPLETED" }),
    }),
    item({
      name: "Update Task Or Grocery Note",
      method: "PATCH",
      path: "/task/update-grocery-or-task-with-note",
      description: "Adds or updates a note on either a task or grocery item. Provide taskId or groceryId.",
      body: jsonBody({ taskId: "{{taskId}}", note: "Completed before noon" }),
    }),
    item({ name: "Delete Task", method: "DELETE", path: "/task/delete-task", description: "Deletes a task by taskId.", body: jsonBody({ taskId: "{{taskId}}" }) }),
    item({ name: "Create Grocery Category", method: "POST", path: "/task/post-grocery-category", description: "Creates grocery categories. Service expects an array payload spread into insert/create.", body: jsonBody([{ name: "Vegetables" }, { name: "Dairy" }]) }),
    item({ name: "Get Grocery Categories", method: "GET", path: "/task/get-grocery-category", description: "Lists grocery categories with QueryBuilder params.", query: commonQuery }),
    item({
      name: "Create Grocery",
      method: "POST",
      path: "/task/post-grocery",
      description: "Creates a grocery assignment for an employee. Conflicted code shows groceryList in the latest branch and groceryName in another branch.",
      body: jsonBody({
        assignedTo: "{{employeeUserId}}",
        groceryList: ["Milk", "Eggs", "Rice"],
        startDateStr: "10/08/2026",
        startTimeStr: "11:00 AM",
        endDateStr: "10/08/2026",
        endTimeStr: "12:00 PM",
        recurrence: "ONE_TIME",
        additionalMessage: "Buy fresh items",
      }),
    }),
    item({ name: "Get Grocery", method: "GET", path: "/task/get-grocery", description: "Fetches a grocery item by groceryId.", query: [{ key: "groceryId", value: "{{groceryId}}" }] }),
    item({ name: "Get My Grocery", method: "GET", path: "/task/get-my-grocery", description: "Lists grocery items for the authenticated USER or EMPLOYEE.", query: commonQuery }),
    item({ name: "Get Notifications", method: "GET", path: "/task/get-notifications", description: "Lists notifications for the authenticated user." }),
    item({ name: "Get Task Presets", method: "GET", path: "/task/presets", description: "Returns household task presets from household_tasks.json. This endpoint appears in one side of an unresolved merge conflict." }),
    item({ name: "Update Grocery", method: "PATCH", path: "/task/update-grocery", description: "Updates mutable grocery fields. Schedule fields are rejected.", body: jsonBody({ groceryId: "{{groceryId}}", groceryList: ["Milk", "Bread"] }) }),
    item({ name: "Delete Grocery", method: "DELETE", path: "/task/delete-grocery", description: "Deletes a grocery item by groceryId.", body: jsonBody({ groceryId: "{{groceryId}}" }) }),
  ]),
  folder("Grocery Search", "Standalone grocery search module.", [
    item({ name: "Search Grocery List", method: "GET", path: "/grocery/search", description: "Searches grocery reference data by q.", query: [{ key: "q", value: "milk" }] }),
  ]),
  folder("Wallet", "Budgets, expenses, and wallet category data.", [
    item({ name: "Create Budget", method: "POST", path: "/wallet/post-budget", description: "Creates a budget. budgetImage is a string URL/path in the current service.", body: jsonBody({ category: "Food and Drinks", budgetImage: "https://example.com/budget.png", budgetDateStr: "10/01/2026", currency: "BHD", amount: 250 }) }),
    item({ name: "Get Budget", method: "GET", path: "/wallet/get-budget", description: "Fetches one budget and populated expenses.", query: [{ key: "budgetId", value: "{{budgetId}}" }] }),
    item({ name: "Get My Budgets", method: "GET", path: "/wallet/get-my-budget", description: "Lists budgets for the authenticated USER.", query: commonQuery }),
    item({ name: "Get All Budgets", method: "GET", path: "/wallet/get-all-budget", auth: adminToken, description: "Lists all budgets. Requires ADMIN or SUPER_ADMIN.", query: commonQuery }),
    item({ name: "Update Budget", method: "PATCH", path: "/wallet/update-budget", description: "Updates budget category, amount, or budgetImage.", body: jsonBody({ budgetId: "{{budgetId}}", amount: 300 }) }),
    item({ name: "Delete Budget", method: "DELETE", path: "/wallet/delete-budget", description: "Deletes a budget and related expenses.", body: jsonBody({ budgetId: "{{budgetId}}" }) }),
    item({ name: "Create Expense", method: "POST", path: "/wallet/post-expense", description: "Creates an expense under a budget.", body: jsonBody({ budgetId: "{{budgetId}}", expenseDateStr: "10/08/2026", amount: 25 }) }),
    item({ name: "Get Expense", method: "GET", path: "/wallet/get-expense", description: "Fetches one expense by expenseId.", query: [{ key: "expenseId", value: "{{expenseId}}" }] }),
    item({ name: "Get Single Budget Expense", method: "GET", path: "/wallet/get-single-budget-expense", description: "Route exists, but the service implementation is currently empty.", query: [{ key: "budgetId", value: "{{budgetId}}" }] }),
    item({ name: "Delete Expense", method: "DELETE", path: "/wallet/delete-expense", description: "Deletes an expense and decrements the parent budget currentExpense.", body: jsonBody({ expenseId: "{{expenseId}}" }) }),
    item({ name: "Get Budget Categories", method: "GET", path: "/wallet/get-budget-category", description: "Returns built-in wallet budget categories." }),
  ]),
  folder("Recipes", "Recipe CRUD and favorite toggles.", [
    item({
      name: "Create Recipe",
      method: "POST",
      path: "/recipe/post-recipe",
      description: "Creates a recipe. ingredients, steps, and tags may be comma-separated strings or repeated values; the service converts them to arrays.",
      body: formBody([
        { key: "recipeName", value: "Chicken Biryani" },
        { key: "cookingTime", value: "45 minutes" },
        { key: "description", value: "Family dinner recipe" },
        { key: "ingredients", value: "chicken,rice,spices" },
        { key: "steps", value: "Marinate,Cook rice,Combine" },
        { key: "tags", value: "dinner,protein" },
        { key: "url", value: "https://example.com/recipe" },
        { key: "recipeImage", type: "file" },
        { key: "recipe", type: "file", description: "Optional recipe file in one branch." },
      ]),
    }),
    item({ name: "Get Recipe", method: "GET", path: "/recipe/get-recipe", description: "Fetches one recipe by recipeId.", query: [{ key: "recipeId", value: "{{recipeId}}" }] }),
    item({ name: "Get My Recipes", method: "GET", path: "/recipe/get-my-recipe", description: "Lists recipes created by the authenticated USER, with favorite flags.", query: commonQuery }),
    item({ name: "Get All Recipes", method: "GET", path: "/recipe/get-all-recipe", auth: adminToken, description: "Lists all recipes. Requires ADMIN or SUPER_ADMIN.", query: commonQuery }),
    item({
      name: "Update Recipe",
      method: "PATCH",
      path: "/recipe/update-recipe",
      description: "Updates recipe fields. Supports optional recipeImage upload.",
      body: formBody([
        { key: "recipeId", value: "{{recipeId}}" },
        { key: "recipeName", value: "Updated Recipe" },
        { key: "ingredients", value: "rice,spices" },
        { key: "recipeImage", type: "file" },
      ]),
    }),
    item({ name: "Delete Recipe", method: "DELETE", path: "/recipe/delete-recipe", description: "Deletes a recipe by recipeId.", body: jsonBody({ recipeId: "{{recipeId}}" }) }),
    item({ name: "Favorite Or Unfavorite Recipe", method: "PATCH", path: "/recipe/favorite-unfavorite-recipe", description: "Toggles a recipe in the authenticated user's favorites.", query: [{ key: "recipeId", value: "{{recipeId}}" }] }),
  ]),
  folder("Payments", "PayPal, Stripe, Google Play, and Apple payment endpoints. Some endpoints are from unresolved conflict branches.", [
    item({ name: "Payment Success Page", method: "GET", path: "/payment/success", auth: noAuth, description: "Renders payment success page." }),
    item({ name: "Payment Cancel Page", method: "GET", path: "/payment/cancel", auth: noAuth, description: "Renders payment cancel page." }),
    item({ name: "Checkout Subscription", method: "POST", path: "/payment/checkout-subscription", description: "Initializes PayPal subscription checkout.", body: jsonBody({ packageType: "monthly", amount: 9.99, gateway: "paypal" }) }),
    item({ name: "Generate Stripe Payment Link", method: "POST", path: "/payment/generate/payment-link", description: "Generates a Stripe payment link. Present in one side of an unresolved merge conflict.", body: jsonBody({ price_id: "price_123" }) }),
    item({ name: "Get User Stripe Subscription", method: "GET", path: "/payment/user/subscription", description: "Returns Stripe subscription info for the authenticated user. Present in one side of an unresolved merge conflict." }),
    item({ name: "Verify Google Play Subscription", method: "POST", path: "/payment/google-play/verify-subscription", description: "Verifies a Google Play subscription purchase.", body: jsonBody({ packageName: "com.tidybity.app", subscriptionId: "premium_monthly", purchaseToken: "purchase-token" }) }),
    item({ name: "Verify Google Play Product", method: "POST", path: "/payment/google-play/verify-product", description: "Verifies a Google Play one-time product purchase.", body: jsonBody({ packageName: "com.tidybity.app", productId: "premium_once", purchaseToken: "purchase-token" }) }),
    item({ name: "Google Play Webhook", method: "POST", path: "/payment/google-play/webhook", auth: noAuth, description: "Processes Google Play webhook notifications.", body: jsonBody({ message: { data: "base64-payload" } }) }),
    item({ name: "Verify Apple Subscription", method: "POST", path: "/payment/apple/verify-subscription", description: "Verifies an Apple App Store subscription receipt or signed transaction.", body: jsonBody({ receiptData: "base64-receipt", productId: "premium_monthly" }) }),
    item({ name: "Apple Webhook", method: "POST", path: "/payment/apple/webhook", auth: noAuth, description: "Processes Apple App Store server notifications.", body: jsonBody({ signedPayload: "signed-payload" }) }),
  ]),
  folder("Subscriptions", "RevenueCat subscription plans, subscriptions, entitlements, admin plan management, and webhooks.", [
    item({ name: "RevenueCat Webhook", method: "POST", path: "/subscription/webhook/revenuecat", auth: noAuth, description: "Processes RevenueCat webhook events. Configure webhook secret/signature according to deployment settings.", body: jsonBody({ event: { type: "INITIAL_PURCHASE", data: { event_id: "evt_123", subscriber: { app_user_id: "{{userId}}" } } } }) }),
    item({ name: "Webhook Health", method: "GET", path: "/subscription/webhook/health", auth: noAuth, description: "Checks webhook endpoint health." }),
    item({ name: "Get Plans", method: "GET", path: "/subscription/plans", auth: noAuth, description: "Lists active subscription plans." }),
    item({ name: "Get Plan Details", method: "GET", path: "/subscription/plans/{{planId}}", auth: noAuth, description: "Fetches a plan by planId." }),
    item({ name: "Create Subscription", method: "POST", path: "/subscription/create", description: "Creates a subscription record for a plan.", body: jsonBody({ planId: "{{planId}}", stripeToken: "tok_visa" }) }),
    item({ name: "Get Active Subscription", method: "GET", path: "/subscription/active", description: "Returns active subscription for the authenticated user." }),
    item({ name: "Get Subscription History", method: "GET", path: "/subscription/history", description: "Returns subscription history for the authenticated user." }),
    item({ name: "Cancel Subscription", method: "POST", path: "/subscription/cancel", description: "Cancels the active subscription.", body: jsonBody({ reason: "user_cancelled" }) }),
    item({ name: "Pause Subscription", method: "POST", path: "/subscription/pause", description: "Pauses the active subscription." }),
    item({ name: "Resume Subscription", method: "POST", path: "/subscription/resume", description: "Resumes a paused subscription." }),
    item({ name: "Upgrade Or Downgrade Subscription", method: "POST", path: "/subscription/upgrade-downgrade", description: "Moves the active subscription to another plan.", body: jsonBody({ newPlanId: "{{newPlanId}}" }) }),
    item({ name: "Check Entitlements", method: "GET", path: "/subscription/check-entitlements", description: "Returns entitlement access for the authenticated user." }),
    item({ name: "Subscription Stats", method: "GET", path: "/subscription/stats", auth: adminToken, description: "Admin subscription statistics." }),
    item({ name: "Create Subscription Plan", method: "POST", path: "/subscription/admin/plans/create", auth: adminToken, description: "Creates a subscription plan.", body: jsonBody({ planName: "Premium", revenuecat_product_id: "premium_monthly", stripe_price_id: "price_123", entitlements: ["advanced_recipes", "meal_planning"], billing_period: "Monthly", amount: 9.99, currency: "BHD", description: "Premium monthly plan" }) }),
    item({ name: "Update Subscription Plan", method: "PUT", path: "/subscription/admin/plans/{{planId}}", auth: adminToken, description: "Updates subscription plan details.", body: jsonBody({ planName: "Premium Plus", entitlements: ["advanced_recipes", "meal_planning", "grocery_integration"], billing_period: "Monthly", amount: 12.99, currency: "BHD", description: "Updated plan", isActive: true }) }),
  ]),
  folder("Dashboard", "Admin dashboard summary endpoints.", [
    item({ name: "Total Overview", method: "GET", path: "/dashboard/total-overview", auth: adminToken, description: "Returns admin dashboard total overview." }),
    item({ name: "Revenue", method: "GET", path: "/dashboard/revenue", auth: adminToken, description: "Returns revenue data. Query filters depend on DashboardService implementation.", query: [{ key: "year", value: "2026" }, { key: "month", value: "" }] }),
  ], adminToken),
  folder("Manage Content", "Terms, privacy policy, about us, FAQ, and contact content management.", [
    item({ name: "Add Terms Conditions", method: "POST", path: "/manage/add-terms-conditions", description: "Creates or updates terms and conditions.", body: jsonBody({ description: "Terms and conditions content." }) }),
    item({ name: "Get Terms Conditions", method: "GET", path: "/manage/get-terms-conditions", auth: noAuth, description: "Returns terms and conditions." }),
    item({ name: "Delete Terms Conditions", method: "DELETE", path: "/manage/delete-terms-conditions", description: "Deletes terms and conditions by id.", query: [{ key: "id", value: "{{contentId}}" }] }),
    item({ name: "Add Privacy Policy", method: "POST", path: "/manage/add-privacy-policy", description: "Creates or updates privacy policy.", body: jsonBody({ description: "Privacy policy content." }) }),
    item({ name: "Get Privacy Policy", method: "GET", path: "/manage/get-privacy-policy", auth: noAuth, description: "Returns privacy policy document." }),
    item({ name: "Get Public Privacy Policy", method: "GET", path: "/manage/public-privacy-policy", auth: noAuth, description: "Returns only the privacy policy description string." }),
    item({ name: "Delete Privacy Policy", method: "DELETE", path: "/manage/delete-privacy-policy", description: "Deletes privacy policy by id.", query: [{ key: "id", value: "{{contentId}}" }] }),
    item({ name: "Add About Us", method: "POST", path: "/manage/add-about-us", description: "Creates or updates about us content.", body: jsonBody({ description: "About Tidy Bity." }) }),
    item({ name: "Get About Us", method: "GET", path: "/manage/get-about-us", auth: noAuth, description: "Returns about us content." }),
    item({ name: "Delete About Us", method: "DELETE", path: "/manage/delete-about-us", description: "Deletes about us content by id.", query: [{ key: "id", value: "{{contentId}}" }] }),
    item({ name: "Add FAQ", method: "POST", path: "/manage/add-faq", description: "Creates a FAQ item.", body: jsonBody({ question: "How do I add a room?", description: "Open rooms and create a new room." }) }),
    item({ name: "Get FAQ", method: "GET", path: "/manage/get-faq", auth: noAuth, description: "Lists FAQ items." }),
    item({ name: "Delete FAQ", method: "DELETE", path: "/manage/delete-faq", description: "Deletes a FAQ by id.", query: [{ key: "id", value: "{{contentId}}" }] }),
    item({ name: "Add Contact Us", method: "POST", path: "/manage/add-contact-us", description: "Creates or updates contact us content.", body: jsonBody({ description: "support@example.com" }) }),
    item({ name: "Get Contact Us", method: "GET", path: "/manage/get-contact-us", auth: noAuth, description: "Returns contact us content." }),
    item({ name: "Delete Contact Us", method: "DELETE", path: "/manage/delete-contact-us", description: "Deletes contact us content by id.", query: [{ key: "id", value: "{{contentId}}" }] }),
  ]),
];

const collection = {
  info: {
    name: "Tidy Bity Backend API",
    description:
      "Postman documentation for the Tidy Bity backend. Routes were generated from src/app/module/** route, controller, service, and model files. Set baseUrl and apiPrefix in the environment before running requests.",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  auth: authToken,
  event: [
    {
      listen: "prerequest",
      script: {
        type: "text/javascript",
        exec: [
          "pm.request.headers.upsert({ key: 'Accept', value: 'application/json' });",
        ],
      },
    },
  ],
  variable: [
    { key: "baseUrl", value: "http://localhost:8002" },
    { key: "apiPrefix", value: "" },
    { key: "authToken", value: "" },
    { key: "adminToken", value: "" },
  ],
  item: collectionItems,
};

const environment = {
  name: "Tidy Bity Local",
  values: [
    { key: "baseUrl", value: "http://localhost:8002", enabled: true },
    {
      key: "apiPrefix",
      value: "",
      enabled: true,
      type: "text",
      description: "Set to /api/v1 or another prefix if the Express app mounts routers behind one.",
    },
    { key: "authToken", value: "", enabled: true, type: "secret" },
    { key: "adminToken", value: "", enabled: true, type: "secret" },
    { key: "refreshToken", value: "", enabled: true, type: "secret" },
    { key: "userId", value: "", enabled: true },
    { key: "employeeUserId", value: "", enabled: true },
    { key: "employeeAuthId", value: "", enabled: true },
    { key: "houseId", value: "", enabled: true },
    { key: "roomId", value: "", enabled: true },
    { key: "taskId", value: "", enabled: true },
    { key: "groceryId", value: "", enabled: true },
    { key: "budgetId", value: "", enabled: true },
    { key: "expenseId", value: "", enabled: true },
    { key: "recipeId", value: "", enabled: true },
    { key: "planId", value: "", enabled: true },
    { key: "newPlanId", value: "", enabled: true },
    { key: "contentId", value: "", enabled: true },
  ],
  _postman_variable_scope: "environment",
  _postman_exported_using: "Tidy Bity generator",
};

function flattenItems(items, parent = []) {
  return items.flatMap((entry) => {
    if (entry.item) return flattenItems(entry.item, [...parent, entry.name]);
    return [{ folder: parent.join(" / "), name: entry.name, request: entry.request }];
  });
}

function markdownGuide() {
  const endpoints = flattenItems(collectionItems);
  const table = endpoints
    .map((entry) => `| ${entry.folder} | ${entry.request.method} | \`${entry.request.url.raw.replace(BASE, "{{baseUrl}}{{apiPrefix}}")}\` | ${entry.name} |`)
    .join("\n");

  return `# Tidy Bity Postman Documentation

Generated from the backend route, controller, service, and model files.

## Files

- \`tidy-bity.postman_collection.json\`: import this as the Postman collection.
- \`tidy-bity.local.postman_environment.json\`: import this as the local Postman environment.

## Environment Variables

- \`baseUrl\`: defaults to \`http://localhost:8002\`.
- \`apiPrefix\`: defaults to an empty string. Set it to \`/api/v1\`, \`/api\`, or the real mount prefix if your Express bootstrap uses one.
- \`authToken\`: bearer token for USER/EMPLOYEE requests. The login and activation requests try to set this automatically.
- \`adminToken\`: bearer token for ADMIN/SUPER_ADMIN requests.
- ID variables such as \`roomId\`, \`taskId\`, \`budgetId\`, and \`planId\` are placeholders used across requests.

## Important Notes

- This checkout does not contain the Express app bootstrap required by \`src/server.js\` (\`require("./app")\`), so module mount paths are inferred as \`/auth\`, \`/user\`, \`/task\`, and so on.
- Several files currently contain unresolved merge-conflict markers, including task, payment, grocery, recipe, wallet, room, user, and query builder files. Requests from both visible conflict branches are documented where applicable.
- Protected routes use \`Authorization: Bearer {{authToken}}\` unless marked as admin, which uses \`{{adminToken}}\`.
- List endpoints using \`QueryBuilder\` generally support \`page\`, \`limit\`, \`sort\`, \`fields\`, \`searchTerm\`, and direct filter fields.

## Endpoint Index

| Folder | Method | URL | Request |
| --- | --- | --- | --- |
${table}
`;
}

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(COLLECTION_PATH, `${JSON.stringify(collection, null, 2)}\n`);
fs.writeFileSync(ENVIRONMENT_PATH, `${JSON.stringify(environment, null, 2)}\n`);
fs.writeFileSync(GUIDE_PATH, markdownGuide());

console.log(`Wrote ${COLLECTION_PATH}`);
console.log(`Wrote ${ENVIRONMENT_PATH}`);
console.log(`Wrote ${GUIDE_PATH}`);
