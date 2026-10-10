const catchAsync = require("../../../shared/catchAsync");
const sendResponse = require("../../../shared/sendResponse");
const RoomService = require("./room.service");

const postHouse = catchAsync(async (req, res) => {
  const result = await RoomService.postHouse(req.user, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "House created successfully",
    data: result,
  });
});

const getSingleHouse = catchAsync(async (req, res) => {
  const result = await RoomService.getSingleHouse(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "House retrieved successfully",
    data: result,
  });
});

const getMyHouses = catchAsync(async (req, res) => {
  const result = await RoomService.getMyHouses(req.user, req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Houses retrieved successfully",
    data: result,
  });
});

const postRoom = catchAsync(async (req, res) => {
  const result = await RoomService.postRoom(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Room created successfully",
    data: result,
  });
});

const getMyRoom = catchAsync(async (req, res) => {
  const result = await RoomService.getMyRoom(req.user, req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Rooms retrieved successfully",
    data: result,
  });
});

const getSingleRoom = catchAsync(async (req, res) => {
  const result = await RoomService.getSingleRoom(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Room retrieved successfully",
    data: result,
  });
});

const editSingleRoom = catchAsync(async (req, res) => {
  const result = await RoomService.editSingleRoom(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Rooms updated successfully",
    data: result,
  });
});

const deleteSingleRoom = catchAsync(async (req, res) => {
  const result = await RoomService.deleteSingleRoom(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Room retrieved successfully",
    data: result,
  });
});

const RoomController = {
  postHouse,
  getSingleHouse,
  getMyHouses,
  postRoom,
  getMyRoom,
  getSingleRoom,
  editSingleRoom,
  deleteSingleRoom,
};

module.exports = RoomController;
