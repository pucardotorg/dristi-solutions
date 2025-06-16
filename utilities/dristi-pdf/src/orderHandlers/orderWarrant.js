const cheerio = require("cheerio");
const config = require("../config");
const {
  search_case,
  search_sunbirdrc_credential_service,
  create_pdf,
  create_pdf_v2,
} = require("../api");
const { renderError } = require("../utils/renderError");
const { formatDate } = require("./formatDate");
const { handleApiCall } = require("../utils/handleApiCall");

function formatToIndianCurrency(number) {
  if (!number) return "";

  const numStr = number.toString();
  const lastThree = numStr.slice(-3);
  const otherNumbers = numStr.slice(0, -3);

  const formattedOther = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",");

  return otherNumbers ? formattedOther + "," + lastThree : lastThree;
}

async function orderWarrant(
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

    const bailinfo = order?.additionalDetails?.formdata?.bailInfo;

    const reasonForWarrant =
      order?.additionalDetails?.formdata?.warrantSubType?.subType || "";
    const personName =
      order?.orderDetails?.respondentName?.name ||
      order?.orderDetails?.respondentName ||
      "";
    const additionalComments = order.comments || "";

    let isBailable = "";

    if (bailinfo?.isBailable?.code === true) {
      isBailable = "bailable";
    } else if (bailinfo?.isBailable?.code === false) {
      isBailable = "nonbailable";
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

    const currentDate = new Date();
    const formattedToday = formatDate(currentDate, "DD-MM-YYYY");
    const caseNumber = courtCase?.courtCaseNumber || courtCase?.cmpNumber || "";
    // Prepare data for PDF generation
    const data = {
      Data: [
        {
          courtName: mdmsCourtRoom.name,
          place: mdmsCourtRoom.place,
          state: mdmsCourtRoom.state,
          caseName: courtCase.caseTitle,
          caseNumber: caseNumber,
          orderName: order.orderNumber,
          date: formattedToday,
          reasonForWarrant: reasonForWarrant,
          isBailable: isBailable,
          isTemplateType: bailinfo?.isBailable?.code,
          bailAmount: formatToIndianCurrency(bailinfo?.bailableAmount) || "",
          noOfSurety: bailinfo?.noOfSureties?.name || "",
          personName: personName,
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
        ? config.pdf.order_issue_warrant_qr
        : config.pdf.order_issue_warrant;

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
      "Failed to generate PDF of warrant order"
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
    return renderError(res, "Failed to create PDF for warrant order", 500, ex);
  }
}

module.exports = orderWarrant;
