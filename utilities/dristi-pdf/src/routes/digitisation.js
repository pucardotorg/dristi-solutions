const express = require("express");
const router = express.Router();
const asyncMiddleware = require("../utils/asyncMiddleware");
const { logger } = require("../logger");

const digitisationOfPlea = require("../digitisationHandlers/digitisationOfPlea");
const digitisationOfExaminationOfAccused = require("../digitisationHandlers/digitisationOfExaminationOfAccused");
const digitisationOfMediation = require("../digitisationHandlers/digitisationOfMediation");

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

    let qrCode = req.query.qrCode;
    let digitisationType = req.query.documentType;
    // Set qrCode to false if it is undefined, null, or empty
    if (!qrCode) {
      qrCode = "false";
    } else {
      // Convert qrCode to lowercase
      qrCode = qrCode.toString().toLowerCase();
    }

    if (!digitisationType) {
      return renderError(
        res,
        "Digitisation type is mandatory to generate the PDF",
        400
      );
    }

    try {
      switch (digitisationType.toLowerCase()) {
        case "digitisation-plea":
          await digitisationOfPlea(
            req,
            res,
            qrCode,
            // courtCaseJudgeDetails
          );
          break;
        case "digitisation-examination-of-accused":
          await digitisationOfExaminationOfAccused(
            req,
            res,
            qrCode,
            // courtCaseJudgeDetails
          );
          break;
        case "digitisation-mediation":
          await digitisationOfMediation(
            req,
            res,
            qrCode,
            // courtCaseJudgeDetails
          );
          break;
        
        default:
          return renderError(
            res,
            `Unsupported hearing PDF type: ${digitisationType}`,
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
