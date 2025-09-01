const cheerio = require("cheerio");
const config = require("../config");
const {
  search_case,
  search_sunbirdrc_credential_service,
  create_pdf,
  search_message,
  search_hearing,
} = require("../api");
const { renderError } = require("../utils/renderError");
const { formatDate } = require("./formatDate");
const { handleApiCall } = require("../utils/handleApiCall");
const { getStringAddressDetails } = require("../utils/addressUtils");

async function newOrderGeneric(req, res, qrCode, order, courtCaseJudgeDetails) {
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

    const resMessage = await handleApiCall(
      res,
      () => search_message(tenantId, "rainmaker-common", "en_IN", requestInfo),
      "Failed to query Localized messages"
    );
    const messages = resMessage?.data?.messages;
    const messagesMap = messages.reduce((acc, curr) => {
      acc[curr.code] = curr.message;
      return acc;
    }, {});

    const resHearing = await handleApiCall(
      res,
      () => search_hearing(tenantId, cnrNumber, requestInfo, order?.courtId),
      "Failed to query hearing service"
    );

    const hearingInProgress = resHearing?.data?.HearingList.find(
      (hearing) => hearing?.status === config.workFlowState.hearing.INPROGRESS
    );

    const hearingScheduled = resHearing?.data?.HearingList.find(
      (hearing) => hearing?.status === config.workFlowState.hearing.SCHEDULED
    );

    const mdmsCourtRoom = courtCaseJudgeDetails.mdmsCourtRoom;
    const judgeDetails = courtCaseJudgeDetails.judgeDetails;

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
    const caseNumber = courtCase?.isLPRCase
      ? courtCase?.lprNumber
      : courtCase?.courtCaseNumber || courtCase?.cmpNumber || "";

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

    const accusedList = [...joinedAccuseds, ...unJoinedAccuseds];

    const listOfPresentAttendees =
      order?.attendance?.Present?.map(
        (attendee) => messagesMap[attendee] || attendee
      )?.join(", ") || "";
    const listOfAbsentAttendees =
      order?.attendance?.Absent?.map(
        (attendee) => messagesMap[attendee] || attendee
      )?.join(", ") || "";
    const isHearingInProgress = !!hearingInProgress;
    const nextHearingDate = order?.nextHearingDate
      ? formatDate(new Date(order?.nextHearingDate), "DD-MM-YYYY")
      : hearingScheduled?.startTime
      ? formatDate(new Date(hearingScheduled?.startTime), "DD-MM-YYYY")
      : "";
    const purposeOfNextHearing =
      messagesMap[order?.purposeOfNextHearing || ""] ||
      messagesMap[hearingScheduled?.hearingType || ""] ||
      "";
    const isNextHearing = !!(
      (order?.nextHearingDate &&
        order?.purposeOfNextHearing &&
        hearingInProgress) ||
      hearingScheduled
    );

    const data = {
      Data: [
        {
          orderHeading: mdmsCourtRoom.orderHeading,
          judgeName: judgeDetails.name,
          judgeDesignation: judgeDetails.judgeDesignation,
          date: formattedToday,
          caseNumber,
          complainantList,
          accusedList,
          isHearingInProgress,
          listOfPresentAttendees,
          listOfAbsentAttendees,
          itemText: order?.itemText || "",
          isNextHearing,
          purposeOfNextHearing,
          nextHearingDate,
          judgeSignature: judgeDetails.judgeSignature,
          courtSeal: judgeDetails.courtSeal,
          qrCodeUrl: base64Url,
        },
      ],
    };

    // Generate the PDF
    const pdfKey =
      qrCode === "true"
        ? config.pdf.new_order_generic_qr
        : config.pdf.new_order_generic;

    const pdfResponse = await handleApiCall(
      res,
      () => create_pdf(tenantId, pdfKey, data, req.body),
      "Failed to generate PDF of generic order"
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
      "Failed to query details of generic order",
      500,
      ex
    );
  }
}

module.exports = newOrderGeneric;
