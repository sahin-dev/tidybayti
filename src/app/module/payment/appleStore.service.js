const https = require("https");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const status = require("http-status");
const config = require("../../../config");
const ApiError = require("../../../error/ApiError");
const User = require("../user/User");
const Payment = require("./payment.model");
const Subscription = require("./subscription.model");
const validateFields = require("../../../util/validateFields");
const { logger } = require("../../../shared/logger");

const APPLE_GATEWAY = "apple_app_store";
const PRODUCTION_VERIFY_RECEIPT_URL = "https://buy.itunes.apple.com/verifyReceipt";
const SANDBOX_VERIFY_RECEIPT_URL = "https://sandbox.itunes.apple.com/verifyReceipt";
const PRODUCTION_SERVER_API_URL = "https://api.storekit.itunes.apple.com";
const SANDBOX_SERVER_API_URL = "https://api.storekit-sandbox.itunes.apple.com";
const ACTIVE_SUBSCRIPTION_STATUSES = new Set([1, 4]);

const getUserId = (userData) => userData?.userId || userData?._id || userData?.id;

const getAppleConfig = () => config.appleAppStore || {};

const normalizeEnvironment = (environment) => {
  if (!environment) return null;
  const value = String(environment).toLowerCase();
  return value === "sandbox" ? "sandbox" : "production";
};

const getDefaultEnvironment = (environment) =>
  normalizeEnvironment(environment) ||
  normalizeEnvironment(getAppleConfig().environment) ||
  "production";

const getVerifyReceiptUrl = (environment) =>
  environment === "sandbox" ? SANDBOX_VERIFY_RECEIPT_URL : PRODUCTION_VERIFY_RECEIPT_URL;

const getServerApiBaseUrl = (environment) =>
  environment === "sandbox" ? SANDBOX_SERVER_API_URL : PRODUCTION_SERVER_API_URL;

const formatPrivateKey = (privateKey) =>
  privateKey ? privateKey.replace(/\\n/g, "\n") : privateKey;

const parseMillisDate = (value) => {
  const millis = Number(value);
  return Number.isFinite(millis) && millis > 0 ? new Date(millis) : null;
};

const base64UrlDecode = (value) => {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(
    Math.ceil(value.length / 4) * 4,
    "="
  );
  return Buffer.from(padded, "base64");
};

const certificateToPem = (certificate) =>
  `-----BEGIN CERTIFICATE-----\n${certificate.match(/.{1,64}/g).join("\n")}\n-----END CERTIFICATE-----`;

const decodeAppleJws = (signedPayload) => {
  if (!signedPayload || typeof signedPayload !== "string") {
    throw new ApiError(status.BAD_REQUEST, "signedPayload is required.");
  }

  const parts = signedPayload.split(".");
  if (parts.length !== 3) {
    throw new ApiError(status.BAD_REQUEST, "Invalid Apple signed payload.");
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = JSON.parse(base64UrlDecode(encodedHeader).toString("utf-8"));
  const payload = JSON.parse(base64UrlDecode(encodedPayload).toString("utf-8"));

  if (header.x5c?.length) {
    const certificate = new crypto.X509Certificate(certificateToPem(header.x5c[0]));
    const isValid = crypto.verify(
      "sha256",
      Buffer.from(`${encodedHeader}.${encodedPayload}`),
      { key: certificate.publicKey, dsaEncoding: "ieee-p1363" },
      base64UrlDecode(encodedSignature)
    );

    if (!isValid) {
      throw new ApiError(status.BAD_REQUEST, "Invalid Apple signed payload signature.");
    }
  }

  return payload;
};

const requestJson = (url, options = {}, body) =>
  new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const request = https.request(
      {
        hostname: parsedUrl.hostname,
        path: `${parsedUrl.pathname}${parsedUrl.search}`,
        method: options.method || "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
      },
      (response) => {
        let data = "";
        response.on("data", (chunk) => {
          data += chunk;
        });
        response.on("end", () => {
          let parsedData = {};
          if (data) {
            try {
              parsedData = JSON.parse(data);
            } catch (error) {
              return reject(error);
            }
          }

          if (response.statusCode < 200 || response.statusCode >= 300) {
            return reject(
              new ApiError(
                status.BAD_REQUEST,
                `Apple API request failed with status ${response.statusCode}.`
              )
            );
          }

          resolve(parsedData);
        });
      }
    );

    request.on("error", reject);
    if (body) request.write(JSON.stringify(body));
    request.end();
  });

const createAppStoreServerToken = () => {
  const { issuerId, keyId, privateKey, bundleId } = getAppleConfig();

  if (!issuerId || !keyId || !privateKey || !bundleId) {
    throw new ApiError(
      status.INTERNAL_SERVER_ERROR,
      "Apple App Store Server API is not configured. Missing issuerId, keyId, privateKey, or bundleId."
    );
  }

  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      iss: issuerId,
      iat: now,
      exp: now + 1200,
      aud: "appstoreconnect-v1",
      bid: bundleId,
    },
    formatPrivateKey(privateKey),
    {
      algorithm: "ES256",
      header: {
        alg: "ES256",
        kid: keyId,
        typ: "JWT",
      },
    }
  );
};

const requestAppStoreServerApi = async (path, environment) => {
  const token = createAppStoreServerToken();
  const baseUrl = getServerApiBaseUrl(environment);
  return requestJson(`${baseUrl}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const verifyReceiptWithApple = async (receiptData, environment) => {
  const { sharedSecret } = getAppleConfig();

  if (!sharedSecret) {
    throw new ApiError(
      status.INTERNAL_SERVER_ERROR,
      "Apple receipt validation is not configured. Missing shared secret."
    );
  }

  const initialEnvironment = getDefaultEnvironment(environment);
  const body = {
    "receipt-data": receiptData,
    password: sharedSecret,
    "exclude-old-transactions": false,
  };

  const firstResponse = await requestJson(getVerifyReceiptUrl(initialEnvironment), { method: "POST" }, body);

  if (firstResponse.status === 21007) {
    return {
      response: await requestJson(SANDBOX_VERIFY_RECEIPT_URL, { method: "POST" }, body),
      environment: "sandbox",
    };
  }

  if (firstResponse.status === 21008) {
    return {
      response: await requestJson(PRODUCTION_VERIFY_RECEIPT_URL, { method: "POST" }, body),
      environment: "production",
    };
  }

  return {
    response: firstResponse,
    environment: initialEnvironment,
  };
};

const selectLatestReceiptTransaction = (receiptResponse, productId) => {
  const transactions = [
    ...(receiptResponse.latest_receipt_info || []),
    ...(receiptResponse.receipt?.in_app || []),
  ].filter((item) => !productId || item.product_id === productId);

  if (!transactions.length) {
    throw new ApiError(status.BAD_REQUEST, "No matching Apple subscription transaction found.");
  }

  return transactions.sort((a, b) => {
    const aDate = Number(a.expires_date_ms || a.purchase_date_ms || 0);
    const bDate = Number(b.expires_date_ms || b.purchase_date_ms || 0);
    return bDate - aDate;
  })[0];
};

const getReceiptRenewalInfo = (receiptResponse, transaction) =>
  (receiptResponse.pending_renewal_info || []).find(
    (renewalInfo) =>
      renewalInfo.original_transaction_id === transaction.original_transaction_id ||
      renewalInfo.product_id === transaction.product_id
  );

const normalizeReceiptTransaction = (receiptResponse, environment, productId, amount) => {
  if (![0, 21006].includes(receiptResponse.status)) {
    throw new ApiError(
      status.BAD_REQUEST,
      `Apple receipt validation failed with status ${receiptResponse.status}.`
    );
  }

  const transaction = selectLatestReceiptTransaction(receiptResponse, productId);
  const renewalInfo = getReceiptRenewalInfo(receiptResponse, transaction);

  return {
    productId: transaction.product_id,
    originalTransactionId: transaction.original_transaction_id,
    transactionId: transaction.transaction_id,
    bundleId: receiptResponse.receipt?.bundle_id,
    purchaseDate: parseMillisDate(transaction.purchase_date_ms) || new Date(),
    expiresDate: parseMillisDate(transaction.expires_date_ms),
    revocationDate: parseMillisDate(transaction.cancellation_date_ms),
    autoRenewing: renewalInfo ? renewalInfo.auto_renew_status === "1" : undefined,
    environment,
    amount: Number(amount || 0),
    sourceStatus: receiptResponse.status,
  };
};

const normalizeServerTransaction = (transaction, renewalInfo, environment, amount, subscriptionStatus) => ({
  productId: transaction.productId,
  originalTransactionId: transaction.originalTransactionId,
  transactionId: transaction.transactionId,
  bundleId: transaction.bundleId,
  purchaseDate: parseMillisDate(transaction.purchaseDate) || new Date(),
  expiresDate: parseMillisDate(transaction.expiresDate),
  revocationDate: parseMillisDate(transaction.revocationDate),
  autoRenewing:
    renewalInfo?.autoRenewStatus === 1 ||
    renewalInfo?.autoRenewStatus === "1" ||
    renewalInfo?.autoRenewStatus === true,
  environment: normalizeEnvironment(transaction.environment) || environment,
  amount: Number(amount || 0),
  subscriptionStatus,
});

const getTransactionFromServerApi = async (transactionId, environment, amount) => {
  const response = await requestAppStoreServerApi(
    `/inApps/v1/transactions/${encodeURIComponent(transactionId)}`,
    environment
  );
  const transaction = decodeAppleJws(response.signedTransactionInfo);
  return normalizeServerTransaction(transaction, null, environment, amount);
};

const getSubscriptionFromServerApi = async (originalTransactionId, environment, productId, amount) => {
  const response = await requestAppStoreServerApi(
    `/inApps/v1/subscriptions/${encodeURIComponent(originalTransactionId)}`,
    environment
  );

  const allTransactions = (response.data || [])
    .flatMap((group) => group.lastTransactions || [])
    .map((item) => ({
      status: item.status,
      transaction: decodeAppleJws(item.signedTransactionInfo),
      renewalInfo: item.signedRenewalInfo ? decodeAppleJws(item.signedRenewalInfo) : null,
    }))
    .filter((item) => !productId || item.transaction.productId === productId);

  if (!allTransactions.length) {
    throw new ApiError(status.BAD_REQUEST, "No matching Apple subscription status found.");
  }

  const latest = allTransactions.sort((a, b) => {
    const aDate = Number(a.transaction.expiresDate || a.transaction.purchaseDate || 0);
    const bDate = Number(b.transaction.expiresDate || b.transaction.purchaseDate || 0);
    return bDate - aDate;
  })[0];

  return normalizeServerTransaction(
    latest.transaction,
    latest.renewalInfo,
    normalizeEnvironment(response.environment) || environment,
    amount,
    latest.status
  );
};

const ensureBundleMatches = (bundleId) => {
  const configuredBundleId = getAppleConfig().bundleId;
  if (configuredBundleId && bundleId && configuredBundleId !== bundleId) {
    throw new ApiError(status.BAD_REQUEST, "Apple transaction bundleId does not match this app.");
  }
};

const getSubscriptionStatus = (purchase) => {
  const subscriptionStatus =
    purchase.subscriptionStatus === undefined || purchase.subscriptionStatus === null
      ? null
      : Number(purchase.subscriptionStatus);

  if (purchase.revocationDate) return "cancelled";
  if (purchase.notificationType && ["REFUND", "REVOKE"].includes(purchase.notificationType)) {
    return "cancelled";
  }
  if (purchase.notificationType === "DID_FAIL_TO_RENEW") return "pending";
  if (subscriptionStatus === 3) return "pending";
  if (Number.isFinite(subscriptionStatus) && !ACTIVE_SUBSCRIPTION_STATUSES.has(subscriptionStatus)) {
    return "expired";
  }
  if (!purchase.expiresDate || purchase.expiresDate <= new Date()) return "expired";
  return "activated";
};

const isPurchaseActive = (purchase) => getSubscriptionStatus(purchase) === "activated";

const saveAppleSubscription = async (userData, purchase, payload = {}) => {
  const userId = getUserId(userData);
  if (!userId) {
    throw new ApiError(status.UNAUTHORIZED, "User is required.");
  }

  if (!purchase.productId) {
    throw new ApiError(status.BAD_REQUEST, "Apple productId is missing from transaction.");
  }

  if (!purchase.originalTransactionId && !purchase.transactionId) {
    throw new ApiError(status.BAD_REQUEST, "Apple transaction id is missing.");
  }

  ensureBundleMatches(purchase.bundleId);

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(status.NOT_FOUND, "User not found");
  }

  const purchaseToken = purchase.originalTransactionId || purchase.transactionId;
  const subscriptionStatus = getSubscriptionStatus(purchase);
  const active = isPurchaseActive(purchase);
  const expiresDate = purchase.expiresDate || new Date();
  const amount = Number(payload.amount ?? purchase.amount ?? 0);
  const packageType = payload.packageType;

  user.isSubscribed = active;
  user.subscriptionExpires = expiresDate;
  await user.save();

  let payment = await Payment.findOne({ purchaseToken });
  if (!payment) {
    payment = new Payment({
      user: user._id,
      packageType,
      amount,
      gateway: APPLE_GATEWAY,
      purchaseToken,
      productId: purchase.productId,
      packageName: purchase.bundleId || getAppleConfig().bundleId,
      status: active ? "succeeded" : "unpaid",
    });
  } else {
    payment.user = user._id;
    payment.packageType = packageType;
    payment.amount = amount;
    payment.gateway = APPLE_GATEWAY;
    payment.productId = purchase.productId;
    payment.packageName = purchase.bundleId || payment.packageName || getAppleConfig().bundleId;
    payment.status = active ? "succeeded" : "unpaid";
  }
  await payment.save();

  const startDate = purchase.purchaseDate || new Date();
  let subscription = await Subscription.findOne({
    $or: [{ purchaseToken }, { user: user._id }],
  });

  if (!subscription) {
    subscription = new Subscription({
      user: user._id,
      productId: purchase.productId,
      purchaseToken,
      startDate,
      endDate: expiresDate,
      nextPaymentDate: expiresDate,
      status: subscriptionStatus,
      autoRenewing: purchase.autoRenewing,
      amount,
      gateway: APPLE_GATEWAY,
    });
  } else {
    subscription.user = user._id;
    subscription.productId = purchase.productId;
    subscription.purchaseToken = purchaseToken;
    subscription.startDate = startDate;
    subscription.endDate = expiresDate;
    subscription.nextPaymentDate = expiresDate;
    subscription.status = subscriptionStatus;
    subscription.autoRenewing = purchase.autoRenewing;
    subscription.amount = amount;
    subscription.gateway = APPLE_GATEWAY;
  }
  await subscription.save();

  return {
    verified: active,
    expiryDate: user.subscriptionExpires,
    autoRenewing: purchase.autoRenewing,
    environment: purchase.environment,
    transactionId: purchase.transactionId,
    originalTransactionId: purchaseToken,
    payment,
  };
};

const verifySubscriptionPurchase = async (userData, payload) => {
  validateFields(payload, ["packageType"]);

  if (!payload.receiptData && !payload.transactionId && !payload.originalTransactionId) {
    throw new ApiError(
      status.BAD_REQUEST,
      "receiptData, transactionId, or originalTransactionId is required."
    );
  }

  const environment = getDefaultEnvironment(payload.environment);
  let purchase;

  if (payload.receiptData) {
    const { response, environment: receiptEnvironment } = await verifyReceiptWithApple(
      payload.receiptData,
      environment
    );
    purchase = normalizeReceiptTransaction(
      response,
      receiptEnvironment,
      payload.productId,
      payload.amount
    );
  } else if (payload.originalTransactionId) {
    purchase = await getSubscriptionFromServerApi(
      payload.originalTransactionId,
      environment,
      payload.productId,
      payload.amount
    );
  } else {
    purchase = await getTransactionFromServerApi(payload.transactionId, environment, payload.amount);
  }

  if (payload.productId && payload.productId !== purchase.productId) {
    throw new ApiError(status.BAD_REQUEST, "Apple productId does not match the transaction.");
  }

  return saveAppleSubscription(userData, purchase, payload);
};

const handleAppleWebhook = async (payload) => {
  validateFields(payload, ["signedPayload"]);

  const notification = decodeAppleJws(payload.signedPayload);
  const transaction = notification.data?.signedTransactionInfo
    ? decodeAppleJws(notification.data.signedTransactionInfo)
    : null;
  const renewalInfo = notification.data?.signedRenewalInfo
    ? decodeAppleJws(notification.data.signedRenewalInfo)
    : null;

  logger.info("Received Apple App Store notification:", {
    notificationType: notification.notificationType,
    subtype: notification.subtype,
  });

  if (!transaction) {
    return { success: true, message: "Ignored Apple notification without transaction info." };
  }

  const purchaseToken = transaction.originalTransactionId || transaction.transactionId;
  const payment = await Payment.findOne({ purchaseToken });

  if (!payment) {
    logger.warn("No payment record found for Apple transaction.");
    return { success: false, message: "No matching payment record found." };
  }

  const purchase = normalizeServerTransaction(
    transaction,
    renewalInfo,
    normalizeEnvironment(notification.data?.environment) || getDefaultEnvironment(),
    payment.amount,
    notification.data?.status
  );
  purchase.notificationType = notification.notificationType;

  const result = await saveAppleSubscription(
    { userId: payment.user },
    purchase,
    {
      packageType: payment.packageType,
      amount: payment.amount,
    }
  );

  return {
    success: true,
    notificationType: notification.notificationType,
    subtype: notification.subtype,
    verified: result.verified,
    expiryDate: result.expiryDate,
  };
};

const AppleStoreService = {
  verifySubscriptionPurchase,
  handleAppleWebhook,
};

module.exports = AppleStoreService;
