const cheerio = require("cheerio");
const config = require("../config");
const {
  search_case,
  search_mdms,
  search_sunbirdrc_credential_service,
  create_pdf,
  create_pdf_v2,
} = require("../api");
const { renderError } = require("../utils/renderError");
const { formatDate } = require("./formatDate");
const { handleApiCall } = require("../utils/handleApiCall");

async function adrCaseReferral(
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

    const resADR = await handleApiCall(
      res,
      () =>
        search_mdms(
          order?.orderDetails?.adrMode,
          "Order.ADRMode",
          tenantId,
          requestInfo
        ),
      "Failed to query MDMS service for court room"
    );
    const adr = resADR?.data?.mdms[0]?.data;

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
    const additionalComments =
      order?.additionalDetails?.formdata?.comments?.text || "";
    const modeOfAdr = adr?.name || "";
    const caseNumber = courtCase?.courtCaseNumber || courtCase?.cmpNumber || "";
    const data = {
      Data: [
        {
          courtName: mdmsCourtRoom.name,
          place: mdmsCourtRoom.place,
          state: mdmsCourtRoom.state,
          caseName: courtCase.caseTitle,
          caseNumber: caseNumber,
          caseYear: caseYear,
          modeOfAdr: modeOfAdr,
          additionalComments: additionalComments,
          date: formattedToday,
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
        ? config.pdf.adr_case_referral_qr
        : config.pdf.adr_case_referral;

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
      "Failed to generate PDF of order for Referral of Case to ADR"
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
      "Failed to query details of order for Referral of Case to ADR",
      500,
      ex
    );
  }
}

module.exports = adrCaseReferral;
