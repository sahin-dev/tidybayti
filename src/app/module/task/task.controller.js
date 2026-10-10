const catchAsync = require("../../../shared/catchAsync");
const sendResponse = require("../../../shared/sendResponse");
const TaskService = require("./task.service");

const postTask = catchAsync(async (req, res) => {
  const result = await TaskService.postTask(req.user, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Task posted successfully",
    data: result,
  });
});

const getTask = catchAsync(async (req, res) => {
  const result = await TaskService.getTask(req.user, req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Task retrieved successfully",
    data: result,
  });
});

const getMyTask = catchAsync(async (req, res) => {


  const result = await TaskService.getMyTask(req.user, req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Task retrieved successfully",
    data: result,
  });
});

const getEmployeeSpecificTask = catchAsync(async (req, res) => {
  const result = await TaskService.getEmployeeSpecificTask(req.user, req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Task retrieved successfully",
    data: result,
  });
});


const getEmployeeSpecificCurrentTask = catchAsync(async (req, res) => {
  const result = await TaskService.getEmployeeSpecificCurrentTask(req.user, req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Task retrieved successfully",
    data: result,
  });
});

const getAllTask = catchAsync(async (req, res) => {
  const result = await TaskService.getAllTask(req.user, req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Task retrieved successfully",
    data: result,
  });
});

const updateTask = catchAsync(async (req, res) => {
  const result = await TaskService.updateTask(req.user, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Task updated successfully",
    data: result,
  });
});

const updateTaskOrGroceryStatus = catchAsync(async (req, res) => {
  const result = await TaskService.updateTaskOrGroceryStatus(
    req.user,
    req.body
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Status updated successfully",
    data: result,
  });
});

const updateTaskOrGroceryWithNote = catchAsync(async (req, res) => {
  const result = await TaskService.updateTaskOrGroceryWithNote(
    req.user,
    req.body
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Updated successfully",
    data: result,
  });
});

const deleteTask = catchAsync(async (req, res) => {
  const result = await TaskService.deleteTask(req.user, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Task deleted successfully",
    data: result,
  });
});

const postGrocery = catchAsync(async (req, res) => {
  const result = await TaskService.postGrocery(req.user, req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Grocery item added successfully",
    data: result,
  });
});

const postGroceryCategory = catchAsync(async (req, res) => {
  const result = await TaskService.postGroceryCategory(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Grocery category created successfully",
    data: result,
  });
});

const getGroceryCategory = catchAsync(async (req, res) => {
  const result = await TaskService.getGroceryCategory(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Grocery category retrieved successfully",
    data: result,
  });
});

const getGrocery = catchAsync(async (req, res) => {
  const result = await TaskService.getGrocery(req.user, req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Grocery items retrieved successfully",
    data: result,
  });
});

const getMyGrocery = catchAsync(async (req, res) => {
  const result = await TaskService.getMyGrocery(req.user, req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Your grocery items retrieved successfully",
    data: result,
  });
});

const updateGrocery = catchAsync(async (req, res) => {
  const result = await TaskService.updateGrocery(req.user, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Grocery item updated successfully",
    data: result,
  });
});

const deleteGrocery = catchAsync(async (req, res) => {
  const result = await TaskService.deleteGrocery(req.user, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Grocery item deleted successfully",
    data: result,
  });
});

const getNotifications = catchAsync(async (req, res) => {
  const result = await TaskService.getNotifications(req.user);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Notification retrieved successfully",
    data: result,
  });
});

const getPreset = catchAsync(async (req, res) => {
  const {room} = req.query
  const presets = await TaskService.taskPresets(room)

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "presets retrieved successfully",
    data: presets,
  });
})

const TaskController = {
  postTask,
  getTask,
  getMyTask,
  getEmployeeSpecificTask,
  getEmployeeSpecificCurrentTask,
  getAllTask,
  updateTask,
  updateTaskOrGroceryStatus,
  updateTaskOrGroceryWithNote,
  deleteTask,

  getGroceryCategory,
  postGroceryCategory,

  postGrocery,
  getGrocery,
  getMyGrocery,
  updateGrocery,
  deleteGrocery,
  getNotifications,

  getPreset
};

module.exports = TaskController;
