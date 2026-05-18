/** Shared contact-uniqueness validation for FileCase + edit profile flows. */

export const getComplainantMobileNumbers = (caseDetails) =>
  caseDetails?.additionalDetails?.complainantDetails?.formdata
    ?.filter((data) => data?.data?.complainantVerification?.mobileNumber)
    ?.map((data) => data?.data?.complainantVerification?.mobileNumber) || [];

export const getRespondentMobileNumbers = (caseDetails) =>
  caseDetails?.additionalDetails?.respondentDetails?.formdata
    ?.filter((data) => data?.data?.phonenumbers?.mobileNumber?.length > 0)
    ?.map((data) => data?.data?.phonenumbers?.mobileNumber)
    ?.reduce((acc, curr) => acc.concat(curr), []) || [];

export const getWitnessMobileNumbers = (caseDetails) =>
  caseDetails?.witnessDetails
    ?.filter((data) => data?.phonenumbers?.mobileNumber?.length > 0)
    ?.map((data) => data?.phonenumbers?.mobileNumber)
    ?.reduce((acc, curr) => acc.concat(curr), []) || [];

export const getRespondentEmails = (caseDetails) =>
  caseDetails?.additionalDetails?.respondentDetails?.formdata
    ?.filter((data) => data?.data?.emails?.emailId?.length > 0)
    ?.map((data) => data?.data?.emails?.emailId)
    ?.reduce((acc, curr) => acc.concat(curr), []) || [];

export const getWitnessEmails = (caseDetails) =>
  caseDetails?.witnessDetails
    ?.filter((data) => data?.emails?.emailId?.length > 0)
    ?.map((data) => data?.emails?.emailId)
    ?.reduce((acc, curr) => acc.concat(curr), []) || [];

const isDuplicateInEnabledFormdata = (formdata, predicate) =>
  formdata?.length > 0 &&
  formdata.filter((data) => data.isenabled === true).some(predicate);

export const validateRespondentMobileEmailDuplicates = ({
  formData,
  formdata,
  setError,
  clearErrors,
  complainantMobileNumbers = [],
  witnessMobileNumbers = [],
  witnessEmails = [],
}) => {
  const currentMobileNumber = formData?.phonenumbers?.textfieldValue;
  if (currentMobileNumber && complainantMobileNumbers.some((number) => number === currentMobileNumber)) {
    setError("phonenumbers", { mobileNumber: "RESPONDENT_MOB_NUM_CAN_NOT_BE_SAME_AS_COMPLAINANT_MOB_NUM" });
  } else if (currentMobileNumber && witnessMobileNumbers.some((number) => number === currentMobileNumber)) {
    setError("phonenumbers", { mobileNumber: "RESPONDENT_MOB_NUM_CAN_NOT_BE_SAME_AS_WITNESS_MOB_NUM" });
  } else if (
    isDuplicateInEnabledFormdata(formdata, (data) =>
      data?.data?.phonenumbers?.mobileNumber?.some((number) => number === formData?.phonenumbers?.textfieldValue)
    ) &&
    formData?.phonenumbers?.textfieldValue?.length === 10
  ) {
    setError("phonenumbers", { mobileNumber: "DUPLICATE_MOBILE_NUMBER_FOR_RESPONDENT" });
  } else {
    clearErrors("phonenumbers");
  }

  const currentEmail = formData?.emails?.textfieldValue;
  if (currentEmail && witnessEmails.some((email) => email === currentEmail)) {
    setError("emails", { emailId: "RESPONDENT_EMAIL_CAN_NOT_BE_SAME_AS_WITNESS_EMAIL" });
  } else if (
    isDuplicateInEnabledFormdata(formdata, (data) =>
      data?.data?.emails?.emailId?.some((email) => email === formData?.emails?.textfieldValue)
    ) &&
    formData?.emails?.textfieldValue
  ) {
    setError("emails", { emailId: "DUPLICATE_EMAIL_ID_FOR_RESPONDENT" });
  } else {
    clearErrors("emails");
  }
};

export const validateWitnessMobileEmailDuplicates = ({
  formData,
  formdata,
  setError,
  clearErrors,
  respondentMobileNumbers = [],
  respondentEmails = [],
}) => {
  const currentMobileNumber = formData?.phonenumbers?.textfieldValue;
  if (currentMobileNumber && respondentMobileNumbers.some((number) => number === currentMobileNumber)) {
    setError("phonenumbers", { mobileNumber: "WITNESS_MOB_NUM_CAN_NOT_BE_SAME_AS_RESPONDENT_MOB_NUM" });
  } else if (
    isDuplicateInEnabledFormdata(formdata, (data) =>
      data?.data?.phonenumbers?.mobileNumber?.some((number) => number === formData?.phonenumbers?.textfieldValue)
    ) &&
    formData?.phonenumbers?.textfieldValue?.length === 10
  ) {
    setError("phonenumbers", { mobileNumber: "DUPLICATE_MOBILE_NUMBER_FOR_WITNESS" });
  } else {
    clearErrors("phonenumbers");
  }

  const currentEmail = formData?.emails?.textfieldValue;
  if (currentEmail && respondentEmails.some((email) => email === currentEmail)) {
    setError("emails", { emailId: "WITNESS_EMAIL_CAN_NOT_BE_SAME_AS_RESPONDENT_EMAIL" });
  } else if (
    isDuplicateInEnabledFormdata(formdata, (data) =>
      data?.data?.emails?.emailId?.some((email) => email === formData?.emails?.textfieldValue)
    ) &&
    formData?.emails?.textfieldValue
  ) {
    setError("emails", { emailId: "DUPLICATE_EMAIL_ID_FOR_WITNESS" });
  } else {
    clearErrors("emails");
  }
};

export const validateComplainantMobileDuplicates = ({
  formData,
  formdata,
  index,
  currentDisplayIndex,
  setError,
  clearErrors,
  respondentMobileNumbers = [],
}) => {
  const currentMobileNumber = formData?.complainantVerification?.mobileNumber;
  const currentPOAMobileNumber = formData?.poaVerification?.mobileNumber;
  if (currentMobileNumber && currentPOAMobileNumber && currentMobileNumber === currentPOAMobileNumber) {
    if (formData?.complainantVerification?.otpNumber && !formData?.poaVerification?.otpNumber) {
      setError("poaVerification", { mobileNumber: "POA_MOB_NUM_CAN_NOT_BE_SAME_AS_COMPLAINANT_MOB_NUM", isDuplicateNumber: true });
    }
    if (formData?.poaVerification?.otpNumber && !formData?.complainantVerification?.otpNumber) {
      setError("complainantVerification", { mobileNumber: "COMPLAINANT_MOB_NUM_CAN_NOT_BE_SAME_AS_POA_MOB_NUM", isDuplicateNumber: true });
    }
  } else if (currentMobileNumber && respondentMobileNumbers.some((number) => number === currentMobileNumber)) {
    setError("complainantVerification", { mobileNumber: "COMPLAINANT_MOB_NUM_CAN_NOT_BE_SAME_AS_RESPONDENT_MOB_NUM", isDuplicateNumber: true });
  } else if (
    formdata &&
    formdata?.length > 1 &&
    formData?.complainantVerification?.mobileNumber &&
    formData?.complainantVerification?.mobileNumber?.length === 10 &&
    formdata
      .filter((data) => data.isenabled === true)
      .filter((data) => data?.displayindex !== currentDisplayIndex)
      ?.some(
        (data, idx) =>
          idx !== index && data?.data?.complainantVerification?.mobileNumber === formData?.complainantVerification?.mobileNumber
      )
  ) {
    setError("complainantVerification", { mobileNumber: "DUPLICATE_MOBILE_NUMBER_FOR_COMPLAINANT", isDuplicateNumber: true });
  } else {
    clearErrors("complainantVerification");
    clearErrors("poaVerification");
  }
};

const getComplainantMobileFromCase = (caseDetails) =>
  caseDetails?.additionalDetails?.complainantDetails?.formdata?.[0]?.data?.complainantVerification?.mobileNumber;

/** Skip respondent validation when inquiry affidavit not required for address mismatch. */
export const shouldSkipRespondentInquiryAffidavitValidation = (formData, caseDetails) => {
  if (!("inquiryAffidavitFileUpload" in formData)) {
    return false;
  }
  const complainant = caseDetails?.additionalDetails?.["complainantDetails"]?.formdata?.[0]?.data;
  return (
    formData?.addressDetails?.some(
      (address) =>
        (address?.addressDetails?.pincode !== complainant?.addressDetails?.pincode &&
          complainant?.complainantType?.code === "INDIVIDUAL") ||
        (address?.addressDetails?.pincode !== complainant?.addressCompanyDetails?.pincode &&
          complainant?.complainantType?.code === "REPRESENTATIVE")
    ) && !Object.keys(formData?.inquiryAffidavitFileUpload?.document || {}).length
  );
};

export const validateRespondentMobileNotSameAsComplainant = ({
  formData,
  caseDetails,
  setShowToast,
  setFormErrors,
  clearFormDataErrors,
  t,
}) => {
  const respondentMobile = formData?.phonenumbers?.textfieldValue;
  const complainantMobile = getComplainantMobileFromCase(caseDetails);
  if (
    formData?.phonenumbers?.textfieldValue?.length === 10 &&
    respondentMobile &&
    respondentMobile === complainantMobile
  ) {
    setShowToast({ label: t("RESPONDENT_MOB_NUM_CAN_NOT_BE_SAME_AS_COMPLAINANT_MOB_NUM"), error: true });
    setFormErrors("phonenumbers", { mobileNumber: "RESPONDENT_MOB_NUM_CAN_NOT_BE_SAME_AS_COMPLAINANT_MOB_NUM" });
    return true;
  }
  clearFormDataErrors("phonenumbers");
  return false;
};

export const validateComplainantMobileNotInRespondentList = ({ formData, caseDetails, setShowToast, t }) => {
  const complainantMobileNumber = formData?.complainantVerification?.mobileNumber;
  const respondentData = caseDetails?.additionalDetails?.respondentDetails;
  if (!respondentData || !complainantMobileNumber) {
    return false;
  }
  const respondentMobileNumbers = respondentData?.formdata?.[0]?.data?.phonenumbers?.mobileNumber;
  if (!respondentMobileNumbers) {
    return false;
  }
  for (let i = 0; i < respondentMobileNumbers.length; i++) {
    if (respondentMobileNumbers[i] === complainantMobileNumber) {
      setShowToast({ label: t("CHANGE_RESPONDENT_MOBILE_NUMBER_REGISTERED"), error: true });
      return true;
    }
  }
  return false;
};

export const validatePartyAgeField = ({ formData, selected, setFormErrors, clearFormDataErrors, fieldKey }) => {
  const age = parseInt(formData?.[fieldKey], 10);
  if (age < 18 || age > 999) {
    setFormErrors(fieldKey, { message: "ONLY_AGE_ALLOWED" });
    return true;
  }
  clearFormDataErrors(fieldKey);
  return false;
};

export const clearBulkContactTextfieldValues = (formDataCopy) => {
  for (let i = 0; i < formDataCopy.length; i++) {
    const obj = formDataCopy[i];
    if (obj?.data?.phonenumbers) {
      obj.data.phonenumbers.textfieldValue = "";
    }
    if (obj?.data?.emails) {
      obj.data.emails.textfieldValue = "";
    }
  }
};
