const auth = require("../../middleware/auth");
const express = require("express");
const RoomController = require("./room.controller");
const config = require("../../../config");
const { uploadFile } = require("../../middleware/fileUploader");

const router = express.Router();

router
  .post("/post-house", auth(config.auth_level.user), RoomController.postHouse)
  .get(
    "/get-single-house",
    auth(config.auth_level.user),
    RoomController.getSingleHouse
  )
  .get(
    "/get-my-houses",
    auth(config.auth_level.user),
    RoomController.getMyHouses
  )
  .post(
    "/post-room",
    auth(config.auth_level.user),
    uploadFile(),
    RoomController.postRoom
  )
  .get("/get-my-room", auth(config.auth_level.user), RoomController.getMyRoom)
  .get(
    "/get-single-room",
    auth(config.auth_level.user),
    RoomController.getSingleRoom
  )
  .patch(
    "/edit-single-room",
    auth(config.auth_level.user),
    uploadFile(),
    RoomController.editSingleRoom
  )
  .delete(
    "/delete-single-room",
    auth(config.auth_level.user),
    RoomController.deleteSingleRoom
  );

module.exports = router;
