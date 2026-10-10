const dotenv = require("dotenv");
const path = require("path");

dotenv.config({
  path: path.join(process.cwd(), ".env"),
});

const WEAK_SECRET_VALUES = new Set([
  "secret",
  "jwtsecret",
  "password",
  "tidybity",
  "tidybayti",
  "tidybitysecret",
  "test",
]);

const validateSecret = (name, value) => {
  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  const normalized = value.trim().toLowerCase();
  if (value.length < 32 || WEAK_SECRET_VALUES.has(normalized)) {
    throw new Error(`${name} must be at least 32 characters and not guessable`);
  }
};

const validateConfig = (config) => {
  validateSecret("JWT_SECRET", config.jwt.secret);
  validateSecret("JWT_REFRESH_SECRET", config.jwt.refresh_secret);
  if (config.jwt.secret === config.jwt.refresh_secret) {
    throw new Error("JWT_SECRET and JWT_REFRESH_SECRET must be different");
  }
  if (!config.database_url) {
    throw new Error("Missing database URL");
  }
};

const config = {
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  base_url: process.env.BASE_URL,
  database_url: process.env.MONGO_URL,
  database_password: process.env.DB_PASSWORD,
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS || 12,
  security: {
    enforce_https:
      process.env.ENFORCE_HTTPS === "true" || process.env.NODE_ENV === "production",
  },
  auth_level: {
    employee: ["USER", "EMPLOYEE", "ADMIN", "SUPER_ADMIN"],
    user: ["USER", "ADMIN", "SUPER_ADMIN"],
    admin: ["ADMIN", "SUPER_ADMIN"],
    super_admin: ["SUPER_ADMIN"],
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    refresh_secret: process.env.JWT_REFRESH_SECRET,
    expires_in: process.env.JWT_EXPIRES_IN,
    refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN,
  },
  smtp: {
    smtp_host: process.env.SMTP_HOST,
    smtp_port: process.env.SMTP_PORT,
    smtp_service: process.env.SMTP_SERVICE,
    smtp_mail: process.env.smtp_mail,
    smtp_password: process.env.SMTP_PASSWORD,
    NAME: process.env.SERVICE_NAME,
  },
  cloudinary: {
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
    couldinary_url: process.env.CLOUDINARY_URL,
  },
  sendgrid: {
    from_email: process.env.FORM_EMAIL,
    api_key: process.env.SEND_GRIDAPI_KEY,
  },
  stripe: {
    stripe_secret_key: process.env.STRIPE_SECRET_KEY,
    success_url: process.env.STRIPE_SUCCESS_URL,
    cancel_url: process.env.STRIPE_CANCEL_URL,
  },
  paypal: {
    mode: process.env.MODE,
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
  },
  googlePlay: {
    clientEmail: process.env.GOOGLE_PLAY_CLIENT_EMAIL,
    privateKey: process.env.GOOGLE_PLAY_PRIVATE_KEY,
    packageName: process.env.GOOGLE_PLAY_PACKAGE_NAME,
  },
  appleAppStore: {
    sharedSecret: process.env.APPLE_SHARED_SECRET,
    bundleId: process.env.APPLE_BUNDLE_ID,
    environment: process.env.APPLE_ENVIRONMENT,
    issuerId: process.env.APPLE_ISSUER_ID,
    keyId: process.env.APPLE_KEY_ID,
    privateKey: process.env.APPLE_PRIVATE_KEY,
  },  
  revenuecat: {
    api_key: process.env.REVENUECAT_API_KEY,
    secret_key: process.env.REVENUECAT_SECRET_KEY,
    webhook_secret: process.env.REVENUECAT_WEBHOOK_SECRET,
  },
  firebase: {
    projectId: "tidybayti-d3c85",
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
  },
};

// Validate configuration
validateConfig(config);

module.exports = config;
