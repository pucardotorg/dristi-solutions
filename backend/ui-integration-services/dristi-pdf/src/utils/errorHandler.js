const { logger } = require("../logger");

/**
 * Sanitize and structure error details for logging
 * @param {Error} error - The error object
 * @param {string} context - Context where the error occurred
 * @returns {Object} Sanitized error details
 */
const sanitizeError = (error, context) => {
  // Basic error info without sensitive data
  const sanitizedError = {
    context,
    message: error.message,
    type: error.name,
    timestamp: new Date().toISOString(),
  };

  // Add HTTP-specific info if available, without sensitive data
  if (error.response) {
    sanitizedError.status = error.response.status;
    sanitizedError.statusText = error.response.statusText;
  }

  // Add request context if available, without query parameters or headers
  if (error.config) {
    sanitizedError.endpoint = new URL(error.config.url).pathname;
    sanitizedError.method = error.config.method;
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
