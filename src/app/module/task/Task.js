const { Schema, model } = require("mongoose");
const {
  TaskRecurrence,
  DaysOfWeek,
  TaskStatus,
} = require("../../../util/enum");
const ObjectId = Schema.Types.ObjectId;

const TaskSchema = new Schema(
  {
    user: {
      type: ObjectId,
      ref: "User",
      required: true,
    },
    room: {
      type: ObjectId,
      ref: "Room",
      required: true,
    },
    assignedTo: {
      type: ObjectId,
      ref: "User",
      required: true,
    },
    taskName: {
      type: String,
      required: true,
    },
    recurrence: {
      type: String,
      enum: {
        values: [TaskRecurrence.ONE_TIME, TaskRecurrence.RECURRENT],
        message: `Invalid recurrence value. Allowed values: ${Object.values(
          TaskRecurrence
        ).join(", ")}`,
      },
      default: TaskRecurrence.ONE_TIME,
    },
    recurrenceStr:{
      type:String,
      required:false
    },
    recurrenceRule:{
      type: String,
      required:false
    },
    startDateStr: {
      type: String, // MM/DD/YYYY
      required: true,
    },
    startTimeStr: {
      type: String, // HH:MM AM/PM
      required: true,
    },
    startDateTime: {
      type: Date,
      required: true,
    },
    endDateTime:{
      type:Date,
      required:true
    },
    endTimeStr:{
      type:String,
      required:true,

    },
    endDateStr:{
      type:String,
      required:true
    },
    duration:{
      type:Number,
      required:false
    },
    
    dayOfWeek: {
      type: String,
      required: true,
    },
    taskDetails: {
      type: String,
    },
    additionalMessage: {
      type: String,
    },
    note: {
      type: String,
    },
    status: {
      type: String,
      enum: {
        values: Object.values(TaskStatus),
        message: `Invalid recurrence value ({VALUE}). Allowed values: ${Object.values(
          TaskStatus
        ).join(", ")}`,
      },
      default: TaskStatus.PENDING,
    },
  },
  {
    timestamps: true,
  }
);

const Task = model("Task", TaskSchema);

module.exports = Task;
