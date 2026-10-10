const { Schema, model } = require("mongoose");
const ObjectId = Schema.Types.ObjectId;

const subscriptionSchema = new Schema(
  {
    user: { type: ObjectId, ref: "User", required: true, unique: true },
    productId: { type: String, required: true }, // Google Play subscriptionId
    purchaseToken: { type: String, required: true, unique: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    nextPaymentDate: { type: Date },
    status: {
      type: String,
      enum: ["activated", "expired", "cancelled", "pending"],
      default: "pending",
    },
    autoRenewing: { type: Boolean },
    amount: { type: Number },
    gateway: { type: String, enum: ["paypal", "stripe", "google_play", "apple_app_store"], default: "google_play" },
  },
  { timestamps: true }
);

const Subscription = model("Subscription", subscriptionSchema);
module.exports = Subscription;
