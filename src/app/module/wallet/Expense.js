const { Schema, model } = require("mongoose");
const ObjectId = Schema.Types.ObjectId;

const ExpenseSchema = new Schema(
  {
    user: {
      type: ObjectId,
      ref: "User",
      required: true,
    },
    budget: {
      type: ObjectId,
      ref: "Budget",
      required: true,
    },
    expenseDateStr: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Expense = model("Expense", ExpenseSchema);

module.exports = Expense;
