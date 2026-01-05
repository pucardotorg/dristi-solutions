const cheerio = require("cheerio");
const config = require("../config");
const {
  search_case,
  search_sunbirdrc_credential_service,
  create_pdf,
  search_evidence_v2,
} = require("../api");
const { renderError } = require("../utils/renderError");
const {
  getPartyType,
  getCourtAndJudgeDetails,
} = require("../utils/commonUtils");
const { htmlToFormattedText } = require("../utils/htmlToFormattedText");

function getOrdinalSuffix(day) {
  if (day > 3 && day < 21) return "th"; // 11th, 12th, 13th, etc.
  switch (day % 10) {
    case 1:
      return "st"; // 1st, 21st, 31st
    case 2:
      return "nd"; // 2nd, 22nd
    case 3:
      return "rd"; // 3rd, 23rd
    default:
      return "th"; // 4th, 5th, 6th, etc.
  }
}

const witnessDeposition = async (req, res, qrCode) => {
  const cnrNumber = req.query.cnrNumber;
  const filingNumber = req.query.filingNumber;
  const artifactNumber = req.query.artifactNumber;
  const tenantId = req.query.tenantId;
  const entityId = req.query.entityId;
  const code = req.query.code;
  const courtId = req.query.courtId;
  const requestInfo = req.body.RequestInfo;

  const missingFields = [];
  if (!cnrNumber) missingFields.push("cnrNumber");
  if (!filingNumber) missingFields.push("filingNumber");
  if (!artifactNumber) missingFields.push("artifactNumber");
  if (!tenantId) missingFields.push("tenantId");
  if (!courtId) missingFields.push("courtId");
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

  const courtCaseJudgeDetails = await getCourtAndJudgeDetails(
    res,
    tenantId,
    "Judge",
    courtId,
    requestInfo
  );

  // Function to handle API calls
  const handleApiCall = async (apiCall, errorMessage) => {
    try {
      return await apiCall();
    } catch (ex) {
      renderError(res, `${errorMessage}`, 500, ex);
      throw ex; // Ensure the function stops on error
    }
  };
  // Search for case details
  try {
    const evidenceResponse = await handleApiCall(
      () =>
        search_evidence_v2(
          tenantId,
          requestInfo,
          {
            courtId,
            cnrNumber,
            filingNumber,
            tenantId,
            filingType: "CASE_FILING",
            artifactNumber,
          },
          {}
        ),
      "Failed to query evidence service"
    );

    const witnessEvidence = evidenceResponse?.data?.artifacts[0];

    const resCase = await handleApiCall(
      () => search_case(cnrNumber, tenantId, requestInfo, courtId),
      "Failed to query case service"
    );
    const courtCase = resCase?.data?.criteria[0]?.responseList[0];
    if (!courtCase) {
      return renderError(res, "Court case not found", 404);
    }

    const partyName = getPartyType(witnessEvidence?.tag);
    const mdmsCourtRoom = courtCaseJudgeDetails.mdmsCourtRoom;

    // Handle QR code if enabled
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
    const year = currentDate.getFullYear();

    const ordinalSuffix = getOrdinalSuffix(day);
    const caseNumber =
      (courtCase?.isLPRCase
        ? courtCase?.lprNumber
        : courtCase?.courtCaseNumber) ||
      courtCase?.courtCaseNumber ||
      courtCase?.cmpNumber ||
      "";
    const witnessDepositionText = htmlToFormattedText(
      witnessEvidence?.description || ""
    );
    const data = {
      Data: [
        {
          courtComplex: mdmsCourtRoom.name,
          caseNumber: caseNumber,
          witnessType: witnessEvidence.tag,
          partyName,
          witnessName: witnessEvidence.additionalDetails.witnessDetails.name,
          witnessFatherName: "",
          witnessAddress:
            witnessEvidence.additionalDetails.witnessDetails.address,
          witnessDesignation:
            witnessEvidence.additionalDetails.witnessDetails.designation,
          witnessAge: witnessEvidence.additionalDetails.witnessDetails.age,
          day: day + ordinalSuffix,
          month: month,
          year: year,
          depositionType: "",
          witnessDeposition: witnessDepositionText,
          witnessPlaceholder: "Deponent",
          judgePlaceholder: "Judicial Magistrate of First Class",
          qrCodeUrl: base64Url,
          designation:
            witnessEvidence.additionalDetails.witnessDetails.designation,
        },
      ],
    };
    const pdfKey =
      qrCode === "true"
        ? config.pdf.new_witness_deposition_qr
        : config.pdf.new_witness_deposition;
    const pdfResponse = await handleApiCall(
      () => create_pdf(tenantId, pdfKey, data, req.body),
      "Failed to generate PDF of Application Bail Bond"
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
      "Failed to create PDF for Application for Bail",
      500,
      ex
    );
  }
};

module.exports = witnessDeposition;
