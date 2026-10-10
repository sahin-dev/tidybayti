const { Schema, model } = require("mongoose");
const ObjectId = Schema.Types.ObjectId;

const paymentSchema = new Schema(
  {
    user: {
      type: ObjectId,
      ref: "User",
    },
    packageType: {
      type: String,
      enum: {
        values: ["monthly", "yearly"],
        message: `Invalid recurrence value. Allowed values: monthly, yearly`,
      },
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    gateway: {
      type: String,
      enum: ["paypal", "stripe", "google_play", "apple_app_store"],
      default: "paypal",
    },
    
    purchaseToken: {
      type: String,
      sparse: true,
      unique: true,
    },
    productId: {
      type: String,
    },
    packageName: {
      type: String,
    },
    payment_intent_id: {
      type: String,
    },
    status: {
      type: String,
      enum: ["unpaid", "succeeded", "refunded", "transferred"],
      default: "unpaid",
    },
  },
  {
    timestamps: true,
  }
);

const Payment = model("Payment", paymentSchema);
module.exports = Payment;
