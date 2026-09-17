const cheerio = require("cheerio");
const config = require("../config");
const {
  search_sunbirdrc_credential_service,
  create_pdf,
} = require("../api");
const { renderError } = require("../utils/renderError");
const { formatDate } = require("./formatDate");
const { getStringAddressDetails } = require("../utils/addressUtils");
const { htmlToFormattedText } = require("../utils/htmlToFormattedText");

function formatAddressee(text = "", type = "full") {
  const formatted = text
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());

  if (type === "district") {
    const parts = formatted.split(",");
    return parts.length > 1
      ? parts[parts.length - 1].trim()
      : formatted;
  }
  return formatted;
}


async function miscellaneousProcessTemplate(
  req,
  res,
  qrCode,
  courtCaseJudgeDetails
) {
  const tenantId = req.query.tenantId;
  const entityId = req.query.entityId;
  const code = req.query.code;
  const requestInfo = req.body.RequestInfo;
  const templateData = req.body.templateConfiguration;

  if(templateData === undefined){
    return renderError(
      res,
      "templateConfiguration is mandatory to generate the PDF",
      400
    );
  }
  if(templateData.courtId === undefined){
    return renderError(
      res,
      "courtId inside templateConfiguration is mandatory to generate the PDF",
      400
    );
  }

  const missingFields = [];
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

    const caseNumber = templateData?.caseNumber || "";

    const nbwDate = templateData?.nbwDate ? formatDate(templateData.nbwDate, "DD-MM-YYYY") : "";

    const coverLetterSelected = templateData?.isCoverLetterRequired || false;

    let policeAddresseeSelected = false;
    let otherAddresseeSelected = false;

    if(templateData?.addressee === "POLICE"){
      policeAddresseeSelected = true;
    } else if(templateData?.addressee === "OTHER"){
      otherAddresseeSelected = true;
    }

    const addresseeDetails = otherAddresseeSelected ? templateData?.addresseeName : templateData?.addresseeDetails || "";

    const coverLetterText = templateData?.coverLetterText || "";

    const showAccusedNameAddress = (policeAddresseeSelected || otherAddresseeSelected) ? true : false;

    const accusedNameAddress = 
      templateData?.partyDetails?.flatMap(party =>
        (party.address || []).map(address => ({
          name: party.party?.name || "",
          formattedAddress: getStringAddressDetails(address)
        }))
      ) || [];

    const processTitle = templateData?.processTitle || "";
    const processText = templateData?.processText || "";
    const nextHearingDate = templateData?.nextHearingDate || "";

    const data = {
      Data: [
        {
          coverLetterSelected: coverLetterSelected,
          courtComplex: mdmsCourtRoom.nameWithIn,
          caseNumber: caseNumber,

          policeAddresseeSelected: policeAddresseeSelected,

          addresseeDetails: policeAddresseeSelected ? formatAddressee(addresseeDetails) : addresseeDetails,  
          addresseeDetailsDistrict: policeAddresseeSelected
            ? formatAddressee(addresseeDetails, "district")
            : "",

          date: formattedToday,
          nbwDate: nbwDate,
          coverLetterText: htmlToFormattedText(coverLetterText),
          showAccusedNameAddress: showAccusedNameAddress,
          accusedNameAddress: accusedNameAddress, // array with name and address already computed

          processTitle: processTitle,
          processText: htmlToFormattedText(processText),
          nextHearingDate: formatDate(nextHearingDate, "DD-MM-YYYY"),
          qrCodeUrl: base64Url,
        },
      ],
    };

    // Generate the PDF
    const pdfKey =
      qrCode === "true"
        ? config.pdf.template_configuration_miscellaneous_process_qr
        : config.pdf.template_configuration_miscellaneous_process;
    const pdfResponse = await handleApiCall(
      () => create_pdf(tenantId, pdfKey, data, { RequestInfo: requestInfo }),
      "Failed to generate PDF of template configuration miscellaneous process"
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
      "Failed to query details of Miscellaneous Process Application",
      500,
      ex
    );
  }
}

module.exports = miscellaneousProcessTemplate;
