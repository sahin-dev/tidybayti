
function parseDateTime(dateTimeStr) {
  const [datePart, timePart, meridian] = dateTimeStr.split(" ");
  const [month, day, year] = datePart.split('/');
  let [hours, minutes] = timePart.split(':').map(Number);


  if (meridian.toUpperCase() === 'PM' && hours < 12) hours += 12;
  if (meridian.toUpperCase() === 'AM' && hours === 12) hours = 0;

  let isoDate = `${year}-${month.padStart(2,"0")}-${day.padStart(2, "0")}`
  let isoTime = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`
  return new Date(`${isoDate}T${isoTime}Z`)
}



module.exports = parseDateTime
