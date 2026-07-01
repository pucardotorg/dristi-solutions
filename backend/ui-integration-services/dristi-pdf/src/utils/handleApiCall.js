const { renderError } = require("./renderError");

async function handleApiCall(res, apiCall, errorMessage) {
  try {
    return await apiCall();
  } catch (ex) {
    renderError(res, `${errorMessage}`, 500, ex);
    throw ex; // Ensure the function stops on error
  }
}

module.exports = { handleApiCall };
