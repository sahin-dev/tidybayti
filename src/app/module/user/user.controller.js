const { UserService } = require("./user.service");
const sendResponse = require("../../../shared/sendResponse");
const catchAsync = require("../../../shared/catchAsync");

const updateProfile = catchAsync(async (req, res) => {
  const result = await UserService.updateProfile(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Profile updated successfully",
    data: result,
  });
});

const getProfile = catchAsync(async (req, res) => {
  const result = await UserService.getProfile(req.user);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User retrieved successfully",
    data: result,
  });
});

const deleteMyAccount = catchAsync(async (req, res) => {
  await UserService.deleteMyAccount(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Account deleted!",
  });
});

const addEmployee = catchAsync(async (req, res) => {
  const result = await UserService.addEmployee(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Employee added successfully",
    data: result,
  });
});

const editEmployee = catchAsync(async (req, res) => {
  const result = await UserService.editEmployee(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Employee updated successfully",
    data: result,
  });
});

const deleteEmployee = catchAsync(async (req, res) => {
  const result = await UserService.deleteEmployee(req.user, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Employee deleted successfully",
    data: result,
  });
});

const getMyEmployee = catchAsync(async (req, res) => {
  const result = await UserService.getMyEmployee(req.user, req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Employees retrieved successfully",
    data: result,
  });
});

const getSingleEmployee = catchAsync(async (req, res) => {
  const result = await UserService.getSingleEmployee(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Employees retrieved successfully",
    data: result,
  });
});


const getUserSubscriptionData = catchAsync(async (req, res) => {

  const {userId} = req.user
  const result = await UserService.getUserSubscriptionData(userId)

  sendResponse(res, {
    statusCode:200,
    success:true,
    message:"User subscription data found!",
    data:result
  })
})

const UserController = {
  deleteMyAccount,
  getProfile,
  updateProfile,
  addEmployee,
  editEmployee,
  deleteEmployee,
  getMyEmployee,
  getSingleEmployee,
  getUserSubscriptionData
};

module.exports = { UserController };
