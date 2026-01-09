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

async function mandatoryAsyncSubmissionsResponses(
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

    let year;
    if (typeof courtCase.filingDate === "string") {
      year = courtCase.filingDate.slice(-4);
    } else if (courtCase.filingDate instanceof Date) {
      year = courtCase.filingDate.getFullYear();
    } else if (typeof courtCase.filingDate === "number") {
      // Assuming the number is in milliseconds (epoch time)
      year = new Date(courtCase.filingDate).getFullYear();
    } else {
      return renderError(res, "Invalid filingDate format", 500);
    }
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const currentDate = new Date();
    const day = currentDate.getDate();
    const month = months[currentDate.getMonth()];
    const formattedToday = formatDate(currentDate, "DD-MM-YYYY");
    const ifResponse = order?.orderDetails?.isResponseRequired?.code
      ? "Yes"
      : "No";
    const documentList = order?.orderDetails?.documentType?.value || "";
    const partiesToRespond =
      order?.orderDetails?.partyDetails?.partiesToRespond || [];
    const partyToMakeSubmission =
      order?.orderDetails?.partyDetails?.partyToMakeSubmission || [];
    const evidenceSubmissionDeadline = order?.orderDetails?.dates
      ?.submissionDeadlineDate
      ? formatDate(
          new Date(order?.orderDetails?.dates?.submissionDeadlineDate),
          "DD-MM-YYYY"
        )
      : "";

    const responseSubmissionDeadline = order?.orderDetails?.dates
      ?.responseDeadlineDate
      ? formatDate(
          new Date(order?.orderDetails?.dates?.responseDeadlineDate),
          "DD-MM-YYYY"
        )
      : "";
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
          caseNumber: caseNumber,
          year: year,
          caseName: courtCase.caseTitle,
          parties: partyToMakeSubmission?.join(", "),
          documentList: documentList,
          evidenceSubmissionDeadline,
          ifResponse,
          responseSubmissionDeadline,
          additionalComments:
            order?.additionalDetails?.formdata?.additionalComments?.text || "",
          Date: formattedToday,
          day: day,
          Month: month,
          Year: year,
          judgeName: judgeDetails.name,
          judgeSignature: judgeDetails.judgeSignature,
          designation: judgeDetails.designation,
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
        ? config.pdf.mandatory_async_submissions_responses_qr
        : config.pdf.mandatory_async_submissions_responses;

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
      "Failed to generate PDF of order for Mandatory Async Submissions and Responses"
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
    console.error(ex);
    return renderError(
      res,
      "Failed to generate PDF for order for mandatory async submission",
      500,
      ex
    );
  }
}

module.exports = mandatoryAsyncSubmissionsResponses;
