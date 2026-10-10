const { RRule } = require("rrule")
const { TaskRecurrence } = require("../../../../util/enum")
const RecurringTask = require("../../task/RecurringTask/RecurringTask")
const Task = require("../../task/Task")
const TaskService = require("../../task/task.service")
const { formateDate, formateTime } = require("../../../../util/formateDate")
const getWeekStartEndDays = require("../../../../helper/weekStartEnd")

const taskWatcher = async () => {
    const rTasks = await RecurringTask.find({})

    for (const rTask of rTasks) {
        const currentDate = new Date()

        if (currentDate < new Date(rTask.next)) continue

        try {
            const { start, end } = getWeekStartEndDays()

            const payload = await Task.findById(rTask.task)

            if (!payload) {
                continue
            }

         
            const rule = RRule.fromString(rTask.recurrenceRule)
            const startDateOnly = new Date(payload.startDateTime)
            startDateOnly.setUTCHours(0, 0, 0, 0)
            
            const calculatedNextDates = rule.between(
                startDateOnly,
                end,
                true
            )

            

            for (const date of calculatedNextDates) {
                const taskData = {
                    userId: payload.user,
                    assignedTo: payload.assignedTo,
                    roomIds: [payload.room],
                    duration: payload.duration,
                    taskName: payload.taskName,
                    startDateStr: formateDate(date),
                    startTimeStr: payload.startTimeStr,
                    endTimeStr: payload.endTimeStr,
                    recurrence: TaskRecurrence.ONE_TIME,
                    ...(payload.taskDetails && { taskDetails: payload.taskDetails }),
                    ...(payload.additionalMessage && {
                        additionalMessage: payload.additionalMessage,
                    }),
                }

                await TaskService.postTask(
                    { userId: taskData.userId },
                    taskData
                )
            }

            if (calculatedNextDates.length > 0) {
                const lastDate = calculatedNextDates.at(-1)
                const nextDate = rule.after(lastDate)

                await RecurringTask.findByIdAndUpdate(rTask._id, {
                    next: new Date(nextDate.setUTCHours(0, 0, 0, 0)),
                    previous: new Date(),
                })
            }
        } catch (err) {
            
        }
    }
}

module.exports = taskWatcher