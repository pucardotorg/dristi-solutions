const cheerio = require("cheerio");
const config = require("../config");
const {
  search_case,
  search_sunbirdrc_credential_service,
  create_pdf,
  search_application,
  create_pdf_v2,
} = require("../api");
const { renderError } = require("../utils/renderError");
const { handleApiCall } = require("../utils/handleApiCall");

function formatDate(epochMillis) {
  // Convert epoch milliseconds to a Date object
  const date = new Date(epochMillis);

  // Ensure that the date is a valid Date object
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date");
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

async function acceptReschedulingRequest(
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

    // Search for application details
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
      renderError(res, "Application not found", 404);
    }
    const partyName = application?.additionalDetails?.onBehalOfName || "";
    const reasonForRescheduling =
      order?.orderDetails?.reasonForReschedule || "";
    const originalHearingDate = application?.applicationDetails
      ?.initialHearingDate
      ? formatDate(
          new Date(application?.applicationDetails?.initialHearingDate),
          "DD-MM-YYYY"
        )
      : "";
    // Search for individual details
    // const resIndividual = await handleApiCall(
    //     () => search_individual_uuid(tenantId, application.onBehalfOf[0], requestInfo),
    //     "Failed to query individual service using id"
    // );
    // const individual = resIndividual?.data?.Individual[0];
    // if (!individual) {
    //     renderError(res, "Individual not found", 404);
    // }

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

    const formattedToday = formatDate(Date.now());
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
          place: "Kollam",
          state: "Kerala",
          caseName: courtCase.caseTitle,
          caseNumber: caseNumber,
          date: formattedToday,
          partyNames: partyName,
          applicationId: order.orderDetails?.refApplicationId || "",
          reasonForRescheduling,
          originalHearingDate,
          additionalComments:
            order?.additionalDetails?.formdata?.comments?.text || "",
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
        ? config.pdf.accept_rescheduling_request_qr
        : config.pdf.accept_rescheduling_request;

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
      "Failed to generate PDF of order to Accept Rescheduling Request (No New Date)"
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
      "Failed to query details of order to Accept Rescheduling Request (No New Date)",
      500,
      ex
    );
  }
}

module.exports = acceptReschedulingRequest;
