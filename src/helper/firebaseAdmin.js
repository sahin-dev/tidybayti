const admin = require("firebase-admin");
const config = require("../config");

const formatPrivateKey = (privateKey) =>
  privateKey ? privateKey.replace(/\\n/g, "\n") : privateKey;

const getFirebaseAdmin = () => {
  if (admin.apps.length) return admin;

  const { projectId, clientEmail, privateKey } = config.firebase;

  if (clientEmail || privateKey) {
    if (!clientEmail || !privateKey) {
      throw new Error(
        "FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY must both be configured"
      );
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: formatPrivateKey(privateKey),
      }),
      projectId,
    });
  } else {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId,
    });
  }

  return admin;
};

module.exports = getFirebaseAdmin;
