const cheerio = require("cheerio");
const config = require("../config");
const {
  search_case,
  search_sunbirdrc_credential_service,
  create_pdf,
  search_advocate,
} = require("../api");
const { renderError } = require("../utils/renderError");
const { formatDate } = require("./formatDate");
const { cleanName } = require("./cleanName");

function getOrdinalSuffix(day) {
  if (day > 3 && day < 21) return "th"; // 11th, 12th, 13th, etc.
  switch (day % 10) {
    case 1:
      return "st"; // 1st, 21st, 31st
    case 2:
      return "nd"; // 2nd, 22nd
    case 3:
      return "rd"; // 3rd, 23rd
    default:
      return "th"; // 4th, 5th, 6th, etc.
  }
}

const getOldData = (caseDetails, partyType, uniqueId) => {
  if (partyType === "complainant") {
    return caseDetails?.additionalDetails?.complainantDetails?.formdata?.find(
      (item) =>
        item?.data?.complainantVerification?.individualDetails?.individualId ===
        uniqueId
    );
  } else if (partyType === "respondent") {
    return caseDetails?.additionalDetails?.respondentDetails?.formdata?.find(
      (item) =>
        item?.data?.respondentVerification?.individualDetails?.individualId ===
          uniqueId || item?.uniqueId === uniqueId
    );
  }
};

const getFullName = (firstName, middleName, lastName) => {
  return [firstName, middleName, lastName]
    .filter((name) => name !== null && name !== undefined && name.trim() !== "")
    .join(" ");
};

const showAddress = (data) => {
  const format = (address = {}) => {
    const { pincode, city, district, locality, state } = address;

    const parts = [locality, city, district, state, pincode].filter(
      (part) => part !== null && part !== undefined && part.trim?.() !== ""
    );

    return parts.join(", ");
  };

  if (Array.isArray(data)) {
    return data.map((item) => format(item?.addressDetails));
  } else if (typeof data === "object" && data !== null) {
    return [format(data)];
  } else {
    return [];
  }
};

const getCommaSeparatedValues = (data) => {
  if (Array.isArray(data)) {
    return data.join(", ");
  }
  return "";
};

async function applicationProfileEdit(
  req,
  res,
  qrCode,
  application,
  courtCaseJudgeDetails
) {
  const cnrNumber = req.query.cnrNumber;
  const applicationNumber = req.query.applicationNumber;
  const tenantId = req.query.tenantId;
  const entityId = req.query.entityId;
  const code = req.query.code;
  const requestInfo = req.body.RequestInfo;

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
    const resCase = await handleApiCall(
      () => search_case(cnrNumber, tenantId, requestInfo, application?.courtId),
      "Failed to query case service"
    );
    const courtCase = resCase?.data?.criteria[0]?.responseList[0];
    if (!courtCase) {
      return renderError(res, "Court case not found", 404);
    }

    const mdmsCourtRoom = courtCaseJudgeDetails.mdmsCourtRoom;
    const judgeDetails = courtCaseJudgeDetails.judgeDetails;

    let barRegistrationNumber = "";
    let advocateName = "";
    const advocateIndividualId =
      application?.applicationDetails?.advocateIndividualId;
    if (advocateIndividualId) {
      const resAdvocate = await handleApiCall(
        () => search_advocate(tenantId, advocateIndividualId, requestInfo),
        "Failed to query Advocate Details"
      );
      const advocateData = resAdvocate?.data?.advocates?.[0];
      const advocateDetails = advocateData?.responseList?.find(
        (item) => item.isActive === true
      );
      barRegistrationNumber = advocateDetails?.barRegistrationNumber || "";
      advocateName =
        cleanName(advocateDetails?.additionalDetails?.username) || "";
    }

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

    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const currentDate = new Date();
    const formattedToday = formatDate(currentDate, "DD-MM-YYYY");
    const day = currentDate.getDate();
    const month = months[currentDate.getMonth()];
    const year = currentDate.getFullYear();
    const ordinalSuffix = getOrdinalSuffix(day);

    const partyReferenceId =
      application?.additionalDetails?.pendingTaskRefId || "";
    const profileRequest = courtCase?.additionalDetails?.profileRequests?.find(
      (req) => req?.pendingTaskRefId === partyReferenceId
    );
    const partyType = profileRequest?.litigantDetails?.partyType || "";
    const uniqueId = profileRequest?.litigantDetails?.uniqueId || "";
    const newData =
      profileRequest?.newData?.complainantDetails ||
      profileRequest?.newData?.respondentDetails;
    const oldData = getOldData(courtCase, partyType, uniqueId);

    const partyName =
      partyType === "respondent"
        ? getFullName(
            oldData?.data?.respondentFirstName,
            oldData?.data?.respondentLastName
          )
        : getFullName(
            oldData?.data?.firstName,
            oldData?.data?.middleName,
            oldData?.data?.lastName
          );

    const newPartyName =
      partyType === "respondent"
        ? getFullName(newData?.respondentFirstName, newData?.respondentLastName)
        : getFullName(
            newData?.firstName,
            newData?.middleName,
            newData?.lastName
          );

    const currentDetailsLitigantType =
      partyType === "respondent"
        ? oldData?.data?.respondentType?.name
        : oldData?.data?.complainantType?.name;
    const currentDetailsLitigantTypeCode =
      partyType === "respondent"
        ? oldData?.data?.respondentType?.code
        : oldData?.data?.complainantType?.code;

    const caseNumber = courtCase?.courtCaseNumber || courtCase?.cmpNumber || "";
    const reasonForChange =
      application?.additionalDetails?.formdata?.reasonForChange?.text || "";
    const prayer = application?.additionalDetails?.formdata?.prayer?.text || "";

    const currentCompanyName =
      partyType === "respondent"
        ? oldData?.data?.respondentCompanyName
        : oldData?.data?.complainantCompanyName;
    const currentEntityType =
      partyType === "respondent"
        ? oldData?.data?.respondentTypeOfEntity?.name
        : oldData?.data?.complainantTypeOfEntity?.name;

    const data = {
      Data: [
        {
          courtComplex: mdmsCourtRoom.name,
          caseType: "Negotiable Instruments Act 138 A",
          caseNumber: caseNumber,
          caseYear: caseYear,
          caseName: courtCase.caseTitle,
          judgeName: judgeDetails.name,
          courtDesignation: judgeDetails.designation,
          addressOfTheCourt: mdmsCourtRoom.state,
          date: formattedToday,
          partyName: partyName,
          advocateName,
          reasonForEditing: reasonForChange,
          prayer,
          advocateSignature: "Advocate Signature",
          day: day + ordinalSuffix,
          month: month,
          year: year,
          qrCodeUrl: base64Url,
          barRegistrationNumber,
          currentName: partyName,
          currentDetailsLitigantType: currentDetailsLitigantType || "",
          currentAge:
            oldData?.data?.respondentAge || oldData?.data?.complainantAge || "",
          currentMobileNumber: getCommaSeparatedValues(
            oldData?.data?.phonenumbers?.mobileNumber
          ),
          currentEmailId: getCommaSeparatedValues(
            oldData?.data?.emails?.emailId
          ),
          currentPermanentAddress:
            showAddress(oldData?.data?.addressDetails)?.[0] || "",
          currentResedentialAddress: "", // need to change config first
          isEntity: currentDetailsLitigantTypeCode !== "INDIVIDUAL",
          currentCompanyName: currentCompanyName || "",
          currentEntityType: currentEntityType || "",
          newName: newPartyName,
          newAge: newData?.respondentAge || newData?.complainantAge || "",
          newMobileNumber: getCommaSeparatedValues(
            newData?.phonenumbers?.mobileNumber
          ),
          newEmailId: getCommaSeparatedValues(newData?.emails?.emailId),
          newPermanentAddress: showAddress(newData?.addressDetails)?.[0] || "",
          newResedentialAddress: "", // need to change config first
        },
      ],
    };

    const pdfKey =
      qrCode === "true"
        ? config.pdf.application_profile_edit_qr
        : config.pdf.application_profile_edit;
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
  } catch (ex) {
    return renderError(
      res,
      "Failed to query details of Generic Application",
      500,
      ex
    );
  }
}

module.exports = applicationProfileEdit;
