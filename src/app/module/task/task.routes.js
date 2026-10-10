const auth = require("../../middleware/auth");
const express = require("express");
const config = require("../../../config");
const TaskController = require("./task.controller");

const router = express.Router();

router
  .post("/post-task", auth(config.auth_level.user), TaskController.postTask)
  .get("/get-task", auth(config.auth_level.employee), TaskController.getTask)
  .get(
    "/get-my-task",
    auth(config.auth_level.employee),
    TaskController.getMyTask
  )
  .get(
    "/get-employee-specific-task",
    auth(config.auth_level.employee),
    TaskController.getEmployeeSpecificTask
  )
  .get(
    "/get-employee-specific-current-task",
    auth(config.auth_level.employee),
    TaskController.getEmployeeSpecificCurrentTask
  )
  .get(
    "/get-all-task",
    auth(config.auth_level.user),
    TaskController.getAllTask
  )
  .patch(
    "/update-task",
    auth(config.auth_level.user),
    TaskController.updateTask
  )
  .patch(
    "/update-task-or-grocery-status",
    auth(config.auth_level.employee),
    TaskController.updateTaskOrGroceryStatus
  )
  .patch(
    "/update-grocery-or-task-with-note",
    auth(config.auth_level.employee),
    TaskController.updateTaskOrGroceryWithNote
  )
  .delete(
    "/delete-task",
    auth(config.auth_level.user),
    TaskController.deleteTask
  )
  .post(
    "/post-grocery-category",
    auth(config.auth_level.employee),
    TaskController.postGroceryCategory
  )
  .get(
    "/get-grocery-category",
    auth(config.auth_level.employee),
    TaskController.getGroceryCategory
  )
  .post(
    "/post-grocery",
    auth(config.auth_level.user),
    TaskController.postGrocery
  )
  .get(
    "/get-grocery",
    auth(config.auth_level.employee),
    TaskController.getGrocery
  )
  .get(
    "/get-my-grocery",
    auth(config.auth_level.employee),
    TaskController.getMyGrocery
  )
  .get(
    "/get-notifications",
    auth(config.auth_level.employee),
    TaskController.getNotifications
  )
  .get(
    "/presets",
    auth(config.auth_level.employee),
    TaskController.getPreset
  )
  .patch(
    "/update-grocery",
    auth(config.auth_level.user),
    TaskController.updateGrocery
  )
  .delete(
    "/delete-grocery",
    auth(config.auth_level.user),
    TaskController.deleteGrocery
  );

module.exports = router;
