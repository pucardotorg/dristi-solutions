import { CloseSvg } from "@egovernments/digit-ui-components";
import React from "react";
import { formatAddress, mapAddressDetails } from ".";

export const Heading = (props) => {
  return <h1 className="heading-m">{props.label}</h1>;
};

export const CloseBtn = (props) => {
  return (
    <div
      onClick={props?.onClick}
      style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        paddingRight: "20px",
        cursor: "pointer",
        ...(props?.backgroundColor && { backgroundColor: props.backgroundColor }),
      }}
    >
      <CloseSvg />
    </div>
  );
};

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

export const formatDate = (date, format) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  if (format === "DD-MM-YYYY") {
    return `${day}-${month}-${year}`;
  }
  return `${year}-${month}-${day}`;
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
  return `${locality ? `${locality},` : ""} ${district ? `${district},` : ""} ${city ? `${city},` : ""} ${state ? `${state},` : ""} ${
    pincode ? `- ${pincode}` : ""
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

        if(acceptRescheduleRequest && !scheduleItem && hearingDate){
          const dateChanged = formatDate(new Date(acceptRescheduleRequest?.orderSchema?.orderDetails?.newHearingDate)) !== hearingDate;
          if (dateChanged) {
            itemErrors?.push({
              key: "DATE_OF_HEARING",
              errorMessage: "THIS_DOES_NOT_MATCH_WITH_NEXT_HEARING_DATE",
            });
          }
        }
        else if (scheduleItem && hearingDate) {
          const dateChanged = formatDate(new Date(scheduleItem?.orderSchema?.orderDetails?.hearingDate)) !== hearingDate;
          if (dateChanged) {
            itemErrors?.push({
              key: "DATE_OF_HEARING",
              errorMessage: "THIS_DOES_NOT_MATCH_WITH_NEXT_HEARING_DATE",
            });
          }
        } else if (currentOrder?.nextHearingDate && hearingDate) {
          const dateChanged = formatDate(new Date(currentOrder?.nextHearingDate)) !== hearingDate;
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
        const dateChanged = formatDate(new Date(currentOrder?.nextHearingDate)) !== hearingDate;
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
      filingNumber: filingNumber
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
