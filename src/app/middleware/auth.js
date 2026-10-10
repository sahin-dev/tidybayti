const config = require("../../config");
const ApiError = require("../../error/ApiError");
const {status} = require("http-status");
const { jwtHelpers } = require("../../helper/jwtHelpers");
const { ENUM_USER_ROLE } = require("../../util/enum");
const Auth = require("../module/auth/Auth");
const User = require("../module/user/User");

const auth =
  (roles, isAccessible = true) =>
  async (req, res, next) => {
    try {
      const tokenWithBearer = req.headers.authorization;

      if (!tokenWithBearer && !isAccessible) return next();

      if (!tokenWithBearer)
        throw new ApiError(
          status.UNAUTHORIZED,
          "You are not authorized for this role"
        );

      if (tokenWithBearer.startsWith("Bearer")) {
        const token = tokenWithBearer.split(" ")[1];

        const verifyUser = jwtHelpers.verifyToken(token, config.jwt.secret);

        req.user = verifyUser;

        const isExist = await Auth.findById(verifyUser?.authId);
        if (!isExist || !Object.values(ENUM_USER_ROLE).includes(verifyUser.role)) {
          throw new ApiError(status.UNAUTHORIZED, "You are not authorized");
        }


        if (roles.length && !roles.includes(verifyUser.role))
          throw new ApiError(
            status.FORBIDDEN,
            "Access Forbidden: You do not have permission to perform this action"
          );

          const user = await User.findOne({ authId: verifyUser.authId });
          if (user && user.isBlocked) {
            throw new ApiError(
              status.UNAUTHORIZED,
              "Your account has been blocked. Please contact support for assistance."
            );
          }

         

          if(user && user.trialExpires && new Date(user.trialExpires) < new Date() && !user.isSubscribed){
             if(req.url === "/google-play/verify-subscription" || req.url === "/apple/verify-subscription"){
              return next();
            }
            throw new ApiError(
              status.UNAUTHORIZED,
              "Your trial period has expired or subscription has expired. Please subscribe to continue using the service."
            );
          }

       return  next();
      }
    } catch (error) {
      next(error);
    }
  };

module.exports = auth;
