const auth = require("../../middleware/auth");
const express = require("express");
const config = require("../../../config");
const RecipeController = require("./recipe.controller");
const { uploadFile } = require("../../middleware/fileUploader");

const router = express.Router();

router
  .post(
    "/post-recipe",
    auth(config.auth_level.user),
    uploadFile(),
    RecipeController.postRecipe
  )
  .get(
    "/get-recipe",
    auth(config.auth_level.employee),
    RecipeController.getRecipe
  )
  .get(
    "/get-my-recipe",
    auth(config.auth_level.user),
    RecipeController.getMyRecipe
  )
  .get(
    "/get-all-recipe",
    auth(config.auth_level.admin),
    RecipeController.getAllRecipe
  )
  .patch(
    "/update-recipe",
    auth(config.auth_level.user),
    uploadFile(),
    RecipeController.updateRecipe
  )
  .delete(
    "/delete-recipe",
    auth(config.auth_level.user),
    RecipeController.deleteRecipe
  )
  .patch(
    "/favorite-unfavorite-recipe",
    auth(config.auth_level.user),
    RecipeController.updateRecipeFavorite
  );

module.exports = router;
