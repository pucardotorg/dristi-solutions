const cheerio = require("cheerio");
const { handleApiCall } = require("../utils/handleApiCall");
const {
  search_case,
  create_pdf,
  search_sunbirdrc_credential_service,
  create_pdf_v2,
  search_task,
} = require("../api");
const { renderError } = require("../utils/renderError");
const config = require("../config");
const { formatDate } = require("./formatDate");

const getFullName = (seperator, ...strings) => {
  return strings.filter(Boolean).join(seperator);
};

const orderChangeAdvocate = async (req, res, qrCode, order, compositeOrder) => {
  const cnrNumber = req.query.cnrNumber;
  const tenantId = req.query.tenantId;
  const entityId = req.query.entityId;
  const code = req.query.code;
  const requestInfo = req.body.RequestInfo;
  const response =
    order?.additionalDetails?.formdata?.replaceAdvocateStatus?.code === "GRANT"
      ? "GRANTED"
      : "REJECTED";
  const additionalComments =
    order?.additionalDetails?.formdata?.additionalComments?.text || "";
  const reasonForWithdrawal =
    order?.additionalDetails?.formdata?.reasonForWithdrawal?.text || "";
  const taskNumber = order?.additionalDetails?.taskNumber || "";

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

  // Search for case details
  try {
    const resCase = await handleApiCall(
      res,
      () => search_case(cnrNumber, tenantId, requestInfo),
      "Failed to query case service"
    );
    const courtCase = resCase?.data?.criteria[0]?.responseList[0];
    if (!courtCase) {
      return renderError(res, "Court case not found", 404);
    }

    const resTask = await handleApiCall(
      res,
      () => search_task(taskNumber, tenantId, requestInfo),
      "Failed to query task service"
    );
    const task = resTask?.data?.list?.[0];
    if (!task) {
      return renderError(res, "Task not found", 404);
    }

    const mdmsCourtRoom = config.constants.mdmsCourtRoom;
    const judgeDetails = config.constants.judgeDetails;
    const { firstName, middleName, lastName } =
      task?.taskDetails?.advocateDetails?.individualDetails;

    const partyName = getFullName(" ", firstName, middleName, lastName);
    const dateOfMotion = formatDate(
      new Date(task?.taskDetails?.advocateDetails?.requestedDate),
      "DD-MM-YYYY"
    );

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

    const caseNumber = courtCase?.courtCaseNumber || courtCase?.cmpNumber || "";
    const data = {
      Data: [
        {
          orderHeading: mdmsCourtRoom.orderHeading,
          caseNumber,
          year: caseYear,
          caseName: courtCase.caseTitle,
          date: formattedToday,
          partyName,
          dateOfMotion,
          briefReasonOfWithdrawal: reasonForWithdrawal,
          response,
          advocateName: partyName,
          additionalComments,
          judgeSignature: judgeDetails.judgeSignature,
          judgeName: judgeDetails.name,
          judgeDesignation: judgeDetails.judgeDesignation,
          qrCodeUrl: base64Url,
        },
      ],
    };
    const pdfKey =
      qrCode === "true"
        ? config.pdf.order_change_advocate_qr
        : config.pdf.order_change_advocate;

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
      "Failed to generate PDF of replacement advocate"
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
      "Failed to generate PDF of replacement advocate",
      500,
      ex
    );
  }
};

module.exports = orderChangeAdvocate;
