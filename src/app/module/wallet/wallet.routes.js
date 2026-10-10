const auth = require("../../middleware/auth");
const express = require("express");
const config = require("../../../config");
const WalletController = require("./wallet.controller");
const { uploadFile } = require("../../middleware/fileUploader");

const router = express.Router();

router
  .post(
    "/post-budget",
    auth(config.auth_level.user),
    WalletController.postBudget
  )
  .get("/get-budget", auth(config.auth_level.user), WalletController.getBudget)
  .get(
    "/get-my-budget",
    auth(config.auth_level.user),
    WalletController.getMyBudget
  )
  .get(
    "/get-all-budget",
    auth(config.auth_level.admin),
    WalletController.getAllBudget
  )
  .patch(
    "/update-budget",
    auth(config.auth_level.user),
    WalletController.updateBudget
  )
  .delete(
    "/delete-budget",
    auth(config.auth_level.user),
    WalletController.deleteBudget
  )
  .post(
    "/post-expense",
    auth(config.auth_level.user),
    WalletController.postExpense
  )
  .get(
    "/get-expense",
    auth(config.auth_level.user),
    WalletController.getExpense
  )
  .get(
    "/get-single-budget-expense",
    auth(config.auth_level.user),
    WalletController.getSingleBudgetExpense
  )
  .delete(
    "/delete-expense",
    auth(config.auth_level.user),
    WalletController.deleteExpense
  )
  .get(
    "/get-budget-category",
    auth(config.auth_level.employee),
    WalletController.getBudgetCategory
  );

module.exports = router;
