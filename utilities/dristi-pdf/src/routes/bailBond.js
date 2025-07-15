const express = require("express");
const router = express.Router();
const asyncMiddleware = require("../utils/asyncMiddleware");
const { logger } = require("../logger");
const bailBond = require("../bailBondHandlers/bailBond");

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

    try {
      switch (bailBondPdfType.toLowerCase()) {
        case "bail-bond":
          await bailBond(req, res, qrCode);
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
