function formatDate(date, format) {
  if (!date) return "";

  const options = {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };
  const parts = new Intl.DateTimeFormat("en-IN", options).formatToParts(date);

  const day = parts.find((p) => p.type === "day")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const year = parts.find((p) => p.type === "year")?.value;

  if (format === "DD-MM-YYYY") {
    return `${day}-${month}-${year}`;
  }
  return `${year}-${month}-${day}`;
}
module.exports = { formatDate };
