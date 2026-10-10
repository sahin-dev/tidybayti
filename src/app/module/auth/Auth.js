const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const config = require("../../../config");
const validator = require("validator");

const { Schema, model } = mongoose;

const AuthSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      validate: {
        validator: (value) => validator.isEmail(value),
        message: "Please provide a valid email address",
      },
    },
    firebaseUid: {
      type: String,
      unique: true,
      sparse: true,
    },
    password: {
      type: String,
      select: false,
    },
    role: {
      type: String,
      enum: ["USER", "EMPLOYEE"],
      required: true,
    },
    isVerified: {
      type: Boolean,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    verificationCode: {
      type: String,
    },
    verificationCodeExpire: {
      type: Date,
    },
    activationCode: {
      type: String,
    },
    activationCodeExpire: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

AuthSchema.statics.isAuthExist = async function (email) {
  return await this.findOne(
    { email },
    {
      firstName:1,
      lastName:1,
      name: 1,
      email: 1,
      password: 1,
      role: 1,
      isActive: 1,
      isBlocked: 1,
      isVerified: 1,
      verificationCode: 1,
      verificationCodeExpire: 1,
    }
  );
};

AuthSchema.statics.isPasswordMatched = async function (
  givenPassword,
  savedPassword
) {
  const result = await bcrypt.compare(givenPassword, savedPassword);
  return result;
};

AuthSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  this.password = await bcrypt.hash(
    this.password,
    Number(config.bcrypt_salt_rounds)
  );
  next();
});

const Auth = model("Auth", AuthSchema);

module.exports = Auth;
