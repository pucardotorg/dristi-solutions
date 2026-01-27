const express = require("express");
const router = express.Router();

// Import application handlers
const applicationSubmissionExtension = require("../applicationHandlers/applicationSubmissionExtension");

const asyncMiddleware = require("../utils/asyncMiddleware");
const { logger } = require("../logger");
const applicationGeneric = require("../applicationHandlers/applicationGeneric");
const applicationProductionOfDocuments = require("../applicationHandlers/applicationProductionOfDocuments");
const applicationBailBond = require("../applicationHandlers/applicationBailBond");
const applicationCaseTransfer = require("../applicationHandlers/applicationCaseTransfer");
const applicationCaseWithdrawal = require("../applicationHandlers/applicationCaseWithdrawal");
const applicationRescheduleRequest = require("../applicationHandlers/applicationRescheduleRequest");
const applicationCheckout = require("../applicationHandlers/applicationCheckout");
const caseSettlementApplication = require("../applicationHandlers/caseSettlementApplication");
const applicationDelayCondonation = require("../applicationHandlers/applicationDelayCondonation");
const applicationSubmitBailDocuments = require("../applicationHandlers/applicationSubmitBailDocuments");
const { handleApiCall } = require("../utils/handleApiCall");
const { search_application } = require("../api");
const { getCourtAndJudgeDetails } = require("../utils/commonUtils");
const applicationProfileEdit = require("../applicationHandlers/applicationProfileEdit");
const applicationWitnessDeposition = require("../applicationHandlers/applicationWitnessDeposition");
const applicationPoaClaim = require("../applicationHandlers/applicationPoaClaim");
const applicationRescheduleHearing = require("../applicationHandlers/applicationRescheduleHearing");

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
    const applicationType = req.query.applicationType;
    const applicationNumber = req.query.applicationNumber;
    const tenantId = req.query.tenantId;
    const requestInfo = req.body.RequestInfo;
    let qrCode = req.query.qrCode;
    const courtId = req.query.courtId;

    // Set qrCode to false if it is undefined, null, or empty
    if (!qrCode) {
      qrCode = "false";
    } else {
      // Convert qrCode to lowercase
      qrCode = qrCode.toString().toLowerCase();
    }

    if (!applicationType) {
      return renderError(
        res,
        "Application type is mandatory to generate the PDF",
        400
      );
    }

    const resApplication = await handleApiCall(
      res,
      () =>
        search_application(tenantId, applicationNumber, requestInfo, courtId),
      "Failed to query application service"
    );
    const application = resApplication?.data?.applicationList[0];
    if (!application) {
      renderError(res, "Application not found", 404);
    }

    const courtCaseJudgeDetails = await getCourtAndJudgeDetails(
      res,
      tenantId,
      "Judge",
      courtId || application?.courtId,
      requestInfo
    );

    try {
      switch (applicationType.toLowerCase()) {
        case "application-submission-extension":
          await applicationSubmissionExtension(
            req,
            res,
            qrCode,
            application,
            courtCaseJudgeDetails
          );
          break;
        case "application-generic":
          await applicationGeneric(
            req,
            res,
            qrCode,
            application,
            courtCaseJudgeDetails
          );
          break;
        case "application-production-of-documents":
          await applicationProductionOfDocuments(
            req,
            res,
            qrCode,
            application,
            courtCaseJudgeDetails
          );
          break;
        case "application-reschedule-request":
          await applicationRescheduleRequest(
            req,
            res,
            qrCode,
            application,
            courtCaseJudgeDetails
          );
          break;
        case "application-reschedule-hearing":
          await applicationRescheduleHearing(
            req,
            res,
            qrCode,
            application,
            courtCaseJudgeDetails
          );
          break;
        case "application-bail-bond":
          await applicationBailBond(
            req,
            res,
            qrCode,
            application,
            courtCaseJudgeDetails
          );
          break;
        case "application-case-transfer":
          await applicationCaseTransfer(
            req,
            res,
            qrCode,
            application,
            courtCaseJudgeDetails
          );
          break;
        case "application-case-withdrawal":
          await applicationCaseWithdrawal(
            req,
            res,
            qrCode,
            application,
            courtCaseJudgeDetails
          );
          break;
        case "application-for-checkout-request":
          await applicationCheckout(
            req,
            res,
            qrCode,
            application,
            courtCaseJudgeDetails
          );
          break;
        case "application-case-settlement":
          await caseSettlementApplication(
            req,
            res,
            qrCode,
            application,
            courtCaseJudgeDetails
          );
          break;
        case "application-delay-condonation":
          await applicationDelayCondonation(
            req,
            res,
            qrCode,
            application,
            courtCaseJudgeDetails
          );
          break;
        case "application-submit-bail-documents":
          await applicationSubmitBailDocuments(
            req,
            res,
            qrCode,
            application,
            courtCaseJudgeDetails
          );
          break;
        case "application-profile-edit":
          await applicationProfileEdit(
            req,
            res,
            qrCode,
            application,
            courtCaseJudgeDetails
          );
          break;
        case "application-witness-deposition":
          await applicationWitnessDeposition(
            req,
            res,
            qrCode,
            application,
            courtCaseJudgeDetails
          );
          break;
        case "poa-claim-application":
          await applicationPoaClaim(
            req,
            res,
            qrCode,
            application,
            courtCaseJudgeDetails
          );
          break;
        default:
          await applicationGeneric(
            req,
            res,
            qrCode,
            application,
            courtCaseJudgeDetails
          );
          break;
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
