const express = require("express");
const router = express.Router();

// Import order handlers
const acceptAdrApplication = require("../orderHandlers/acceptAdrApplication");
const acceptReschedulingRequest = require("../orderHandlers/acceptReschedulingRequest");
const adrCaseReferral = require("../orderHandlers/adrCaseReferral");
const caseSettlementAcceptance = require("../orderHandlers/caseSettlementAcceptance");
const caseSettlementRejection = require("../orderHandlers/caseSettlementRejection");
const caseTransfer = require("../orderHandlers/caseTransfer");
const mandatoryAsyncSubmissionsResponses = require("../orderHandlers/mandatoryAsyncSubmissionsResponses");
const newHearingDateAfterReschedule = require("../orderHandlers/newHearingDateAfterReschedule");
const orderGeneric = require("../orderHandlers/orderGeneric");
const rejectAdrApplication = require("../orderHandlers/rejectAdrApplication");
const rejectReschedulingRequest = require("../orderHandlers/rejectReschedulingRequest");
const rescheduleRequestJudge = require("../orderHandlers/rescheduleRequestJudge");
const scheduleHearingDate = require("../orderHandlers/scheduleHearingDate");
const summonsIssue = require("../orderHandlers/summonsIssue");

const asyncMiddleware = require("../utils/asyncMiddleware");
const { logger } = require("../logger");
const { clear } = require("winston");
const orderBailAcceptance = require("../orderHandlers/orderBailAcceptance");
const orderBailRejection = require("../orderHandlers/orderBailRejection");
const orderForAcceptReschedulingRequest = require("../orderHandlers/orderForAcceptReschedulingRequest");
const orderForRejectionReschedulingRequest = require("../orderHandlers/orderForRejectionReschedulingRequest");
const orderForMandatoryAsyncSubmissionsAndResponse = require("../orderHandlers/orderForMandatoryAsyncSubmissionsAndResponse");
const orderAcceptVoluntary = require("../orderHandlers/orderAcceptVoluntary");
const orderRejectVoluntary = require("../orderHandlers/orderRejectVoluntary");
const orderAcceptCheckout = require("../orderHandlers/orderAcceptCheckout");
const orderRejectCheckout = require("../orderHandlers/orderRejectCheckout");

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
    const orderType = req.query.orderType;
    let qrCode = req.query.qrCode;

    // Set qrCode to false if it is undefined, null, or empty
    if (!qrCode) {
      qrCode = "false";
    } else {
      // Convert qrCode to lowercase
      qrCode = qrCode.toString().toLowerCase();
    }

    if (!orderType) {
      return renderError(
        res,
        "Order type is mandatory to generate the PDF",
        400
      );
    }

    try {
      switch (orderType.toLowerCase()) {
        case "reschedule-request-judge":
          await rescheduleRequestJudge(req, res, qrCode);
          break;
        case "new-hearing-date-after-rescheduling":
          await newHearingDateAfterReschedule(req, res, qrCode);
          break;
        case "schedule-hearing-date":
          await scheduleHearingDate(req, res, qrCode);
          break;
        case "accept-reschedule-request":
          await acceptReschedulingRequest(req, res, qrCode);
          break;
        case "reject-reschedule-request":
          await rejectReschedulingRequest(req, res, qrCode);
          break;
        case "mandatory-async-submissions-responses":
          await mandatoryAsyncSubmissionsResponses(req, res, qrCode);
          break;
        case "adr-case-referral":
          await adrCaseReferral(req, res, qrCode);
          break;
        case "accept-adr-application":
          await acceptAdrApplication(req, res, qrCode);
          break;
        case "reject-adr-application":
          await rejectAdrApplication(req, res, qrCode);
          break;
        case "case-settlement-rejection":
          await caseSettlementRejection(req, res, qrCode);
          break;
        case "case-settlement-acceptance":
          await caseSettlementAcceptance(req, res, qrCode);
          break;
        case "case-transfer":
          await caseTransfer(req, res, qrCode);
          break;
        case "summons-issue":
          await summonsIssue(req, res, qrCode);
          break;
        case "order-generic":
          await orderGeneric(req, res, qrCode);
          break;
        case "order-bail-acceptance":
          await orderBailAcceptance(req, res, qrCode);
          break;
        case "order-bail-rejection":
          await orderBailRejection(req, res, qrCode);
          break;
        case "order-for-accept-rescheduling-request":
          await orderForAcceptReschedulingRequest(req, res, qrCode);
          break;
        case "order-for-rejection-rescheduling-request":
          await orderForRejectionReschedulingRequest(req, res, qrCode);
          break;
        case "order-for-mandatory-async-submissions-and-response":
          await orderForMandatoryAsyncSubmissionsAndResponse(req, res, qrCode);
          break;
        case "order-accept-voluntary":
          await orderAcceptVoluntary(req, res, qrCode);
          break;
        case "order-reject-voluntary":
          await orderRejectVoluntary(req, res, qrCode);
          break;
        case "order-accept-checkout-request":
          await orderAcceptCheckout(req, res, qrCode);
          break;
        case "order-reject-checkout-request":
          await orderRejectCheckout(req, res, qrCode);
          break;
        default:
          await orderGeneric(req, res, qrCode);
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
