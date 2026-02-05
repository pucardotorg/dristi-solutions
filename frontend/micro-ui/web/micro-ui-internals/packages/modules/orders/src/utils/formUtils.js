import { formatDate, generateAddress } from "./orderUtils";
import { applicationTypes } from "./constants";

/**
 * Gets default values for form fields based on order type and context
 * @param {Object} params - Configuration object containing all required parameters
 * @returns {Object} Default form values
 */
export const getDefaultFormValue = ({
  currentOrder,
  orderTypeData,
  orderType,
  applicationData,
  caseDetails,
  uuidNameMap,
  allAdvocates,
  courtRooms,
  publishedBailOrder,
  hearingsList,
  isHearingScheduled,
  isHearingInPassedOver,
  hearingDetails,
  skipScheduling,
  setValueRef,
  index,
}) => {
  if (currentOrder?.orderType && !currentOrder?.additionalDetails?.formdata) {
    return {
      orderType: {
        ...orderTypeData?.find((item) => item.code === currentOrder?.orderType),
      },
    };
  }

  const newCurrentOrder =
    currentOrder?.orderCategory === "COMPOSITE"
      ? {
          ...currentOrder,
          additionalDetails: currentOrder?.compositeItems?.[index]?.orderSchema?.additionalDetails,
          orderDetails: currentOrder?.compositeItems?.[index]?.orderSchema?.orderDetails,
          orderType: currentOrder?.compositeItems?.[index]?.orderType,
        }
      : currentOrder;

  let updatedFormdata = newCurrentOrder?.additionalDetails?.formdata || {};
  const currentOrderType = newCurrentOrder?.orderType || orderType?.code || "";
  const newApplicationDetails = applicationData?.applicationList?.find(
    (application) => application?.applicationNumber === newCurrentOrder?.additionalDetails?.formdata?.refApplicationId
  );

  // Handle JUDGEMENT order type
  if (currentOrderType === "JUDGEMENT") {
    handleJudgementOrder({ updatedFormdata, caseDetails, uuidNameMap, allAdvocates, courtRooms, publishedBailOrder, hearingsList, setValueRef, index });
  }

  // Handle BAIL order type
  if (currentOrderType === "BAIL") {
    handleBailOrder({ updatedFormdata, newApplicationDetails, setValueRef, index });
  }

  // Handle SET_BAIL_TERMS order type
  if (currentOrderType === "SET_BAIL_TERMS") {
    handleSetBailTerms({ updatedFormdata, newApplicationDetails, setValueRef, index });
  }

  // Handle REJECT_BAIL order type
  if (currentOrderType === "REJECT_BAIL") {
    handleRejectBail({ updatedFormdata, newApplicationDetails, setValueRef, index });
  }

  // Handle EXTENSION_OF_DOCUMENT_SUBMISSION_DATE order type
  if (currentOrderType === "EXTENSION_OF_DOCUMENT_SUBMISSION_DATE") {
    handleExtensionOrder({ updatedFormdata, newApplicationDetails, applicationTypes, setValueRef, index });
  }

  // Handle SUMMONS order type
  if (currentOrderType === "SUMMONS") {
    handleSummonsOrder({
      updatedFormdata,
      newCurrentOrder,
      isHearingScheduled,
      isHearingInPassedOver,
      hearingDetails,
      skipScheduling,
      caseDetails,
      setValueRef,
      index,
    });
  }

  // Handle NOTICE order type
  if (currentOrderType === "NOTICE") {
    handleNoticeOrder({
      updatedFormdata,
      newCurrentOrder,
      isHearingScheduled,
      isHearingInPassedOver,
      hearingDetails,
      skipScheduling,
      caseDetails,
      setValueRef,
      index,
    });
  }

  // Handle WARRANT, PROCLAMATION, ATTACHMENT, MISCELLANEOUS_PROCESS order types
  if (["WARRANT", "PROCLAMATION", "ATTACHMENT", "MISCELLANEOUS_PROCESS"].includes(currentOrderType)) {
    handleWarrantAndRelatedOrders({
      updatedFormdata,
      newCurrentOrder,
      isHearingScheduled,
      isHearingInPassedOver,
      hearingDetails,
      skipScheduling,
      setValueRef,
      index,
    });
  }

  // Handle REFERRAL_CASE_TO_ADR order type
  if (currentOrderType === "REFERRAL_CASE_TO_ADR") {
    handleReferralOrder({
      updatedFormdata,
      newCurrentOrder,
      isHearingScheduled,
      isHearingInPassedOver,
      hearingDetails,
      skipScheduling,
      setValueRef,
      index,
    });
  }

  // Handle rescheduling related order types
  if (
    [
      "RESCHEDULE_OF_HEARING_DATE",
      "REJECTION_RESCHEDULE_REQUEST",
      "APPROVAL_RESCHEDULE_REQUEST",
      "INITIATING_RESCHEDULING_OF_HEARING_DATE",
      "CHECKOUT_ACCEPTANCE",
      "CHECKOUT_REJECT",
      "ACCEPT_RESCHEDULING_REQUEST",
    ].includes(currentOrderType)
  ) {
    handleReschedulingOrders({ updatedFormdata, newCurrentOrder, newApplicationDetails, setValueRef, index });
  }

  return {
    ...updatedFormdata,
    orderType,
  };
};

// Helper functions for different order types
const handleJudgementOrder = ({ updatedFormdata, caseDetails, uuidNameMap, allAdvocates, courtRooms, publishedBailOrder, hearingsList, setValueRef, index }) => {
  const complainantPrimary = caseDetails?.litigants?.find((item) => item?.partyType?.includes("complainant.primary"));
  const respondentPrimary = caseDetails?.litigants?.find((item) => item?.partyType?.includes("respondent.primary"));

  const updateField = (field, value) => {
    updatedFormdata[field] = value;
    setValueRef?.current?.[index]?.(field, value);
  };

  updateField("nameofComplainant", complainantPrimary?.additionalDetails?.fullName);
  updateField("nameofRespondent", respondentPrimary?.additionalDetails?.fullName);
  updateField("nameofComplainantAdvocate", uuidNameMap?.[allAdvocates?.[complainantPrimary?.additionalDetails?.uuid]] || "");
  updateField("nameofRespondentAdvocate", uuidNameMap?.[allAdvocates?.[respondentPrimary?.additionalDetails?.uuid]] || "");
  updateField("caseNumber", (caseDetails?.isLPRCase ? caseDetails?.lprNumber : caseDetails?.courtCaseNumber) || caseDetails?.courtCaseNumber);
  updateField("nameOfCourt", courtRooms.find((room) => room.code === caseDetails?.courtId)?.name);
  updateField(
    "addressRespondant",
    generateAddress(caseDetails?.additionalDetails?.respondentDetails?.formdata?.[0]?.data?.addressDetails?.map((data) => data?.addressDetails)?.[0])
  );
  updateField("dateChequeReturnMemo", formatDate(new Date(caseDetails?.caseDetails?.chequeDetails?.formdata?.[0]?.data?.depositDate)));
  updateField("dateFiling", formatDate(new Date(caseDetails?.filingDate)));
  updateField("dateApprehension", formatDate(new Date(publishedBailOrder?.auditDetails?.lastModifiedTime)) || "");
  updateField("dateofReleaseOnBail", formatDate(new Date(publishedBailOrder?.auditDetails?.lastModifiedTime)) || "");
  updateField("dateofCommencementTrial", formatDate(new Date(publishedBailOrder?.auditDetails?.lastModifiedTime)) || "");
  updateField("dateofCloseTrial", formatDate(new Date(hearingsList?.[hearingsList?.length - 2]?.startTime)));
  updateField("dateofSentence", formatDate(new Date(hearingsList?.[hearingsList?.length - 1]?.startTime)));
  updateField("offense", "Section 138 of Negotiable Instruments Act");
};

const handleBailOrder = ({ updatedFormdata, newApplicationDetails, setValueRef, index }) => {
  updatedFormdata.bailType = { type: newApplicationDetails?.applicationType };
  setValueRef?.current?.[index]?.("bailType", updatedFormdata.bailType);

  updatedFormdata.submissionDocuments = newApplicationDetails?.additionalDetails?.formdata?.submissionDocuments;
  setValueRef?.current?.[index]?.("submissionDocuments", updatedFormdata.submissionDocuments);

  updatedFormdata.bailOf = newApplicationDetails?.additionalDetails?.onBehalOfName;
  setValueRef?.current?.[index]?.("bailOf", updatedFormdata.bailOf);
};

const handleSetBailTerms = ({ updatedFormdata, newApplicationDetails, setValueRef, index }) => {
  updatedFormdata.partyId = newApplicationDetails?.createdBy;
  setValueRef?.current?.[index]?.("partyId", updatedFormdata.partyId);
};

const handleRejectBail = ({ updatedFormdata, newApplicationDetails, setValueRef, index }) => {
  updatedFormdata.bailParty = newApplicationDetails?.additionalDetails?.onBehalOfName;
  updatedFormdata.submissionDocuments = {
    uploadedDocs:
      newApplicationDetails?.additionalDetails?.formdata?.supportingDocuments?.flatMap((doc) => doc.submissionDocuments?.uploadedDocs || []) || [],
  };
  setValueRef?.current?.[index]?.("bailParty", updatedFormdata.bailParty);
  setValueRef?.current?.[index]?.("submissionDocuments", updatedFormdata.submissionDocuments);
};

const handleExtensionOrder = ({ updatedFormdata, newApplicationDetails, applicationTypes, setValueRef, index }) => {
  if (newApplicationDetails?.applicationType === applicationTypes.EXTENSION_SUBMISSION_DEADLINE) {
    updatedFormdata.documentName = newApplicationDetails?.additionalDetails?.formdata?.documentType?.value;
    setValueRef?.current?.[index]?.("documentName", updatedFormdata.documentName);

    updatedFormdata.originalDeadline = newApplicationDetails?.additionalDetails?.formdata?.initialSubmissionDate;
    setValueRef?.current?.[index]?.("originalDeadline", updatedFormdata.originalDeadline);
  }
};

const handleSummonsOrder = ({
  updatedFormdata,
  newCurrentOrder,
  isHearingScheduled,
  isHearingInPassedOver,
  hearingDetails,
  skipScheduling,
  caseDetails,
  setValueRef,
  index,
}) => {
  const scheduleHearingOrderItem = newCurrentOrder?.compositeItems?.find(
    (item) => item?.isEnabled && ["SCHEDULE_OF_HEARING_DATE", "SCHEDULING_NEXT_HEARING"].includes(item?.orderType)
  );
  const rescheduleHearingItem = newCurrentOrder?.compositeItems?.find(
    (item) =>
      item?.isEnabled && ["RESCHEDULE_OF_HEARING_DATE", "CHECKOUT_ACCEPTANCE", "ASSIGNING_DATE_RESCHEDULED_HEARING"].includes(item?.orderType)
  );

  if (scheduleHearingOrderItem) {
    updatedFormdata.dateForHearing = scheduleHearingOrderItem?.orderSchema?.additionalDetails?.formdata?.hearingDate || "";
  } else if (rescheduleHearingItem) {
    updatedFormdata.dateForHearing = rescheduleHearingItem?.orderSchema?.additionalDetails?.formdata?.newHearingDate || "";
  } else if (isHearingScheduled || isHearingInPassedOver) {
    updatedFormdata.dateForHearing = formatDate(new Date(hearingDetails?.startTime));
  } else if (newCurrentOrder?.nextHearingDate && !skipScheduling) {
    updatedFormdata.dateForHearing = formatDate(new Date(newCurrentOrder?.nextHearingDate));
  } else if (!newCurrentOrder?.nextHearingDate && skipScheduling) {
    updatedFormdata.dateForHearing = "";
  }
  setValueRef?.current?.[index]?.("dateForHearing", updatedFormdata.dateForHearing);

  if (newCurrentOrder?.additionalDetails?.selectedParty && newCurrentOrder?.additionalDetails?.selectedParty?.uuid) {
    updatedFormdata.SummonsOrder = {
      party: caseDetails?.additionalDetails?.respondentDetails?.formdata
        ?.filter((data) => data?.data?.uuid === newCurrentOrder?.additionalDetails?.selectedParty?.uuid)
        ?.map((item) => ({
          ...item,
          data: {
            ...item.data,
            firstName: item?.data?.respondentFirstName,
            lastName: item?.data?.respondentLastName,
            address: item?.data?.addressDetails.map((address) => ({
              locality: address?.addressDetails?.locality,
              city: address.addressDetails.city,
              district: address?.addressDetails?.district,
              pincode: address?.addressDetails?.pincode,
            })),
            partyType: "Respondent",
            phone_numbers: item?.data?.phonenumbers?.mobileNumber || [],
            email: item?.data?.emails?.emailId,
          },
        }))?.[0],
      selectedChannels: newCurrentOrder?.additionalDetails?.formdata?.SummonsOrder?.selectedChannels,
    };
    setValueRef?.current?.[index]?.("SummonsOrder", updatedFormdata.SummonsOrder);
  }
};

const handleNoticeOrder = ({
  updatedFormdata,
  newCurrentOrder,
  isHearingScheduled,
  isHearingInPassedOver,
  hearingDetails,
  skipScheduling,
  caseDetails,
  setValueRef,
  index,
}) => {
  const scheduleHearingOrderItem = newCurrentOrder?.compositeItems?.find(
    (item) => item?.isEnabled && ["SCHEDULE_OF_HEARING_DATE", "SCHEDULING_NEXT_HEARING"].includes(item?.orderType)
  );
  const rescheduleHearingItem = newCurrentOrder?.compositeItems?.find(
    (item) =>
      item?.isEnabled && ["RESCHEDULE_OF_HEARING_DATE", "CHECKOUT_ACCEPTANCE", "ASSIGNING_DATE_RESCHEDULED_HEARING"].includes(item?.orderType)
  );

  if (scheduleHearingOrderItem) {
    updatedFormdata.dateForHearing = scheduleHearingOrderItem?.orderSchema?.additionalDetails?.formdata?.hearingDate || "";
  } else if (rescheduleHearingItem) {
    updatedFormdata.dateForHearing = rescheduleHearingItem?.orderSchema?.additionalDetails?.formdata?.newHearingDate || "";
  } else if (isHearingScheduled || isHearingInPassedOver) {
    updatedFormdata.dateForHearing = formatDate(new Date(hearingDetails?.startTime));
  } else if (newCurrentOrder?.nextHearingDate && !skipScheduling) {
    updatedFormdata.dateForHearing = formatDate(new Date(newCurrentOrder?.nextHearingDate));
  } else if (!newCurrentOrder?.nextHearingDate && skipScheduling) {
    updatedFormdata.dateForHearing = "";
  }
  setValueRef?.current?.[index]?.("dateForHearing", updatedFormdata.dateForHearing);

  const partyUuid = newCurrentOrder?.additionalDetails?.selectedParty?.uuid;
  if (partyUuid) {
    updatedFormdata.noticeOrder = {
      party: caseDetails?.additionalDetails?.respondentDetails?.formdata
        ?.filter((data) => data?.data?.uuid === partyUuid)
        ?.map((item) => ({
          ...item,
          data: {
            ...item.data,
            firstName: item.data.respondentFirstName,
            lastName: item.data.respondentLastName,
            address: item.data.addressDetails.map((address) => ({
              locality: address.addressDetails.locality,
              city: address.addressDetails.city,
              district: address?.addressDetails?.district,
              pincode: address?.addressDetails?.pincode,
            })),
            partyType: "Respondent",
            phone_numbers: item?.data?.phonenumbers?.mobileNumber || [],
            email: item?.data?.emails?.emailId,
          },
        })),
    };
    setValueRef?.current?.[index]?.("noticeOrder", updatedFormdata.noticeOrder);
  }
};

const handleWarrantAndRelatedOrders = ({
  updatedFormdata,
  newCurrentOrder,
  isHearingScheduled,
  isHearingInPassedOver,
  hearingDetails,
  skipScheduling,
  setValueRef,
  index,
}) => {
  const scheduleHearingOrderItem = newCurrentOrder?.compositeItems?.find(
    (item) => item?.isEnabled && ["SCHEDULE_OF_HEARING_DATE", "SCHEDULING_NEXT_HEARING"].includes(item?.orderType)
  );
  const rescheduleHearingItem = newCurrentOrder?.compositeItems?.find(
    (item) =>
      item?.isEnabled &&
      ["RESCHEDULE_OF_HEARING_DATE", "CHECKOUT_ACCEPTANCE", "INITIATING_RESCHEDULING_OF_HEARING_DATE"].includes(item?.orderType)
  );

  if (scheduleHearingOrderItem) {
    updatedFormdata.dateOfHearing = scheduleHearingOrderItem?.orderSchema?.additionalDetails?.formdata?.hearingDate || "";
  } else if (rescheduleHearingItem) {
    updatedFormdata.dateOfHearing = rescheduleHearingItem?.orderSchema?.additionalDetails?.formdata?.newHearingDate || "";
  } else if (isHearingScheduled || isHearingInPassedOver) {
    updatedFormdata.dateOfHearing = formatDate(new Date(hearingDetails?.startTime));
  } else if (newCurrentOrder?.nextHearingDate && !skipScheduling) {
    updatedFormdata.dateOfHearing = formatDate(new Date(newCurrentOrder?.nextHearingDate));
  } else if (!newCurrentOrder?.nextHearingDate && skipScheduling) {
    updatedFormdata.dateOfHearing = "";
  }
  setValueRef?.current?.[index]?.("dateOfHearing", updatedFormdata.dateOfHearing);
};

const handleReferralOrder = ({
  updatedFormdata,
  newCurrentOrder,
  isHearingScheduled,
  isHearingInPassedOver,
  hearingDetails,
  skipScheduling,
  setValueRef,
  index,
}) => {
  const scheduleHearingOrderItem = newCurrentOrder?.compositeItems?.find(
    (item) => item?.isEnabled && ["SCHEDULE_OF_HEARING_DATE", "SCHEDULING_NEXT_HEARING"].includes(item?.orderType)
  );
  const rescheduleHearingItem = newCurrentOrder?.compositeItems?.find(
    (item) =>
      item?.isEnabled && ["RESCHEDULE_OF_HEARING_DATE", "CHECKOUT_ACCEPTANCE", "ASSIGNING_DATE_RESCHEDULED_HEARING"].includes(item?.orderType)
  );

  if (scheduleHearingOrderItem) {
    updatedFormdata.hearingDate = scheduleHearingOrderItem?.orderSchema?.additionalDetails?.formdata?.hearingDate || "";
  } else if (rescheduleHearingItem) {
    updatedFormdata.hearingDate = rescheduleHearingItem?.orderSchema?.additionalDetails?.formdata?.newHearingDate || "";
  } else if (isHearingScheduled || isHearingInPassedOver) {
    updatedFormdata.hearingDate = formatDate(new Date(hearingDetails?.startTime));
  } else if (newCurrentOrder?.nextHearingDate && !skipScheduling) {
    updatedFormdata.hearingDate = formatDate(new Date(newCurrentOrder?.nextHearingDate));
  } else if (!newCurrentOrder?.nextHearingDate && skipScheduling) {
    updatedFormdata.hearingDate = "";
  }
  setValueRef?.current?.[index]?.("hearingDate", updatedFormdata.hearingDate);
};

const handleReschedulingOrders = ({ updatedFormdata, newCurrentOrder, newApplicationDetails, setValueRef, index }) => {
  updatedFormdata.originalHearingDate =
    newCurrentOrder?.additionalDetails?.formdata?.originalHearingDate ||
    newApplicationDetails?.additionalDetails?.formdata?.initialHearingDate ||
    "";
  setValueRef?.current?.[index]?.("originalHearingDate", updatedFormdata.originalHearingDate);
};
