const { Schema, model } = require("mongoose");
const ObjectId = Schema.Types.ObjectId;


const RecurringTaskSchema = new Schema({
    task:{
        type:ObjectId,
        ref:"Task",
        required:true
    },
    previous:{
        type:Date,
        required:false
    },
    next:{
        type:Date,
        required:true,
    },

    recurrenceRule:{
        type:String,
        required:true
    }},
    {
        timestamps:true
    })


const RecurringTask = model("RecurringTask", RecurringTaskSchema)


module.exports = RecurringTask