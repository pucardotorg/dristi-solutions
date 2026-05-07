const { createLogger, format, transports } = require("winston");

const myFormat = format.printf(({ level, message, label, timestamp, ...meta }) => {
  const formattedMessage =
    typeof message === "string" ? message : JSON.stringify(message);
  const SPLAT = Symbol.for("splat");
  const splatArgs = meta[SPLAT];
  let metaStr = "";
  if (splatArgs && splatArgs.length > 0) {
    metaStr = " " + splatArgs.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ");
  } else {
    const keys = Object.keys(meta).filter((k) => k !== "splat");
    if (keys.length > 0) {
      const obj = {};
      keys.forEach((k) => { obj[k] = meta[k]; });
      metaStr = " " + JSON.stringify(obj);
    }
  }
  return `${timestamp} [${label}] [${level}]: ${formattedMessage}${metaStr}`;
});

const logger = createLogger({
  format: format.combine(
    format.label({ label: "BFF" }),
    format.timestamp({ format: " YYYY-MM-DD HH:mm:ss.SSSZZ " }),
    format.splat(),
    myFormat
  ),
  transports: [new transports.Console()],
});

//export default logger;
module.exports = { logger };
