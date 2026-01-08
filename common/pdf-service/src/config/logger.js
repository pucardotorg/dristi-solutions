const { createLogger, format, transports } = require("winston");

const logger = createLogger({
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSSZZ" }),
    format.printf(({ timestamp, level, message, ...meta }) => {
      const metaStr = Object.keys(meta).length ? ` | ${JSON.stringify(meta)}` : '';
      return `${timestamp} [${level.toUpperCase()}] [pdf-service] ${message}${metaStr}`;
    })
  ),
  transports: [new transports.Console()]
});

export default logger;
