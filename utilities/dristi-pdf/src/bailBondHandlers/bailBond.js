const cheerio = require("cheerio");
const config = require("../config");
const {
  search_case,
  search_sunbirdrc_credential_service,
  create_pdf,
  search_advocate,
  search_message,
  search_bailBond
} = require("../api");
const { renderError } = require("../utils/renderError");
const { formatDate } = require("../applicationHandlers/formatDate");
const { cleanName } = require("../applicationHandlers/cleanName");
const { getCourtAndJudgeDetails } = require("../utils/commonUtils");

const bailBond = async (
  req,
  res,
  qrCode,
) => {
  const cnrNumber = req.query.cnrNumber;
  const bailBondId = req.query.bailBondId;
  const tenantId = req.query.tenantId;
  const entityId = req.query.entityId;
  const code = req.query.code;
  const requestInfo = req.body.RequestInfo;

  const missingFields = [];
  if (!cnrNumber) missingFields.push("cnrNumber");
  if (!bailBondId) missingFields.push("bailBondId");
  if (!tenantId) missingFields.push("tenantId");
  if (requestInfo === undefined) missingFields.push("requestInfo");
  if (qrCode === "true" && (!entityId || !code))
    missingFields.push("entityId and code");

  if (missingFields.length > 0) {
    return renderError(
      res,
      `${missingFields.join(", ")} are mandatory to generate the PDF`,
      400
    );
  }

  // Function to handle API calls
  const handleApiCall = async (apiCall, errorMessage) => {
    try {
      return await apiCall();
    } catch (ex) {
      renderError(res, `${errorMessage}`, 500, ex);
      throw ex; // Ensure the function stops on error
    }
  };


  try {

    const resBailBond = await handleApiCall(
      () => search_bailBond(tenantId, bailBondId, requestInfo),
      "Failed to query case service"
    );

    const bailBond = resBailBond?.data?.criteria[0]?.responseList[0];
    if (!bailBond) {
      return renderError(res, "bailBond not found", 404);
    }

    const courtCaseJudgeDetails = await getCourtAndJudgeDetails(
      res,
      tenantId,
      "Judge",
      bailBond?.courtId,
      requestInfo
    );
    
    // TODO: Add logic to handle bailBond details and generate PDF
  } catch (ex) {
    return renderError(
        res,
        "Failed to query details of Generic Application",
        500,
        ex
      );
  }
};

module.exports = bailBond;
