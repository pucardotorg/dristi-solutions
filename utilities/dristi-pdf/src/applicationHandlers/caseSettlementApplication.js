const cheerio = require("cheerio");
const config = require("../config");
const {
  search_case,
  search_sunbirdrc_credential_service,
  create_pdf,
  search_advocate,
} = require("../api");
const { renderError } = require("../utils/renderError");
const { cleanName } = require("./cleanName");

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

function extractYear(date) {
  if (typeof date === "string") {
    return date.slice(-4); // Extract the year from the string
  } else if (date instanceof Date) {
    return date.getFullYear(); // Extract the year from a Date object
  } else if (typeof date === "number") {
    return new Date(date).getFullYear(); // Convert epoch time to Date and extract the year
  } else {
    return null; // Invalid date format
  }
}

async function caseSettlementApplication(
  req,
  res,
  qrCode,
  application,
  courtCaseJudgeDetails
) {
  const cnrNumber = req.query.cnrNumber;
  const applicationNumber = req.query.applicationNumber;
  const tenantId = req.query.tenantId;
  const entityId = req.query.entityId;
  const code = req.query.code;
  const requestInfo = req.body.RequestInfo;

  const missingFields = [];
  if (!cnrNumber) missingFields.push("cnrNumber");
  if (!applicationNumber) missingFields.push("applicationNumber");
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
    // Search for case details
    const resCase = await handleApiCall(
      () => search_case(cnrNumber, tenantId, requestInfo, application?.courtId),
      "Failed to query case service"
    );
    const courtCase = resCase?.data?.criteria[0]?.responseList[0];
    if (!courtCase) {
      return renderError(res, "Court case not found", 404);
    }

    const mdmsCourtRoom = courtCaseJudgeDetails.mdmsCourtRoom;

    let barRegistrationNumber = "";
    let advocateName = "";
    const advocateIndividualId =
      application?.applicationDetails?.advocateIndividualId;
    if (advocateIndividualId) {
      const resAdvocate = await handleApiCall(
        () => search_advocate(tenantId, advocateIndividualId, requestInfo),
        "Failed to query Advocate Details"
      );
      const advocateData = resAdvocate?.data?.advocates?.[0];
      const advocateDetails = advocateData?.responseList?.find(
        (item) => item.isActive === true
      );
      barRegistrationNumber = advocateDetails?.barRegistrationNumber || "";
      advocateName =
        cleanName(advocateDetails?.additionalDetails?.username) || "";
    }

    const onBehalfOfuuid = application?.onBehalfOf?.[0];
    const partyName = application?.additionalDetails?.onBehalOfName || "";
    const onBehalfOfLitigent = courtCase?.litigants?.find(
      (item) => item.additionalDetails.uuid === onBehalfOfuuid
    );
    let partyType = "COURT";
    if (onBehalfOfLitigent?.partyType?.toLowerCase()?.includes("complainant")) {
      partyType = "COMPLAINANT";
    }
    if (onBehalfOfLitigent?.partyType?.toLowerCase()?.includes("respondent")) {
      partyType = "ACCUSED";
    }
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

    let caseYear = extractYear(courtCase.filingDate);
    if (!caseYear) {
      return renderError(res, "Invalid filingDate format", 500);
    }

    let applicationYear = extractYear(application?.createdDate);
    if (!applicationYear) {
      return renderError(res, "Invalid applicationDate format", 500);
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
    // const applicationNameMap = {
    //   BAIL_BOND: "Bail Application - Personal Bail Bond",
    //   SURETY: "Bail Application - In Person Surety",
    //   CHECKOUT_REQUEST: "Checkout Application",
    //   SETTLEMENT: "Case Settlement Application",
    //   TRANSFER: "Case Transfer Application",
    //   WITHDRAWAL: "Case Withdrawal",
    //   PRODUCTION_DOCUMENTS:
    //     "Application for production of documents or evidence",
    //   EXTENSION_SUBMISSION_DEADLINE: "Application for Extension of Submission",
    //   "": "General Application",
    //   undefined: "General Application",
    // };

    const currentDate = new Date();
    // const formattedToday = formatDate(currentDate, "DD-MM-YYYY");
    const day = currentDate.getDate();
    const month = months[currentDate.getMonth()];
    const year = currentDate.getFullYear();

    const ordinalSuffix = getOrdinalSuffix(day);
    const additionalComments =
      application?.applicationDetails?.additionalComments || "";
    const caseNumber = courtCase?.courtCaseNumber || courtCase?.cmpNumber || "";
    const prayer = application?.applicationDetails?.prayer || "";
    const data = {
      Data: [
        {
          courtName: mdmsCourtRoom.name,
          caseType: "Negotiable Instruments Act 138 A",
          caseNumber: caseNumber,
          caseYear: caseYear,
          caseName: courtCase.caseTitle,
          applicationNumber: applicationNumber,
          applicationYear: applicationYear,
          partyName: partyName,
          partyType: partyType,
          dateOfSettlementAggrement: applicationYear, // missing from the form
          specifyMechanism: "", // nmissing from the form
          settlementStatus: "", // missing from the form
          additionalComments: additionalComments,
          location: mdmsCourtRoom.state,
          day: day + ordinalSuffix,
          month: month,
          year: year,
          prayer,
          advocateSignature: "Advocate Signature",
          advocateName: advocateName,
          barRegistrationNumber: barRegistrationNumber,
          qrCodeUrl: base64Url,
        },
      ],
    };

    // Generate the PDF
    const pdfKey =
      qrCode === "true"
        ? config.pdf.case_settlement_application_qr
        : config.pdf.case_settlement_application;
    const pdfResponse = await handleApiCall(
      () => create_pdf(tenantId, pdfKey, data, req.body),
      "Failed to generate PDF of case Settlement Application"
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
      "Failed to query details of case Settlement Application",
      500,
      ex
    );
  }
}

module.exports = caseSettlementApplication;
