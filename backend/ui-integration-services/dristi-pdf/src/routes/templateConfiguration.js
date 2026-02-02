const express = require("express");
const router = express.Router();
const asyncMiddleware = require("../utils/asyncMiddleware");
const { logger } = require("../logger");
const { getCourtAndJudgeDetails } = require("../utils/commonUtils");

const miscellaneousProcessTemplate = require("../templateConfigurationHandlers/miscellaneousProcessTemplate");

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


    try {
      await miscellaneousProcessTemplate(
        req,
        res,
        qrCode,
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
