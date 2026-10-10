# Tidy Bity Backend

Backend API for the Tidy Bity household management platform. The service supports account activation, user and employee management, rooms, tasks, grocery workflows, wallet and budgeting, recipes, subscriptions, payments, notifications, and scheduled jobs.

## Tech Stack

- Node.js and Express
- MongoDB with Mongoose
- JWT authentication and role-based authorization
- Agenda and node-cron for background processing
- Nodemailer for transactional email
- Stripe, PayPal, Google Play Billing, Apple App Store, and RevenueCat subscription integrations
- Winston logging with daily rotation

## Requirements

- Node.js 18 or newer
- npm
- MongoDB connection string
- SMTP credentials for email delivery
- Payment provider credentials for enabled billing flows

## Getting Started

Install dependencies:

```bash
npm install
```

Create the local environment file:

```bash
cp .env.example .env
```

Update `.env` with real values for your environment. Do not commit production secrets, private keys, webhook secrets, or service-account credentials.

Start the development server:

```bash
npm run dev
```

Start the production server:

```bash
npm start
```

By default the server reads `PORT` and `BASE_URL` from `.env`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm start` | Run `src/server.js` with Node.js |
| `npm run dev` | Run the API with Nodemon |
| `npm run lint:check` | Check JavaScript linting |
| `npm run lint:fix` | Fix lint issues where possible |
| `npm run prettier:check` | Check formatting for JavaScript and JSON files |
| `npm run prettier:fix` | Format the repository |
| `npm run lint-prettier` | Run lint and Prettier checks together |

## Environment Variables

The application reads configuration from `.env` through `src/config/index.js`.

### Core

```env
NODE_ENV=development
MODE=Development
BASE_URL=localhost
PORT=8002
MONGO_URL=mongodb://localhost:27017/tidy-bity
```

### Authentication

```env
BCRYPT_SALT_ROUNDS=12
JWT_SECRET=replace-with-strong-secret
JWT_EXPIRES_IN=365d
JWT_REFRESH_SECRET=replace-with-strong-refresh-secret
JWT_REFRESH_EXPIRES_IN=365d
ACTIVATION_SECRET=replace-with-activation-secret
```

### Email

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SERVICE=gmail
smtp_mail=no-reply@example.com
SMTP_PASSWORD=replace-with-app-password
SERVICE_NAME=Tidy Bity
```

### Media and Email Providers

```env
CLOUD_NAME=replace-with-cloudinary-cloud-name
API_KEY=replace-with-cloudinary-api-key
API_SECRET=replace-with-cloudinary-api-secret
CLOUDINARY_URL=replace-with-cloudinary-url
FORM_EMAIL=no-reply@example.com
SEND_GRIDAPI_KEY=replace-with-sendgrid-api-key
```

### Payments and Subscriptions

```env
STRIPE_SECRET_KEY=replace-with-stripe-secret
STRIPE_WEBHOOK_SECRET=replace-with-stripe-webhook-secret

CLIENT_ID=replace-with-paypal-client-id
CLIENT_SECRET=replace-with-paypal-client-secret

GOOGLE_PLAY_CLIENT_EMAIL=service-account@example.iam.gserviceaccount.com
GOOGLE_PLAY_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_PLAY_PACKAGE_NAME=com.tidybity.app

APPLE_SHARED_SECRET=replace-with-apple-shared-secret
APPLE_BUNDLE_ID=com.tidybity.app
APPLE_ENVIRONMENT=production
APPLE_ISSUER_ID=replace-with-issuer-id
APPLE_KEY_ID=replace-with-key-id
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

REVENUECAT_API_KEY=replace-with-revenuecat-api-key
REVENUECAT_SECRET_KEY=replace-with-revenuecat-secret-key
REVENUECAT_WEBHOOK_SECRET=replace-with-revenuecat-webhook-secret
```

## Project Structure

```text
src/
  app/
    middleware/          Express middleware for auth, upload handling, rate limits, and errors
    module/              Feature modules and route controllers
  builder/               Query builder helpers
  config/                Environment configuration
  connection/            MongoDB connection setup
  error/                 Error transformers and not-found handling
  helper/                Shared helper functions
  mail/                  Transactional email templates
  shared/                Response, logger, async, and transaction utilities
  util/                  General utility functions
  server.js              Application entry point
data/                    Seed/reference JSON data
public/                  Static public assets
scripts/                 Maintenance and data scripts
uploads/                 Runtime uploads, ignored by Git
logs/                    Runtime logs, ignored by Git
```

## Feature Modules

| Module | Responsibility |
| --- | --- |
| `auth` | Registration, activation, login, password reset, and password changes |
| `user` | Profile management, account deletion, employee management, and subscription status |
| `admin` | Administrative account operations |
| `Room` | Room and house metadata |
| `task` | Household tasks, recurring task data, grocery categories, groceries, and notifications |
| `grocery` | Grocery categories and grocery item workflows |
| `wallet` | Expenses, budgets, and wallet categories |
| `recipe` | Recipe and favorite recipe management |
| `payment` | Stripe, PayPal, Google Play, and Apple payment flows |
| `subscription` | RevenueCat subscription plans, status, entitlements, webhooks, and admin plan management |
| `dashboard` | Dashboard summary data |
| `manage` | Management-related operations |
| `agenda` | Scheduled/background job initialization and task watchers |

## API Overview

Routes are organized by module under `src/app/module/**/<module>.routes.js`. The main API should mount these routers from the Express app entry file. Common route groups include:

- Auth: register, login, account activation, forgot password, reset password, and change password
- User: profile, employee creation and management, account deletion, and subscription status
- Task and grocery: create, list, update, delete, status updates, notes, presets, and notifications
- Wallet: budgets, expenses, and wallet reporting
- Payment: subscription checkout, payment links, store verification, and payment callbacks
- Subscription: plans, active subscription, subscription history, entitlements, RevenueCat webhooks, and admin plan management

Protected routes use the JWT auth middleware in `src/app/middleware/auth.js`. Role groups are defined in `src/config/index.js`.

## Background Jobs

The server starts the Agenda job scheduler during boot. Job code lives in:

```text
src/app/module/agenda/
src/app/module/agenda/jobs/
```

Use this area for recurring task watchers and other scheduled household automation.

## Logging

Logging is centralized in `src/shared/logger.js`. Runtime logs are written under `logs/`, which is ignored by Git. In production, forward these logs to the hosting platform or a centralized log service.

## File Uploads

Upload handling is implemented in `src/app/middleware/fileUploader.js`. Runtime uploads are stored under `uploads/`, which is ignored by Git. For production deployments, prefer durable object storage such as S3, Cloudinary, or another managed storage provider.

## Production Checklist

- Use strong unique values for all JWT and activation secrets.
- Keep `.env`, private keys, webhook secrets, service-account credentials, uploads, and logs out of Git.
- Use a production MongoDB cluster with backups enabled.
- Restrict database, SMTP, payment, and app-store credentials to the minimum required permissions.
- Configure RevenueCat, Stripe, PayPal, Google Play, and Apple webhook URLs for the deployed API domain.
- Enable HTTPS at the load balancer or platform level.
- Configure process management with PM2, Docker, or the deployment platform's native runtime.
- Run linting and formatting checks before deployment.
- Review and resolve any merge-conflict markers before starting the application.

## Useful Commands

Check for merge-conflict markers:

```bash
git grep "<<<<<<<\\|=======\\|>>>>>>>"
```

Run code quality checks:

```bash
npm run lint:check
npm run prettier:check
```

Start locally with live reload:

```bash
npm run dev
```

## Documentation

Subscription-specific documentation is available in:

```text
src/app/module/subscription/README.md
src/app/module/subscription/SUBSCRIPTION_GUIDE.md
src/app/module/subscription/API_TESTING_GUIDE.md
src/app/module/subscription/AUTH_MIDDLEWARE.md
src/app/module/subscription/IMPLEMENTATION_EXAMPLES.md
```

## License

This project is licensed under the ISC license.
