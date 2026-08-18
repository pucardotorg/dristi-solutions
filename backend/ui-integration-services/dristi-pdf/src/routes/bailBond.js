const express = require("express");
const router = express.Router();
const asyncMiddleware = require("../utils/asyncMiddleware");
const { logger } = require("../logger");
const bailBond = require("../bailBondHandlers/bailBond");
const { getCourtAndJudgeDetails } = require("../utils/commonUtils");

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
    const bailBondPdfType = req.query.bailBondPdfType;
    const courtId = req.query.courtId;
    const tenantId = req.query.tenantId;
    const requestInfo = req.body.RequestInfo;
    let qrCode = req.query.qrCode;

    // Set qrCode to false if it is undefined, null, or empty
    if (!qrCode) {
      qrCode = "false";
    } else {
      // Convert qrCode to lowercase
      qrCode = qrCode.toString().toLowerCase();
    }

    if (!bailBondPdfType) {
      return renderError(
        res,
        "Hearing Pdf type is mandatory to generate the PDF",
        400
      );
    }

    const courtCaseJudgeDetails = await getCourtAndJudgeDetails(
      res,
      tenantId,
      "Judge",
      courtId,
      requestInfo
    );

    try {
      switch (bailBondPdfType.toLowerCase()) {
        case "bail-bond":
          await bailBond(req, res, courtCaseJudgeDetails, qrCode);
          break;
        default:
          return renderError(
            res,
            `Unsupported hearing PDF type: ${bailBondPdfType}`,
            400
          );
      }
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
