const { create_pdf, search_sunbirdrc_credential_service } = require("../api");
const { formatDate } = require("../applicationHandlers/formatDate");
const config = require("../config");
const { getCourtAndJudgeDetails } = require("../utils/commonUtils");
const { renderError } = require("../utils/renderError");
const cheerio = require("cheerio");

const Evidence = async (req, res, qrCode) => {
  const tenantId = req.query.tenantId;
  const entityId = req.query.entityId;
  const code = req.query.code;
  const requestInfo = req.body.RequestInfo;
  const Evidence = req.body.Evidence;
  const courtId = Evidence?.courtId;
  const markedAs = Evidence?.markedAs;
  const caseNumber = Evidence?.caseNumber;
  const markedThrough = Evidence?.markedThrough;

  const missingFields = [];
  if (!courtId) missingFields.push("courtId");
  if (!tenantId) missingFields.push("tenantId");
  if (!markedAs) missingFields.push("markedAs");
  if (!caseNumber) missingFields.push("caseNumber");
  if (!markedThrough) missingFields.push("markedThrough");
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
    const courtCaseJudgeDetails = await getCourtAndJudgeDetails(
      res,
      tenantId,
      "Judge",
      courtId,
      requestInfo
    );

    let base64Url = "";
    if (qrCode === "true") {
      const resCredential = await handleApiCall(
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

    const mdmsCourtRoom = courtCaseJudgeDetails.mdmsCourtRoom;
    const currentDate = new Date();
    const formattedToday = formatDate(currentDate, "DD-MM-YYYY");

    const data = {
      Data: [
        {
          courtName: "The " + mdmsCourtRoom.courtName,
          caseNumber: caseNumber,
          markedAs: markedAs,
          markedThrough: markedThrough,
          date: formattedToday,
          judgeSignature: "Judge/Magistrate",
          qrCodeUrl: base64Url,
        },
      ],
    };
    const pdfKey =
      qrCode === "true" ? config.pdf.evidence : config.pdf.evidence;
    const pdfResponse = await handleApiCall(
      () => create_pdf(tenantId, pdfKey, data, { RequestInfo: requestInfo }),
      "Failed to generate PDF of Evidence"
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
    return renderError(res, "Failed to create PDF for Evidence", 500, ex);
  }
};

module.exports = Evidence;
