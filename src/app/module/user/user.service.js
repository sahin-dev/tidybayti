const { status } = require("http-status");
const cron = require("node-cron");

const ApiError = require("../../../error/ApiError");
const User = require("./User");
const Auth = require("../auth/Auth");
const validateFields = require("../../../util/validateFields");
const { ENUM_USER_ROLE } = require("../../../util/enum");
const EmailHelpers = require("../../../util/emailHelpers");
const convertToArray = require("../../../util/convertToArray");
const QueryBuilder = require("../../../builder/queryBuilder");

const updateProfile = async (req) => {
  const { files, body: data } = req;
  const { userId, authId } = req.user;
  const updateData = { ...data };

  if (data?.profile_image === "")
    throw new ApiError(status.BAD_REQUEST, `Missing profile image`);

  if (files && files.profile_image)
    updateData.profile_image = files.profile_image[0].path;

  const [auth, user] = await Promise.all([
    Auth.findByIdAndUpdate(
      authId,
      {
        firstName: updateData.firstName,
        lastName: updateData.lastName,
      },
      {
        new: true,
      }
    ),
    User.findByIdAndUpdate(
      userId,
      { ...updateData },
      {
        new: true,
      }
    ).populate("authId"),
  ]);

  if (!auth || !user) throw new ApiError(status.NOT_FOUND, "User not found!");

  return user;
};

const getProfile = async (userData) => {
  const { userId, authId } = userData;

  const [auth, result] = await Promise.all([
    Auth.findById(authId).lean(),
    User.findById(userId).populate("authId").lean(),
  ]);

  if (!result || !auth) throw new ApiError(status.NOT_FOUND, "User not found");
  if (auth.isBlocked)
    throw new ApiError(status.FORBIDDEN, "You are blocked. Contact support");
  const isTrialActive = result.trialExpires && new Date(result.trialExpires) > new Date();
  const isSubscriptionActive = result.isSubscribed && (!result.subscriptionExpires || new Date(result.subscriptionExpires) > new Date());

  if (
    auth.role === ENUM_USER_ROLE.USER &&
    !isTrialActive &&
    !isSubscriptionActive
  ) {
    throw new ApiError(
      status.FORBIDDEN,
      "Trial period expired or subscription finished. Please subscribe"
    );
  }

  return result;
};

const deleteMyAccount = async (payload) => {
  const { email, password } = payload;

  const isUserExist = await Auth.isAuthExist(email);
  if (!isUserExist) throw new ApiError(status.NOT_FOUND, "User does not exist");
  if (
    isUserExist.password &&
    !(await Auth.isPasswordMatched(password, isUserExist.password))
  ) {
    throw new ApiError(status.FORBIDDEN, "Password is incorrect");
  }

  Promise.all([
    Auth.deleteOne({ email }),
    User.deleteOne({ authId: isUserExist._id }),
  ]);
};

const addEmployee = async (req) => {
  const { body: payload, files, user } = req;

  validateFields(files, ["profile_image"]);
  validateFields(payload, [
    "firstName",
    "lastName",
    "email",
    "password",
    "phoneNumber",
    "jobType",
    "CPRNumber",
    "CPRExpDate",
    "passportNumber",
    "passportExpDate",
    "dutyTime",
    "breakTimeStart",
    "breakTimeEnd",
    "workingDay",
    "offDay",
    "designation",
    "address"
  ]);

  const authData = {
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email,
    password: payload.password,
    role: ENUM_USER_ROLE.EMPLOYEE,
    isActive: true,
  };

  const auth = await Auth.create(authData);

  const employeeData = {
    authId: auth._id,
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email,
    profile_image: files.profile_image[0].path,
    phoneNumber: payload.phoneNumber,
    employer: user.userId,
    jobType: payload.jobType,
    CPRNumber: payload.CPRNumber,
    CPRExpDate: payload.CPRExpDate,
    passportNumber: payload.passportNumber,
    passportExpDate: payload.passportExpDate,
    note: payload.note,
    dutyTime: payload.dutyTime,
    breakTimeStart: payload.breakTimeStart,
    breakTimeEnd: payload.breakTimeEnd,
    workingDay: convertToArray(payload.workingDay),
    offDay: payload.offDay,
    designation: payload.designation,
    address: payload.address
  };

  const employee = await User.create(employeeData);

  employee.employeeId = employee._id.toString().toUpperCase();
  await employee.save();

  EmailHelpers.sendAddEmployeeTemp(payload.email, {
    password: payload.password,
    workDays: employeeData.workingDay.join(", "),
    name: `${payload.firstName} ${payload.lastName}`,
    ...employee.toObject(),
  });

  return employee;
};

const editEmployee = async (req) => {
  const { body: payload, files, user: userData } = req;

  validateFields(payload, ["authId", "userId"]);

  const { workingDay, ...others } = payload || {};

  if (payload.email || payload.password)
    throw new ApiError(status.BAD_REQUEST, "Email & Password can't be changed");

  const updateData = {
    ...(workingDay && {
      workingDay: convertToArray(payload.workingDay),
    }),
    ...others,
  };

  const employee = await User.findOne({
    _id: payload.userId,
    authId: payload.authId,
  });

  if (!employee) throw new ApiError(status.BAD_REQUEST, "Employee not found.");

  if (files && files.profile_image)
    updateData.profile_image = files.profile_image[0].path;

  const [auth, updatedEmployee] = await Promise.all([
    Auth.findByIdAndUpdate(
      payload.authId,
      { firstName: updateData.firstName, lastName: updateData.lastName },
      {
        new: true,
      }
    ).lean(),
    User.findByIdAndUpdate(
      payload.userId,
      { ...updateData },
      {
        new: true,
      }
    ).lean(),
  ]);

  return {
    updatedEmployee,
  };
};

const deleteEmployee = async (userData, payload) => {
  validateFields(payload, ["userId", "authId"]);

  const deletedUser = await User.deleteOne({
    _id: payload.userId,
    employer: userData.userId,
  });

  if (!deletedUser.deletedCount)
    throw new ApiError(status.NOT_FOUND, "Employee Not found");

  const deletedAuth = await Auth.deleteOne({ _id: payload.authId });
};

const getMyEmployee = async (userData, query) => {
  const myEmployeesQuery = new QueryBuilder(
    User.find({ employer: userData.userId }),
    query
  )
    .search(["employeeId", "firstName"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const [result, meta] = await Promise.all([
    myEmployeesQuery.modelQuery,
    myEmployeesQuery.countTotal(),
  ]);

  return {
    meta,
    result,
  };
};

const getSingleEmployee = async (query) => {
  validateFields(query, ["userId"]);

  const employee = await User.findById(query.userId);

  if (!employee) throw new ApiError(status.NOT_FOUND, "Employee not found");

  return employee;
};

const updateSubscription = async (userData, payload) => {
  validateFields(payload, ["subscriptionType", "price"]);

  const user = await User.findById(userData.userId);

  if (!user) throw new ApiError(status.NOT_FOUND, "User not found");

  return user;
};

// const updateSubscriptionStatusWithCron = async (check) => {
//   const now = new Date();

//   const updateTrial = await User.updateMany(
//     {
//       trialExpires: { $lte: now },
//     },
//     {}
//   );

//   // if (result.deletedCount > 0)
//   //   logger.info(`Deleted ${result.deletedCount} expired one_time task`);

//   // logger.info(`${now}`);
// };

// // update subscription status every midnight
// cron.schedule("0 0 * * *", async () => {
//   try {
//     // updateSubscriptionStatusWithCron();
//   } catch (error) {
//     errorLogger.error("Error updating trial and subscription", error);
//   }
// });

const getUserSubscriptionData = async (userId)=> {
  const user = await User.findById(userId)
  if(!user){
    throw new ApiError(status.NOT_FOUND, "user not found")
  }

  return {
    isSubscribed:user.isSubscribed,
    trialExpiresAt:user.trialExpires,
    isTrialExpired: user.trialExpires < new Date(Date.now())
  }
}

const UserService = {
  getProfile,
  deleteMyAccount,
  updateProfile,
  addEmployee,
  editEmployee,
  deleteEmployee,
  getMyEmployee,
  getSingleEmployee,
  getUserSubscriptionData
};

module.exports = { UserService };
