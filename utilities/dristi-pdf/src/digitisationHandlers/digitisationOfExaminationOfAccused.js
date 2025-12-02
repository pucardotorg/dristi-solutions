const cheerio = require("cheerio");
const config = require("../config");
const {
  search_case,
  search_sunbirdrc_credential_service,
  create_pdf,
  search_digitisation,
} = require("../api");
const { renderError } = require("../utils/renderError");

const digitisationOfExaminationOfAccused = async (
  req,
  res,
  courtCaseJudgeDetails,
  qrCode
) => {
  const cnrNumber = req.query.cnrNumber;
  const tenantId = req.query.tenantId;
  const entityId = req.query.entityId;
  const code = req.query.code;
  const requestInfo = req.body.RequestInfo;
  const documentNumber = req.query.documentNumber;

  const missingFields = [];
  if (!cnrNumber) missingFields.push("cnrNumber");
  if (!documentNumber) missingFields.push("documentNumber");
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
      () => search_case(cnrNumber, tenantId, requestInfo, req.query.courtId),
      "Failed to query case service"
    );
   const resDigitisation = await handleApiCall(
      () => search_digitisation(tenantId, documentNumber, requestInfo),

      "Failed to query case service"
    );
    const place = resDigitisation?.place;

    const courtCase = resCase?.data?.criteria[0]?.responseList[0];
    if (!courtCase) {
      renderError(res, "Court case not found", 404);
    }

    const mdmsCourtRoom = courtCaseJudgeDetails.mdmsCourtRoom;

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
    const caseNumber = courtCase?.isLPRCase
      ? courtCase?.lprNumber
      : courtCase?.courtCaseNumber || courtCase?.cmpNumber || "";

    const data = {
      Data: [
        {
          courtName: mdmsCourtRoom.courtName,
          place: "",
          state: "",
          caseNumber: caseNumber || "",
          caseYear: caseYear || "",
          accusedName: "",
          textBody: [],
          caseType: "Negotiable Instruments Act 138A",
          accusedSignature: "Signature of Accused",
          judgeSignature: "Signature of Magistrate",
          qrCodeUrl: base64Url,
        },
      ],
    };

    // Generate the PDF
    const pdfKey =
      qrCode === "true" ? config.pdf.bail_bond_qr : config.pdf.bail_bond;
    const pdfResponse = await handleApiCall(
      () => create_pdf(tenantId, pdfKey, data, req.body),
      "Failed to generate PDF of Digitisation of Examination of Accused"
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
      "Failed to get query details of Digitisation of Examination of Accused",
      500,
      ex
    );
  }
};

module.exports = digitisationOfExaminationOfAccused;
