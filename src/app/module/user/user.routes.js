const express = require("express");
const auth = require("../../middleware/auth");
const { uploadFile } = require("../../middleware/fileUploader");
const { UserController } = require("./user.controller");
const config = require("../../../config");

const router = express.Router();

router
  .get("/profile", auth(config.auth_level.employee), UserController.getProfile)
  .patch(
    "/edit-profile",
    auth(config.auth_level.employee),
    uploadFile(),
    UserController.updateProfile
  )
  .delete(
    "/delete-account",
    auth(config.auth_level.employee),
    UserController.deleteMyAccount
  )
  .post(
    "/add-employee",
    auth(config.auth_level.user),
    uploadFile(),
    UserController.addEmployee
  )
  .patch(
    "/edit-employee",
    auth(config.auth_level.user),
    uploadFile(),
    UserController.editEmployee
  )
  .delete(
    "/delete-employee",
    auth(config.auth_level.user),
    UserController.deleteEmployee
  )
  .get(
    "/get-my-employee",
    auth(config.auth_level.user),
    UserController.getMyEmployee
  )
  .get(
    "/get-single-employee",
    auth(config.auth_level.user),
    UserController.getSingleEmployee
  )
  .get("/subscription_status", 
    auth(config.auth_level.user),
    UserController.getUserSubscriptionData
  )

module.exports = router;
