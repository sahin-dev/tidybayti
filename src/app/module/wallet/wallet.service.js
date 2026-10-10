const { default: status } = require("http-status");
const validateFields = require("../../../util/validateFields");
const dateTimeValidator = require("../../../util/dateTimeValidator");
const Budget = require("./Budget");
const ApiError = require("../../../error/ApiError");
const Expense = require("./Expense");
const postNotification = require("../../../util/postNotification");
const QueryBuilder = require("../../../builder/queryBuilder");

const postBudget = async (req) => {
  const { body: payload, files, user } = req;

  validateFields(payload, [
    "category",
    "budgetDateStr",
    "amount",
    "budgetImage",
  ]);
  dateTimeValidator(payload.budgetDateStr);

  const budgetData = {
    user: user.userId,
    category: payload.category,
    budgetImage: payload.budgetImage,
    budgetDateStr: payload.budgetDateStr,
    currency: payload.currency,
    amount: Math.round(payload.amount),
    currentExpense: payload.currentExpense,
    expenses: payload.expenses,
  };

  const budget = await Budget.create(budgetData);

  return budget;
};

const getBudget = async (userData, query) => {
  validateFields(query, ["budgetId"]);

  const budget = await Budget.findById(query.budgetId)
    .populate([
      {
        path: "expenses",
      },
    ])
    .lean();

  if (!budget) throw new ApiError(status.NOT_FOUND, "Budget not found");

  return budget;
};

const getMyBudget = async (userData, query) => {
  const budgetQuery = new QueryBuilder(
    Budget.find({ user: userData.userId }),
    query
  )
    .search([])
    .filter()
    .sort("-createdAt")
    .paginate()
    .fields();

  const [result, meta] = await Promise.all([
    budgetQuery.modelQuery,
    budgetQuery.countTotal(),
  ]);

  return {
    meta,
    result,
  };
};

const getAllBudget = async (userData, query) => {
  const budgetQuery = new QueryBuilder(Budget.find({}), query)
    .search([])
    .filter()
    .sort()
    .paginate()
    .fields();

  const [result, meta] = await Promise.all([
    budgetQuery.modelQuery,
    budgetQuery.countTotal(),
  ]);

  return {
    meta,
    result,
  };
};

const updateBudget = async (userData, payload) => {
  validateFields(payload, ["budgetId"]);

  const updateData = {
    ...(payload.category && { category: payload.category }),
    ...(payload.amount && { amount: payload.amount }),
    ...(payload.budgetImage && { budgetImage: payload.budgetImage }),
  };

  const updatedBudget = await Budget.findByIdAndUpdate(
    payload.budgetId,
    updateData,
    { new: true, runValidators: true }
  );

  if (!updatedBudget) throw new ApiError(status.NOT_FOUND, "Budget not found");

  return updatedBudget;
};

const deleteBudget = async (userData, payload) => {
  validateFields(payload, ["budgetId"]);

  const deletedBudget = await Budget.deleteOne({ _id: payload.budgetId });

  if (!deletedBudget.deletedCount)
    throw new ApiError(status.NOT_FOUND, "Budget not found");

  const deletedExpenses = await Expense.deleteMany({
    budget: payload.budgetId,
  });

  return deletedBudget;
};

// Expense  =======================================================

const postExpense = async (userData, payload) => {
  validateFields(payload, ["budgetId", "expenseDateStr", "amount"]);
  dateTimeValidator(payload.expenseDateStr);

  const budget = await Budget.findById(payload.budgetId).lean();

  if (!budget) throw new ApiError(status.NOT_FOUND, "Budget not found");

  const expenseData = {
    user: userData.userId,
    budget: payload.budgetId,
    expenseDateStr: payload.expenseDateStr,
    amount: Math.round(payload.amount),
  };

  const budgetAfterNewExpense = budget.currentExpense + expenseData.amount;
  if (budgetAfterNewExpense >= budget.amount)
    throw new ApiError(status.BAD_REQUEST, `Expense can not be higher than budget`);

  const expense = await Expense.create(expenseData);

  Promise.all([
    Budget.findByIdAndUpdate(payload.budgetId, {
      $push: { expenses: expense._id },
      $inc: { currentExpense: expense.amount },
    }),
  ]);

  postNotification(
    "New expense",
    "New expense added to the budget",
    userData.userId
  );

  return expense;
};

const getExpense = async (userData, query) => {
  validateFields(query, ["expenseId"]);

  const expense = await Expense.findById(query.expenseId).lean();

  if (!expense) throw new ApiError(status.NOT_FOUND, "Expense not found");

  return expense;
};

const getSingleBudgetExpense = async (userData, query) => {};

const deleteExpense = async (userData, payload) => {
  validateFields(payload, ["expenseId"]);

  const expense = await Expense.findById(payload.expenseId).lean();

  if (!expense) throw new ApiError(status.NOT_FOUND, "Expense not found");

  Promise.all([
    Budget.findByIdAndUpdate(expense.budget, {
      $pull: { expenses: expense._id },
      $inc: { currentExpense: -expense.amount },
    }),
  ]);

  const result = await Expense.deleteOne({ _id: payload.expenseId });

  postNotification(
    "Deleted expense",
    "Expense has been deleted",
    userData.userId
  );

  return result;
};

const getBudgetCategory = async () => {
  return [
    {
      name: "Travel",
      image:
        "https://res.cloudinary.com/dkfvvufsa/image/upload/v1780552883/icons8-traveler-50_1_dsspwe.png",
    },
    {
      name: "Investments",
      image:
        "https://res.cloudinary.com/dkfvvufsa/image/upload/v1780552883/icons8-receive-dollar-50_1_h07ybt.png",
    },
    {
      name: "Housing",
      image:
        "https://res.cloudinary.com/dkfvvufsa/image/upload/v1780552883/icons8-city-buildings-30_1_lc5cgs.png",
    },
    {
      name: "Life & Entertainment",
      image:
        "https://res.cloudinary.com/dkfvvufsa/image/upload/v1780552883/icons8-film-reel-50_1_ruzuos.png",
    },
    {
      name: "Vehicle",
      image:
        "https://res.cloudinary.com/dkfvvufsa/image/upload/v1780552884/icons8-minibus-50_1_x7gqm9.png",
    },
    {
      name: "Financial Expense",
      image:
        "https://res.cloudinary.com/dkfvvufsa/image/upload/v1780552884/icons8-card-payment-50_1_tp9bpe.png",
    },
    {
      name: "Communication",
      image:
        "https://res.cloudinary.com/dkfvvufsa/image/upload/v1780552884/icons8-people-working-together-50_1_st1teb.png",
    },
    {
      name: "Food and Drinks",
      image:
        "https://res.cloudinary.com/dkfvvufsa/image/upload/v1780552883/icons8-wine-bar-50_1_h0oshu.png",
    },
    {
      name: "Shopping",
      image:
        "https://res.cloudinary.com/dkfvvufsa/image/upload/v1780552884/icons8-shopping-bag-50_1_ijuihu.png",
    },
    {
      name: "Transportation",
      image:
        "https://res.cloudinary.com/dkfvvufsa/image/upload/v1780552884/icons8-minibus-50_1_x7gqm9.png",
    },
  ];
};

const WalletService = {
  postBudget,
  getBudget,
  getMyBudget,
  getAllBudget,
  updateBudget,
  deleteBudget,
  postExpense,
  getExpense,
  getSingleBudgetExpense,
  deleteExpense,
  getBudgetCategory,
};

module.exports = WalletService;
