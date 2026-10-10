const { Schema, model } = require("mongoose");

const GroceryCategorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const GroceryCategory = model("GroceryCategory", GroceryCategorySchema);

module.exports = GroceryCategory;
