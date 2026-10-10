

function formateDate(dateStr){
    
    const formatter = new Intl.DateTimeFormat(undefined, {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
    });

    return formatter.format(new Date(dateStr))

}

function formateTime (dateStr){
    const formatter = new Intl.DateTimeFormat(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });

    return formatter.format(new Date(dateStr))
}

module.exports  = {
    formateDate,
    formateTime
}