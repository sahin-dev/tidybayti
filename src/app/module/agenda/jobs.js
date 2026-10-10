
const taskWatcher = require("./jobs/taskWatcher");


module.exports = {
    "task:watcher": {
        interval:"5 seconds",
        job: taskWatcher
    }
}
