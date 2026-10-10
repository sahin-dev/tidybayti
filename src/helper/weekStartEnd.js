const getWeekStartEndDays = (currentDate = new Date())=>{

    const weekDay = new Date(currentDate).getUTCDay()
    const start = new Date(new Date(Date.now() - weekDay * 24 * 60 * 60 * 1000).setUTCHours(0,0,0,0))
    const end = new Date(new Date(Date.now() +  (6-weekDay) * 24 * 60 * 60 * 1000).setUTCHours(23,59,59,999))

    return {start, end}
    

}

module.exports = getWeekStartEndDays