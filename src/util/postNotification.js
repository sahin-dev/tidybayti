const Notification = require("../app/module/notification/Notification");
const catchAsync = require("../shared/catchAsync");
const validateFields = require("./validateFields");

const postNotification = catchAsync(async (title, message, toId) => {
  validateFields({ title, message, toId }, ["title", "message", "toId"]);
  await Notification.create({ toId, title, message });
});

module.exports = postNotification;
