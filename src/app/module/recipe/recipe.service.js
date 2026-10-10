const { default: status } = require("http-status");
const ApiError = require("../../../error/ApiError");
const validateFields = require("../../../util/validateFields");
const Recipe = require("./Recipe");
const convertToArray = require("../../../util/convertToArray");
const QueryBuilder = require("../../../builder/queryBuilder");
const FavRecipe = require("./FavoriteRecipe");

const postRecipe = async (req) => {
  const { user, body, files } = req || {};

  validateFields(files, ["recipeImage"]);
  validateFields(body, [
    "recipeName",
    "cookingTime",
    "description",
    "ingredients",
    "steps",
    "tags",
  ]);

  let source = "custom"
  if(body.url){
    source = "website"
  }else if (files.recipe){
    source = "file"
  }


  const recipeData = {
    user: user.userId,
    recipeName: body.recipeName,
    recipeImage: files.recipeImage[0].path,
    cookingTime: body.cookingTime,
    description: body.description,
    ingredients: convertToArray(body.ingredients),
    steps: convertToArray(body.steps),
    tags: convertToArray(body.tags),
    url : body.url ?? "",
    file : files.recipe ? files.recipe[0].path : "",
    source
  };

  const recipe = await Recipe.create(recipeData);

  return recipe;
};

const getRecipe = async (userData, query) => {
  validateFields(query, ["recipeId"]);

  const recipe = await Recipe.findById(query.recipeId);

  if (!recipe) throw new ApiError(status.NOT_FOUND, "Recipe not found");

  return recipe;
};

const getMyRecipe = async (userData, query) => {
  const recipeQuery = new QueryBuilder(
    Recipe.find({ user: userData.userId }).lean(),
    query
  )
    .search(["recipeName"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const [recipes, meta, userFavRecipes] = await Promise.all([
    recipeQuery.modelQuery,
    recipeQuery.countTotal(),
    FavRecipe.find({ user: userData.userId }),
  ]);

  const recipeWithFavorite = getFavRecipeWithLike(recipes, userFavRecipes);

  return {
    meta,
    recipeWithFavorite,
  };
};

const getAllRecipe = async (userData, query) => {
  const recipeQuery = new QueryBuilder(Recipe.find({}).lean(), query)
    .search(["recipeName"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const [recipes, meta, userFavRecipes] = await Promise.all([
    recipeQuery.modelQuery,
    recipeQuery.countTotal(),
    FavRecipe.find({ user: userData.userId }),
  ]);

  const recipeWithFavorite = getFavRecipeWithLike(recipes, userFavRecipes);

  return {
    meta,
    recipeWithFavorite,
  };
};

const updateRecipe = async (req) => {
  const { user, body, files } = req || {};

  validateFields(body, ["recipeId"]);

  const updateData = {
    ...(files.recipeImage && { recipeImage: files.recipeImage[0].path }),
    ...(body.user && { user: user.userId }),
    ...(body.recipeName && { recipeName: body.recipeName }),
    ...(body.recipeImage && { recipeImage: files.recipeImage[0].path }),
    ...(body.cookingTime && { cookingTime: body.cookingTime }),
    ...(body.description && { description: body.description }),
    ...(body.ingredients && { ingredients: convertToArray(body.ingredients) }),
    ...(body.steps && { steps: convertToArray(body.steps) }),
    ...(body.tags && { tags: convertToArray(body.tags) }),
    ...(body.source && {source : body.source}),
    ...(body.url && {url : body.url})

  };

  const updatedRecipe = await Recipe.findOneAndUpdate(
    { _id: body.recipeId },
    updateData,
    { new: true, runValidators: true }
  );

  if (!updateRecipe) throw new ApiError(status.NOT_FOUND, "Recipe not found");

  return updatedRecipe;
};

const deleteRecipe = async (userData, payload) => {
  validateFields(payload, ["recipeId"]);

  const recipe = await Recipe.deleteOne({ _id: payload.recipeId });

  if (!recipe.deletedCount)
    throw new ApiError(status.NOT_FOUND, "Recipe not found");

  return recipe;
};

const updateRecipeFavorite = async (userData, query) => {
  validateFields(query, ["recipeId"]);
  const { recipeId } = query;

  const favRecipeData = {
    user: userData.userId,
    recipe: recipeId,
  };

  const [recipe, favRecipe] = await Promise.all([
    Recipe.findById(recipeId),
    FavRecipe.findOne({ user: userData.userId, recipe: recipeId }),
  ]);

  if (!recipe) throw new ApiError(status.NOT_FOUND, "Recipe not found");

  if (favRecipe) {
    await FavRecipe.deleteOne({
      user: userData.userId,
      recipe: recipeId,
    });

    return {
      message: "Removed from favorite",
    };
  }

  Promise.all([FavRecipe.create(favRecipeData)]);

  return {
    message: "Added to favorite",
  };
};

const getFavRecipeWithLike = (recipes, userFavRecipes) => {
  const favRecipeIds = new Set(
    userFavRecipes.map((favRecipe) => favRecipe.recipe.toString())
  );

  const recipeWithFavorite = recipes.map((recipe) => {
    return {
      ...recipe,
      isFavorite: favRecipeIds.has(recipe._id.toString()),
    };
  });

  return recipeWithFavorite;
};

const RecipeService = {
  postRecipe,
  getRecipe,
  getMyRecipe,
  getAllRecipe,
  updateRecipe,
  deleteRecipe,
  updateRecipeFavorite,
  getFavRecipeWithLike
};

module.exports = RecipeService;
