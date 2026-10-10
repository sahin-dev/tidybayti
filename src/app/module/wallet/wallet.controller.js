const catchAsync = require("../../../shared/catchAsync");
const sendResponse = require("../../../shared/sendResponse");
const WalletService = require("./wallet.service");

const postBudget = catchAsync(async (req, res) => {
  const result = await WalletService.postBudget(req);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Budget created successfully",
    data: result,
  });
});

const getBudget = catchAsync(async (req, res) => {
  const result = await WalletService.getBudget(req.user, req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Budget retrieved successfully",
    data: result,
  });
});

const getMyBudget = catchAsync(async (req, res) => {
  const result = await WalletService.getMyBudget(req.user, req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "My budgets retrieved successfully",
    data: result,
  });
});

const getAllBudget = catchAsync(async (req, res) => {
  const result = await WalletService.getAllBudget(req.user, req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "All budgets retrieved successfully",
    data: result,
  });
});

const updateBudget = catchAsync(async (req, res) => {
  const result = await WalletService.updateBudget(req.user, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Budget updated successfully",
    data: result,
  });
});

const deleteBudget = catchAsync(async (req, res) => {
  const result = await WalletService.deleteBudget(req.user, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Budget and related expenses deleted successfully",
    data: result,
  });
});

const postExpense = catchAsync(async (req, res) => {
  const result = await WalletService.postExpense(req.user, req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Expense added successfully",
    data: result,
  });
});

const getExpense = catchAsync(async (req, res) => {
  const result = await WalletService.getExpense(req.user, req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Expense retrieved successfully",
    data: result,
  });
});

const getSingleBudgetExpense = catchAsync(async (req, res) => {
  const result = await WalletService.getSingleBudgetExpense(
    req.user,
    req.query
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Budget expenses retrieved successfully",
    data: result,
  });
});

const deleteExpense = catchAsync(async (req, res) => {
  const result = await WalletService.deleteExpense(req.user, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Expense deleted successfully",
    data: result,
  });
});

const getBudgetCategory = catchAsync(async (req, res) => {
  const result = await WalletService.getBudgetCategory();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Budget category retrieved successfully",
    data: result,
  });
});

const WalletController = {
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

module.exports = WalletController;
