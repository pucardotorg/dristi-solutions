const cheerio = require("cheerio");
const config = require("../config");
const {
  search_case,
  search_sunbirdrc_credential_service,
  create_pdf,
} = require("../api");
const { renderError } = require("../utils/renderError");
const { formatDate } = require("./formatDate");


async function miscellaneousProcessTemplate(
  req,
  res,
  qrCode,
  courtCaseJudgeDetails
) {
  const cnrNumber = req.query.cnrNumber;
  const applicationNumber = req.query.applicationNumber;
  const tenantId = req.query.tenantId;
  const entityId = req.query.entityId;
  const code = req.query.code;
  const requestInfo = req.body.RequestInfo;
  const templateConfigurationData = req.body.templateConfiguration;
  const courtId = templateConfigurationData?.courtId;

  if(templateConfigurationData === undefined){
    return renderError(
      res,
      "templateConfiguration is mandatory to generate the PDF",
      400
    );
  }
  if(templateConfigurationData.courtId === undefined){
    return renderError(
      res,
      "courtId inside templateConfiguration is mandatory to generate the PDF",
      400
    );
  }

  const missingFields = [];
  if (!cnrNumber) missingFields.push("cnrNumber");
  if (!applicationNumber) missingFields.push("applicationNumber");
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
    // Search for case details
    const resCase = await handleApiCall(
      () => search_case(cnrNumber, tenantId, requestInfo, courtId), // TODO : verify courtId param
      "Failed to query case service"
    );
    const courtCase = resCase?.data?.criteria[0]?.responseList[0];
    if (!courtCase) {
      return renderError(res, "Court case not found", 404);
    }

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

    const caseNumber = courtCase?.isLPRCase
      ? courtCase?.lprNumber
      : courtCase?.courtCaseNumber || courtCase?.cmpNumber || "";

    // TODO : confirm all the paths and update

    const coverLetterSelected = ""; // application?.additionalDetails?.coverLetterSelected || "";
    const policeAddresseeSelected = "";
      //application?.additionalDetails?.policeAddresseeSelected || "";
    const accusedAddresseeSelected = "";
      // application?.additionalDetails?.accusedAddresseeSelected || "";
    const complainantAddresseeSelected = "";
      // application?.additionalDetails?.complainantAddresseeSelected || "";
    const otherAddresseeSelected = "";
      // application?.additionalDetails?.otherAddresseeSelected || "";

    const policeStation = "";
      // application?.applicationDetails?.policeStation || "";
    const accusedName = ""; // application?.applicationDetails?.accusedName || "";
    const complainantName = "";
      // application?.applicationDetails?.complainantName || "";
    const otherName = ""; // application?.applicationDetails?.otherName || "";

    const coverLetterText = "";
      // application?.additionalDetails?.coverLetterText || "";
    const showAccusedNameAddress = "";
      // application?.additionalDetails?.showAccusedNameAddress || false;
    const accusedNameAddress = "";
      // application?.additionalDetails?.accusedNameAddress || [];             // TODO : modify to array with name and address already attached

    const processTitle = ""; // application?.applicationDetails?.processTitle || "";
    const processText = ""; // application?.applicationDetails?.processText || "";
    const nextHearingDate = "";
      // application?.applicationDetails?.nextHearingDate || "";

    const data = {
      Data: [
        {
          coverLetterSelected: coverLetterSelected,
          courtComplex: mdmsCourtRoom.name,
          caseNumber: caseNumber,

          policeAddresseeSelected: policeAddresseeSelected,
          accusedAddresseeSelected: accusedAddresseeSelected, 
          complainantAddresseeSelected: complainantAddresseeSelected,
          otherAddresseeSelected: otherAddresseeSelected, 

          policeStation: policeStation,
          accusedName: accusedName,
          complainantName: complainantName,
          otherName: otherName,

          date: formattedToday,
          coverLetterText: coverLetterText,
          showAccusedNameAddress: showAccusedNameAddress,
          accusedNameAddress: accusedNameAddress, // array with name and address already computed

          processTitle: processTitle,
          processText: processText,
          nextHearingDate: nextHearingDate,
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
      "Failed to query details of case Settlement Application",
      500,
      ex
    );
  }
}

module.exports = miscellaneousProcessTemplate;
