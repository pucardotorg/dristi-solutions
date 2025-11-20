const cheerio = require("cheerio");
const config = require("../config");
const {
  search_case,
  search_sunbirdrc_credential_service,
  create_pdf,
  search_individual_uuid,
  search_bailBond,
} = require("../api");
const { renderError } = require("../utils/renderError");
const { formatDate } = require("../applicationHandlers/formatDate");

const extractPermanentAddress = (individualData) => {
  const permanentAddress = individualData?.address?.find(
    (addr) => addr.type === "PERMANENT"
  );

  if (!permanentAddress) {
    return "Permanent address not found";
  }

  const formattedAddress = [
    permanentAddress.addressLine1,
    permanentAddress.addressLine2,
    permanentAddress.street,
    permanentAddress.city,
    permanentAddress.pincode,
  ]
    .filter((line) => line)
    .join(", ");

  return formattedAddress;
};

const processSureties = (bailData) => {
  const { sureties } = bailData;

  if (!sureties || !Array.isArray(sureties)) {
    return [];
  }

  const formatAddress = (address) => {
    const formattedAddress = [
      address?.locality,
      address?.city,
      address?.district,
      address?.state,
      address?.pincode,
    ]
      .filter((line) => line)
      .join(", ");

    return formattedAddress;
  };

  return sureties?.map((surety) => ({
    suretyName: surety?.name || "",
    suretyParentName: surety?.fatherName || "",
    suretyAddress: formatAddress(surety?.address) || "",
    index: surety?.index,
  }));
};

const bailBond = async (req, res, courtCaseJudgeDetails, qrCode) => {
  const cnrNumber = req.query.cnrNumber;
  const bailBondId = req.query.bailBondId;
  const tenantId = req.query.tenantId;
  const entityId = req.query.entityId;
  const code = req.query.code;
  const requestInfo = req.body.RequestInfo;

  const missingFields = [];
  if (!cnrNumber) missingFields.push("cnrNumber");
  if (!bailBondId) missingFields.push("bailBondId");
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
    const resCase = await handleApiCall(
      () => search_case(cnrNumber, tenantId, requestInfo, req.query.courtId),
      "Failed to query case service"
    );
    const courtCase = resCase?.data?.criteria[0]?.responseList[0];
    if (!courtCase) {
      renderError(res, "Court case not found", 404);
    }

    const resBailBond = await handleApiCall(
      () => search_bailBond(tenantId, bailBondId, requestInfo),
      "Failed to query bailBond service"
    );

    const bailBond = resBailBond?.data?.bails?.[0];
    if (!bailBond) {
      return renderError(res, "bailBond not found", 404);
    }

    const resIndividual = await handleApiCall(
      () => search_individual_uuid(tenantId, bailBond.litigantId, requestInfo),
      "Failed to query individual service using id"
    );
    const individual = resIndividual?.data?.Individual[0];
    if (!individual) {
      renderError(res, "Individual not found", 404);
    }

    const mdmsCourtRoom = courtCaseJudgeDetails.mdmsCourtRoom;

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

    let caseYear;
    if (typeof courtCase.filingDate === "string") {
      caseYear = courtCase.filingDate.slice(-4);
    } else if (courtCase.filingDate instanceof Date) {
      caseYear = courtCase.filingDate.getFullYear();
    } else if (typeof courtCase.filingDate === "number") {
      // Assuming the number is in milliseconds (epoch time)
      caseYear = new Date(courtCase.filingDate).getFullYear();
    } else {
      return renderError(res, "Invalid filingDate format", 500);
    }

    const currentDate = new Date();
    const formattedToday = formatDate(currentDate, "DD-MM-YYYY");
    const caseNumber = courtCase?.isLPRCase
      ? courtCase?.lprNumber
      : courtCase?.courtCaseNumber || courtCase?.cmpNumber || "";
    const judgeDetails = courtCaseJudgeDetails.judgeDetails;
    const data = {
      Data: [
        {
          caseName: bailBond?.caseTitle || "",
          caseNumber: caseNumber || "",
          caseYear: caseYear || "",
          litigantName: bailBond?.litigantName || "",
          litigantFatherName: bailBond?.litigantFatherName || "",
          litigantAddress: extractPermanentAddress(individual) || "",
          courtName: mdmsCourtRoom.courtName,
          caseType: "Negotiable Instruments Act 138A",
          bailAmount: bailBond?.bailAmount || "",
          sureties: processSureties(bailBond),
          accusedSignature: "Accused Signature",
          date: formattedToday,
          judgeSignature: "Magistrate Signature",
          orderHeading: mdmsCourtRoom.orderHeading,
          qrCodeUrl: base64Url,
          judgeName: judgeDetails.name,
          judgeDesignation: judgeDetails.judgeDesignation,
        },
      ],
    };

    // Generate the PDF
    const pdfKey =
      qrCode === "true" ? config.pdf.bail_bond_qr : config.pdf.bail_bond;
    const pdfResponse = await handleApiCall(
      () => create_pdf(tenantId, pdfKey, data, req.body),
      "Failed to generate PDF of Generic Application"
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

    // TODO: Add logic to handle bailBond details and generate PDF
  } catch (ex) {
    return renderError(res, "Failed to query details of Bail Bond", 500, ex);
  }
};

module.exports = bailBond;
