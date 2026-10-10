// const cron = require("node-cron");
// const { core } = require("@paypal/checkout-server-sdk");
// const paypal = require("@paypal/checkout-server-sdk");

// const config = require("../../../config");
// const validateFields = require("../../../util/validateFields");
// const Payment = require("./payment.model");
// const catchAsync = require("../../../shared/catchAsync");

// const postCheckoutForSubscription = async (userData, payload) => {
//   validateFields(payload, ["amount", "amount"]);

//   const request = new paypal.orders.OrdersCreateRequest();
//   request.prefer("return=representation");
//   request.requestBody({
//     intent: "CAPTURE",
//     purchase_units: [
//       {
//         amount: {
//           currency_code: "AZ",
//           value: 15,
//         },
//         description: "Payment for subscription",
//       },
//     ],
//     application_context: {
//       brand_name: "Your business name",
//       landing_page: "LOGIN",
//       user_action: "PAY_NOW",
//       return_url: "",
//       cancel_url: "",
//     },
//   });
//   // return paypalClient();
//   const res = await paypalClient().execute(request);
//   console.log(res.result.links);
//   const url = "";
// };

// // utility functions =================================================
// const paypalClient = () => {
//   const environment =
//     config.paypal.mode === "live"
//       ? new core.LiveEnvironment(
//           config.paypal.client_id,
//           config.paypal.client_secret
//         )
//       : new core.SandboxEnvironment(
//           config.paypal.client_id,
//           config.paypal.client_secret
//         );

//   return new core.PayPalHttpClient(environment);
// };

// // Delete unpaid payments every day at midnight
// cron.schedule(
//   "0 0 * * *",
//   catchAsync(async () => {
//     const paymentDeletionResult = Payment.deleteMany({
//       status: ENUM_PAYMENT_STATUS.UNPAID,
//     });

//     if (paymentDeletionResult.deletedCount > 0) {
//       logger.info(
//         `Deleted ${paymentDeletionResult.deletedCount} unpaid payments`
//       );
//     }
//   })
// );

// const PaypalService = {
//   postCheckoutForSubscription,
// };

// module.exports = PaypalService;
