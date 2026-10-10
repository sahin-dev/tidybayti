const express = require("express");
const router = express.Router();
const AuthRoutes = require("../module/auth/auth.routes");
const AdminRoutes = require("../module/admin/admin.routes");
const UserRoutes = require("../module/user/user.routes");
const DashboardRoutes = require("../module/dashboard/dashboard.routes");
const ManageRoutes = require("../module/manage/manage.routes");
const RoomRoutes = require("../module/Room/room.routes");
const TaskRoutes = require("../module/task/task.routes");
const WalletRoutes = require("../module/wallet/wallet.routes");
const RecipeRoutes = require("../module/recipe/recipe.routes");
const PaymentRoutes = require("../module/payment/payment.routes");
const SubscriptionRoutes = require("../module/subscription/subscription.routes");
const groceryRoutes = require("../module/grocery/grocery.route");

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/user",
    route: UserRoutes,
  },
  {
    path: "/admin",
    route: AdminRoutes,
  },
  {
    path: "/admin",
    route: DashboardRoutes,
  },
  {
    path: "/manage",
    route: ManageRoutes,
  },
  {
    path: "/room",
    route: RoomRoutes,
  },
  {
    path: "/task",
    route: TaskRoutes,
  },
  {
    path: "/wallet",
    route: WalletRoutes,
  },
  {
    path: "/recipe",
    route: RecipeRoutes,
  },
  {
    path: "/payment",
    route: PaymentRoutes,
  },
  {
    path: "/subscription",
    route: SubscriptionRoutes,
  },
  {
    path: "/groceries",
    route: groceryRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

module.exports = router;
