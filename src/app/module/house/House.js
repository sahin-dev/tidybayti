const { Schema, model } = require("mongoose");
const ObjectId = Schema.Types.ObjectId;

const HouseSchema = new Schema(
  {
    user: {
      type: ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const House = model("House", HouseSchema);

module.exports = House;
