const config = require("../config");
const { create_pdf } = require("../api");
const { renderError } = require("../utils/renderError");
const { formatDate } = require("../ctcApplicationsHandlers/formatDate");

async function ctcApplications(req, res, qrCode, courtCaseJudgeDetails) {
  const { RequestInfo, criteria } = req.body || {};

  const entityId = req.query.entityId;
  const code = req.query.code;
  const tenantId = req.query.tenantId;

  if (!criteria) {
    return renderError(
      res,
      "Search criteria is mandatory to generate the PDF",
      400
    );
  }
  const { tenantId: tenantID } = criteria;
  const finalTenantId = tenantId || tenantID;
  const missingFields = [];
  if (!finalTenantId) missingFields.push("tenantId");
  if (RequestInfo === undefined) missingFields.push("requestInfo");
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
    const mdmsCourtRoom = courtCaseJudgeDetails.mdmsCourtRoom;

    const {
      ctcApplicationNumber,
      caseNumber,
      nameOfApplicant,
      dateOfApplication,
      dateOfApplicationApproval,
      requestedDocName,
    } = criteria;

    const currentDate = new Date();
    const formattedToday = formatDate(currentDate, "DD-MM-YYYY");

    const data = {
      Data: [
        {
          caseNumber: caseNumber,
          courtName: mdmsCourtRoom.courtName,
          applicantName: nameOfApplicant || "",
          applicationNumber: ctcApplicationNumber || "",
          applicationDate: dateOfApplication ? formatDate(
            new Date(dateOfApplication),
            "DD-MM-YYYY"
          ) : "",
          documentName: requestedDocName || "",
          isMagistrateApproved: dateOfApplicationApproval ? true : false,
          applicationApprovalDate: dateOfApplicationApproval ? formatDate(
            new Date(dateOfApplicationApproval),
            "DD-MM-YYYY"
          ) : "",
          issuanceDate: formattedToday,
          cmoName: RequestInfo?.userInfo?.name || "",
          judgeSignature: "Certification Signature",
        },
      ],
    };

    // Generate the PDF
    const pdfKey = config.pdf.application_ctc_certification;
    const pdfResponse = await handleApiCall(
      () =>
        create_pdf(finalTenantId, pdfKey, data, { RequestInfo: RequestInfo }),
      "Failed to generate PDF of CTC Certification"
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
      "Failed to query details of CTC Certification PDF",
      500,
      ex
    );
  }
}

module.exports = ctcApplications;
