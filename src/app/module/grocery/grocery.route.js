const express = require("express");
const  config  = require("../../../config");
const { groceryController } = require("./grocery.controller");
const auth = require("../../middleware/auth");

const router = express.Router()

router.get("/search", auth(config.auth_level.user), groceryController.getGroceryList)

module.exports =  router