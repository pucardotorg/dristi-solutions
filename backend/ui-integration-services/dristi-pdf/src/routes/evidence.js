const express = require("express");
const router = express.Router();
const asyncMiddleware = require("../utils/asyncMiddleware");
const { logger } = require("../logger");
const Evidence = require("../EvidenceHandlers/evidence");

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
    const evidencePdfType = req.query.evidencePdfType;
    let qrCode = req.query.qrCode;

    // Set qrCode to false if it is undefined, null, or empty
    if (!qrCode) {
      qrCode = "false";
    } else {
      // Convert qrCode to lowercase
      qrCode = qrCode.toString().toLowerCase();
    }

    if (!evidencePdfType) {
      return renderError(
        res,
        "Evidence Pdf type is mandatory to generate the PDF",
        400
      );
    }

    try {
      switch (evidencePdfType.toLowerCase()) {
        case "evidence-seal":
          await Evidence(req, res, qrCode);
          break;
        default:
          return renderError(
            res,
            `Unsupported hearing PDF type: ${evidencePdfType}`,
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
