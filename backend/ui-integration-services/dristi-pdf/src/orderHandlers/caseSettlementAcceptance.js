const cheerio = require("cheerio");
const config = require("../config");
const {
  search_case,
  search_individual,
  search_sunbirdrc_credential_service,
  create_pdf,
  create_pdf_v2,
} = require("../api");
const { renderError } = require("../utils/renderError");
const { formatDate } = require("./formatDate");
const { handleApiCall } = require("../utils/handleApiCall");

async function caseSettlementAcceptance(
  req,
  res,
  qrCode,
  order,
  compositeOrder,
  courtCaseJudgeDetails
) {
  const cnrNumber = req.query.cnrNumber;
  const entityId = req.query.entityId;
  const code = req.query.code;
  const tenantId = req.query.tenantId;
  const requestInfo = req.body.RequestInfo;

  const missingFields = [];
  if (!cnrNumber) missingFields.push("cnrNumber");
  if (!tenantId) missingFields.push("tenantId");
  if (qrCode === "true" && (!entityId || !code))
    missingFields.push("entityId and code");
  if (requestInfo === undefined) missingFields.push("requestInfo");

  if (missingFields.length > 0) {
    return renderError(
      res,
      `${missingFields.join(", ")} are mandatory to generate the PDF`,
      400
    );
  }

  try {
    // Search for case details
    const resCase = await handleApiCall(
      res,
      () => search_case(cnrNumber, tenantId, requestInfo, order?.courtId),
      "Failed to query case service"
    );
    const courtCase = resCase?.data?.criteria[0]?.responseList[0];
    if (!courtCase) {
      renderError(res, "Court case not found", 404);
    }

    const mdmsCourtRoom = courtCaseJudgeDetails.mdmsCourtRoom;
    const judgeDetails = courtCaseJudgeDetails.judgeDetails;

    // Filter litigants to find the respondent.primary
    const respondentParty = courtCase.litigants.find(
      (party) => party.partyType === "respondent.primary"
    );
    if (!respondentParty) {
      return renderError(
        res,
        "No party with partyType 'respondent.primary' found",
        400
      );
    }
    // Search for individual details
    const resIndividual = await handleApiCall(
      res,
      () =>
        search_individual(tenantId, respondentParty.individualId, requestInfo),
      "Failed to query individual service using individualId"
    );
    const respondentIndividual = resIndividual?.data?.Individual[0];
    if (!respondentIndividual) {
      renderError(res, "Respondent individual not found", 404);
    }

    // Filter litigants to find the complaint.primary
    const complaintParty = courtCase.litigants.find(
      (party) => party.partyType === "complainant.primary"
    );
    if (!complaintParty) {
      return renderError(
        res,
        "No party with partyType 'complaint.primary' found",
        400
      );
    }
    // Search for individual details
    const resIndividual1 = await handleApiCall(
      res,
      () =>
        search_individual(tenantId, complaintParty.individualId, requestInfo),
      "Failed to query individual service using individualId"
    );
    const complaintIndividual = resIndividual1?.data?.Individual[0];
    if (!complaintIndividual) {
      renderError(res, "Complaint individual not found", 404);
    }

    // Handle QR code if enabled
    let base64Url = "";
    if (qrCode === "true") {
      const resCredential = await handleApiCall(
        res,
        () =>
          search_sunbirdrc_credential_service(
            tenantId,
            code,
            entityId,
            requestInfo
          ),
        "Failed to query sunbirdrc credential service"
      );
      const $ = cheerio.load(resCredential.data);
      const imgTag = $("img");
      if (imgTag.length === 0) {
        return renderError(
          res,
          "No img tag found in the sunbirdrc response",
          500
        );
      }
      base64Url = imgTag.attr("src");
    }

    const partyName = [
      complaintIndividual.name.givenName,
      complaintIndividual.name.otherNames,
      complaintIndividual.name.familyName,
    ]
      .filter(Boolean)
      .join(" ");
    const otherPartyName = [
      respondentIndividual.name.givenName,
      respondentIndividual.name.otherNames,
      respondentIndividual.name.familyName,
    ]
      .filter(Boolean)
      .join(" ");
    const dateOfSettlementAgreement = order.orderDetails.settlementDate
      ? formatDate(new Date(order.orderDetails.settlementDate), "DD-MM-YYYY")
      : "";
    const currentDate = new Date();
    const formattedToday = formatDate(currentDate, "DD-MM-YYYY");

    const specifyMechanism = order.orderDetails.settlementMechanism;
    const additionalComments =
      order?.additionalDetails?.formdata?.comments?.text || "";
    const settlementStatus =
      order.orderDetails.isSettlementImplemented === "ES_COMMON_YES"
        ? "Yes"
        : "No";

    const caseNumber =
      (courtCase?.isLPRCase
        ? courtCase?.lprNumber
        : courtCase?.courtCaseNumber) ||
      courtCase?.courtCaseNumber ||
      courtCase?.cmpNumber ||
      "";
    const data = {
      Data: [
        {
          courtName: mdmsCourtRoom.name,
          place: mdmsCourtRoom.place,
          state: mdmsCourtRoom.state,
          caseName: courtCase.caseTitle,
          caseNumber: caseNumber,
          partyName: partyName,
          otherPartyName: otherPartyName,
          date: formattedToday,
          dateOfSettlementAgreement: dateOfSettlementAgreement,
          specifyMechanism: specifyMechanism,
          settlementStatus: settlementStatus,
          additionalComments: additionalComments,
          judgeSignature: judgeDetails.judgeSignature,
          judgeName: judgeDetails.name,
          courtSeal: judgeDetails.courtSeal,
          qrCodeUrl: base64Url,
          orderHeading: mdmsCourtRoom.orderHeading,
          judgeDesignation: judgeDetails.judgeDesignation,
        },
      ],
    };

    // Generate the PDF
    const pdfKey =
      qrCode === "true"
        ? config.pdf.case_settlement_acceptance_qr
        : config.pdf.case_settlement_acceptance;

    if (compositeOrder) {
      const pdfResponse = await handleApiCall(
        res,
        () => create_pdf_v2(tenantId, pdfKey, data, req.body),
        "Failed to generate PDF of generic order"
      );
      return pdfResponse.data;
    }

    const pdfResponse = await handleApiCall(
      res,
      () => create_pdf(tenantId, pdfKey, data, req.body),
      "Failed to generate PDF of order to Settle a Case - Acceptance"
    );
    const filename = `${pdfKey}_${new Date().getTime()}`;
    res.writeHead(200, {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=${filename}.pdf`,
    });
    pdfResponse.data
      .pipe(res)
      .on("finish", () => {
        res.end();
      })
      .on("error", (err) => {
        return renderError(res, "Failed to send PDF response", 500, err);
      });
  } catch (ex) {
    return renderError(
      res,
      "Failed to query details of order to Settle a Case - Acceptance",
      500,
      ex
    );
  }
}

module.exports = caseSettlementAcceptance;
