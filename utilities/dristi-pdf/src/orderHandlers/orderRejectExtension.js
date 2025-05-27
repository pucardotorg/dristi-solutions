const cheerio = require("cheerio");
const config = require("../config");
const {
  search_case,
  search_order,
  search_sunbirdrc_credential_service,
  create_pdf,
  search_individual_uuid,
  search_application,
  create_pdf_v2,
} = require("../api");
const { renderError } = require("../utils/renderError");
const { formatDate } = require("./formatDate");
const { getAdvocates } = require("../applicationHandlers/getAdvocates");
const { handleApiCall } = require("../utils/handleApiCall");
const { extractOrderNumber } = require("../utils/extractOrderNumber");

async function orderRejectExtension(
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
    const originalOrderNumber = extractOrderNumber(
      application.additionalDetails.formdata.refOrderId
    );
    const resOriginalOrder = await handleApiCall(
      res,
      () =>
        search_order(
          tenantId,
          originalOrderNumber,
          requestInfo,
          order?.courtId,
          true
        ),
      "Failed to query order service"
    );
    let originalOrder = resOriginalOrder?.data?.list[0];
    if (!originalOrder) {
      renderError(res, "Order not found", 404);
    }

    if (originalOrder.orderCategory === "COMPOSITE") {
      const itemDetails = originalOrder.compositeItems?.find(
        (item) => item.orderType === "MANDATORY_SUBMISSIONS_RESPONSES"
      );
      originalOrder = {
        ...originalOrder,
        orderType: itemDetails.orderType,
        additionalDetails: itemDetails.orderSchema.additionalDetails,
        orderDetails: itemDetails.orderSchema.orderDetails,
      };
    }

    const behalfOfIndividual = await handleApiCall(
      res,
      () =>
        search_individual_uuid(
          tenantId,
          application.onBehalfOf[0],
          requestInfo
        ),
      "Failed to query individual service using id"
    );
    const onbehalfOfIndividual = behalfOfIndividual?.data?.Individual[0];
    if (!onbehalfOfIndividual) {
      renderError(res, "Individual not found", 404);
    }

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
    const originalSubmissionName = originalOrder.orderDetails.documentName;
    const partyName = [
      onbehalfOfIndividual.name.givenName,
      onbehalfOfIndividual.name.otherNames,
      onbehalfOfIndividual.name.familyName,
    ]
      .filter(Boolean)
      .join(" ");
    const onBehalfOfuuid = application.onBehalfOf[0];
    const allAdvocates = getAdvocates(courtCase);
    const advocate = allAdvocates[onBehalfOfuuid]?.[0]?.additionalDetails
      ?.advocateName
      ? allAdvocates[onBehalfOfuuid]?.[0]
      : {};
    const advocateName = advocate?.additionalDetails?.advocateName || "";
    const applicantName = advocateName || partyName || "";
    const submissionDate = formatDate(
      new Date(application?.createdDate),
      "DD-MM-YYYY"
    );
    const requestedDeadlineDate = order.orderDetails.proposedSubmissionDate
      ? formatDate(
          new Date(order.orderDetails.proposedSubmissionDate),
          "DD-MM-YYYY"
        )
      : "";
    const newDeadlineDate = order.orderDetails.newSubmissionDate
      ? formatDate(new Date(order.orderDetails.newSubmissionDate), "DD-MM-YYYY")
      : "";
    const originalDeadlineDate = order.orderDetails.originalDocSubmissionDate
      ? formatDate(
          new Date(order.orderDetails.originalDocSubmissionDate),
          "DD-MM-YYYY"
        )
      : "";
    const originalOrderDate = originalOrder.createdDate
      ? formatDate(new Date(originalOrder.createdDate), "DD-MM-YYYY")
      : "";
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
          orderId: originalOrderNumber,
          orderDate: originalOrderDate,
          date: formattedToday,
          partyName: partyName,
          applicantName: applicantName,
          applicationFiledDate: submissionDate,
          requestedDeadlineDate: requestedDeadlineDate,
          originalDeadlineDate: originalDeadlineDate,
          originalSubmissionName: originalSubmissionName,
          newDeadlineDate: newDeadlineDate,
          additionalComments: additionalComments,
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
        ? config.pdf.order_reject_application_submission_deadline_qr
        : config.pdf.order_reject_application_submission_deadline;

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
      "Failed to generate PDF of order to Settle a Case - Acceptance"
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
      "Failed to query details of order to Settle a Case - Acceptance",
      500,
      ex
    );
  }
}

module.exports = orderRejectExtension;
