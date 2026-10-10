const  {RRule}  = require("rrule")
const RecurringTask  = require("./RecurringTask")

const { TaskRecurrence } = require("../../../../util/enum")
const getRRule = require("../../../../util/rrule")
const validateFields = require("../../../../util/validateFields")
const Task = require("../Task")
const parseDateTime = require("../../../../util/parseDateTume")


const createRecurringTask  = async (taskId,payload)=>{

  
  const startDateTime = new Date(
    `${payload.startDateStr} ${payload.starTimeStr}`
  );


  if(payload.recurrence === TaskRecurrence.RECURRENT){

    let recurrenceRule

    if(payload.rrule){

      recurrenceRule = payload.rrule
      
    }else {
      validateFields(payload, ["freq", "interval", "days", 'months'])
      const {freq, interval, days, months} = payload
       recurrenceRule = getRRule(freq, interval, days, months,payload.starTimeStr)
    }
    
    
  

    await Task.findOneAndUpdate({_id:taskId}, {recurrenceRule, recurrenceStr:recurrenceRule})

    await RecurringTask.create({task:taskId, recurrenceRule:recurrenceRule,next:new Date()})
  }

}

 module.exports = {
    createRecurringTask
}
