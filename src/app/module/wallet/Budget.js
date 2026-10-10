const { Schema, model } = require("mongoose");
const ObjectId = Schema.Types.ObjectId;

const BudgetSchema = new Schema(
  {
    user: {
      type: ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      unique: true,
      required: true,
    },
    budgetImage: {
      type: String,
      required: true,
    },
    budgetDateStr: {
      type: String,
      required: true,
    },
    budgetDateTime: {
      type: Date,
    },
    budgetMonth: {
      type: String,
    },
    budgetYear: {
      type: String,
    },
    currency: {
      type: String,
      default:"BHD"
    },
    amount: {
      type: Number,
      required: true,
    },
    currentExpense: {
      type: Number,
      default: 0,
    },
    expenses: [
      {
        type: ObjectId,
        ref: "Expense",
      },
    ],
  },
  {
    timestamps: true,
  }
);

BudgetSchema.pre("save", function (next) {
  const budgetDateTime = new Date(`${this.budgetDateStr}`);

  this.budgetDateTime = budgetDateTime;
  this.budgetMonth = budgetDateTime.toLocaleString("default", {
    month: "long",
  });
  this.budgetYear = budgetDateTime.getFullYear();

  next();
});

const Budget = model("Budget", BudgetSchema);

module.exports = Budget;
