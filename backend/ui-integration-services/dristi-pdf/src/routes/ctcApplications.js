const express = require("express");
const router = express.Router();
const asyncMiddleware = require("../utils/asyncMiddleware");
const { logger } = require("../logger");
const { getCourtAndJudgeDetails } = require("../utils/commonUtils");

const ctcApplications = require("../ctcApplicationsHandlers/ctcApplications");
function renderError(res, errorMessage, errorCode, errorObject) {
  if (errorCode == undefined) errorCode = 500;
  logger.error(
    `${errorMessage}: ${errorObject ? errorObject.stack || errorObject : ""}`,
  );
  res.status(errorCode).send({ errorMessage });
}

router.post(
  "",
  asyncMiddleware(async function (req, res, next) {
    const { criteria } = req.body || {};
    const { tenantId, courtId } = criteria;

    const requestInfo = req.body?.RequestInfo;
    const courtCaseJudgeDetails = await getCourtAndJudgeDetails(
      res,
      tenantId,
      "Judge",
      courtId,
      requestInfo,
    );

    try {
      await ctcApplications(req, res, courtCaseJudgeDetails);
    } catch (error) {
      renderError(
        res,
        "An error occurred while processing the request",
        500,
        error,
      );
    }
  }),
);

module.exports = router;
