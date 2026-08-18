const { mergePdfs } = require("./mergePdfs");
const { renderError } = require("./renderError");

const acceptReschedulingRequest = require("../orderHandlers/acceptReschedulingRequest");
const adrCaseReferral = require("../orderHandlers/adrCaseReferral");
const caseSettlementAcceptance = require("../orderHandlers/caseSettlementAcceptance");
const caseSettlementRejection = require("../orderHandlers/caseSettlementRejection");
const caseTransfer = require("../orderHandlers/caseTransfer");
const mandatoryAsyncSubmissionsResponses = require("../orderHandlers/mandatoryAsyncSubmissionsResponses");
const newHearingDateAfterReschedule = require("../orderHandlers/newHearingDateAfterReschedule");
const orderGeneric = require("../orderHandlers/orderGeneric");
const scheduleHearingDate = require("../orderHandlers/scheduleHearingDate");
const summonsIssue = require("../orderHandlers/summonsIssue");
const orderBailAcceptance = require("../orderHandlers/orderBailAcceptance");
const orderBailRejection = require("../orderHandlers/orderBailRejection");
const orderForRejectionReschedulingRequest = require("../orderHandlers/orderForRejectionReschedulingRequest");
const orderAcceptVoluntary = require("../orderHandlers/orderAcceptVoluntary");
const orderRejectVoluntary = require("../orderHandlers/orderRejectVoluntary");
const orderAcceptCheckout = require("../orderHandlers/orderAcceptCheckout");
const orderRejectCheckout = require("../orderHandlers/orderRejectCheckout");
const orderNotice = require("../orderHandlers/orderNotice");
const orderWarrant = require("../orderHandlers/orderWarrant");
const orderProclamation = require("../orderHandlers/orderProclamation");
const orderAttachment = require("../orderHandlers/orderAttachment");
const orderWithdrawalAccept = require("../orderHandlers/orderWithdrawalAccept");
const orderWithdrawalReject = require("../orderHandlers/orderWithdrawalReject");
const orderSection202Crpc = require("../orderHandlers/orderSection202crpc");
const orderAcceptExtension = require("../orderHandlers/orderAcceptExtension");
const orderRejectExtension = require("../orderHandlers/orderRejectExtension");
const orderAcceptanceRejectionDca = require("../orderHandlers/orderAcceptanceRejectionDca");
const orderSetTermsOfBail = require("../orderHandlers/orderSetTermsOfBail");
const orderAdmitCase = require("../orderHandlers/orderAdmitCase");
const orderDismissCase = require("../orderHandlers/orderDismissCase");
const orderApprovalRejectionLitigantDetails = require("../orderHandlers/orderApprovalRejectionLitigantDetails");
const orderChangeAdvocate = require("../orderHandlers/orderChangeAdvocate");
const newOrderGeneric = require("../orderHandlers/newOrderGeneric");

const OrderPreviewOrderTypeMap = {
  MANDATORY_SUBMISSIONS_RESPONSES: "mandatory-async-submissions-responses",
  ASSIGNING_DATE_RESCHEDULED_HEARING: "new-hearing-date-after-rescheduling",
  SCHEDULE_OF_HEARING_DATE: "schedule-hearing-date",
  SUMMONS: "summons-issue",
  NOTICE: "order-notice",
  INITIATING_RESCHEDULING_OF_HEARING_DATE: "accept-reschedule-request",
  OTHERS: "order-generic",
  REFERRAL_CASE_TO_ADR: "order-referral-case-adr",
  EXTENSION_DEADLINE_ACCEPT: "order-for-extension-deadline",
  EXTENSION_DEADLINE_REJECT: "order-reject-application-submission-deadline",
  SCHEDULING_NEXT_HEARING: "schedule-hearing-date",
  RESCHEDULE_OF_HEARING_DATE: "new-hearing-date-after-rescheduling",
  REJECTION_RESCHEDULE_REQUEST: "order-for-rejection-rescheduling-request",
  ASSIGNING_NEW_HEARING_DATE: "order-generic",
  CASE_TRANSFER_ACCEPT: "order-case-transfer",
  CASE_TRANSFER_REJECT: "order-case-transfer",
  SETTLEMENT: "order-case-settlement-acceptance",
  SETTLEMENT_REJECT: "order-case-settlement-rejected",
  SETTLEMENT_ACCEPT: "order-case-settlement-acceptance",
  BAIL_APPROVED: "order-bail-acceptance",
  BAIL_REJECT: "order-bail-rejection",
  WARRANT: "order-warrant",
  PROCLAMATION: "order-proclamation",
  ATTACHMENT: "order-attachment",
  WITHDRAWAL_ACCEPT: "order-case-withdrawal-acceptance",
  WITHDRAWAL_REJECT: "order-case-withdrawal-rejected",
  APPROVE_VOLUNTARY_SUBMISSIONS: "order-accept-voluntary",
  REJECT_VOLUNTARY_SUBMISSIONS: "order-reject-voluntary",
  JUDGEMENT: "order-generic",
  SECTION_202_CRPC: "order-202-crpc",
  CHECKOUT_ACCEPTANCE: "order-accept-checkout-request",
  CHECKOUT_REJECT: "order-reject-checkout-request",
  ACCEPTANCE_REJECTION_DCA: "order-acceptance-rejection-dca",
  SET_BAIL_TERMS: "order-set-terms-of-bail",
  REJECT_BAIL: "order-bail-rejection",
  ACCEPT_BAIL: "order-bail-acceptance",
  TAKE_COGNIZANCE: "order-admit-case",
  DISMISS_CASE: "order-dismiss-case",
  APPROVAL_REJECTION_LITIGANT_DETAILS_CHANGE:
    "order-approval-rejection-litigant-details",
  ADVOCATE_REPLACEMENT_APPROVAL: "order-replace-advocate",
};

const orderPDFMap = {
  BAIL: {
    APPROVED: "BAIL_APPROVED",
    REJECTED: "BAIL_REJECT",
  },
  BAILREQUEST: {
    APPROVED: "ACCEPT_BAIL",
    REJECTED: "REJECT_BAIL",
    SET_TERM_BAIL: "SET_BAIL_TERMS",
  },
  SETTLEMENT: {
    APPROVED: "SETTLEMENT_ACCEPT",
    REJECTED: "SETTLEMENT_REJECT",
  },
  EXTENSION_OF_DOCUMENT_SUBMISSION_DATE: {
    APPROVED: "EXTENSION_DEADLINE_ACCEPT",
    REJECTED: "EXTENSION_DEADLINE_REJECT",
  },
};

const applicationStatusType = (type) => {
  switch (type) {
    case "APPROVED":
      return "APPROVED";
    case "SET_TERM_BAIL":
      return "SET_TERM_BAIL";
    default:
      return "REJECTED";
  }
};

async function processOrder(
  req,
  res,
  qrCode,
  order,
  orderPreviewKey,
  courtCaseJudgeDetails,
  compositeOrder = false
) {
  switch (orderPreviewKey.toLowerCase()) {
    case "new-hearing-date-after-rescheduling":
      return await newHearingDateAfterReschedule(
        req,
        res,
        qrCode,
        order,
        compositeOrder,
        courtCaseJudgeDetails
      );
    case "schedule-hearing-date":
      return await scheduleHearingDate(
        req,
        res,
        qrCode,
        order,
        compositeOrder,
        courtCaseJudgeDetails
      );
    case "accept-reschedule-request":
      return await acceptReschedulingRequest(
        req,
        res,
        qrCode,
        order,
        compositeOrder,
        courtCaseJudgeDetails
      );
    case "mandatory-async-submissions-responses":
      return await mandatoryAsyncSubmissionsResponses(
        req,
        res,
        qrCode,
        order,
        compositeOrder,
        courtCaseJudgeDetails
      );
    case "order-referral-case-adr":
      return await adrCaseReferral(
        req,
        res,
        qrCode,
        order,
        compositeOrder,
        courtCaseJudgeDetails
      );
    case "order-case-settlement-rejected":
      return await caseSettlementRejection(
        req,
        res,
        qrCode,
        order,
        compositeOrder,
        courtCaseJudgeDetails
      );
    case "order-for-extension-deadline":
      return await orderAcceptExtension(
        req,
        res,
        qrCode,
        order,
        compositeOrder,
        courtCaseJudgeDetails
      );
    case "order-reject-application-submission-deadline":
      return await orderRejectExtension(
        req,
        res,
        qrCode,
        order,
        compositeOrder,
        courtCaseJudgeDetails
      );
    case "order-case-settlement-acceptance":
      return await caseSettlementAcceptance(
        req,
        res,
        qrCode,
        order,
        compositeOrder,
        courtCaseJudgeDetails
      );
    case "order-case-transfer":
      return await caseTransfer(
        req,
        res,
        qrCode,
        order,
        compositeOrder,
        courtCaseJudgeDetails
      );
    case "summons-issue":
      return await summonsIssue(
        req,
        res,
        qrCode,
        order,
        compositeOrder,
        courtCaseJudgeDetails
      );
    case "order-generic":
      return await orderGeneric(
        req,
        res,
        qrCode,
        order,
        compositeOrder,
        courtCaseJudgeDetails
      );
    case "order-bail-acceptance":
      return await orderBailAcceptance(
        req,
        res,
        qrCode,
        order,
        compositeOrder,
        courtCaseJudgeDetails
      );
    case "order-bail-rejection":
      return await orderBailRejection(
        req,
        res,
        qrCode,
        order,
        compositeOrder,
        courtCaseJudgeDetails
      );
    case "order-for-rejection-rescheduling-request":
      return await orderForRejectionReschedulingRequest(
        req,
        res,
        qrCode,
        order,
        compositeOrder,
        courtCaseJudgeDetails
      );
    case "order-accept-voluntary":
      return await orderAcceptVoluntary(
        req,
        res,
        qrCode,
        order,
        compositeOrder,
        courtCaseJudgeDetails
      );
    case "order-reject-voluntary":
      return await orderRejectVoluntary(
        req,
        res,
        qrCode,
        order,
        compositeOrder,
        courtCaseJudgeDetails
      );
    case "order-accept-checkout-request":
      return await orderAcceptCheckout(
        req,
        res,
        qrCode,
        order,
        compositeOrder,
        courtCaseJudgeDetails
      );
    case "order-reject-checkout-request":
      return await orderRejectCheckout(
        req,
        res,
        qrCode,
        order,
        compositeOrder,
        courtCaseJudgeDetails
      );
    case "order-notice":
      return await orderNotice(
        req,
        res,
        qrCode,
        order,
        compositeOrder,
        courtCaseJudgeDetails
      );
    case "order-warrant":
      return await orderWarrant(
        req,
        res,
        qrCode,
        order,
        compositeOrder,
        courtCaseJudgeDetails
      );
    case "order-proclamation":
      return await orderProclamation(
        req,
        res,
        qrCode,
        order,
        compositeOrder,
        courtCaseJudgeDetails
      );
    case "order-attachment":
      return await orderAttachment(
        req,
        res,
        qrCode,
        order,
        compositeOrder,
        courtCaseJudgeDetails
      );
    case "order-case-withdrawal-acceptance":
      return await orderWithdrawalAccept(
        req,
        res,
        qrCode,
        order,
        compositeOrder,
        courtCaseJudgeDetails
      );
    case "order-case-withdrawal-rejected":
      return await orderWithdrawalReject(
        req,
        res,
        qrCode,
        order,
        compositeOrder,
        courtCaseJudgeDetails
      );
    case "order-202-crpc":
      return await orderSection202Crpc(
        req,
        res,
        qrCode,
        order,
        compositeOrder,
        courtCaseJudgeDetails
      );
    case "order-acceptance-rejection-dca":
      return await orderAcceptanceRejectionDca(
        req,
        res,
        qrCode,
        order,
        compositeOrder,
        courtCaseJudgeDetails
      );
    case "order-set-terms-of-bail":
      return await orderSetTermsOfBail(
        req,
        res,
        qrCode,
        order,
        compositeOrder,
        courtCaseJudgeDetails
      );
    case "order-admit-case":
      return await orderAdmitCase(
        req,
        res,
        qrCode,
        order,
        compositeOrder,
        courtCaseJudgeDetails
      );
    case "order-dismiss-case":
      return await orderDismissCase(
        req,
        res,
        qrCode,
        order,
        compositeOrder,
        courtCaseJudgeDetails
      );
    case "order-approval-rejection-litigant-details":
      return await orderApprovalRejectionLitigantDetails(
        req,
        res,
        qrCode,
        order,
        compositeOrder,
        courtCaseJudgeDetails
      );
    case "order-replace-advocate":
      return await orderChangeAdvocate(
        req,
        res,
        qrCode,
        order,
        compositeOrder,
        courtCaseJudgeDetails
      );
    case "new-order-generic":
      return await newOrderGeneric(
        req,
        res,
        qrCode,
        order,
        courtCaseJudgeDetails
      );
    default:
      return await orderGeneric(
        req,
        res,
        qrCode,
        order,
        compositeOrder,
        courtCaseJudgeDetails
      );
  }
}

async function handleCompositePDF(
  req,
  res,
  qrCode,
  order,
  courtCaseJudgeDetails
) {
  try {
    if (
      !order ||
      !Array.isArray(order.compositeItems) ||
      order.compositeItems.length === 0
    ) {
      return renderError(res, "No valid orders provided", 400);
    }
    const pdfDocs = [];

    for (const item of order.compositeItems) {
      const newOrder = {
        ...order,
        orderType: item.orderType,
        additionalDetails: item.orderSchema.additionalDetails,
        orderDetails: item.orderSchema.orderDetails,
      };
      const applicationStatus = applicationStatusType(
        newOrder?.additionalDetails?.applicationStatus
      );
      const orderType = newOrder?.orderType;
      const orderPreviewKey =
        OrderPreviewOrderTypeMap[
          orderPDFMap?.[orderType]?.[applicationStatus] || orderType
        ];
      const pdfResponseData = await processOrder(
        req,
        res,
        qrCode,
        newOrder,
        orderPreviewKey,
        courtCaseJudgeDetails,
        true
      );
      if (!pdfResponseData) {
        return renderError(
          res,
          "Failed to generate PDF for one of the orders.",
          500
        );
      }
      pdfDocs.push(pdfResponseData);
    }

    if (pdfDocs.length === 0) {
      return renderError(res, "No valid PDFs were generated", 500);
    }

    // Merge PDF buffers
    const mergedPdf = await mergePdfs(pdfDocs);

    // Set response headers and send merged PDF
    const filename = `composite_${Date.now()}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.end(mergedPdf);
  } catch (error) {
    return renderError(res, "Failed to generate composite PDF", 500, error);
  }
}

module.exports = {
  OrderPreviewOrderTypeMap,
  orderPDFMap,
  applicationStatusType,
  processOrder,
  handleCompositePDF,
};
