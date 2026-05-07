const { logger } = require("../logger");

/**
 * Sanitize and structure error details for logging
 * @param {Error} error - The error object
 * @param {string} context - Context where the error occurred
 * @returns {Object} Sanitized error details
 */
const sanitizeError = (error, context) => {
  const sanitizedError = {
    context,
    message: error.message,
    type: error.name,
    timestamp: new Date().toISOString(),
  };

  if (error.response) {
    sanitizedError.status = error.response.status;
    sanitizedError.statusText = error.response.statusText;
    try {
      const raw = error.response.data;
      const bodyStr =
        typeof raw === "string"
          ? raw
          : Buffer.isBuffer(raw)
          ? raw.toString("utf8").slice(0, 500)
          : JSON.stringify(raw);
      sanitizedError.responseBody = bodyStr ? bodyStr.slice(0, 500) : null;
    } catch (_) {}
  }

  if (error.config) {
    try {
      sanitizedError.downstreamUrl = error.config.url;
      sanitizedError.method = error.config.method?.toUpperCase();
    } catch (_) {}
    if (error.config.params) {
      sanitizedError.requestParams = error.config.params;
    }
  }

  return sanitizedError;
};

/**
 * Log error safely without exposing sensitive information
 * @param {Error} error - The error object
 * @param {string} context - Context where the error occurred
 * @param {Object} [additionalInfo] - Additional contextual information
 */
const logError = (error, context, additionalInfo = {}) => {
  const sanitizedError = sanitizeError(error, context);

  // Add any safe additional context
  if (additionalInfo.safe) {
    sanitizedError.additionalContext = additionalInfo.safe;
  }

  logger.error("API Error", sanitizedError);
};

/**
 * Handle API errors consistently
 * @param {Error} error - The error object
 * @param {string} context - Context where the error occurred
 * @returns {Promise} Rejected promise with sanitized error
 */
const handleApiError = (error, context) => {
  logError(error, context);

  // Return a sanitized error for the client
  const clientError = {
    message: "An error occurred processing your request",
    status: error.response?.status || 500,
    code: error.code || "INTERNAL_ERROR",
  };

  return Promise.reject(clientError);
};

module.exports = {
  handleApiError,
  logError,
  sanitizeError,
};
