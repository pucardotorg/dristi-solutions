const config = require("../config");
const {
  create_pdf,
  search_ctc_applications,
  search_advocate,
  search_case_v2,
} = require("../api");
const { renderError } = require("../utils/renderError");
const { formatDate } = require("./formatDate");
const {
  getComplaintAndAccusedList,
} = require("../applicationHandlers/getCaseDetails"); // getnamebyuuid
const { cleanName } = require("../applicationHandlers/cleanName");
const { handleApiCall } = require("../utils/handleApiCall");

async function ctcApplications(req, res, courtCaseJudgeDetails) {
  const { RequestInfo, criteria, pagination = {} } = req.body || {};

  if (!criteria) {
    return renderError(
      res,
      "Search criteria is mandatory to generate the PDF",
      400,
    );
  }
  const { tenantId, courtId, ctcApplicationNumber, filingNumber } = criteria;
  const missingFields = [];
  if (!tenantId) missingFields.push("tenantId");
  if (!courtId) missingFields.push("courtId");
  if (!ctcApplicationNumber) missingFields.push("ctcApplicationNumber");
  if (!filingNumber) missingFields.push("filingNumber");

  if (RequestInfo === undefined) missingFields.push("requestInfo");

  if (missingFields.length > 0) {
    return renderError(
      res,
      `${missingFields.join(", ")} are mandatory to generate the PDF`,
      400,
    );
  }

  try {
    const resCase = await handleApiCall(
      res,
      () =>
        search_case_v2(
          [
            {
              filingNumber,
            },
          ],
          tenantId,
          RequestInfo,
        ),
      "Failed to query case service",
    );
    const resCtcApplications = await handleApiCall(
      res,
      () =>
        search_ctc_applications(tenantId, RequestInfo, criteria, pagination),
      "Failed to query CTC applications service",
    );

    const resCTC = resCtcApplications?.data?.ctcApplications?.[0] || {};
    const courtCase = resCase?.data?.criteria?.[0]?.responseList?.[0];

    if (!courtCase) {
      return renderError(
        res,
        "No case details found for the provided inputs (cnrNumber/tenantId)",
        400,
      );
    }

    const mdmsCourtRoom = courtCaseJudgeDetails.mdmsCourtRoom;

    const currentDate = new Date();
    const formattedToday = formatDate(currentDate, "DD-MM-YYYY");

    const caseNumber = criteria?.caseNumber || "";
    const { complainantList, accusedList } = getComplaintAndAccusedList(
      courtCase || {},
    );
    let advocateName = "";
    const advocateIndividualId = "";
    // application?.applicationDetails?.advocateIndividualId;
    if (advocateIndividualId) {
      const resAdvocate = await handleApiCall(
        res,
        () => search_advocate(tenantId, advocateIndividualId, RequestInfo),
        "Failed to query Advocate Details",
      );
      const advocateData = resAdvocate?.data?.advocates?.[0];
      const advocateDetails = advocateData?.responseList?.find(
        (item) => item.isActive === true,
      );
      advocateName =
        cleanName(advocateDetails?.additionalDetails?.username) || "";
    }
    let applicationTitle = "Application for Certified True Copies";
    const onBehalfOfuuid = ""; // application?.onBehalfOf?.[0];
    const partyName = ""; //application?.additionalDetails?.onBehalOfName || "";
    const onBehalfOfLitigent = courtCase?.litigants?.find(
      (item) => item.additionalDetails.uuid === onBehalfOfuuid,
    );
    let partyType = "COURT";
    if (onBehalfOfLitigent?.partyType?.toLowerCase()?.includes("complainant")) {
      partyType = "Complainant";
    }
    if (onBehalfOfLitigent?.partyType?.toLowerCase()?.includes("respondent")) {
      partyType = "Accused";
    }

    const requestedDocumentList = []; // resCTC?.requestedDocumentList || [];
    const noRepresentingParty = resCTC?.noRepresentingParty || false;
    const courtName = mdmsCourtRoom?.name;
    const applicantName = ""; //getNameByUuid(application?.createdBy, courtCase);
    const applicationDate = resCTC?.applicationDate || "";
    const isMagistrateApproved = resCTC?.isMagistrateApproved || false;
    const applicationApprovalDate = resCTC?.applicationApprovalDate || "";
    const issuanceDate = resCTC?.issuanceDate || "";
    const judgeSignature = courtCaseJudgeDetails?.judgeDetails?.judgeSignature;
    const sealOfCourt = resCTC?.sealOfCourt || "";
    const cmoName = resCTC?.cmoName || "";

    const data = {
      Data: [
        {
          courtComplex: mdmsCourtRoom?.name,
          caseNumber: caseNumber,
          caseName: courtCase.caseTitle,
          date: formattedToday,
          complainantList: complainantList,
          accusedList: accusedList,
          advocateName: advocateName,
          applicationTitle: applicationTitle,
          partyName: partyName,
          partyType: partyType,
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
        },
      ],
    };

    // Generate the PDF
    const pdfKey = config.pdf.application_certified_true_copies;
    const pdfResponse = await handleApiCall(
      res,
      () => create_pdf(tenantId, pdfKey, data, { RequestInfo: RequestInfo }),
      "Failed to generate PDF of Application for Certified True Copies",
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
      "Failed to query details of Application for Certified True Copies",
      500,
      ex,
    );
  }
}

module.exports = ctcApplications;
