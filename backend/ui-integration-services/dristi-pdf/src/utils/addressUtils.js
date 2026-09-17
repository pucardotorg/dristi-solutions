/**
 * Formats address object into a string representation
 * @param {Object} addressObject - The address object containing address details
 * @returns {string} Formatted address string
 */
function getStringAddressDetails(addressObject) {
  return `${addressObject?.locality || ""}, ${addressObject?.city || ""}, ${
    addressObject?.district || ""
  },  ${addressObject?.state || ""},  ${addressObject?.pincode || ""}`;
}

module.exports = {
  getStringAddressDetails,
};
