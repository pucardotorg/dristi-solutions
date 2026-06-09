const cheerio = require("cheerio");
const config = require("../config");
const {
  search_case,
  search_sunbirdrc_credential_service,
  create_pdf,
  search_digitalizedDocuments,
} = require("../api");
const { renderError } = require("../utils/renderError");
const { formatDate } = require("../applicationHandlers/formatDate");

const digitisationOfPlea = async (req, res, courtCaseJudgeDetails, qrCode) => {
  const { cnrNumber, tenantId, entityId, code, documentNumber } = req.query;
  const requestInfo = req.body?.RequestInfo;
  const courtId = req.query?.courtId || requestInfo?.courtId;
  
  const missingFields = [];
  if (!cnrNumber) missingFields.push("cnrNumber");
  if (!documentNumber) missingFields.push("documentNumber");
  if (!tenantId) missingFields.push("tenantId");
  if (!requestInfo) missingFields.push("requestInfo");
  if (!courtId) missingFields.push("courtId");
  if (qrCode === "true" && (!entityId || !code)) missingFields.push("entityId and code");
  if (missingFields.length > 0) {
    return renderError(
      res,
      `${missingFields.join(", ")} are mandatory to generate the PDF`,
      400
    );
  }

  // Function to handle API calls
  const handleApiCall = async (apiCall, errorMessage) => {
    try {
      return await apiCall();
    } catch (ex) {
      renderError(res, `${errorMessage}`, 500, ex);
      throw ex; // Ensure the function stops on error
    }
  };

  try {
    const resCase = await handleApiCall(
      () => search_case(cnrNumber, tenantId, requestInfo, courtId),

      "Failed to query case service"
    );
    const resDigitisation = await handleApiCall(
      () =>
        search_digitalizedDocuments(
          tenantId,
          requestInfo,
          {
            documentNumber: documentNumber,
            tenantId: tenantId,
            courtId: courtId,
          }
        ),
      "Failed to query digitisation service"
    );

    const digitisationRecord =
      resDigitisation?.data?.digitalizedDocuments?.[0] ||
      resDigitisation?.data?.documents?.[0] ||
      resDigitisation?.data || {};

    const pleaDetails = digitisationRecord?.pleaDetails || {};
    const courtCase = resCase?.data?.criteria?.[0]?.responseList?.[0];

    if (!courtCase) {
      return renderError(
        res,
        "No case details found for the provided inputs (cnrNumber/tenantId)",
        400
      );
    }

    const mdmsCourtRoom = courtCaseJudgeDetails?.mdmsCourtRoom;

    let base64Url = "";
    if (qrCode === "true") {
      const resCredential = await handleApiCall(
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
      caseYear = new Date(courtCase.filingDate).getFullYear();
    } else {
      return renderError(res, "Invalid filingDate format", 500);
    }
    const currentDate = new Date();
    const formattedToday = formatDate(currentDate, "DD-MM-YYYY");
    const caseNumber = courtCase?.isLPRCase
      ? courtCase?.lprNumber
      : courtCase?.courtCaseNumber || courtCase?.cmpNumber || "";

    const place = mdmsCourtRoom?.place || digitisationRecord?.place || "";
    const state = mdmsCourtRoom?.state || digitisationRecord?.state || "";
    const data = {
      Data: [
        {
          courtName: mdmsCourtRoom?.courtName || digitisationRecord?.courtName || "",
          caseType: "Negotiable Instruments Act 138A",
          place,
          state,
          caseNumber,
          caseYear,
          accusedName: pleaDetails?.accusedName || "",
          fatherName: pleaDetails?.fatherName || "",
          villageName: pleaDetails?.village || "",
          taluk: pleaDetails?.taluk || "",
          calling: pleaDetails?.calling || "",
          age: pleaDetails?.age || "",
          date: formattedToday,
          ques1Yes: pleaDetails?.isChargesUnderstood === true,
          ques1No: pleaDetails?.isChargesUnderstood === false,
          ques2Yes: pleaDetails?.pleadGuilty === true,
          ques2No: pleaDetails?.pleadGuilty === false,
          judgeRemarks: pleaDetails?.magistrateRemarks || "",
          accusedSignature: "Signature of Accused",
          judgeSignature: "Signature of Magistrate",
          qrCodeUrl: base64Url,
        },
      ],
    };

    // Generate the PDF
    const pdfKey =
      qrCode === "true"
        ? config.pdf.digitisation_plea
        : config.pdf.digitisation_plea;
    const pdfResponse = await handleApiCall(
      () => create_pdf(tenantId, pdfKey, data, req.body),
      "Failed to generate PDF of Digitisation of Plea"
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
      "Failed to get query details of Digitisation of Plea",
      500,
      ex
    );
  }
};

module.exports = digitisationOfPlea;
