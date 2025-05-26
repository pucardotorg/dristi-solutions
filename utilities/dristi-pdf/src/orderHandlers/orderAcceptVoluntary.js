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
const { formatDate } = require("./formatDate");
const { handleApiCall } = require("../utils/handleApiCall");

async function orderAcceptVoluntary(req, res, qrCode, order, compositeOrder) {
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
      () => search_case(cnrNumber, tenantId, requestInfo),
      "Failed to query case service"
    );
    const courtCase = resCase?.data?.criteria[0]?.responseList[0];
    if (!courtCase) {
      renderError(res, "Court case not found", 404);
    }

    // Search for HRMS details
    // const resHrms = await handleApiCall(
    //   () => search_hrms(tenantId, "JUDGE", courtCase.courtId, requestInfo),
    //   "Failed to query HRMS service"
    // );
    // const employee = resHrms?.data?.Employees[0];
    // if (!employee) {
    //     renderError(res, "Employee not found", 404);
    // }

    // Search for MDMS court room details
    // const resMdms = await handleApiCall(
    //   () =>
    //     search_mdms(
    //       courtCase.courtId,
    //       "common-masters.Court_Rooms",
    //       tenantId,
    //       requestInfo
    //     ),
    //   "Failed to query MDMS service for court room"
    // );
    // const mdmsCourtRoom = resMdms?.data?.mdms[0]?.data;
    // if (!mdmsCourtRoom) {
    //   renderError(res, "Court room MDMS master not found", 404);
    // }

    const mdmsCourtRoom = config.constants.mdmsCourtRoom;
    const judgeDetails = config.constants.judgeDetails;

    // Search for MDMS court establishment details
    // const resMdms1 = await handleApiCall(
    //   () =>
    //     search_mdms(
    //       mdmsCourtRoom.courtEstablishmentId,
    //       "case.CourtEstablishment",
    //       tenantId,
    //       requestInfo
    //     ),
    //   "Failed to query MDMS service for court establishment"
    // );
    // const mdmsCourtEstablishment = resMdms1?.data?.mdms[0]?.data;
    // if (!mdmsCourtEstablishment) {
    //     renderError(res, "Court establishment MDMS master not found", 404);
    // }

    const resApplication = await handleApiCall(
      res,
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
    const partyName = application?.additionalDetails?.onBehalOfName || "";

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

    const currentDate = new Date();
    const formattedToday = formatDate(currentDate, "DD-MM-YYYY");
    const submissionDate = formatDate(
      new Date(application?.createdDate),
      "DD-MM-YYYY"
    );
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
    const additionalComments =
      order?.additionalDetails?.formdata?.comments?.text || "";
    const caseNumber = courtCase?.courtCaseNumber || courtCase?.cmpNumber || "";
    const data = {
      Data: [
        {
          courtName: mdmsCourtRoom.name,
          place: mdmsCourtRoom.place,
          courtPlace: mdmsCourtRoom.place,
          state: mdmsCourtRoom.state,
          caseName: courtCase.caseTitle,
          caseNumber: caseNumber,
          orderName: order.orderNumber,
          submissionType: "Application",
          submissionDate,
          date: formattedToday,
          Date: formattedToday,
          caseYear,
          partyName: partyName,
          additionalComments: additionalComments,
          content: order?.additionalDetails?.formdata?.comments?.text || "",
          applicationNumber: application?.applicationNumber,
          additionalDetails:
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
        ? config.pdf.order_accept_voluntary_qr
        : config.pdf.order_accept_voluntary;

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
      "Failed to generate PDF of generic order"
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
      "Failed to query details of generic order",
      500,
      ex
    );
  }
}

module.exports = orderAcceptVoluntary;
