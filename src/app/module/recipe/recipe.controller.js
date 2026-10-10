const catchAsync = require("../../../shared/catchAsync");
const sendResponse = require("../../../shared/sendResponse");
const RecipeService = require("./recipe.service");

const postRecipe = catchAsync(async (req, res) => {
  const result = await RecipeService.postRecipe(req);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Recipe added successfully",
    data: result,
  });
});

const getRecipe = catchAsync(async (req, res) => {
  const result = await RecipeService.getRecipe(req.user, req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Recipe retrieved successfully",
    data: result,
  });
});

const getMyRecipe = catchAsync(async (req, res) => {
  const result = await RecipeService.getMyRecipe(req.user, req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Your recipes retrieved successfully",
    data: result,
  });
});

const getAllRecipe = catchAsync(async (req, res) => {
  const result = await RecipeService.getAllRecipe(req.user, req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "All recipes retrieved successfully",
    data: result,
  });
});

const updateRecipe = catchAsync(async (req, res) => {
  const result = await RecipeService.updateRecipe(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Recipe updated successfully",
    data: result,
  });
});

const deleteRecipe = catchAsync(async (req, res) => {
  const result = await RecipeService.deleteRecipe(req.user, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Recipe deleted successfully",
    data: result,
  });
});

const updateRecipeFavorite = catchAsync(async (req, res) => {
  const result = await RecipeService.updateRecipeFavorite(req.user, req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message,
  });
});

const RecipeController = {
  postRecipe,
  getRecipe,
  getMyRecipe,
  getAllRecipe,
  updateRecipe,
  deleteRecipe,
  updateRecipeFavorite,
};

module.exports = RecipeController;
