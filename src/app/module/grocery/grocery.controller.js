const catchAsync = require("../../../shared/catchAsync");
const sendResponse = require("../../../shared/sendResponse");
const { groceryService } = require("./grocery.service");

const getGroceryList = catchAsync(async (req , res) => {
    const {q} = req.query

    const grocery = await groceryService.searchGrocery(q)

    sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Grocery retrieved successfully",
    data: grocery,
  });

})

module.exports.groceryController = {
    getGroceryList
}