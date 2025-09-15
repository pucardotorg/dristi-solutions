const cheerio = require("cheerio");
const config = require("../config");
const {
  search_case,
  search_order,
  search_sunbirdrc_credential_service,
  create_pdf,
  search_advocate,
} = require("../api");
const { renderError } = require("../utils/renderError");
const { formatDate } = require("./formatDate");
const { cleanName } = require("./cleanName");
const { extractOrderNumber } = require("../utils/extractOrderNumber");

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

async function applicationSubmissionExtension(
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
      renderError(res, "Court case not found", 404);
    }

    const mdmsCourtRoom = courtCaseJudgeDetails.mdmsCourtRoom;
    const judgeDetails = courtCaseJudgeDetails.judgeDetails;

    const refOrderNumber = extractOrderNumber(
      application?.additionalDetails?.formdata?.refOrderId
    );

    const resOrder = await handleApiCall(
      () =>
        search_order(
          tenantId,
          refOrderNumber,
          requestInfo,
          application?.courtId,
          true
        ),
      "Failed to query order service"
    );

    let order = resOrder?.data?.list[0];
    if (!order) {
      renderError(res, "Order not found", 404);
    }

    if (order.orderCategory === "COMPOSITE") {
      const itemDetails = order.compositeItems?.find(
        (item) => item.orderType === "MANDATORY_SUBMISSIONS_RESPONSES"
      );
      order = {
        ...order,
        orderType: itemDetails.orderType,
        additionalDetails: itemDetails.orderSchema.additionalDetails,
        orderDetails: itemDetails.orderSchema.orderDetails,
      };
    }

    const documentSubmissionName = order?.orderDetails?.documentName || "";
    const documentId = order?.orderDetails?.documentType?.value | "";

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

    const partyName = application?.additionalDetails?.onBehalOfName || "";
    const additionalComments =
      application?.applicationDetails?.additionalComments || "";
    const reasonForApplication =
      application?.applicationDetails?.reasonForApplication || "";

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

    const originalSubmissionDate = application?.applicationDetails
      ?.originalSubmissionDate
      ? formatDate(
          new Date(application?.applicationDetails?.originalSubmissionDate),
          "DD-MM-YYYY"
        )
      : "";
    const requestedExtensionDate = application?.applicationDetails
      ?.requestedExtensionDate
      ? formatDate(
          new Date(application?.applicationDetails?.requestedExtensionDate),
          "DD-MM-YYYY"
        )
      : "";
    const benefitOfExtension = application?.benefitOfExtension;
    const caseNumber = courtCase?.isLPRCase
      ? courtCase?.lprNumber
      : courtCase?.courtCaseNumber || courtCase?.cmpNumber || "";
    const prayer = application?.applicationDetails?.prayer;

    const data = {
      Data: [
        {
          courtComplex: mdmsCourtRoom.name,
          caseType: "Negotiable Instruments Act 138 A",
          caseNumber: caseNumber,
          caseYear: caseYear,
          caseName: courtCase.caseTitle,
          judgeName: judgeDetails.name,
          courtDesignation: judgeDetails.designation,
          addressOfTheCourt: mdmsCourtRoom.state,
          date: currentDate,
          partyName: partyName,
          advocateName: advocateName,
          documentSubmissionName,
          documentId,
          originalSubmissionDate: originalSubmissionDate,
          requestedSubmissionDate: requestedExtensionDate,
          extensionReason: reasonForApplication,
          day: day + ordinalSuffix,
          month: month,
          year: year,
          prayer,
          additionalComments: benefitOfExtension || additionalComments,
          advocateSignature: "Advocate Signature",
          barRegistrationNumber,
          qrCodeUrl: base64Url,
        },
      ],
    };

    // Generate the PDF
    const pdfKey =
      qrCode === "true"
        ? config.pdf.application_submission_extension_qr
        : config.pdf.application_submission_extension;
    const pdfResponse = await handleApiCall(
      () => create_pdf(tenantId, pdfKey, data, req.body),
      "Failed to generate PDF of APPLICATION FOR EXTENSION OF SUBMISSION DEADLINE"
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
      "Failed to generate pdf of APPLICATION FOR EXTENSION OF SUBMISSION DEADLINE",
      500,
      ex
    );
  }
}

module.exports = applicationSubmissionExtension;
