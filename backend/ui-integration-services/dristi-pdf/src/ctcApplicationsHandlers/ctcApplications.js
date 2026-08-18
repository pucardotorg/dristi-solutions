const config = require("../config");
const {
  create_pdf,
  search_ctc_applications,
  search_case_v2,
  search_message,
} = require("../api");
const { renderError } = require("../utils/renderError");
const { formatDate } = require("./formatDate");
const {
  getComplaintAndAccusedList,
} = require("../applicationHandlers/getCaseDetails"); // getnamebyuuid
const { handleApiCall } = require("../utils/handleApiCall");
const { getSelectedTitles } = require("../utils/commonUtils");

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
              flow: "flow_jac",
            },
          ],
          tenantId,
          RequestInfo,
          true,
        ),
      "Failed to query case service",
    );
    const resCtcApplications = await handleApiCall(
      res,
      () =>
        search_ctc_applications(tenantId, RequestInfo, criteria, pagination),
      "Failed to query CTC applications service",
    );

    const ctcApplication = resCtcApplications?.data?.ctcApplications?.[0] || {};

    const resMessage = await handleApiCall(
      res,
      () =>
        search_message(
          tenantId,
          "rainmaker-case,rainmaker-orders,rainmaker-submissions,rainmaker-home,rainmaker-common",
          "en_IN",
          RequestInfo,
        ),
      "Failed to query Localized messages",
    );
    const messages = resMessage?.data?.messages || [];
    const messagesMap =
      messages?.length > 0
        ? Object.fromEntries(
            messages.map(({ code, message }) => [code, message]),
          )
        : {};

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

    const { complainantList, accusedList } = getComplaintAndAccusedList(
      courtCase || {},
    );

    const selectedDocumentList = getSelectedTitles(
      ctcApplication?.selectedCaseBundle,
      messagesMap,
    );
    const data = {
      Data: [
        {
          courtComplex: mdmsCourtRoom?.name,
          caseNumber: courtCase?.stNumber || courtCase?.cmpNumber || "",
          caseName: courtCase.caseTitle,
          date: formattedToday,
          complainantList: complainantList,
          accusedList: accusedList,
          selectedDocumentList,
          isPartyToCase: ctcApplication?.isPartyToCase,
          applicantName: ctcApplication?.applicantName || "",
          designation: ctcApplication?.partyDesignation || "",
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
