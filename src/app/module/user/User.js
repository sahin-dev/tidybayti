const { Schema, model, Types } = require("mongoose");
const ObjectId = Schema.Types.ObjectId;

const UserSchema = new Schema(
  {
    authId: {
      type: Types.ObjectId,
      required: true,
      ref: "Auth",
    },
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
      required: true,
    },
    profile_image: {
      type: String,
    },
    phoneNumber: {
      type: String,
    },
    dateOfBirth: {
      type: String,
    },
    address: {
      type: String,
    },

    /* user(owner) only fields -----------*/
    firstLogin: {
      type: Date,
    },
    trialExpires: {
      type: Date,
    },
    isSubscribed: {
      type: Boolean,
    },
    subscriptionExpires: {
      type: Date,
    },

    stripe_customer_id:{
      type:String
    },

    /* employee only fields -----------*/

    employer: {
      type: ObjectId,
      ref: "User",
    },
    designation:{
      type:String,
      required:false
    },
    address:{
      type:String,
      required:false
    },
    employeeId: {
      type: String,
    },
    jobType: {
      type: String,
    },
    CPRNumber: {
      type: String,
    },
    CPRExpDate: {
      type: String,
    },
    passportNumber: {
      type: String,
    },
    passportExpDate: {
      type: String,
    },
    note: {
      type: String,
    },
    dutyTime: {
      type: String,
    },
    breakTimeStart: {
      type: String,
    },
    breakTimeEnd: {
      type: String,
    },
    workingDay: {
      type: [String],
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
    },
    offDay: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const User = model("User", UserSchema);

module.exports = User;
