const cheerio = require("cheerio");
const config = require("../config");
const {
  search_case,
  search_sunbirdrc_credential_service,
  search_application,
  create_pdf,
  create_pdf_v2,
} = require("../api");
const { renderError } = require("../utils/renderError");
const { formatDate } = require("./formatDate");
const { handleApiCall } = require("../utils/handleApiCall");

async function orderAcceptanceRejectionDca(
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

    const resApplication = await handleApiCall(
      res,
      () =>
        search_application(
          tenantId,
          order?.additionalDetails?.formdata?.refApplicationId,
          requestInfo,
          order?.courtId
        ),
      "Failed to query application service"
    );
    const application = resApplication?.data?.applicationList[0];
    if (!application) {
      return renderError(res, "Application not found", 404);
    }

    const partyName = application?.additionalDetails?.onBehalOfName || "";

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

    let caseYear;
    if (typeof courtCase.filingDate === "string") {
      caseYear = courtCase.filingDate.slice(-4);
    } else if (courtCase.filingDate instanceof Date) {
      caseYear = courtCase.filingDate.getFullYear();
    } else if (typeof courtCase.filingDate === "number") {
      // Assuming the number is in milliseconds (epoch time)
      caseYear = new Date(courtCase.filingDate).getFullYear();
    } else {
      return renderError(res, "Invalid filingDate format", 500);
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
          cmpNumber: courtCase.cmpNumber,
          caseNumber: caseNumber,
          caseYear: caseYear,
          caseName: courtCase.caseTitle,
          date: formattedToday,
          partyName: partyName,
          reasonForDelayCondonation: order?.orderDetails?.reasonForSeekingDca,
          response: order?.orderDetails?.isDcaAcceptedOrRejected?.toLowerCase(),
          responseReason:
            order?.orderDetails?.reasonForAcceptanceOrRejectionDca || "",
          additionalComments: order?.orderDetails?.additionalCommentsDca || "",
          judgeSignature: judgeDetails.judgeSignature,
          judgeName: judgeDetails.name,
          judgeDesignation: judgeDetails.judgeDesignation,
          qrCodeUrl: base64Url,
        },
      ],
    };
    const pdfKey =
      qrCode === "true"
        ? config.pdf.order_acceptance_rejection_dca_qr
        : config.pdf.order_acceptance_rejection_dca;

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
      "Failed to generate PDF of Order for Acceptance Rejection of DCA"
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
      "Failed to generate PDF for Acceptance of Bail",
      500,
      ex
    );
  }
}

module.exports = orderAcceptanceRejectionDca;
