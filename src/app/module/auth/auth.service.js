const bcrypt = require("bcrypt");
const cron = require("node-cron");
const { status } = require("http-status");

const ApiError = require("../../../error/ApiError");
const Auth = require("./Auth");
const User = require("../user/User");
const Admin = require("../admin/Admin");
const House = require("../house/House");
const Room = require("../Room/Room");
const config = require("../../../config");
const { jwtHelpers } = require("../../../helper/jwtHelpers");
const { ENUM_USER_ROLE } = require("../../../util/enum");
const { logger, errorLogger } = require("../../../shared/logger");
const codeGenerator = require("../../../util/codeGenerator");
const validateFields = require("../../../util/validateFields");
const EmailHelpers = require("../../../util/emailHelpers");
const Subscription = require("../payment/subscription.model");

const path = require('path')

const registrationAccount = async (payload) => {

  const { role, firstName, lastName, password, confirmPassword, email } = payload;


  validateFields(payload, [
    "password",
    "confirmPassword",
    "email",
    "firstName",
    "lastName",
  ]);


  const authData = {
    role,
    firstName,
    lastName,
    email,
    password,
  };


  if (!Object.values(ENUM_USER_ROLE).includes(role))
    throw new ApiError(status.BAD_REQUEST, "Invalid role");
  if (password !== confirmPassword)
    throw new ApiError(
      status.BAD_REQUEST,
      "Password and Confirm Password didn't match"
    );

  const user = await Auth.findOne({ email });

  if (user) {
    const message = "Account already exist with this email! Please login to your account"

    return {
      isActive: user.isActive,
      message,
    };
  }

  const auth = await Auth.create(authData);

  const userData = {
    authId: auth._id,
    firstName,
    lastName,
    email,
    ...(payload.phoneNumber && { phoneNumber: payload.phoneNumber }),
    ...(role === ENUM_USER_ROLE.USER && {
      firstLogin: null,
      trialExpires: null,
      isSubscribed: false,
    }),
  };

  if (role === ENUM_USER_ROLE.ADMIN) await Admin.create(userData);
  else {
    const user = await User.create(userData);

    const { code: activationCode, expiredAt: activationCodeExpire } =
      codeGenerator(3);
    const data = {
      user: `${user.firstName} ${user.lastName}`,
      activationCode,
      activationCodeExpire: Math.round(
        (activationCodeExpire - Date.now()) / (60 * 1000)
      ),
    }
    auth.activationCode = activationCode;
    auth.activationCodeExpire = activationCodeExpire;
    await auth.save();
    EmailHelpers.sendActivationEmail(email, data);
  }


  // if (role !== ENUM_USER_ROLE.ADMIN)
  //   EmailHelpers.sendActivationEmail(email, data);



  return {
    isActive: false,
    message: "Account created successfully. Please check your email",
  };
};

const populateDefaultData = async (userId) => {
  try {
    if (!userId) return;

    // create a default house for the user
    const house = await House.create({ user: userId, name: "My House" });

    // create 8 default rooms for the house
    const roomNames = [
      "Living Room",
      "Kitchen",
      "Bedroom",
      "Bathroom",
      "Dining Room",
      "Guest Room",
      "Pantry",
      "Laundry Room",
    ];

    const rooms = roomNames.map((name) => {
      const roomImageFileName = name.toLowerCase().split(" ").join("_").concat(".svg")
      const imagePath = path.join("uploads", "default", "room", roomImageFileName)
      return ({
        user: userId,
        house: house._id,
        roomImage: imagePath,
        name,
      })
    });

    await Room.insertMany(rooms);

    logger.info(`Default house and ${rooms.length} rooms created for user ${userId}`);
  } catch (error) {
    errorLogger.error("Error populating default data:", error);
  }
};

const resendActivationCode = async (payload) => {
  const email = payload.email;
  const user = await Auth.findOne({ email: email });
  if (!user) throw new ApiError(status.BAD_REQUEST, "Email not found!");

  const { code: activationCode, expiredAt: activationCodeExpire } =
    codeGenerator(3);
  const data = {
    user: `${user.firstName} ${user.lastName}`,
    activationCode,
    activationCodeExpire: Math.round(
      (activationCodeExpire - Date.now()) / (60 * 1000)
    ),
  };

  user.activationCode = activationCode;
  user.activationCodeExpire = activationCodeExpire;
  await user.save();

  EmailHelpers.sendOtpResendEmail(email, data);
};

const activateAccount = async (payload) => {
  const { activationCode, email } = payload;

  const auth = await Auth.findOne({ email });
  if (!auth) throw new ApiError(status.NOT_FOUND, "User not found");
  if (!auth.activationCode)
    throw new ApiError(
      status.NOT_FOUND,
      "Activation code not found. Get a new activation code"
    );
  if (auth.activationCode !== activationCode)
    throw new ApiError(status.BAD_REQUEST, "Code didn't match!");

  await Auth.updateOne(
    { email: email },
    { isActive: true },
    {
      new: true,
      runValidators: true,
    }
  );

  let result;
  switch (auth.role) {
    case ENUM_USER_ROLE.ADMIN:
      result = await Admin.findOne({ authId: auth._id }).lean();
      break;
    default:
      result = await User.findOne({ authId: auth._id }).lean();
      populateDefaultData(result._id)
  }

  const tokenPayload = {
    authId: auth._id,
    userId: result._id,
    email,
    role: auth.role,
  };

  const accessToken = jwtHelpers.createToken(
    tokenPayload,
    config.jwt.secret,
    config.jwt.expires_in
  );
  const refreshToken = jwtHelpers.createToken(
    tokenPayload,
    config.jwt.refresh_secret,
    config.jwt.refresh_expires_in
  );

  return {
    accessToken,
    refreshToken,
  };
};

const loginAccount = async (payload) => {
  const { email, password, role } = payload;

  const auth = await Auth.isAuthExist(email);

  if (!auth) throw new ApiError(status.NOT_FOUND, "User does not exist");

  if (role && role !== auth.role) {
    throw new ApiError(status.BAD_REQUEST, "Sorry, you selected the wrong role.");
  }

  if (!auth.isActive) {

    const { code: activationCode, expiredAt: activationCodeExpire } = codeGenerator(3);
    const data = {
      user: `${auth.firstName} ${auth.lastName}`,
      activationCode,
      activationCodeExpire: Math.round(
        (activationCodeExpire - Date.now()) / (60 * 1000)
      ),
    };

    auth.activationCode = activationCode;
    auth.activationCodeExpire = activationCodeExpire;
    await auth.save();

    EmailHelpers.sendOtpResendEmail(email, data);

    return {
      statusCode: status.BAD_REQUEST,
      isActive: false,
      message: "Please activate your account.Check your email for otp."
    }

  }

  if (auth.isBlocked)
    throw new ApiError(status.FORBIDDEN, "You are blocked. Contact support");

  if (
    auth.password &&
    !(await Auth.isPasswordMatched(password, auth.password))
  ) {
    throw new ApiError(status.BAD_REQUEST, "Password is incorrect");
  }

  let result;
  switch (auth.role) {
    case ENUM_USER_ROLE.ADMIN:
      result = await Admin.findOne({ authId: auth._id }).populate("authId");
      break;
    default:
      result = await User.findOne({ authId: auth._id }).populate("authId");
  }


  

  const tokenPayload = {
    authId: auth._id,
    userId: result._id,
    email,
    role: auth.role,
  };

  const accessToken = jwtHelpers.createToken(
    tokenPayload,
    config.jwt.secret,
    config.jwt.expires_in
  );
  const refreshToken = jwtHelpers.createToken(
    tokenPayload,
    config.jwt.refresh_secret,
    config.jwt.refresh_expires_in
  );
  

  if (auth.role === ENUM_USER_ROLE.USER && !result.firstLogin){
      await trialActivationForNewUser(auth._id);
      return {
      
      isSubscribed: result.isSubscribed,
      trialExpired: false,
      trialExpiresAt: result.trialExpires,
      accessToken: accessToken,
      refreshToken: refreshToken
    };

  }

  
  const isTrialActive = result.trialExpires && new Date(result.trialExpires) > new Date();
  const isSubscriptionActive = result.isSubscribed && (!result.subscriptionExpires || new Date(result.subscriptionExpires) > new Date());


  // Existing code up to token creation
  // Add subscription lookup

  const subscriptionRecord = await Subscription.findOne({ user: result._id }).lean();
  const productId = subscriptionRecord ? subscriptionRecord.productId : null;


  if (
    auth.role === ENUM_USER_ROLE.USER &&
    !isTrialActive &&
    !isSubscriptionActive
  ) {
    return {
      statusCode: status.FORBIDDEN,
      isSubscribed: result.isSubscribed,
      trialExpired: true,
      trialExpiresAt: result.trialExpires,
      token: accessToken,
      message: "Your trial or Subscription is finished. Renew or buy a subscription to continue.",
    };
  }

  return {
    isSubscribed: result.isSubscribed,
    productId,
    accessToken,
    refreshToken,
  };
};

const socialLogin = async (payload) => {
  const { idToken, provider } = payload || {};

  if (!idToken || typeof idToken !== "string") {
    throw new ApiError(status.BAD_REQUEST, "idToken is required");
  }
  if (!["google", "apple"].includes(provider)) {
    throw new ApiError(status.BAD_REQUEST, "provider must be google or apple");
  }

  let decodedToken;
  try {
    decodedToken = await getFirebaseAdmin().auth().verifyIdToken(idToken);
  } catch (error) {
    if (
      typeof error?.code === "string" &&
      error.code.startsWith("auth/")
    ) {
      throw new ApiError(status.UNAUTHORIZED, "Invalid or expired Firebase ID token");
    }
    throw error;
  }

  const expectedSignInProvider =
    provider === "google" ? "google.com" : "apple.com";
  if (
    decodedToken.firebase?.sign_in_provider !== expectedSignInProvider ||
    !decodedToken.uid
  ) {
    throw new ApiError(
      status.UNAUTHORIZED,
      "Firebase token provider does not match"
    );
  }

  let auth = await Auth.findOne({ firebaseUid: decodedToken.uid });

  if (!auth) {
    const email =
      typeof decodedToken.email === "string"
        ? decodedToken.email.trim().toLowerCase()
        : "";

    if (!email) {
      throw new ApiError(status.BAD_REQUEST, "A verified email is required");
    }
    if (decodedToken.email_verified !== true) {
      throw new ApiError(status.UNAUTHORIZED, "Firebase email is not verified");
    }

    auth = await Auth.findOne({ email });
    if (auth) {
      if (auth.role !== ENUM_USER_ROLE.USER) {
        throw new ApiError(
          status.FORBIDDEN,
          "Social login is only available for users"
        );
      }
      if (auth.firebaseUid && auth.firebaseUid !== decodedToken.uid) {
        throw new ApiError(status.CONFLICT, "Email is linked to another social account");
      }

      auth.firebaseUid = decodedToken.uid;
      auth.isActive = true;
      auth.isVerified = true;
      auth.activationCode = undefined;
      auth.activationCodeExpire = undefined;
      await auth.save();
    } else {
      const fullName =
        typeof decodedToken.name === "string" && decodedToken.name.trim()
          ? decodedToken.name
          : [decodedToken.given_name, decodedToken.family_name]
              .filter((name) => typeof name === "string")
              .join(" ");
      const nameParts = fullName.trim().split(/\s+/).filter(Boolean);
      const firstName = nameParts[0] || email.split("@")[0];
      const lastName = nameParts.slice(1).join(" ") || "User";

      auth = await Auth.create({
        firstName,
        lastName,
        email,
        role: ENUM_USER_ROLE.USER,
        firebaseUid: decodedToken.uid,
        isActive: true,
        isVerified: true,
      });

      const user = await User.create({
        authId: auth._id,
        firstName,
        lastName,
        email,
        firstLogin: null,
        trialExpires: null,
        isSubscribed: false,
      });

      await populateDefaultData(user._id);
    }
  }

  if (auth.role !== ENUM_USER_ROLE.USER) {
    throw new ApiError(
      status.FORBIDDEN,
      "Social login is only available for users"
    );
  }
  if (auth.isBlocked) {
    throw new ApiError(status.FORBIDDEN, "You are blocked. Contact support");
  }

  if (!auth.isActive) {
    auth.isActive = true;
    auth.isVerified = true;
    auth.activationCode = undefined;
    auth.activationCodeExpire = undefined;
    await auth.save();
  }

  let user = await User.findOne({ authId: auth._id });
  if (!user) {
    throw new ApiError(status.NOT_FOUND, "User profile does not exist");
  }
  if (!user.firstLogin) {
    await trialActivationForNewUser(auth._id);
    user = await User.findOne({ authId: auth._id });
  }

  const isTrialActive =
    user.trialExpires && new Date(user.trialExpires) > new Date();
  const isSubscriptionActive =
    user.isSubscribed &&
    (!user.subscriptionExpires ||
      new Date(user.subscriptionExpires) > new Date());
  if (!isTrialActive && !isSubscriptionActive) {
    throw new ApiError(
      status.FORBIDDEN,
      "Your trial or Subscription is finished. Renew or buy a subscription to continue."
    );
  }

  const tokenPayload = {
    authId: auth._id,
    userId: user._id,
    email: auth.email,
    role: auth.role,
  };
  const token = jwtHelpers.createToken(
    tokenPayload,
    config.jwt.secret,
    config.jwt.expires_in
  );
  const refreshToken = jwtHelpers.createToken(
    tokenPayload,
    config.jwt.refresh_secret,
    config.jwt.refresh_expires_in
  );
  const subscription = await Subscription.findOne({ user: user._id }).lean();

  return {
    token,
    role: auth.role,
    isSubscribed: Boolean(user.isSubscribed),
    productId: subscription ? subscription.productId : null,
    refreshToken,
  };
};

const forgotPass = async (payload) => {
  const { email } = payload;

  if (!email) throw new ApiError(status.BAD_REQUEST, "Missing email");

  const user = await Auth.isAuthExist(email);
  if (!user) throw new ApiError(status.BAD_REQUEST, "User not found!");

  const { code: verificationCode, expiredAt: verificationCodeExpire } =
    codeGenerator(3);

  user.verificationCode = verificationCode;
  user.verificationCodeExpire = verificationCodeExpire;
  await user.save();

  const data = {
    user: `${user.firstName} ${user.lastName}`,
    verificationCode,
    verificationCodeExpire: Math.round(
      (verificationCodeExpire - Date.now()) / (60 * 1000)
    ),
  };

  EmailHelpers.sendResetPasswordEmail(email, data);
};

const forgetPassOtpVerify = async (payload) => {
  const { email, code } = payload;

  if (!email) throw new ApiError(status.BAD_REQUEST, "Missing email");

  const auth = await Auth.findOne({ email: email });
  if (!auth) throw new ApiError(status.NOT_FOUND, "Account does not exist!");
  if (!auth.verificationCode)
    throw new ApiError(
      status.NOT_FOUND,
      "No verification code. Get a new verification code"
    );
  if (auth.verificationCode !== code)
    throw new ApiError(status.BAD_REQUEST, "Invalid verification code!");

  await Auth.updateOne(
    { email: auth.email },
    { isVerified: true, verificationCode: null }
  );
};

const resetPassword = async (payload) => {
  const { email, code, newPassword, confirmPassword } = payload;

  validateFields(payload, ["email", "code", "newPassword", "confirmPassword"]);
  if (newPassword !== confirmPassword)
    throw new ApiError(status.BAD_REQUEST, "Passwords do not match");

  const auth = await Auth.isAuthExist(email);
  if (!auth) throw new ApiError(status.NOT_FOUND, "User not found!");
  if (!auth.verificationCode)
    throw new ApiError(
      status.BAD_REQUEST,
      "No verification code. Request a new reset code"
    );
  if (auth.verificationCodeExpire && auth.verificationCodeExpire < new Date())
    throw new ApiError(status.BAD_REQUEST, "Verification code has expired");
  if (auth.verificationCode !== code)
    throw new ApiError(status.BAD_REQUEST, "Invalid verification code");

  const hashedPassword = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_rounds)
  );

  await Auth.updateOne(
    { email },
    {
      $set: { password: hashedPassword },
      $unset: {
        isVerified: "",
        verificationCode: "",
        verificationCodeExpire: "",
      },
    }
  );
};

const changePassword = async (userData, payload) => {
  const { email } = userData;
  const { oldPassword, newPassword, confirmPassword } = payload;

  validateFields(payload, ["oldPassword", "newPassword", "confirmPassword"]);

  if (newPassword !== confirmPassword)
    throw new ApiError(
      status.BAD_REQUEST,
      "Password and confirm password do not match"
    );
  if (newPassword === oldPassword) {
    throw new ApiError(status.BAD_REQUEST, "already use this password previously")
  }

  const isUserExist = await Auth.isAuthExist(email);

  if (!isUserExist)
    throw new ApiError(status.NOT_FOUND, "Account does not exist!");
  if (
    isUserExist.password &&
    !(await Auth.isPasswordMatched(oldPassword, isUserExist.password))
  ) {
    throw new ApiError(status.BAD_REQUEST, "Old password is incorrect");
  }

  isUserExist.password = newPassword;
  isUserExist.save();
};

// utility ===============================================

const updateFieldsWithCron = async (check) => {
  const now = new Date();
  let result;

  if (check === "activation") {
    result = await Auth.updateMany(
      {
        activationCodeExpire: { $lte: now },
      },
      {
        $unset: {
          activationCode: "",
          activationCodeExpire: "",
        },
      }
    );
  }

  if (check === "verification") {
    result = await Auth.updateMany(
      {
        verificationCodeExpire: { $lte: now },
      },
      {
        $unset: {
          isVerified: "",
          verificationCode: "",
          verificationCodeExpire: "",
        },
      }
    );
  }

  if (result.modifiedCount > 0)
    logger.info(
      `Removed ${result.modifiedCount} expired ${check === "activation" ? "activation" : "verification"
      } code`
    );
};

const trialActivationForNewUser = async (authId) => {
  const now = new Date();
  const trialPeriod = 7 * 24 * 60 * 60 * 1000

  const updateUser = await User.findOneAndUpdate(
    { authId: authId },
    {
      firstLogin: now,
      trialExpires: new Date(now.getTime() + trialPeriod), // 7 days from now,
    },
    { new: true, runValidators: true }
  );
};

// Unset activationCode activationCodeExpire field for expired activation code
// Unset isVerified, verificationCode, verificationCodeExpire field for expired verification code
cron.schedule("* * * * *", async () => {
  try {
    updateFieldsWithCron("activation");
    updateFieldsWithCron("verification");
  } catch (error) {
    errorLogger.error("Error removing expired code:", error);
  }
});

const AuthService = {
  registrationAccount,
  loginAccount,
  socialLogin,
  changePassword,
  forgotPass,
  resetPassword,
  activateAccount,
  forgetPassOtpVerify,
  resendActivationCode,
};

module.exports = { AuthService };
