const express = require("express");
const router = express.Router();
const asyncMiddleware = require("../utils/asyncMiddleware");
const { logger } = require("../logger");
const { getCourtAndJudgeDetails } = require("../utils/commonUtils");

const ctcApplications = require("../ctcApplicationsHandlers/ctcApplications");
const { handleApiCall } = require("../utils/handleApiCall");
const { search_application } = require("../api");
function renderError(res, errorMessage, errorCode, errorObject) {
  if (errorCode == undefined) errorCode = 500;
  logger.error(
    `${errorMessage}: ${errorObject ? errorObject.stack || errorObject : ""}`
  );
  res.status(errorCode).send({ errorMessage });
}

router.post(
  "",
  asyncMiddleware(async function (req, res, next) {
    const {
      qrCode: qrCodeRaw,
      tenantId,
      courtId,
      applicationNumber,
      filingNumber
    } = req.query || {};

    let qrCode = qrCodeRaw;
    const requestInfo = req.body?.RequestInfo;
    const courtCaseJudgeDetails = await getCourtAndJudgeDetails(
      res,
      tenantId,
      "Judge",
      courtId,
      requestInfo
    );
    // Set qrCode to false if it is undefined, null, or empty
    if (!qrCode) {
      qrCode = "false";
    } else {
      // Convert qrCode to lowercase
      qrCode = qrCode.toString().toLowerCase();
    }

    const resApplication = ""; 
    await handleApiCall(
      res,
      () =>
        search_application(
          tenantId,
          applicationNumber,
          requestInfo,
          courtId,
          filingNumber
        ),
      "Failed to query application service"
    );
    const application = resApplication?.data?.applicationList[0];
    if (!application) {
      renderError(res, "Application not found", 404);
    }


    try {
      await ctcApplications(
        req,
        res,
        qrCode,
        application,
        courtCaseJudgeDetails
      );
    } catch (error) {
      renderError(
        res,
        "An error occurred while processing the request",
        500,
        error
      );
    }
  })
);

module.exports = router;
