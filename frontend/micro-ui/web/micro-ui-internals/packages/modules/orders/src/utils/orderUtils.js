import React from "react";
import { formatAddress, mapAddressDetails, getComplainantName, getRespondantName } from ".";
import { DateUtils } from "@egovernments/digit-ui-module-dristi/src/Utils";
import { getCourtFee } from "./orderApiCallUtils";

export { CloseBtn, Heading } from "@egovernments/digit-ui-module-dristi/src/components/ModalComponents";

export const prepareUpdatedOrderData = (currentOrder, orderFormData, compOrderIndex) => {
  let updatedCompositeItems = null;
  let updatedCurrentOrder = { ...currentOrder };

  if (updatedCurrentOrder?.orderCategory === "COMPOSITE") {
    updatedCompositeItems = updatedCurrentOrder?.compositeItems?.map((compItem, compIndex) => {
      if (compIndex === compOrderIndex) {
        return {
          ...compItem,
          orderType: orderFormData?.orderType?.code,
          orderSchema: {
            ...(compItem?.orderSchema || {}),
            additionalDetails: {
              ...(compItem?.orderSchema?.additionalDetails || {}),
              formdata: orderFormData,
            },
          },
        };
      }
      return compItem;
    });
  }

  return {
    ...updatedCurrentOrder,
    comments:
      orderFormData?.comments?.text ||
      orderFormData?.additionalComments?.text ||
      orderFormData?.otherDetails?.text ||
      orderFormData?.sentence?.text ||
      orderFormData?.briefSummary ||
      "",
    orderTitle: updatedCurrentOrder?.orderCategory !== "COMPOSITE" ? orderFormData?.orderType?.code : updatedCurrentOrder?.orderTitle,
    orderCategory: updatedCurrentOrder?.orderCategory,
    orderType: updatedCurrentOrder?.orderCategory !== "COMPOSITE" ? orderFormData?.orderType?.code : null,
    compositeItems: updatedCurrentOrder?.orderCategory !== "COMPOSITE" ? null : updatedCompositeItems,
    additionalDetails:
      updatedCurrentOrder?.orderCategory !== "COMPOSITE" ? { ...updatedCurrentOrder?.additionalDetails, formdata: orderFormData } : null,
    orderDetails: updatedCurrentOrder?.orderCategory !== "COMPOSITE" ? updatedCurrentOrder?.orderDetails : null,
  };
};

export const getUpdateDocuments = (documents, documentsFile, signedDoucumentUploadedID, fileStoreIds) => {
  if (!documentsFile) return documents;

  if (documentsFile?.documentType === "UNSIGNED") {
    const existingUnsignedDoc = documents?.find((doc) => doc?.documentType === "UNSIGNED");

    if (existingUnsignedDoc) {
      return documents?.map((doc) =>
        doc?.documentType === "UNSIGNED"
          ? {
            ...doc,
            fileStore: documentsFile?.fileStore,
            additionalDetails: documentsFile?.additionalDetails,
          }
          : doc
      );
    }
  }

  if (documentsFile?.documentType === "SIGNED") {
    const localStorageID = sessionStorage.getItem("fileStoreId");
    const newFileStoreId = localStorageID || signedDoucumentUploadedID;
    fileStoreIds.delete(newFileStoreId);
    let index = 1;
    for (const fileStoreId of fileStoreIds) {
      if (fileStoreId !== newFileStoreId) {
        documents.push({
          isActive: false,
          documentType: "UNSIGNED",
          fileStore: fileStoreId,
          documentOrder: index,
        });
        index++;
      }
    }
  }
  return [...documents, documentsFile];
};

export const getFormData = (orderType, order) => {
  const formDataKeyMap = {
    SUMMONS: "SummonsOrder",
    WARRANT: "warrantFor",
    NOTICE: "noticeOrder",
    PROCLAMATION: "proclamationFor",
    ATTACHMENT: "attachmentFor",
  };
  const formDataKey = formDataKeyMap[orderType];
  return order?.additionalDetails?.formdata?.[formDataKey];
};

export const getOrderData = (orderType, orderFormData) => {
  return ["SUMMONS", "NOTICE", "WARRANT", "PROCLAMATION", "ATTACHMENT"].includes(orderType) ? orderFormData?.party?.data : orderFormData;
};

export const generateAddress = ({
  pincode = "",
  district = "",
  city = "",
  state = "",
  coordinates = { longitude: "", latitude: "" },
  locality = "",
  address = "",
} = {}) => {
  if (address) {
    return address;
  }
  return `${locality ? `${locality},` : ""} ${district ? `${district},` : ""} ${city ? `${city},` : ""} ${state ? `${state},` : ""} ${pincode ? `- ${pincode}` : ""
    }`.trim();
};

export const channelTypeEnum = {
  "e-Post": { code: "POST", type: "Post" },
  "Registered Post": { code: "RPAD", type: "RPAD" },
  SMS: { code: "SMS", type: "SMS" },
  "Via Police": { code: "POLICE", type: "Police" },
  "E-mail": { code: "EMAIL", type: "Email" },
};

export const getMediationChangedFlag = (orderDetails, newOrderDetails) => {
  if (newOrderDetails?.adrMode !== "MEDIATION") return false;
  if (!orderDetails) return true;

  const keysToCheck = ["adrMode", "parties", "hearingDate", "modeOfSigning", "mediationCentre"];

  let isMediationChanged = false;

  for (const key of keysToCheck) {
    const oldValue = orderDetails[key];
    const newValue = newOrderDetails[key];

    if (key === "parties") {
      const oldLen = Array?.isArray(oldValue) ? oldValue?.length : 0;
      const newLen = Array?.isArray(newValue) ? newValue?.length : 0;

      if (oldLen !== newLen) {
        isMediationChanged = true;
        break;
      }
    } else {
      if (JSON?.stringify(oldValue) !== JSON?.stringify(newValue)) {
        isMediationChanged = true;
        break;
      }
    }
  }

  return isMediationChanged;
};

export const getParties = (type, orderSchema, allParties) => {
  let parties = [];
  if (["SCHEDULE_OF_HEARING_DATE", "SCHEDULING_NEXT_HEARING"].includes(type)) {
    parties = orderSchema?.orderDetails.partyName;
  } else if (type === "MANDATORY_SUBMISSIONS_RESPONSES") {
    parties = [
      ...(orderSchema?.orderDetails?.partyDetails?.partiesToRespond || []),
      ...(orderSchema?.orderDetails?.partyDetails?.partyToMakeSubmission || []),
    ];
  } else if (["WARRANT", "PROCLAMATION", "ATTACHMENT"].includes(type)) {
    parties = orderSchema?.orderDetails?.respondentName?.name
      ? [orderSchema?.orderDetails?.respondentName?.name]
      : orderSchema?.orderDetails?.respondentName
        ? [orderSchema?.orderDetails?.respondentName]
        : [];
  } else if (["SUMMONS", "NOTICE"].includes(type)) {
    parties = orderSchema?.orderDetails?.respondentName;
  } else if (type === "SECTION_202_CRPC") {
    parties = [orderSchema?.orderDetails?.applicationFilledBy, orderSchema?.orderDetails.soughtOfDetails];
  } else if (
    orderSchema?.orderDetails?.parties?.length > 0 &&
    ["BAIL", "REJECT_VOLUNTARY_SUBMISSIONS", "APPROVE_VOLUNTARY_SUBMISSIONS", "REJECTION_RESCHEDULE_REQUEST", "CHECKOUT_REJECT"].includes(type)
  ) {
    parties = orderSchema?.orderDetails?.parties?.map((party) => party?.partyName);
  } else if (["COST", "WITNESS_BATTA"]?.includes(type)) {
    parties = [orderSchema?.orderDetails?.paymentToBeMadeBy, orderSchema?.orderDetails.paymentToBeMadeTo];
  } else if (type === "REFERRAL_CASE_TO_ADR") {
    const complainants = allParties
      ?.filter((party) => party?.partyType === "complainant")
      .sort((a, b) => (a?.partyUuid || "").localeCompare(b?.partyUuid || ""));

    const respondents = allParties
      ?.filter((party) => party?.partyType === "respondent" && party?.isJoined === true)
      .sort((a, b) => (a?.partyUuid || "").localeCompare(b?.partyUuid || ""));

    const updatedComplainants = [...complainants]?.map((party, index) => ({
      partyName: party?.name?.replace(/\s*\(.*?\)\s*/g, "")?.trim(),
      partyType: party?.partyType,
      partyIndex: index + 1,
      poaUuid: party?.poaUuid,
      userUuid: party?.partyUuid,
      uniqueId: party?.partyUuid,
      mobileNumber: party?.mobileNumber,
    }));

    const updatedRespondents = [...respondents]?.map((party, index) => ({
      partyName: party?.name?.replace(/\s*\(.*?\)\s*/g, "")?.trim(),
      partyType: party?.partyType,
      partyIndex: index + 1,
      poaUuid: party?.poaUuid,
      userUuid: party?.partyUuid,
      uniqueId: party?.partyUuid,
      mobileNumber: party?.mobileNumber,
    }));

    parties = [...updatedComplainants, ...updatedRespondents];

    return parties;
  } else if (type === "MISCELLANEOUS_PROCESS") {
    let updatedPartiesdata = [];
    if (orderSchema?.orderDetails?.selectedPartiesDetails?.length > 0) {
      updatedPartiesdata = orderSchema?.orderDetails?.selectedPartiesDetails?.map((party) => {
        return {
          partyName: party?.selectedParty?.name,
          partyType: party?.selectedParty?.partyType,
        };
      });
    } else {
      updatedPartiesdata = orderSchema?.orderDetails?.selectAddresee?.map((party) => ({ partyName: party.name, partyType: party?.partyType }));
    }

    return updatedPartiesdata;
  } else {
    parties = allParties?.map((party) => ({ partyName: party.name, partyType: party?.partyType }));
    return parties;
  }
  const updatedParties = parties?.map((party) => {
    const matchingParty = allParties?.find((p) => [p?.code?.trim(), p?.name?.trim()]?.includes(party?.trim()));
    if (matchingParty) {
      return {
        partyName: matchingParty?.name,
        partyType: matchingParty?.partyType,
      };
    } else {
      return {
        partyName: party,
        partyType: "witness",
      };
    }
  });
  return updatedParties;
};

export const checkValidation = (t, formData, index, setFormErrors, setShowErrorToast) => {
  let hasError = false;
  const currentOrderType = formData?.orderType?.code || "";
  if (currentOrderType === "MANDATORY_SUBMISSIONS_RESPONSES") {
    if (!formData?.responseInfo?.responseDeadline && formData?.responseInfo?.isResponseRequired?.code === true) {
      setFormErrors?.current?.[index]?.("responseDeadline", { message: t("PROPOSED_DATE_CAN_NOT_BE_BEFORE_SUBMISSION_DEADLINE") });
      hasError = true;
    }
    if (
      (!formData?.responseInfo?.respondingParty || formData?.responseInfo?.respondingParty?.length === 0) &&
      formData?.responseInfo?.isResponseRequired?.code === true
    ) {
      setFormErrors?.current?.[index]?.("respondingParty", { message: t("CORE_REQUIRED_FIELD_ERROR") });
      hasError = true;
    }
  }

  if (currentOrderType === "ACCEPT_BAIL") {
    const bt = formData?.bailType;
    const bailTypeCode = (typeof bt === "string" ? bt : bt?.code || bt?.type || "").toUpperCase();
    const isSurety = bailTypeCode === "SURETY";

    if (isSurety) {
      const suretiesNum = Number(formData?.noOfSureties);
      const isInvalidSureties = !Number.isFinite(suretiesNum) || suretiesNum <= 0;
      if (isInvalidSureties) {
        setFormErrors?.current?.[index]?.("noOfSureties", { message: t?.("CORE_REQUIRED_FIELD_ERROR") });
        hasError = true;
      }
    }
  }

  // if (currentOrderType === "NOTICE") {
  //   if (formData?.noticeOrder?.selectedChannels?.length === 0) {
  //     setShowErrorToast({ label: t("PLESE_SELECT_A_DELIVERY_CHANNEL_FOR_NOTICE_ORDER"), error: true });
  //     hasError = true;
  //   }
  // }

  // if (currentOrderType === "SUMMONS") {
  //   if (formData?.SummonsOrder?.selectedChannels?.length === 0) {
  //     setShowErrorToast({ label: t("PLESE_SELECT_A_DELIVERY_CHANNEL_FOR_SUMMONS_ORDER"), error: true });
  //     hasError = true;
  //   } else if (
  //     formData?.SummonsOrder?.selectedChannels?.some(
  //       (channel) => channel?.code === "POLICE" && (!channel?.value?.geoLocationDetails || !channel?.value?.geoLocationDetails?.policeStation)
  //     )
  //   ) {
  //     setShowErrorToast({ label: t("CS_POLICE_STATION_ERROR"), error: true });
  //     hasError = true;
  //   }
  // }

  if (currentOrderType === "WARRANT") {
    if (!formData?.bailInfo?.noOfSureties && formData?.bailInfo?.isBailable?.code === true) {
      setFormErrors?.current?.[index]?.("noOfSureties", { message: t("CORE_REQUIRED_FIELD_ERROR") });
      hasError = true;
    }
    if (
      (!formData?.bailInfo?.bailableAmount || formData?.bailInfo?.bailableAmount?.slice(-1) === ".") &&
      formData?.bailInfo?.isBailable?.code === true
    ) {
      setFormErrors?.current?.[index]?.("bailableAmount", { message: t("CS_VALID_AMOUNT_DECIMAL") });
      hasError = true;
    }

    if (formData?.warrantFor?.selectedChannels?.length === 0) {
      setShowErrorToast({ label: t("PLESE_SELECT_ADDRESSS"), error: true });
      hasError = true;
    }

    if (
      formData?.warrantFor?.selectedChannels?.some(
        (channel) =>
          (channel?.code === "RPAD" || channel?.code === "POLICE") &&
          (!channel?.value?.geoLocationDetails || !channel?.value?.geoLocationDetails?.policeStation)
      )
    ) {
      setShowErrorToast({ label: t("CS_POLICE_STATION_ERROR"), error: true });
      hasError = true;
    }
  }

  if (currentOrderType === "PROCLAMATION") {
    if (formData?.proclamationFor?.selectedChannels?.length === 0) {
      setShowErrorToast({ label: t("PLESE_SELECT_ADDRESSS"), error: true });
      hasError = true;
    }

    if (
      formData?.proclamationFor?.selectedChannels?.some(
        (channel) =>
          (channel?.code === "RPAD" || channel?.code === "POLICE") &&
          (!channel?.value?.geoLocationDetails || !channel?.value?.geoLocationDetails?.policeStation)
      )
    ) {
      setShowErrorToast({ label: t("CS_POLICE_STATION_ERROR"), error: true });
      hasError = true;
    }
  }

  if (currentOrderType === "ATTACHMENT") {
    if (formData?.attachmentFor?.selectedChannels?.length === 0) {
      setShowErrorToast({ label: t("PLESE_SELECT_ADDRESSS"), error: true });
      hasError = true;
    }

    if (
      formData?.attachmentFor?.selectedChannels?.some(
        (channel) =>
          (channel?.code === "RPAD" || channel?.code === "POLICE") &&
          (!channel?.value?.geoLocationDetails || !channel?.value?.geoLocationDetails?.policeStation)
      )
    ) {
      setShowErrorToast({ label: t("CS_POLICE_STATION_ERROR"), error: true });
      hasError = true;
    }
  }

  if (currentOrderType && ["MISCELLANEOUS_PROCESS"]?.includes(currentOrderType)) {
    const isSelectAddreseeValid =
      Array.isArray(formData?.selectAddresee) &&
      formData?.selectAddresee?.length > 0 &&
      formData?.selectAddresee?.every((item) => item && Object.keys(item)?.length > 0);

    if (!isSelectAddreseeValid && formData?.selectAddresee) {
      setFormErrors?.current?.[index]?.("selectAddresee", { message: t("ERR_COMPLETE_ALL_PARTIES") });
      hasError = true;
    }

    const addressee = formData?.processTemplate?.addressee;

    if (addressee) {
      if (["POLICE", "OTHER"].includes(addressee)) {
        const isPartiesDetailsValid =
          Array.isArray(formData?.selectedPartiesDetails) &&
          formData?.selectedPartiesDetails?.length > 0 &&
          formData?.selectedPartiesDetails?.every(
            (item) => item?.selectedParty?.name && Array.isArray(item?.selectedAddresses) && item?.selectedAddresses?.length > 0
          );

        if (!isPartiesDetailsValid) {
          setFormErrors?.current?.[index]?.("selectedPartiesDetails", { message: t("ERR_COMPLETE_ALL_PARTIES") });
          hasError = true;
        }
      }
    }
  }

  return hasError;
};

export const getMandatoryFieldsErrors = (getModifiedFormConfig, currentOrder, currentInProgressHearing, skipScheduling) => {
  let errors = [];

  if (currentOrder?.orderCategory === "COMPOSITE") {
    for (let i = 0; i < currentOrder?.compositeItems?.length; i++) {
      const item = currentOrder?.compositeItems?.[i];
      if (!item?.isEnabled) continue;

      const formdata = item?.orderSchema?.additionalDetails?.formdata;
      const orderType = item?.orderType;

      const configForThisItem = getModifiedFormConfig(i);
      const itemErrors = [];

      if (!formdata) {
        itemErrors.push({ key: "ORDER_TYPE", errorMessage: "SELECT_ORDER_TYPE" });
        errors.push({ index: i, orderType: "NOT_PRESENT", errors: itemErrors });
        continue;
      }

      for (let p = 0; p < configForThisItem?.length; p++) {
        let body = configForThisItem?.[p]?.body || [];
        if (orderType === "REFERRAL_CASE_TO_ADR") {
          const isMediation = formdata?.ADRMode?.name === "MEDIATION";

          const mediationKeys = ["mediationCentre", "mediationNote", "modeOfSigning", "dateOfEndADR"];
          const hideForMediationEndKeys = ["dateOfEndADR"];

          body = body.map((field) => {
            const shouldHide =
              (mediationKeys?.includes(field?.key) && !isMediation) || (hideForMediationEndKeys?.includes(field?.key) && isMediation);
            return {
              ...field,
              populators: {
                ...field?.populators,
                hideInForm: shouldHide,
              },
            };
          });
        }
        for (let k = 0; k < body.length; k++) {
          const field = body[k];
          if (field?.populators?.hideInForm) continue;

          if (field?.isMandatory && !formdata[field?.key]) {
            itemErrors.push({
              key: field?.label || field?.key,
              errorMessage: "THIS_IS_MANDATORY_FIELD",
            });
          }
        }
      }

      if (["NOTICE", "SUMMONS", "WARRANT", "PROCLAMATION", "ATTACHMENT", "REFERRAL_CASE_TO_ADR"]?.includes(orderType)) {
        const hearingDate = formdata?.dateOfHearing || formdata?.dateForHearing || formdata?.hearingDate;
        const scheduleItem = currentOrder?.compositeItems?.find((item) => item?.orderType === "SCHEDULE_OF_HEARING_DATE");
        const acceptRescheduleRequest = currentOrder?.compositeItems?.find((item) => item?.orderType === "ACCEPT_RESCHEDULING_REQUEST");

        if (acceptRescheduleRequest && !scheduleItem && hearingDate) {
          const dateChanged =
            !currentOrder?.nextHearingDate &&
            DateUtils.getFormattedDate(new Date(acceptRescheduleRequest?.orderSchema?.orderDetails?.newHearingDate), "YYYY-MM-DD") !== hearingDate;
          if (dateChanged) {
            itemErrors?.push({
              key: "DATE_OF_HEARING",
              errorMessage: "THIS_DOES_NOT_MATCH_WITH_NEXT_HEARING_DATE",
            });
          }
        } else if (scheduleItem && hearingDate) {
          const dateChanged =
            !currentOrder?.nextHearingDate &&
            DateUtils.getFormattedDate(new Date(scheduleItem?.orderSchema?.orderDetails?.hearingDate), "YYYY-MM-DD") !== hearingDate;
          if (dateChanged) {
            itemErrors?.push({
              key: "DATE_OF_HEARING",
              errorMessage: "THIS_DOES_NOT_MATCH_WITH_NEXT_HEARING_DATE",
            });
          }
        } else if (currentOrder?.nextHearingDate && hearingDate) {
          const dateChanged = DateUtils.getFormattedDate(new Date(currentOrder?.nextHearingDate), "YYYY-MM-DD") !== hearingDate;
          if (dateChanged) {
            itemErrors?.push({
              key: "DATE_OF_HEARING",
              errorMessage: "THIS_DOES_NOT_MATCH_WITH_NEXT_HEARING_DATE",
            });
          }
        }
      }

      errors.push({ index: i, orderType, errors: itemErrors });
    }
  } else {
    const formdata = currentOrder?.additionalDetails?.formdata;
    const orderType = currentOrder?.orderType;
    const isHearing = Boolean(currentInProgressHearing) || Boolean(currentOrder?.hearingNumber);
    const applySkipRules = isHearing && Boolean(skipScheduling);

    const configForThisItem = getModifiedFormConfig(0);
    const itemErrors = [];

    if (isHearing) {
      if (applySkipRules) {
        if (!orderType || !formdata) {
          if (!orderType) itemErrors.push({ key: "ORDER_TYPE", errorMessage: "SELECT_ORDER_TYPE" });
          if (!formdata) itemErrors.push({ key: "ORDER_FORM", errorMessage: "THIS_IS_MANDATORY_FIELD" });
          errors.push({ index: 0, orderType: orderType || "NOT_PRESENT", errors: itemErrors });
          return errors;
        }
      } else {
        if (!orderType || !formdata) {
          return errors;
        }
      }
    } else {
      if (!formdata) {
        itemErrors.push({ key: "ORDER_TYPE", errorMessage: "SELECT_ORDER_TYPE" });
        errors.push({ index: 0, orderType: orderType || "NOT_PRESENT", errors: itemErrors });
        return errors;
      }
    }

    for (let p = 0; p < configForThisItem?.length; p++) {
      let body = configForThisItem?.[p]?.body || [];
      if (orderType === "REFERRAL_CASE_TO_ADR") {
        const isMediation = formdata?.ADRMode?.name === "MEDIATION";

        const mediationKeys = ["mediationCentre", "mediationNote", "modeOfSigning", "dateOfEndADR"];
        const hideForMediationEndKeys = ["dateOfEndADR"];

        body = body.map((field) => {
          const shouldHide = (mediationKeys?.includes(field?.key) && !isMediation) || (hideForMediationEndKeys?.includes(field?.key) && isMediation);
          return {
            ...field,
            populators: {
              ...field?.populators,
              hideInForm: shouldHide,
            },
          };
        });
      }
      for (let k = 0; k < body.length; k++) {
        const field = body[k];
        if (field?.populators?.hideInForm) continue;

        if (field?.isMandatory && !formdata[field?.key]) {
          itemErrors.push({
            key: field?.label || field?.key,
            errorMessage: "THIS_IS_MANDATORY_FIELD",
          });
        }
      }
    }

    if (["NOTICE", "SUMMONS", "WARRANT", "PROCLAMATION", "ATTACHMENT", "REFERRAL_CASE_TO_ADR"]?.includes(orderType)) {
      const hearingDate = formdata?.dateOfHearing || formdata?.dateForHearing || formdata?.hearingDate;
      if (currentOrder?.nextHearingDate && hearingDate) {
        const dateChanged = DateUtils.getFormattedDate(new Date(currentOrder?.nextHearingDate), "YYYY-MM-DD") !== hearingDate;
        if (dateChanged) {
          itemErrors?.push({
            key: "DATE_OF_HEARING",
            errorMessage: "THIS_DOES_NOT_MATCH_WITH_NEXT_HEARING_DATE",
          });
        }
      }
    }

    errors.push({ index: 0, orderType, errors: itemErrors });
  }

  return errors;
};

// any order type from orderTypes can not be paired with any order from unAllowedOrderTypes when creating composite order.
export const compositeOrderAllowedTypes = [
  {
    key: "finalStageOrders",
    orderTypes: ["REFERRAL_CASE_TO_ADR", "JUDGEMENT", "WITHDRAWAL_ACCEPT", "SETTLEMENT_ACCEPT", "CASE_TRANSFER_ACCEPT", "DISMISS_CASE"],
    unAllowedOrderTypes: ["REFERRAL_CASE_TO_ADR", "JUDGEMENT", "WITHDRAWAL_ACCEPT", "SETTLEMENT_ACCEPT", "CASE_TRANSFER_ACCEPT", ""],
  },
  {
    key: "schedule_Reschedule",
    orderTypes: ["SCHEDULE_OF_HEARING_DATE", "RESCHEDULE_OF_HEARING_DATE"],
    unAllowedOrderTypes: ["SCHEDULE_OF_HEARING_DATE", "RESCHEDULE_OF_HEARING_DATE"],
  },
  {
    key: "accept_bail_singleton",
    orderTypes: ["ACCEPT_BAIL"],
    unAllowedOrderTypes: ["ACCEPT_BAIL"],
  },
  {
    key: "no_restriction",
    orderTypes: [
      "NOTICE",
      "OTHERS",
      "WARRANT",
      "SUMMONS",
      "MANDATORY_SUBMISSIONS_RESPONSES",
      "SECTION_202_CRPC",
      // "ACCEPT_BAIL",
      "PROCLAMATION",
      "ATTACHMENT",
      "COST",
      "WITNESS_BATTA",
    ],
    unAllowedOrderTypes: [],
  },
  {
    key: "admit_case",
    orderTypes: ["TAKE_COGNIZANCE"],
    unAllowedOrderTypes: ["TAKE_COGNIZANCE", "DISMISS_CASE"],
  },
];

export const _getPartiesOptions = (caseDetails, type = "all", isFlat = false) => {
  if (!caseDetails?.additionalDetails) return [];

  const mapParty = (item, index, partyRole) => {
    const addressData = item?.data?.addressDetails || item?.addressDetails;
    const addressArray = Array.isArray(addressData) ? addressData : addressData ? [addressData] : [];
    const mappedAddresses = mapAddressDetails(addressArray) || [];
    const complaintUUID = item?.data?.complainantVerification?.individualDetails?.userUuid;
    const uuid = item?.data?.userUuid || item?.userUuid || item?.data?.uuid || complaintUUID;

    const formattedAddressOptions = mappedAddresses?.map((addr) => ({
      partyUniqueId: uuid || item?.uniqueId,
      id: addr?.id,
      formattedAddress: formatAddress ? formatAddress(addr) : `${addr?.locality}, ${addr?.city}, ${addr?.pincode}`,
      locality: addr?.address?.locality || addr?.locality || "",
      city: addr?.address?.city || addr?.city || "",
      district: addr?.address?.district || addr?.district || "",
      pincode: addr?.address?.pincode || addr?.pincode || "",
      state: addr?.address?.state || addr?.state || "",
    }));

    const fName = item?.data?.firstName || item?.firstName || item?.data?.respondentFirstName || "";
    const mName = item?.data?.middleName || item?.middleName || item?.data?.respondentMiddleName || "";
    const lName = item?.data?.lastName || item?.lastName || item?.data?.respondentLastName || "";

    return {
      ...item,
      data: {
        name: `${fName} ${mName} ${lName}`.trim(),
        firstName: fName,
        lastName: lName,
        middleName: mName,
        partyType: partyRole,
        phone_numbers: item?.data?.mobileNumber || item?.mobileNumber || item?.data?.phonenumbers?.mobileNumber || [],
        email: item?.data?.emails?.emailId || [],
        uuid: uuid,
        partyIndex: `${partyRole}_${index}`,
        uniqueId: item?.uniqueId,
        age: item?.data?.respondentAge || item?.data?.complainantAge,
        partyUniqueId: uuid || item?.uniqueId,
      },
      address: formattedAddressOptions,
    };
  };

  const respondentData = caseDetails?.additionalDetails?.respondentDetails?.formdata || [];
  const complainantData = caseDetails?.additionalDetails?.complainantDetails?.formdata || [];

  let result = [];

  if (type === "respondent") {
    result = respondentData?.map((item, index) => mapParty(item, index, "Respondent"));
  }

  if (type === "complainant") {
    result = complainantData?.map((item, index) => mapParty(item, index, "Complainant"));
  }

  if (type === "all") {
    const allComplainants = complainantData?.map((item, index) => mapParty(item, index, "Complainant"));
    const allRespondents = respondentData?.map((item, index) => mapParty(item, index, "Respondent"));
    result = [...allComplainants, ...allRespondents];
  }

  return isFlat ? result?.map((item) => item?.data || {}) : result;
};

export const _getTaskPayload = (taskCaseDetails, orderData, filingDate, scheduleHearing, caseNumber, filingNumber) => {
  const orderDetails = orderData?.orderDetails || {};
  const selectAddresee = orderDetails?.selectAddresee || [];
  const processTemplateAddressee = orderDetails?.processTemplate?.addressee;

  const payload = selectAddresee?.map((data) => {
    let miscellaneuosDetails = null;
    let deliveryChannels = null;
    let partyDetails = null;
    let others = null;
    let policeDetails = null;
    let respondentDetails = null;
    let complainantDetails = null;

    miscellaneuosDetails = {
      ...orderDetails?.processTemplate,
      issueDate: orderData?.auditDetails?.lastModifiedTime,
      caseFilingDate: filingDate,
      nextHearingDate: scheduleHearing,
      caseNumber: caseNumber,
      filingNumber: filingNumber,
    };

    deliveryChannels = {
      channelName: "RPAD",
      status: "",
      statusChangeDate: "",
      channelCode: "RPAD",
      isPendingCollection: false,
    };

    if (["POLICE", "OTHER"]?.includes(processTemplateAddressee)) {
      partyDetails = orderDetails?.selectedPartiesDetails?.map((partyData) => {
        const { address, ...rest } = partyData?.selectedParty;
        return {
          party: rest,
          address: partyData?.selectedAddresses,
        };
      });
    }

    if (processTemplateAddressee === "POLICE") {
      policeDetails = data;
    } else if (processTemplateAddressee === "OTHER") {
      others = data;
    } else if (processTemplateAddressee === "RESPONDENT") {
      respondentDetails = {
        name: data?.name,
        phone: data?.phone_numbers?.[0] || "",
        email: data?.email?.[0] || "",
        age: "",
        gender: data?.age || "",
        uniqueId: data?.uniqueId,
      };
    } else {
      complainantDetails = {
        name: data?.name,
        phone: data?.phone_numbers?.[0] || "",
        email: data?.email?.[0] || "",
        age: "",
        gender: data?.age || "",
        uuid: data?.uuid || data?.uniqueId,
        uniqueId: data?.uuid || data?.uniqueId,
      };
    }

    return {
      caseDetails: taskCaseDetails,
      others,
      miscellaneuosDetails,
      partyDetails,
      policeDetails,
      deliveryChannels,
      respondentDetails,
      complainantDetails,
    };
  });

  return payload;
};

export const getRaiseBailBondReferenceId = ({ accusedKey, filingNumber }) => {
  try {
    const safeAccused = `_ACC_${accusedKey || "UNKNOWN"}`;
    return `MANUAL_RAISE_BAIL_BOND_${filingNumber}${safeAccused}`;
  } catch (e) {
    console.error(e);
    return `MANUAL_RAISE_BAIL_BOND_${filingNumber}_ACC_UNKNOWN`;
  }
};

export const createTaskPayload = async (
  orderType,
  orderDetails,
  { caseDetails, courtRoomData, tenantId, judgeName }
) => {
  let payload = {};
  const { litigants } = caseDetails;
  const complainantIndividualId = litigants?.find((item) => item?.partyType === "complainant.primary")?.individualId;

  const orderData = orderDetails?.order;
  const orderFormData = getFormData(orderType, orderData);
  const orderFormValue = orderDetails?.order?.additionalDetails?.formdata;
  const respondentNameData = getOrderData(orderType, orderFormData);
  const formDataKeyMap = {
    NOTICE: "noticeOrder",
    SUMMONS: "SummonsOrder",
    WARRANT: "warrantFor",
    PROCLAMATION: "proclamationFor",
    ATTACHMENT: "attachmentFor",
  };
  const selectedChannel = orderData?.additionalDetails?.formdata?.[formDataKeyMap[orderType]]?.selectedChannels;
  const noticeType = orderData?.additionalDetails?.formdata?.noticeType?.type;
  const respondentAddress = orderFormData?.addressDetails
    ? orderFormData?.addressDetails?.map((data) => ({ ...data?.addressDetails }))
    : respondentNameData?.address
      ? respondentNameData?.address
      : caseDetails?.additionalDetails?.respondentDetails?.formdata?.[0]?.data?.addressDetails?.map((data) => data?.addressDetails);
  const partyIndex = orderFormData?.party?.data?.partyIndex || "";
  const result = getRespondantName(respondentNameData);
  const respondentName = result?.name || result;
  const respondentPhoneNo = orderFormData?.party?.data?.phone_numbers || [];
  const respondentEmail = orderFormData?.party?.data?.email || [];
  const respondentUniqueId = orderFormData?.party?.data?.uniqueId || orderFormData?.party?.uniqueId || "";
  const complainantDetails = caseDetails?.additionalDetails?.complainantDetails?.formdata?.find(
    (d) => d?.data?.complainantVerification?.individualDetails?.individualId === complainantIndividualId
  )?.data;

  const state = complainantDetails?.addressDetails?.state || "";
  const district = complainantDetails?.addressDetails?.district || "";
  const city = complainantDetails?.addressDetails?.city || "";
  const pincode = complainantDetails?.addressDetails?.pincode || "";
  const latitude = complainantDetails?.addressDetails?.pincode?.latitude || "";
  const longitude = complainantDetails?.addressDetails?.pincode?.longitude || "";
  const complainantName = getComplainantName(complainantDetails);
  const locality = complainantDetails?.addressDetails?.locality || "";
  const complainantAddress = {
    pincode: pincode,
    district: district,
    city: city,
    state: state,
    coordinate: {
      longitude: longitude,
      latitude: latitude,
    },
    locality: locality,
  };
  const courtDetails = courtRoomData?.Court_Rooms?.find((data) => data?.code === caseDetails?.courtId);
  const ownerType = orderFormData?.party?.data?.ownerType;

  const respondentDetails = {
    name: respondentName,
    address: { ...respondentAddress?.[0], coordinate: respondentAddress?.[0]?.coordinates },
    phone: respondentPhoneNo[0] || "",
    email: respondentEmail[0] || "",
    age: "",
    gender: "",
    uniqueId: respondentUniqueId,
    ...(ownerType && { ownerType: ownerType }),
  };
  const caseRespondent = {
    name: caseDetails?.additionalDetails?.respondentDetails?.formdata?.[0]?.data?.respondentFirstName || "",
    address: caseDetails?.additionalDetails?.respondentDetails?.formdata?.[0]?.data?.addressDetails?.[0]?.addressDetails,
    phone: caseDetails?.additionalDetails?.respondentDetails?.formdata?.[0]?.data?.phonenumbers?.mobileNumber?.[0] || "",
    email: caseDetails?.additionalDetails?.respondentDetails?.formdata?.[0]?.data?.emails?.emailId?.[0] || "",
    age: caseDetails?.additionalDetails?.respondentDetails?.formdata?.[0]?.data?.respondentAge,
    gender: "",
  };

  switch (orderType) {
    case "SUMMONS":
      payload = {
        summonDetails: {
          issueDate: orderData?.auditDetails?.lastModifiedTime,
          caseFilingDate: caseDetails?.filingDate,
          docSubType: orderFormData?.party?.data?.partyType === "Witness" ? "WITNESS" : "ACCUSED",
        },
        respondentDetails: orderFormData?.party?.data?.partyType === "Witness" ? caseRespondent : respondentDetails,
        ...(orderFormData?.party?.data?.partyType === "Witness" && { witnessDetails: respondentDetails }),
        complainantDetails: {
          name: complainantName,
          address: complainantAddress,
        },
        caseDetails: {
          caseTitle: caseDetails?.caseTitle,
          year: new Date(caseDetails).getFullYear(),
          hearingDate: new Date(orderData?.additionalDetails?.formdata?.dateForHearing || "").getTime(),
          courtName: courtDetails?.name,
          courtAddress: courtDetails?.address,
          courtPhone: courtDetails?.phone,
          courtId: caseDetails?.courtId,
          hearingNumber: orderData?.hearingNumber,
          judgeName: judgeName,
        },
        deliveryChannels: {
          channelName: "",
          status: "",
          statusChangeDate: "",
          fees: 0,
          feesStatus: "pending",
        },
      };
      break;
    case "NOTICE":
      payload = {
        noticeDetails: {
          issueDate: orderData?.auditDetails?.lastModifiedTime,
          caseFilingDate: caseDetails?.filingDate,
          noticeType,
          docSubType: orderFormData?.party?.data?.partyType === "Witness" ? "WITNESS" : "ACCUSED",
          partyIndex: partyIndex,
        },
        respondentDetails: orderFormData?.party?.data?.partyType === "Witness" ? caseRespondent : respondentDetails,
        ...(orderFormData?.party?.data?.partyType === "Witness" && { witnessDetails: respondentDetails }),
        complainantDetails: {
          name: complainantName,
          address: complainantAddress,
        },
        caseDetails: {
          caseTitle: caseDetails?.caseTitle,
          year: new Date(caseDetails).getFullYear(),
          hearingDate: new Date(orderData?.additionalDetails?.formdata?.dateForHearing || "").getTime(),
          courtName: courtDetails?.name,
          courtAddress: courtDetails?.address,
          courtPhone: courtDetails?.phone,
          courtId: caseDetails?.courtId,
          hearingNumber: orderData?.hearingNumber,
          judgeName: judgeName,
        },
        deliveryChannels: {
          channelName: "",
          status: "",
          statusChangeDate: "",
          fees: 0,
          feesStatus: "pending",
        },
      };
      break;
    case "WARRANT":
      payload = {
        warrantDetails: {
          issueDate: orderData?.auditDetails?.lastModifiedTime,
          caseFilingDate: caseDetails?.filingDate,
          docType: orderFormValue.warrantType?.code,
          docSubType: orderFormValue.bailInfo?.isBailable?.code ? "BAILABLE" : "NON_BAILABLE",
          surety: orderFormValue.bailInfo?.noOfSureties?.code,
          bailableAmount: orderFormValue.bailInfo?.bailableAmount,
          templateType: orderFormValue?.warrantSubType?.templateType || "GENERIC",
          warrantText: orderFormValue?.warrantText?.warrantText || "",
        },
        ...(orderFormData?.party?.data?.partyType === "Witness" && { witnessDetails: respondentDetails }),
        respondentDetails: respondentDetails,
        caseDetails: {
          caseTitle: caseDetails?.caseTitle,
          year: new Date(caseDetails).getFullYear(),
          hearingDate: new Date(orderData?.additionalDetails?.formdata?.dateOfHearing || "").getTime(),
          judgeName: judgeName,
          courtName: courtDetails?.name,
          courtAddress: courtDetails?.address,
          courtPhone: courtDetails?.phone,
          courtId: caseDetails?.courtId,
        },
        deliveryChannels: {
          channelName: "Police",
          name: "",
          address: "",
          phone: "",
          email: "",
          status: "",
          statusChangeDate: "",
          fees: await getCourtFee(
            "POLICE",
            respondentAddress?.[0]?.pincode,
            orderType === "WARRANT" || orderType === "PROCLAMATION" || orderType === "ATTACHMENT" ? "WARRANT" : orderType,
            tenantId
          ),
          feesStatus: "",
        },
      };
      break;
    case "PROCLAMATION":
      payload = {
        proclamationDetails: {
          issueDate: orderData?.auditDetails?.lastModifiedTime,
          caseFilingDate: caseDetails?.filingDate,
          docSubType: "Proclamation requiring the apperance of a person accused",
          templateType: "GENERIC",
          proclamationText: orderFormValue?.proclamationText?.proclamationText || "",
          partyType: respondentNameData?.partyType?.toLowerCase() || "accused",
        },
        ...(orderFormData?.party?.data?.partyType === "Witness" && { witnessDetails: respondentDetails }),
        respondentDetails: respondentDetails,
        caseDetails: {
          caseTitle: caseDetails?.caseTitle,
          year: new Date(caseDetails).getFullYear(),
          hearingDate: new Date(orderData?.additionalDetails?.formdata?.dateOfHearing || "").getTime(),
          judgeName: judgeName,
          courtName: courtDetails?.name,
          courtAddress: courtDetails?.address,
          courtPhone: courtDetails?.phone,
          courtId: caseDetails?.courtId,
        },
        deliveryChannels: {
          channelName: "Police",
          name: "",
          address: "",
          phone: "",
          email: "",
          status: "",
          statusChangeDate: "",
          fees: await getCourtFee(
            "POLICE",
            respondentAddress?.[0]?.pincode,
            orderType === "WARRANT" || orderType === "PROCLAMATION" ? "WARRANT" : orderType,
            tenantId
          ),
          feesStatus: "",
        },
      };
      break;
    case "ATTACHMENT":
      payload = {
        attachmentDetails: {
          issueDate: orderData?.auditDetails?.lastModifiedTime,
          caseFilingDate: caseDetails?.filingDate,
          docSubType: "Attachment requiring the apperance of a person accused",
          templateType: "GENERIC",
          attachmentText: orderFormValue?.attachmentText?.attachmentText || "",
          district: orderFormValue?.district?.district || "",
          village: orderFormValue?.village?.village || "",
          chargeDays: orderFormValue?.chargeDays?.chargeDays || "",
          partyType: respondentNameData?.partyType?.toLowerCase() || "accused",
        },
        ...(orderFormData?.party?.data?.partyType === "Witness" && { witnessDetails: respondentDetails }),
        respondentDetails: respondentDetails,
        caseDetails: {
          caseTitle: caseDetails?.caseTitle,
          year: new Date(caseDetails).getFullYear(),
          hearingDate: new Date(orderData?.additionalDetails?.formdata?.dateOfHearing || "").getTime(),
          judgeName: judgeName,
          courtName: courtDetails?.name,
          courtAddress: courtDetails?.address,
          courtPhone: courtDetails?.phone,
          courtId: caseDetails?.courtId,
        },
        deliveryChannels: {
          channelName: "Police",
          name: "",
          address: "",
          phone: "",
          email: "",
          status: "",
          statusChangeDate: "",
          fees: await getCourtFee(
            "POLICE",
            respondentAddress?.[0]?.pincode,
            orderType === "WARRANT" || orderType === "PROCLAMATION" || orderType === "ATTACHMENT" ? "WARRANT" : orderType,
            tenantId
          ),
          feesStatus: "",
        },
      };
      break;
    case "BAIL":
      payload = {
        respondentDetails: {
          name: respondentName,
          address: respondentAddress?.[0],
          phone: respondentPhoneNo?.[0] || "",
          email: respondentEmail?.[0] || "",
          age: "",
          gender: "",
        },
        caseDetails: {
          title: caseDetails?.caseTitle,
          year: new Date(caseDetails).getFullYear(),
          hearingDate: new Date(orderData?.additionalDetails?.formdata?.date || "").getTime(),
          judgeName: "",
          courtName: courtDetails?.name,
          courtAddress: courtDetails?.address,
          courtPhone: courtDetails?.phone,
          courtId: caseDetails?.courtId,
        },
      };
      break;
    case "MISCELLANEOUS_PROCESS":
      const hearingDate = new Date(orderData?.additionalDetails?.formdata?.dateOfHearing || "").getTime();
      const taskCaseDetails = {
        title: caseDetails?.caseTitle,
        year: new Date(caseDetails).getFullYear(),
        hearingDate: hearingDate,
        judgeName: "",
        courtName: courtDetails?.name,
        courtAddress: courtDetails?.address,
        courtPhone: courtDetails?.phone,
        courtId: caseDetails?.courtId,
      };
      const caseNumber = caseDetails?.courtCaseNumber || caseDetails?.cmpNumber || caseDetails?.filingNumber;
      payload = await _getTaskPayload(taskCaseDetails, orderData, caseDetails?.filingDate, hearingDate, caseNumber, caseDetails?.filingNumber);
      break;
    default:
      break;
  }
  if (orderType === "MISCELLANEOUS_PROCESS") return payload;
  if (Object.keys(payload || {}).length > 0 && !Array.isArray(selectedChannel)) return [payload];
  else if (Object.keys(payload || {}).length > 0 && Array.isArray(selectedChannel)) {
    const channelPayloads = await Promise.all(
      selectedChannel?.map(async (item) => {
        let clonedPayload = JSON.parse(JSON.stringify(payload));

        const pincode = ["e-Post", "Registered Post", "Via Police"].includes(item?.type)
          ? item?.value?.pincode
          : clonedPayload?.respondentDetails?.address?.pincode;

        let courtFees = await getCourtFee(
          item?.code,
          pincode,
          orderType === "WARRANT" || orderType === "PROCLAMATION" || orderType === "ATTACHMENT" ? "WARRANT" : orderType,
          tenantId
        );

        if ("deliveryChannels" in clonedPayload) {
          clonedPayload.deliveryChannels = {
            ...clonedPayload.deliveryChannels,
            channelName: channelTypeEnum?.[item?.type]?.type,
            fees: courtFees,
            channelCode: channelTypeEnum?.[item?.type]?.code,
            isPendingCollection: channelTypeEnum?.[item?.type]?.code === "RPAD" ? true : false,
          };

          let address = {};
          if (orderType === "WARRANT" || orderType === "PROCLAMATION" || orderType === "ATTACHMENT" || item?.type === "Via Police") {
            address = {
              ...item?.value,
              locality: item?.value?.locality || "",
              coordinate: {
                longitude: item?.value?.geoLocationDetails?.longitude,
                latitude: item?.value?.geoLocationDetails?.latitude,
              },
            };
          } else if (["e-Post", "Registered Post"].includes(item?.type)) {
            const baseAddress = item?.value || {};
            address = {
              ...baseAddress,
              locality: item?.value?.locality || baseAddress?.locality || "",
              coordinate: item?.value?.coordinates || baseAddress?.coordinates || {},
            };
          } else {
            const baseAddress = respondentAddress[0] || {};
            address = {
              ...baseAddress,
              coordinate: baseAddress?.coordinates || {},
            };
          }

          const phone = item?.type === "SMS" ? item?.value : respondentPhoneNo?.[0] || "";
          const email = item?.type === "E-mail" ? item?.value : respondentEmail?.[0] || "";
          const commonDetails = { address, phone, email, age: "", gender: "" };

          clonedPayload.respondentDetails = {
            ...clonedPayload.respondentDetails,
            ...commonDetails,
          };

          if (clonedPayload?.witnessDetails) {
            clonedPayload.witnessDetails = {
              ...clonedPayload.witnessDetails,
              ...commonDetails,
            };
          }
        }

        return clonedPayload;
      })
    );
    return channelPayloads;
  }
};