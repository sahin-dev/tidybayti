# Tidy Bity Postman Documentation

Generated from the backend route, controller, service, and model files.

## Files

- `tidy-bity.postman_collection.json`: import this as the Postman collection.
- `tidy-bity.local.postman_environment.json`: import this as the local Postman environment.

## Environment Variables

- `baseUrl`: defaults to `http://localhost:8002`.
- `apiPrefix`: defaults to an empty string. Set it to `/api/v1`, `/api`, or the real mount prefix if your Express bootstrap uses one.
- `authToken`: bearer token for USER/EMPLOYEE requests. The login and activation requests try to set this automatically.
- `adminToken`: bearer token for ADMIN/SUPER_ADMIN requests.
- ID variables such as `roomId`, `taskId`, `budgetId`, and `planId` are placeholders used across requests.

## Important Notes

- This checkout does not contain the Express app bootstrap required by `src/server.js` (`require("./app")`), so module mount paths are inferred as `/auth`, `/user`, `/task`, and so on.
- Several files currently contain unresolved merge-conflict markers, including task, payment, grocery, recipe, wallet, room, user, and query builder files. Requests from both visible conflict branches are documented where applicable.
- Protected routes use `Authorization: Bearer {{authToken}}` unless marked as admin, which uses `{{adminToken}}`.
- List endpoints using `QueryBuilder` generally support `page`, `limit`, `sort`, `fields`, `searchTerm`, and direct filter fields.

## Endpoint Index

| Folder | Method | URL | Request |
| --- | --- | --- | --- |
| Auth | POST | `{{baseUrl}}{{apiPrefix}}/auth/register` | Register Account |
| Auth | POST | `{{baseUrl}}{{apiPrefix}}/auth/activation-code-resend` | Resend Activation Code |
| Auth | POST | `{{baseUrl}}{{apiPrefix}}/auth/activate-account` | Activate Account |
| Auth | POST | `{{baseUrl}}{{apiPrefix}}/auth/login` | Login |
| Auth | POST | `{{baseUrl}}{{apiPrefix}}/auth/forgot-password` | Forgot Password |
| Auth | POST | `{{baseUrl}}{{apiPrefix}}/auth/forget-pass-otp-verify` | Verify Forgot Password OTP |
| Auth | POST | `{{baseUrl}}{{apiPrefix}}/auth/reset-password` | Reset Password |
| Auth | PATCH | `{{baseUrl}}{{apiPrefix}}/auth/change-password` | Change Password |
| User | GET | `{{baseUrl}}{{apiPrefix}}/user/profile` | Get Profile |
| User | PATCH | `{{baseUrl}}{{apiPrefix}}/user/edit-profile` | Edit Profile |
| User | DELETE | `{{baseUrl}}{{apiPrefix}}/user/delete-account` | Delete My Account |
| User | POST | `{{baseUrl}}{{apiPrefix}}/user/add-employee` | Add Employee |
| User | PATCH | `{{baseUrl}}{{apiPrefix}}/user/edit-employee` | Edit Employee |
| User | DELETE | `{{baseUrl}}{{apiPrefix}}/user/delete-employee` | Delete Employee |
| User | GET | `{{baseUrl}}{{apiPrefix}}/user/get-my-employee?page=1&limit=10&sort=-createdAt&fields=&searchTerm=` | Get My Employees |
| User | GET | `{{baseUrl}}{{apiPrefix}}/user/get-single-employee?userId=%7B%7BemployeeUserId%7D%7D` | Get Single Employee |
| User | GET | `{{baseUrl}}{{apiPrefix}}/user/subscription_status` | Get User Subscription Status |
| Admin | GET | `{{baseUrl}}{{apiPrefix}}/admin/profile` | Get Admin Profile |
| Admin | PATCH | `{{baseUrl}}{{apiPrefix}}/admin/edit-profile` | Edit Admin Profile |
| Admin | DELETE | `{{baseUrl}}{{apiPrefix}}/admin/delete-account` | Delete Admin Account |
| Rooms And Houses | POST | `{{baseUrl}}{{apiPrefix}}/room/post-house` | Create House |
| Rooms And Houses | GET | `{{baseUrl}}{{apiPrefix}}/room/get-single-house?houseId=%7B%7BhouseId%7D%7D` | Get Single House |
| Rooms And Houses | GET | `{{baseUrl}}{{apiPrefix}}/room/get-my-houses` | Get My Houses |
| Rooms And Houses | POST | `{{baseUrl}}{{apiPrefix}}/room/post-room` | Create Room |
| Rooms And Houses | GET | `{{baseUrl}}{{apiPrefix}}/room/get-my-room?houseId=%7B%7BhouseId%7D%7D` | Get My Rooms |
| Rooms And Houses | GET | `{{baseUrl}}{{apiPrefix}}/room/get-single-room?roomId=%7B%7BroomId%7D%7D` | Get Single Room |
| Rooms And Houses | PATCH | `{{baseUrl}}{{apiPrefix}}/room/edit-single-room` | Edit Single Room |
| Rooms And Houses | DELETE | `{{baseUrl}}{{apiPrefix}}/room/delete-single-room` | Delete Single Room |
| Tasks | POST | `{{baseUrl}}{{apiPrefix}}/task/post-task` | Create Task |
| Tasks | GET | `{{baseUrl}}{{apiPrefix}}/task/get-task?taskId=%7B%7BtaskId%7D%7D` | Get Task |
| Tasks | GET | `{{baseUrl}}{{apiPrefix}}/task/get-my-task?page=1&limit=10&sort=-createdAt&fields=&searchTerm=&status=PENDING&recurrence=ONE_TIME` | Get My Tasks |
| Tasks | GET | `{{baseUrl}}{{apiPrefix}}/task/get-employee-specific-task?page=1&limit=10&sort=-createdAt&fields=&searchTerm=` | Get Employee Specific Tasks |
| Tasks | GET | `{{baseUrl}}{{apiPrefix}}/task/get-employee-specific-current-task?page=1&limit=10&sort=-createdAt&fields=&searchTerm=` | Get Employee Current Tasks |
| Tasks | GET | `{{baseUrl}}{{apiPrefix}}/task/get-all-task?page=1&limit=10&sort=-createdAt&fields=&searchTerm=` | Get All Tasks |
| Tasks | PATCH | `{{baseUrl}}{{apiPrefix}}/task/update-task` | Update Task |
| Tasks | PATCH | `{{baseUrl}}{{apiPrefix}}/task/update-task-or-grocery-status` | Update Task Or Grocery Status |
| Tasks | PATCH | `{{baseUrl}}{{apiPrefix}}/task/update-grocery-or-task-with-note` | Update Task Or Grocery Note |
| Tasks | DELETE | `{{baseUrl}}{{apiPrefix}}/task/delete-task` | Delete Task |
| Tasks | POST | `{{baseUrl}}{{apiPrefix}}/task/post-grocery-category` | Create Grocery Category |
| Tasks | GET | `{{baseUrl}}{{apiPrefix}}/task/get-grocery-category?page=1&limit=10&sort=-createdAt&fields=&searchTerm=` | Get Grocery Categories |
| Tasks | POST | `{{baseUrl}}{{apiPrefix}}/task/post-grocery` | Create Grocery |
| Tasks | GET | `{{baseUrl}}{{apiPrefix}}/task/get-grocery?groceryId=%7B%7BgroceryId%7D%7D` | Get Grocery |
| Tasks | GET | `{{baseUrl}}{{apiPrefix}}/task/get-my-grocery?page=1&limit=10&sort=-createdAt&fields=&searchTerm=` | Get My Grocery |
| Tasks | GET | `{{baseUrl}}{{apiPrefix}}/task/get-notifications` | Get Notifications |
| Tasks | GET | `{{baseUrl}}{{apiPrefix}}/task/presets` | Get Task Presets |
| Tasks | PATCH | `{{baseUrl}}{{apiPrefix}}/task/update-grocery` | Update Grocery |
| Tasks | DELETE | `{{baseUrl}}{{apiPrefix}}/task/delete-grocery` | Delete Grocery |
| Grocery Search | GET | `{{baseUrl}}{{apiPrefix}}/grocery/search?q=milk` | Search Grocery List |
| Wallet | POST | `{{baseUrl}}{{apiPrefix}}/wallet/post-budget` | Create Budget |
| Wallet | GET | `{{baseUrl}}{{apiPrefix}}/wallet/get-budget?budgetId=%7B%7BbudgetId%7D%7D` | Get Budget |
| Wallet | GET | `{{baseUrl}}{{apiPrefix}}/wallet/get-my-budget?page=1&limit=10&sort=-createdAt&fields=&searchTerm=` | Get My Budgets |
| Wallet | GET | `{{baseUrl}}{{apiPrefix}}/wallet/get-all-budget?page=1&limit=10&sort=-createdAt&fields=&searchTerm=` | Get All Budgets |
| Wallet | PATCH | `{{baseUrl}}{{apiPrefix}}/wallet/update-budget` | Update Budget |
| Wallet | DELETE | `{{baseUrl}}{{apiPrefix}}/wallet/delete-budget` | Delete Budget |
| Wallet | POST | `{{baseUrl}}{{apiPrefix}}/wallet/post-expense` | Create Expense |
| Wallet | GET | `{{baseUrl}}{{apiPrefix}}/wallet/get-expense?expenseId=%7B%7BexpenseId%7D%7D` | Get Expense |
| Wallet | GET | `{{baseUrl}}{{apiPrefix}}/wallet/get-single-budget-expense?budgetId=%7B%7BbudgetId%7D%7D` | Get Single Budget Expense |
| Wallet | DELETE | `{{baseUrl}}{{apiPrefix}}/wallet/delete-expense` | Delete Expense |
| Wallet | GET | `{{baseUrl}}{{apiPrefix}}/wallet/get-budget-category` | Get Budget Categories |
| Recipes | POST | `{{baseUrl}}{{apiPrefix}}/recipe/post-recipe` | Create Recipe |
| Recipes | GET | `{{baseUrl}}{{apiPrefix}}/recipe/get-recipe?recipeId=%7B%7BrecipeId%7D%7D` | Get Recipe |
| Recipes | GET | `{{baseUrl}}{{apiPrefix}}/recipe/get-my-recipe?page=1&limit=10&sort=-createdAt&fields=&searchTerm=` | Get My Recipes |
| Recipes | GET | `{{baseUrl}}{{apiPrefix}}/recipe/get-all-recipe?page=1&limit=10&sort=-createdAt&fields=&searchTerm=` | Get All Recipes |
| Recipes | PATCH | `{{baseUrl}}{{apiPrefix}}/recipe/update-recipe` | Update Recipe |
| Recipes | DELETE | `{{baseUrl}}{{apiPrefix}}/recipe/delete-recipe` | Delete Recipe |
| Recipes | PATCH | `{{baseUrl}}{{apiPrefix}}/recipe/favorite-unfavorite-recipe?recipeId=%7B%7BrecipeId%7D%7D` | Favorite Or Unfavorite Recipe |
| Payments | GET | `{{baseUrl}}{{apiPrefix}}/payment/success` | Payment Success Page |
| Payments | GET | `{{baseUrl}}{{apiPrefix}}/payment/cancel` | Payment Cancel Page |
| Payments | POST | `{{baseUrl}}{{apiPrefix}}/payment/checkout-subscription` | Checkout Subscription |
| Payments | POST | `{{baseUrl}}{{apiPrefix}}/payment/generate/payment-link` | Generate Stripe Payment Link |
| Payments | GET | `{{baseUrl}}{{apiPrefix}}/payment/user/subscription` | Get User Stripe Subscription |
| Payments | POST | `{{baseUrl}}{{apiPrefix}}/payment/google-play/verify-subscription` | Verify Google Play Subscription |
| Payments | POST | `{{baseUrl}}{{apiPrefix}}/payment/google-play/verify-product` | Verify Google Play Product |
| Payments | POST | `{{baseUrl}}{{apiPrefix}}/payment/google-play/webhook` | Google Play Webhook |
| Payments | POST | `{{baseUrl}}{{apiPrefix}}/payment/apple/verify-subscription` | Verify Apple Subscription |
| Payments | POST | `{{baseUrl}}{{apiPrefix}}/payment/apple/webhook` | Apple Webhook |
| Subscriptions | POST | `{{baseUrl}}{{apiPrefix}}/subscription/webhook/revenuecat` | RevenueCat Webhook |
| Subscriptions | GET | `{{baseUrl}}{{apiPrefix}}/subscription/webhook/health` | Webhook Health |
| Subscriptions | GET | `{{baseUrl}}{{apiPrefix}}/subscription/plans` | Get Plans |
| Subscriptions | GET | `{{baseUrl}}{{apiPrefix}}/subscription/plans/{{planId}}` | Get Plan Details |
| Subscriptions | POST | `{{baseUrl}}{{apiPrefix}}/subscription/create` | Create Subscription |
| Subscriptions | GET | `{{baseUrl}}{{apiPrefix}}/subscription/active` | Get Active Subscription |
| Subscriptions | GET | `{{baseUrl}}{{apiPrefix}}/subscription/history` | Get Subscription History |
| Subscriptions | POST | `{{baseUrl}}{{apiPrefix}}/subscription/cancel` | Cancel Subscription |
| Subscriptions | POST | `{{baseUrl}}{{apiPrefix}}/subscription/pause` | Pause Subscription |
| Subscriptions | POST | `{{baseUrl}}{{apiPrefix}}/subscription/resume` | Resume Subscription |
| Subscriptions | POST | `{{baseUrl}}{{apiPrefix}}/subscription/upgrade-downgrade` | Upgrade Or Downgrade Subscription |
| Subscriptions | GET | `{{baseUrl}}{{apiPrefix}}/subscription/check-entitlements` | Check Entitlements |
| Subscriptions | GET | `{{baseUrl}}{{apiPrefix}}/subscription/stats` | Subscription Stats |
| Subscriptions | POST | `{{baseUrl}}{{apiPrefix}}/subscription/admin/plans/create` | Create Subscription Plan |
| Subscriptions | PUT | `{{baseUrl}}{{apiPrefix}}/subscription/admin/plans/{{planId}}` | Update Subscription Plan |
| Dashboard | GET | `{{baseUrl}}{{apiPrefix}}/dashboard/total-overview` | Total Overview |
| Dashboard | GET | `{{baseUrl}}{{apiPrefix}}/dashboard/revenue?year=2026&month=` | Revenue |
| Manage Content | POST | `{{baseUrl}}{{apiPrefix}}/manage/add-terms-conditions` | Add Terms Conditions |
| Manage Content | GET | `{{baseUrl}}{{apiPrefix}}/manage/get-terms-conditions` | Get Terms Conditions |
| Manage Content | DELETE | `{{baseUrl}}{{apiPrefix}}/manage/delete-terms-conditions?id=%7B%7BcontentId%7D%7D` | Delete Terms Conditions |
| Manage Content | POST | `{{baseUrl}}{{apiPrefix}}/manage/add-privacy-policy` | Add Privacy Policy |
| Manage Content | GET | `{{baseUrl}}{{apiPrefix}}/manage/get-privacy-policy` | Get Privacy Policy |
| Manage Content | GET | `{{baseUrl}}{{apiPrefix}}/manage/public-privacy-policy` | Get Public Privacy Policy |
| Manage Content | DELETE | `{{baseUrl}}{{apiPrefix}}/manage/delete-privacy-policy?id=%7B%7BcontentId%7D%7D` | Delete Privacy Policy |
| Manage Content | POST | `{{baseUrl}}{{apiPrefix}}/manage/add-about-us` | Add About Us |
| Manage Content | GET | `{{baseUrl}}{{apiPrefix}}/manage/get-about-us` | Get About Us |
| Manage Content | DELETE | `{{baseUrl}}{{apiPrefix}}/manage/delete-about-us?id=%7B%7BcontentId%7D%7D` | Delete About Us |
| Manage Content | POST | `{{baseUrl}}{{apiPrefix}}/manage/add-faq` | Add FAQ |
| Manage Content | GET | `{{baseUrl}}{{apiPrefix}}/manage/get-faq` | Get FAQ |
| Manage Content | DELETE | `{{baseUrl}}{{apiPrefix}}/manage/delete-faq?id=%7B%7BcontentId%7D%7D` | Delete FAQ |
| Manage Content | POST | `{{baseUrl}}{{apiPrefix}}/manage/add-contact-us` | Add Contact Us |
| Manage Content | GET | `{{baseUrl}}{{apiPrefix}}/manage/get-contact-us` | Get Contact Us |
| Manage Content | DELETE | `{{baseUrl}}{{apiPrefix}}/manage/delete-contact-us?id=%7B%7BcontentId%7D%7D` | Delete Contact Us |
