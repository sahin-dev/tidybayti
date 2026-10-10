const { Schema, model } = require("mongoose");

const { GroceryStatus, GroceryRecurrence } = require("../../../util/enum");
const ObjectId = Schema.Types.ObjectId;

const GrocerySchema = new Schema(
  {
    user: {
      type: ObjectId,
      ref: "User",
      required: true,
    },
    assignedTo: {
      type: ObjectId,
      ref: "User",
      required: true,
    },
    groceryList: {
      type: [String],
      required: true,
    },
    recurrence: {
      type: String,
      enum: {
        values: [GroceryRecurrence.ONE_TIME, GroceryRecurrence.WEEKLY],
        message: `Invalid recurrence value. Allowed values: ${Object.values(
          GroceryRecurrence
        ).join(", ")}`,
      },
      default: GroceryRecurrence.ONE_TIME,
    },
    startDateStr: {
      type: String, // MM/DD/YYYY
      required: true,
    },
    startTimeStr: {
      type: String, // HH:MM AM/PM
      required: true,
    },
    startDateTime: {
      type: Date,
      required: true,
    },
    endDateStr: {
      type: String, // MM/DD/YYYY
      required: true,
    },
    endTimeStr: {
      type: String, // HH:MM AM/PM
      required: true,
    },
    endDateTime: {
      type: Date,
      required: true,
    },
    dayOfWeek: {
      type: String,
      required: true,
    },
    taskDetails: {
      type: String,
    },
    additionalMessage: {
      type: String,
    },
    note: {
      type: String,
    },
    status: {
      type: String,
      enum: {
        values: Object.values(GroceryStatus),
        message: `Invalid recurrence value ({VALUE}). Allowed values: ${Object.values(
          GroceryStatus
        ).join(", ")}`,
      },
      default: GroceryStatus.PENDING,
    },
  },
  {
    timestamps: true,
  }
);

const Grocery = model("Grocery", GrocerySchema);

module.exports = Grocery;
