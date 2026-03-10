const cheerio = require("cheerio");
const config = require("../config");
const {
  search_sunbirdrc_credential_service,
  create_pdf,
} = require("../api");
const { renderError } = require("../utils/renderError");

async function ctcApplications(
  req,
  res,
  qrCode,
  courtCaseJudgeDetails
) {

  const { RequestInfo, criteria, pagination={} } = req.body || {};
    
  const tenantId = req.query.tenantId;
  const entityId = req.query.entityId;
  const code = req.query.code;

  if(!criteria){
    return renderError(
      res,
      "Search criteria is mandatory to generate the PDF",
      400
    );
  }
  const { cnrNumber, courtId, ctcApplicationNumber } = criteria;
  const missingFields = [];
  if (!tenantId) missingFields.push("tenantId");
  if(!ctcApplicationNumber) missingFields.push("ctcApplicationNumber");
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

    // Handle QR code if enabled
    let base64Url = "";
    if (qrCode === "true") {
      const resCredential = await handleApiCall(
        () =>
          search_sunbirdrc_credential_service(
            tenantId,
            code,
            entityId,
            RequestInfo
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
    // const formattedToday = formatDate(currentDate, "DD-MM-YYYY");

    const caseNumber = criteria?.caseNumber || "";


    const requestedDocumentList = []; // resCTC?.requestedDocumentList || [];
    const noRepresentingParty = false;//resCTC?.noRepresentingParty || false;
    const courtName = mdmsCourtRoom?.name;
    const applicantName = "" ; //getNameByUuid(application?.createdBy, courtCase);
    const applicationDate = "";//resCTC?.applicationDate || "";
    const isMagistrateApproved = false; //resCTC?.isMagistrateApproved || false;
    const applicationApprovalDate = ""; //resCTC?.applicationApprovalDate || "";
    const issuanceDate ="";// resCTC?.issuanceDate || "";
    const judgeSignature = courtCaseJudgeDetails?.judgeDetails?.judgeSignature;
    const sealOfCourt = ""; //resCTC?.sealOfCourt || "";
    const cmoName = ""; //resCTC?.cmoName || "";
    
    const data = {
      Data: [
        {
          caseNumber: caseNumber,
          requestedDocumentList: [], //requestedDocumentList, // TODO : make it appropriate array and compare with other list
          noRepresentingParty: noRepresentingParty,
          applicantSignature: "Applicant Signature", // TODO : Inform and verify backend

          courtName: courtName,
          applicantName: applicantName,
          applicationNumber: ctcApplicationNumber,
          applicationDate: applicationDate, // TODO : format all the dates correctly
          requestedDocuments: requestedDocumentList,
          isMagistrateApproved: isMagistrateApproved,
          applicationApprovalDate: applicationApprovalDate,
          issuanceDate: issuanceDate,
          judgeSignature: judgeSignature, // TODO : confirm by backend
          sealOfCourt: sealOfCourt,
          cmoName: cmoName,


          qrCodeUrl: base64Url,
        },
      ],
    };

    // Generate the PDF
    const pdfKey =
      qrCode === "true"
        ? config.pdf.application_ctc_certification_qr
        : config.pdf.application_ctc_certification;
    const pdfResponse = await handleApiCall(
      () => create_pdf(tenantId, pdfKey, data, { RequestInfo: RequestInfo }),
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
