const cheerio = require("cheerio");
const config = require("../config");
const { renderError } = require("../utils/renderError");
const {
  search_multiple_cases,
  create_pdf,
  search_sunbirdrc_credential_service,
  search_mdms,
  search_message,
} = require("../api");
const { formatDate } = require("./formatDate");
const { getCourtAndJudgeDetails } = require("../utils/commonUtils");

// compare time and return slots
function formatTimeFromEpoch(epoch) {
  const options = {
    timeZone: "Asia/Kolkata",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  };

  const formattedTime = new Intl.DateTimeFormat("en-GB", options).format(
    new Date(epoch)
  );
  return formattedTime;
}

function timeToSeconds(timeStr) {
  const [hours, minutes, seconds] = timeStr.split(":").map(Number);
  return hours * 3600 + minutes * 60 + seconds;
}

function _getHearingSlots(courtHearingSlots, startTime) {
  const givenTimeStr = formatTimeFromEpoch(startTime);
  const givenTimeInSeconds = timeToSeconds(givenTimeStr);

  const sortedSlots = [...courtHearingSlots].sort((a, b) => {
    return (
      timeToSeconds(a.data.slotStartTime) - timeToSeconds(b.data.slotStartTime)
    );
  });

  let lastMatchingSlot = null;

  for (const slot of sortedSlots) {
    const slotStartInSeconds = timeToSeconds(slot.data.slotStartTime);

    if (givenTimeInSeconds >= slotStartInSeconds) {
      lastMatchingSlot = slot;
    }
  }
  return lastMatchingSlot?.data?.slotName || "";
}

const hearingBulkReschedule = async (req, res, qrCode) => {
  const tenantId = req.query.tenantId;
  const entityId = req.query.entityId;
  const code = req.query.code;
  const requestInfo = req.body.RequestInfo;
  const bulkRescheduleData = req.body.BulkReschedule;
  const courtId = bulkRescheduleData?.courtId;

  const missingFields = [];
  if (!tenantId) missingFields.push("tenantId");
  // if (!bulkRescheduleData) missingFields.push("bulkRescheduleData");
  if (requestInfo === undefined) missingFields.push("requestInfo");
  if (qrCode === "true" && (!entityId || !code))
    missingFields.push("entityId and code");

  // requiredFields.forEach((field) => {
  //   if (!bulkRescheduleData?.[field]) {
  //     missingFields.push(field);
  //   }
  // });

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
      throw ex;
    }
  };

  // Search for case details
  try {
    // localisation api call
    const resMessage = await handleApiCall(
      () => search_message(tenantId, "rainmaker-common", "en_IN", requestInfo),
      "Failed to query Localized messages"
    );
    const messages = resMessage?.data?.messages || [];
    const messagesMap =
      messages?.length > 0
        ? Object.fromEntries(
            messages.map(({ code, message }) => [code, message])
          )
        : {};

    // mdms api call for court slots
    const resMdms = await handleApiCall(
      () => search_mdms(null, "court.slots", tenantId, requestInfo),
      "Failed to query MDMS service for court hearing slots"
    );

    const mdmsCourtSlots = resMdms?.data?.mdms;
    if (!mdmsCourtSlots) {
      return renderError(res, "Court slots MDMS master not found", 404);
    }

    // const BulkReschedule = {
    //   judgeId: bulkRescheduleData?.judgeId,
    //   courtId: bulkRescheduleData?.courtId,
    //   scheduleAfter: bulkRescheduleData?.scheduleAfter,
    //   tenantId: tenantId,
    //   startTime: bulkRescheduleData?.startTime,
    //   endTime: bulkRescheduleData?.endTime,
    //   slotIds: bulkRescheduleData?.slotIds,
    //   reason: bulkRescheduleData?.reason,
    // };

    // // bulk reschedule api call
    // const resBulkHearing = await handleApiCall(
    //   () => bulk_hearing_reschedule(tenantId, BulkReschedule, requestInfo),
    //   "Failed to query hearing service"
    // );

    const resBulkHearingData = bulkRescheduleData?.hearings;
    // console.debug("hearings : ", resBulkHearingData);
    // if (!resBulkHearingData) {
    //   return renderError(res, "Hearing not found during given slot", 404);
    // }

    // Extract filingNumber from the response
    const criteria = resBulkHearingData?.map((hearing) => ({
      filingNumber: hearing?.filingNumber?.[0],
      courtId: courtId,
    }));

    // case api call
    const resCase = await handleApiCall(
      () => search_multiple_cases(criteria, tenantId, requestInfo),
      "Failed to query case service"
    );

    const courtCase = resCase?.data?.criteria;
    if (!courtCase) {
      return renderError(res, "Court case not found", 404);
    }

    // preparting the hearing reschedule data
    const bulkHearingRescheduleList = courtCase?.map((caseItem) => {
      const caseDate = caseItem?.responseList?.[0];
      const matchingHearing = resBulkHearingData?.find(
        (hearing) => hearing?.filingNumber?.[0] === caseDate?.filingNumber
      );

      const caseNumber =
        (caseDate?.isLPRCase
          ? caseDate?.lprNumber
          : caseDate?.courtCaseNumber) ||
        caseDate?.cmpNumber ||
        "";
      const caseTitle = caseDate?.caseTitle || "";
      const originalHearingDate =
        formatDate(
          new Date(matchingHearing?.originalHearingDate),
          "DD-MM-YYYY"
        ) || "";
      const newHearingDate =
        formatDate(new Date(matchingHearing?.startTime), "DD-MM-YYYY") || "";
      const newHearingSlot = _getHearingSlots(
        mdmsCourtSlots,
        matchingHearing?.startTime
      );

      const hearingType =
        messagesMap?.[matchingHearing?.hearingType] ||
        matchingHearing?.hearingType;

      return {
        caseName: caseTitle,
        caseNumber: caseNumber,
        hearingType: hearingType,
        originalHearingDate: originalHearingDate,
        newHearingDate: newHearingDate,
        newHearingSlot: newHearingSlot,
      };
    });

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

    const courtCaseJudgeDetails = await getCourtAndJudgeDetails(
      res,
      tenantId,
      "Judge",
      courtId,
      requestInfo
    );

    const mdmsCourtRoom = courtCaseJudgeDetails.mdmsCourtRoom;
    const judgeDetails = courtCaseJudgeDetails.judgeDetails;
    const currentDate = new Date();
    const formattedToday = formatDate(currentDate, "DD-MM-YYYY");

    const data = {
      Data: [
        {
          courtName: mdmsCourtRoom.name,
          date: formattedToday,
          reasonForRescheduling: bulkRescheduleData?.reason?.name || "",
          bulkHearingResheduleList: bulkHearingRescheduleList,
          additionalComments: bulkRescheduleData?.additionalComments || "",
          judgeSignature: judgeDetails.judgeSignature,
          judgeName: judgeDetails.name,
          judgeDesignation: judgeDetails.judgeDesignation,
          courtSeal: judgeDetails.courtSeal,
          qrCodeUrl: base64Url,
        },
      ],
    };

    const pdfKey =
      qrCode === "true"
        ? config.pdf.hearing_bulk_reschedule_qr
        : config.pdf.hearing_bulk_reschedule;

    // pdf creation api call
    const pdfResponse = await handleApiCall(
      () => create_pdf(tenantId, pdfKey, data, { RequestInfo: requestInfo }),
      "Failed to generate PDF of Bulk Reschedule Hearing"
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
      "Failed to create PDF for Bulk Reschedule Hearing",
      500,
      ex
    );
  }
};

module.exports = hearingBulkReschedule;
