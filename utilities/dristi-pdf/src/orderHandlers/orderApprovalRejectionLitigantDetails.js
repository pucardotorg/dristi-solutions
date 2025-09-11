const cheerio = require("cheerio");
const config = require("../config");
const {
  search_case,
  search_sunbirdrc_credential_service,
  create_pdf,
  create_pdf_v2,
} = require("../api");
const { renderError } = require("../utils/renderError");
const { formatDate } = require("./formatDate");
const { handleApiCall } = require("../utils/handleApiCall");

async function orderApprovalRejectionLitigantDetails(
  req,
  res,
  qrCode,
  order,
  compositeOrder,
  courtCaseJudgeDetails
) {
  const cnrNumber = req.query.cnrNumber;
  const tenantId = req.query.tenantId;
  const entityId = req.query.entityId;
  const code = req.query.code;
  const requestInfo = req.body.RequestInfo;

  const missingFields = [];
  if (!cnrNumber) missingFields.push("cnrNumber");
  if (!tenantId) missingFields.push("tenantId");
  if (requestInfo === undefined) missingFields.push("requestInfo");
  if (qrCode === "true" && (!entityId || !code))
    missingFields.push("entityId and code");

  if (missingFields.length > 0) {
    return renderError(
      res,
      `${missingFields.join(", ")} are mandatory to generate the PDF`,
      400
    );
  }

  // Search for case details
  try {
    const resCase = await handleApiCall(
      res,
      () => search_case(cnrNumber, tenantId, requestInfo, order?.courtId),
      "Failed to query case service"
    );
    const courtCase = resCase?.data?.criteria[0]?.responseList[0];
    if (!courtCase) {
      return renderError(res, "Court case not found", 404);
    }

    const mdmsCourtRoom = courtCaseJudgeDetails.mdmsCourtRoom;
    const judgeDetails = courtCaseJudgeDetails.judgeDetails;

    const advocate =
      courtCase?.representatives?.find(
        (rep) =>
          rep?.additionalDetails?.uuid ===
          order?.additionalDetails?.applicantPartyUuid
      ) || {};

    const advComplainantName =
      advocate?.representing?.find(
        (litigant) =>
          litigant?.individualId === order?.additionalDetails?.uniqueId
      )?.additionalDetails?.fullName ||
      advocate?.representing
        ?.map((rep) => rep?.additionalDetails?.fullName)
        .join(", ");

    const complainantName =
      courtCase?.litigants?.find(
        (litigant) =>
          litigant?.additionalDetails?.uuid ===
          order?.additionalDetails?.applicantPartyUuid
      )?.additionalDetails?.fullName || "";

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

    const currentDate = new Date();

    const formattedToday = formatDate(currentDate, "DD-MM-YYYY");

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
          orderHeading: mdmsCourtRoom.orderHeading,
          caseNumber: caseNumber,
          caseName: courtCase.caseTitle,
          date: formattedToday,
          applicantName:
            advocate?.additionalDetails?.advocateName || complainantName,
          partyName:
            advocate?.additionalDetails?.advocateName && advComplainantName,
          dateOfApplication: formatDate(
            new Date(order?.additionalDetails?.dateOfApplication),
            "DD-MM-YYYY"
          ),
          reasonForChange:
            order?.orderDetails?.reasonForLitigantDetailsChange || "",
          applicationStatus:
            order?.orderDetails?.applicationGrantedRejected === "GRANTED"
              ? "Accepted"
              : "Rejected" || "",
          additionalComments:
            order?.orderDetails?.additionalCommentsLitigantsDetailChange || "",
          judgeSignature: judgeDetails.judgeSignature,
          judgeName: judgeDetails.name,
          judgeDesignation: judgeDetails.judgeDesignation,
          qrCodeUrl: base64Url,
        },
      ],
    };
    const pdfKey =
      qrCode === "true"
        ? config.pdf.order_approval_rejection_litigant_details_change_qr
        : config.pdf.order_approval_rejection_litigant_details_change;

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
      "Failed to generate PDF of Order For Approval Rejection Litigant Details Change"
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
    return renderError(res, "Failed to generate PDF of Order", 500, ex);
  }
}

module.exports = orderApprovalRejectionLitigantDetails;
