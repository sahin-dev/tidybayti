const ENUM_USER_ROLE = {
  USER: "USER",
  EMPLOYEE: "EMPLOYEE",
  ADMIN: "ADMIN",
};

const TaskRecurrence = {
  ONE_TIME: "one_time",
  RECURRENT: "recurrent",
};

const TaskStatus = {
  PENDING: "pending",
  CANCELLED: "cancelled",
  ONGOING: "ongoing",
  COMPLETED: "completed",
  SCHEDULED:'scheduled'
};

const GroceryRecurrence = {
  ONE_TIME: "one_time",
  WEEKLY: "weekly",
};

const GroceryStatus = {
  PENDING: "pending",
  CANCELLED: "cancelled",
  ONGOING: "ongoing",
  COMPLETED: "completed",
};

const DaysOfWeek = {
  SUNDAY: "Sunday",
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
};

module.exports = {
  ENUM_USER_ROLE,
  DaysOfWeek,
  TaskRecurrence,
  TaskStatus,
  GroceryRecurrence,
  GroceryStatus,
};
