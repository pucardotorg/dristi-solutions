const cheerio = require("cheerio");
const config = require("../config");
const {
  search_case,
  search_mdms,
  search_hrms,
  search_sunbirdrc_credential_service,
  search_application,
  create_pdf,
  search_order,
} = require("../api");
const { renderError } = require("../utils/renderError");
const { getAdvocates } = require("../applicationHandlers/getAdvocates");
const { formatDate } = require("./formatDate");

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

const orderBailRejection = async (req, res, qrCode) => {
  const cnrNumber = req.query.cnrNumber;
  const orderId = req.query.orderId;
  const tenantId = req.query.tenantId;
  const entityId = req.query.entityId;
  const code = req.query.code;
  const requestInfo = req.body.RequestInfo;

  const missingFields = [];
  if (!cnrNumber) missingFields.push("cnrNumber");
  if (!orderId) missingFields.push("orderId");
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
  // Search for case details
  try {
    const resCase = await handleApiCall(
      () => search_case(cnrNumber, tenantId, requestInfo),
      "Failed to query case service"
    );
    const courtCase = resCase?.data?.criteria[0]?.responseList[0];
    if (!courtCase) {
      return renderError(res, "Court case not found", 404);
    }
    const resOrder = await handleApiCall(
      () => search_order(tenantId, orderId, requestInfo),
      "Failed to query order service"
    );
    const order = resOrder?.data?.list[0];
    if (!order) {
      renderError(res, "Order not found", 404);
    }

    const resApplication = await handleApiCall(
      () =>
        search_application(
          tenantId,
          order?.additionalDetails?.formdata?.refApplicationId,
          requestInfo
        ),
      "Failed to query application service"
    );
    const application = resApplication?.data?.applicationList[0];
    if (!application) {
      return renderError(res, "Application not found", 404);
    }

    const documentList = application?.applicationDetails
      ?.applicationDocuments || [{ documentType: "" }];
    const allAdvocates = getAdvocates(courtCase);
    const onBehalfOfuuid = application?.onBehalfOf?.[0];
    const advocate = allAdvocates?.[onBehalfOfuuid]?.[0]?.additionalDetails
      ?.advocateName
      ? allAdvocates[onBehalfOfuuid]?.[0]
      : {};
    const advocateName = advocate?.additionalDetails?.advocateName || "";
    const partyName = application?.additionalDetails?.onBehalOfName || "";
    const applicationDate = formatDate(
      new Date(application?.createdDate),
      "DD-MM-YYYY"
    );

    // Search for MDMS court room details
    const resMdms = await handleApiCall(
      () =>
        search_mdms(
          courtCase.courtId,
          "common-masters.Court_Rooms",
          tenantId,
          requestInfo
        ),
      "Failed to query MDMS service for court room"
    );
    const mdmsCourtRoom = resMdms?.data?.mdms[0]?.data;
    if (!mdmsCourtRoom) {
      return renderError(res, "Court room MDMS master not found", 404);
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
    const formattedToday = formatDate(currentDate, "DD-MM-YYYY");
    let bailType = "Cash";
    if (application?.applicationType === "SURETY") {
      bailType = "In Person Surety";
    }
    if (application?.applicationType === "BAIL_BOND") {
      bailType = "Bail Bond";
    }

    const data = {
      Data: [
        {
          courtName: mdmsCourtRoom.name,
          courtPlace: "Kollam",
          state: "Kerala",
          caseNumber: courtCase?.caseNumber,
          caseYear: caseYear,
          applicantName: advocateName || partyName,
          partyName,
          dateOfApplication: applicationDate,
          briefSummaryOfBail: order?.comments || "",
          date: formattedToday,
          documentNameList: ["Addhar Card", "Pan Card", "Passport"],
          documentList,
          bailType,
          conditionOfBail:
            "Don't go outside of the city without informing the court",
          judgeSignature: "Judge Signature",
          judgeName: "Suresh Soren",
          courtSeal: "Court Seal",
        },
      ],
    };
    const pdfKey =
      qrCode === "true"
        ? config.pdf.order_bail_rejection_qr
        : config.pdf.order_bail_rejection;
    const pdfResponse = await handleApiCall(
      () => create_pdf(tenantId, pdfKey, data, req.body),
      "Failed to generate PDF of Bail Rejection"
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
      "Failed to create PDF of Rejection of Bail",
      500,
      ex
    );
  }
};

module.exports = orderBailRejection;
