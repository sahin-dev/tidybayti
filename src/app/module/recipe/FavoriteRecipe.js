const { Schema, model } = require("mongoose");
const ObjectId = Schema.Types.ObjectId;

const favRecipeSchema = new Schema(
  {
    user: {
      type: ObjectId,
      ref: "User",
      required: true,
    },
    recipe: {
      type: ObjectId,
      ref: "Recipe",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const FavRecipe = model("FavRecipe", favRecipeSchema);

module.exports = FavRecipe;
