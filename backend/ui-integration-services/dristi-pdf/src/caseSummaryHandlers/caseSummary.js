const config = require("../config");
const { search_case_v2, search_botd_orders, create_pdf } = require("../api");
const { renderError } = require("../utils/renderError");
const { handleApiCall } = require("../utils/handleApiCall");
const {
  getCourtAndJudgeDetails,
  getCaseNumber,
} = require("../utils/commonUtils");
const { getComplaintAndAccusedList } = require("../applicationHandlers/getCaseDetails");
const { formatDate } = require("../applicationHandlers/formatDate");
const { logger } = require("../logger");

// pdf-service fills values into a JSON string template, so free text with
// double quotes/backslashes/control chars can break rendering. Sanitize it.
function sanitizeText(str) {
  if (!str) return "";
  return str
    .toString()
    .replace(/\\/g, " ")
    .replace(/"/g, "'")
    .replace(/[\r\t]/g, " ");
}

// Convert a hearing type code (e.g. "EVIDENCE_HEARING") into a readable label.
function toTitleCase(str) {
  if (!str) return "";
  return str
    .toString()
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

async function caseSummary(req, res) {
  const tenantId = req.query.tenantId;
  const filingNumber = req.query.filingNumber;
  const cnrNumber = req.query.cnrNumber;
  const courtId = req.query.courtId;
  const requestInfo = req.body.RequestInfo;

  const missingFields = [];
  if (!tenantId) missingFields.push("tenantId");
  if (!filingNumber) missingFields.push("filingNumber");
  if (requestInfo === undefined) missingFields.push("requestInfo");

  if (missingFields.length > 0) {
    return renderError(
      res,
      `${missingFields.join(", ")} are mandatory to generate the PDF`,
      400,
    );
  }

  try {
    // 1. Case details
    const resCase = await handleApiCall(
      res,
      () =>
        search_case_v2(
          [
            {
              filingNumber,
              ...(cnrNumber && { cnrNumber }),
              ...(courtId && { courtId }),
            },
          ],
          tenantId,
          requestInfo,
        ),
      "Failed to query case service",
    );
    const courtCase = resCase?.data?.criteria?.[0]?.responseList?.[0];
    if (!courtCase) {
      return renderError(res, "Court case not found", 404);
    }

    // 2. Court details (for court name in the header)
    const courtCaseJudgeDetails = await getCourtAndJudgeDetails(
      res,
      tenantId,
      "Judge",
      courtId || courtCase?.courtId,
      requestInfo,
    );
    const courtName = courtCaseJudgeDetails?.mdmsCourtRoom?.courtName || "";

    // 3. Party details table (complainant / accused with advocates)
    const { complainantList, accusedList } = getComplaintAndAccusedList(
      courtCase || {},
    );

    // 4. BoTD summaries for each published order (chronological order)
    const resBotd = await handleApiCall(
      res,
      () =>
        search_botd_orders(tenantId, requestInfo, {
          filingNumber,
          tenantId,
        }),
      "Failed to query BoTD orders",
    );
    const botdOrderList = resBotd?.data?.botdOrderList || [];
    const hearings = [...botdOrderList]
      .sort((a, b) => (a?.createdDate || 0) - (b?.createdDate || 0))
      .map((order) => ({
        date: order?.createdDate
          ? formatDate(new Date(order.createdDate), "DD-MM-YYYY")
          : "",
        purpose: toTitleCase(order?.hearingType),
        businessOfTheDay: sanitizeText(order?.businessOfTheDay),
      }));

    const currentDate = new Date();
    const formattedToday = formatDate(currentDate, "DD-MM-YYYY");

    const data = {
      Data: [
        {
          courtName,
          caseNumber: getCaseNumber(courtCase),
          caseName: courtCase?.caseTitle || "",
          date: formattedToday,
          complainantList,
          accusedList,
          hearings,
        },
      ],
    };

    const pdfKey = config.pdf.case_summary;
    const pdfResponse = await handleApiCall(
      res,
      () => create_pdf(tenantId, pdfKey, data, req.body),
      "Failed to generate Case Summary PDF",
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
    logger.error(`Error in caseSummary: ${ex.message}`);
    return renderError(res, "Failed to create Case Summary PDF", 500, ex);
  }
}

module.exports = caseSummary;
