const cheerio = require("cheerio");
const config = require("../config");
const {
  search_case,
  search_hearing,
  search_sunbirdrc_credential_service,
  create_pdf,
  create_pdf_v2,
} = require("../api");
const { renderError } = require("../utils/renderError");
const { handleApiCall } = require("../utils/handleApiCall");
const { formatDate } = require("./formatDate");

async function summonsIssue(req, res, qrCode, order, compositeOrder) {
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

    // FIXME: Commenting out HRMS calls is it not impl in solution
    // Search for HRMS details
    // const resHrms = await handleApiCall(
    //     () => search_hrms(tenantId, "JUDGE", courtCase.courtId, requestInfo),
    //     "Failed to query HRMS service"
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

    // FIXME: Commenting out MDMS calls is it not impl in solution
    // Search for MDMS court establishment details
    // const resMdms1 = await handleApiCall(
    //     () => search_mdms(mdmsCourtRoom.courtEstablishmentId, "case.CourtEstablishment", tenantId, requestInfo),
    //     "Failed to query MDMS service for court establishment"
    // );
    // const mdmsCourtEstablishment = resMdms1?.data?.mdms[0]?.data;
    // if (!mdmsCourtEstablishment) {
    //     renderError(res, "Court establishment MDMS master not found", 404);
    // }

    const hearingDate = order?.orderDetails?.hearingDate
      ? formatDate(new Date(order?.orderDetails?.hearingDate))
      : "";
    if (!hearingDate) {
      renderError(res, "Hearing not found", 404);
    }

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

    let year;
    if (typeof courtCase.filingDate === "string") {
      year = courtCase.filingDate.slice(-4);
    } else if (courtCase.filingDate instanceof Date) {
      year = courtCase.filingDate.getFullYear();
    } else if (typeof courtCase.filingDate === "number") {
      // Assuming the number is in milliseconds (epoch time)
      year = new Date(courtCase.filingDate).getFullYear();
    } else {
      return renderError(res, "Invalid filingDate format", 500);
    }
    const caseNumber = courtCase?.courtCaseNumber || courtCase?.cmpNumber || "";
    const data = {
      Data: [
        {
          courtName: mdmsCourtRoom.name,
          place: mdmsCourtRoom.place,
          state: mdmsCourtRoom.state,
          caseNumber: caseNumber,
          year: year,
          caseName: courtCase.caseTitle,
          respondentName: order.orderDetails.respondentName,
          date: Date.now(),
          hearingDate: hearingDate,
          additionalComments:
            order?.additionalDetails?.formdata?.comments?.text || "",
          judgeName: judgeDetails.name,
          judgeSignature: judgeDetails.judgeSignature,
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
        ? config.pdf.summons_issue_qr
        : config.pdf.summons_issue;

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
      "Failed to generate PDF of order for Issue of Summons"
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
      "Failed to query details of order for Issue of Summons",
      500,
      ex
    );
  }
}

module.exports = summonsIssue;
