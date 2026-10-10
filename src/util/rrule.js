const { formateTime } = require("./formateDate");


const getRRule = (freq,interval,days,months, startTimeStr)=>{
    let rruleStr= null
   
    // let formattedDate = formateTime(startDateTime)

    // const [hour, minute] = startTimeStr.split(" ")[0].split(":")



    if (freq === 'DAILY'){
       rruleStr= `FREQ=${freq};INTERVAL=${interval}`
    }
    else if (freq === 'WEEKLY'){
       rruleStr= `FREQ=${freq};INTERVAL=${interval}`

       if(days && days.length > 0){
            rruleStr+=`;BYDAY=${days.join(',')}`
       }
    }
    else if (freq === 'MONTHLY'){
        rruleStr=`FREQ=${freq};INTERVAL=${interval}`

        if(days && days.length > 0){
            rruleStr+=`;BYDAY=${days.join(',')}`
       }
    }

    else if (freq === "YEARLY"){
        rruleStr=`FREQ=${freq};INTERVAL=${interval}`
        if(days && days.length > 0){
            rruleStr+=`;BYDAY=${days.join(',')}`
       }
       if(months && months.length > 0){
        rruleStr+=`;BYMONTH=${months.join(',')}`
       }
    }

    return rruleStr /*+=`;BYHOUR=${hour};BYMINUTE=${minute.split(" ")[0]}` */
   
    
}

module.exports = getRRule