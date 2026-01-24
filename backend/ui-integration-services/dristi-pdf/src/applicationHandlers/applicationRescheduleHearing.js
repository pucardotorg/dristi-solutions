const cheerio = require("cheerio");
const config = require("../config");
const {
  search_case,
  search_sunbirdrc_credential_service,
  create_pdf,
  search_advocate,
} = require("../api");
const { renderError } = require("../utils/renderError");
const { cleanName } = require("./cleanName");
const { getStringAddressDetails } = require("../utils/addressUtils");

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

function formatDate(epochMillis) {
  // Convert epoch milliseconds to a Date object
  const date = new Date(epochMillis);

  // Ensure that the date is a valid Date object
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

async function applicationRescheduleHearing(
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
    // Search for case details
    const resCase = await handleApiCall(
      () => search_case(cnrNumber, tenantId, requestInfo, application?.courtId),
      "Failed to query case service"
    );
    const courtCase = resCase?.data?.criteria[0]?.responseList[0];
    if (!courtCase) {
      return renderError(res, "Court case not found", 404);
    }

    const mdmsCourtRoom = courtCaseJudgeDetails.mdmsCourtRoom;
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

    const litigants = courtCase?.litigants?.map((litigant) => ({
      ...litigant,
      representatives:
        courtCase?.representatives?.filter((rep) =>
          rep?.representing?.some(
            (complainant) =>
              complainant?.individualId === litigant?.individualId
          )
        ) || [],
    }));

    const complainants =
      litigants?.filter((litigant) =>
        litigant.partyType.includes("complainant")
      ) || [];

    const complainantList = complainants?.map((complainant) => {
      const complainantInAdditionalDetails =
        courtCase?.additionalDetails?.complainantDetails?.formdata?.find(
          (comp) =>
            comp?.data?.complainantVerification?.individualDetails
              ?.individualId === complainant?.individualId
        );
      const address = getStringAddressDetails(
        complainantInAdditionalDetails?.data?.addressDetails
      );
      return {
        name: complainant?.additionalDetails?.fullName,
        address: address,
        listOfAdvocatesRepresenting: complainant?.representatives
          ?.map((rep) => rep?.additionalDetails?.advocateName)
          ?.join(", "),
      };
    });

    const joinedAccuseds = litigants
      ?.filter((litigant) => litigant.partyType.includes("respondent"))
      ?.map((accused) => {
        const accusedInAdditionalDetails =
          courtCase?.additionalDetails?.respondentDetails?.formdata?.find(
            (comp) =>
              comp?.data?.respondentVerification?.individualDetails
                ?.individualId === accused?.individualId
          );
        const addresses = (
          accusedInAdditionalDetails?.data?.addressDetails || []
        )?.map((addressDetail) => {
          return getStringAddressDetails(addressDetail.addressDetails);
        });
        return {
          displayIndex: accusedInAdditionalDetails?.displayindex + 1 ?? null,
          individualId: accused?.individualId,
          name: accused?.additionalDetails?.fullName,
          address: addresses?.join(", ") || "",
          listOfAdvocatesRepresenting: accused?.representatives
            ?.map((rep) => rep?.additionalDetails?.advocateName)
            ?.join(", "),
        };
      });

    const unJoinedAccuseds =
      courtCase.additionalDetails.respondentDetails.formdata
        ?.map((formData) => {
          const data = formData?.data;
          const firstName = data?.respondentFirstName || "";
          const middleName = data?.respondentMiddleName || "";
          const lastName = data?.respondentLastName || "";
          const addresses = data?.addressDetails?.map((addressDetail) => {
            return getStringAddressDetails(addressDetail?.addressDetails);
          });
          return {
            displayIndex: formData?.displayindex + 1 || null,
            individualId:
              data?.respondentVerification?.individualDetails?.individualId ||
              null,
            name: `${firstName} ${middleName} ${lastName}` || "",
            address: addresses?.join(", ") || "",
            listOfAdvocatesRepresenting: [],
          };
        })
        ?.filter(
          (unJoined) =>
            !joinedAccuseds.some(
              (joined) =>
                joined?.individualId &&
                unJoined?.individualId &&
                joined?.individualId === unJoined?.individualId
            )
        ) || [];

    const accusedList = [...joinedAccuseds, ...unJoinedAccuseds]
      .sort(
        (a, b) => (a.displayIndex ?? Infinity) - (b.displayIndex ?? Infinity)
      )
      .map(({ displayIndex, ...rest }) => rest);

    const applicationDate = formatDate(new Date(application.createdDate));

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
    const day = currentDate.getDate();
    const month = months[currentDate.getMonth()];
    const year = currentDate.getFullYear();

    const ordinalSuffix = getOrdinalSuffix(day);
    const initialHearingDate =
      formatDate(application?.applicationDetails?.initialHearingDate) || "";
    const rawProposedHearingDate =
      application?.additionalDetails?.formdata?.newHearingDates || [];
    const proposedHearingDate = Array.isArray(rawProposedHearingDate)
      ? rawProposedHearingDate
      : [rawProposedHearingDate];
    const reasonForReschedule =
      application?.applicationDetails?.reasonForRequest || "";
    const caseNumber = courtCase?.isLPRCase
      ? courtCase?.lprNumber
      : courtCase?.courtCaseNumber || courtCase?.cmpNumber || "";
    const partyName = application?.additionalDetails?.onBehalOfName || "";

    const data = {
      Data: [
        {
          courtComplex: mdmsCourtRoom.name,
          caseNumber: caseNumber,
          caseName: courtCase.caseTitle,
          applicationDate: applicationDate,
          complainantList: complainantList,
          accusedList: accusedList,
          initialHearingDate: initialHearingDate,
          reasonForReschedule: reasonForReschedule,
          proposedHearingDate: proposedHearingDate.join(", "),
          date: day + ordinalSuffix,
          month: month,
          year: year,
          advocateSignature: "Advocate Signature",
          advocateName: advocateName,
          // date: formattedToday,
          partyName: partyName,
          qrCodeUrl: base64Url,
        },
      ],
    };

    // Generate the PDF
    const pdfKey =
      qrCode === "true"
        ? config.pdf.application_reschedule_hearing_qr
        : config.pdf.application_reschedule_hearing;
    const pdfResponse = await handleApiCall(
      () => create_pdf(tenantId, pdfKey, data, req.body),
      "Failed to generate PDF of Reschedule Hearing Application"
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
      "Failed to query details of APPLICATION FOR EXTENSION OF SUBMISSION DEADLINE",
      500,
      ex
    );
  }
}

module.exports = applicationRescheduleHearing;
