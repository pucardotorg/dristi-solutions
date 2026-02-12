import { getFullName } from "../../../../../cases/src/utils/joinCaseUtils";
import { getUserDetails } from "../../../hooks/useGetAccessToken";
import { DRISTIService } from "../../../services";
import {
  combineMultipleFiles,
  documentsTypeMapping,
  extractValue,
  generateUUID,
  getAuthorizedUuid,
  isEmptyValue,
  TaskManagementWorkflowAction,
} from "../../../Utils";
import { DocumentUploadError } from "../../../Utils/errorUtil";

import { userTypeOptions } from "../registration/config";
import { efilingDocumentKeyAndTypeMapping } from "./Config/efilingDocumentKeyAndTypeMapping";
import isEqual from "lodash/isEqual";
import { sideMenuConfig } from "./Config";

export const formatName = (value, capitalize = true) => {
  let cleanedValue = value
    .replace(/[^a-zA-Z\s]/g, "")
    .trimStart()
    .replace(/ +/g, " ");

  if (!capitalize) return cleanedValue;

  return cleanedValue
    .split(" ")
    .map((word) => (word.length > 1 && word === word.toUpperCase() ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(" ");
};

const checkChequeDepositDateValidity = (caseDetails, dateOfDispatch) => {
  let isValid = true;
  let message = "";
  const dispatchDateObj = new Date(dateOfDispatch);

  caseDetails?.caseDetails?.chequeDetails?.formdata?.forEach(({ data }) => {
    if (data?.depositDate) {
      const depositDateObj = new Date(data.depositDate);
      const dayDifference = (dispatchDateObj - depositDateObj) / (1000 * 60 * 60 * 24);

      if (dayDifference > 30) {
        isValid = false;
        message += `Cheque ${data.chequeNumber} has a deposit date exceeding the allowed 30-day period.\n`;
      }
    }
  });

  return {
    isValid,
    info: {
      header: "WARNING",
      scrutinyHeader: "CS_LEGAL_WARNING",
      data: [message.trim()],
    },
  };
};

export const showDemandNoticeModal = ({
  selected,
  setValue,
  formData,
  setError,
  clearErrors,
  index,
  setServiceOfDemandNoticeModal,
  caseDetails,
  isCaseReAssigned,
  errorCaseDetails,
}) => {
  if (selected === "demandNoticeDetails") {
    const totalCheques = caseDetails?.caseDetails?.["chequeDetails"]?.formdata && caseDetails?.caseDetails?.["chequeDetails"]?.formdata.length;
    const newCaseDetails = isCaseReAssigned ? errorCaseDetails : caseDetails;
    const chequeDetails = newCaseDetails?.caseDetails?.["chequeDetails"]?.formdata?.[0]?.data;
    for (const key in formData) {
      switch (key) {
        case "dateOfService":
          if (formData?.dateOfService && new Date(formData?.dateOfService).getTime() + 16 * 24 * 60 * 60 * 1000 > new Date().getTime()) {
            setError("dateOfService", { message: " CS_SERVICE_DATE_ERROR_MSG" });
            setValue("dateOfAccrual", "");
            setServiceOfDemandNoticeModal({ show: true, index });
          } else if (
            formData?.dateOfDispatch &&
            formData?.dateOfService &&
            new Date(formData?.dateOfService).getTime() < new Date(formData?.dateOfDispatch).getTime()
          ) {
            setError("dateOfService", { message: "CS_SERVICE_DATE_LEGAL_NOTICE_ERROR_MSG" });
          } else {
            clearErrors("dateOfService");
            let formattedDate = "";
            if (formData?.dateOfService) {
              const milliseconds = new Date(formData?.dateOfService).getTime() + 16 * 24 * 60 * 60 * 1000;
              const date = new Date(milliseconds);
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, "0");
              const day = String(date.getDate()).padStart(2, "0");
              formattedDate = `${year}-${month}-${day}`;
              setValue("dateOfAccrual", formattedDate, { shouldValidate: true });
            } else {
              setValue("dateOfAccrual", formattedDate);
            }
          }
          break;
        case "dateOfDispatch":
          if (new Date(formData?.dateOfDispatch).getTime() > new Date().getTime()) {
            setError("dateOfDispatch", { message: "CS_DATE_ERROR_MSG" });
          } else if (
            formData?.dateOfDispatch &&
            chequeDetails?.depositDate &&
            new Date(chequeDetails?.depositDate).getTime() > new Date(formData?.dateOfDispatch).getTime()
          ) {
            setError("dateOfDispatch", { message: "CS_DISPATCH_DATE_ERROR_MSG" });
          } else {
            clearErrors("dateOfDispatch");
          }
          break;
        case "dateOfReply":
          if (
            formData?.dateOfService &&
            formData?.dateOfService &&
            new Date(formData?.dateOfReply).getTime() < new Date(formData?.dateOfService).getTime()
          ) {
            setError("dateOfReply", { message: "CS_REPLY_DATE_ERROR_MSG" });
          } else {
            clearErrors("dateOfReply");
          }
          break;
        default:
          break;
      }
    }
  }
};

export const validateDateForDelayApplication = ({
  formData,
  selected,
  setValue,
  caseDetails,
  toast,
  t,
  history,
  caseId,
  setShowConfirmDcaSkipModal,
  showConfirmDcaSkipModal,
  shouldShowConfirmDcaModal,
  setShouldShowConfirmDcaModal,
  prevIsDcaSkipped,
  setPrevIsDcaSkipped,
  isDcaPageRefreshed,
  setIsDcaPageRefreshed,
}) => {
  if (selected === "delayApplications") {
    if (
      !caseDetails?.caseDetails ||
      (caseDetails?.caseDetails && !caseDetails?.caseDetails?.["demandNoticeDetails"]?.formdata?.[0]?.data?.dateOfAccrual)
    ) {
      setValue("delayCondonationType", null);
      toast.error(t("SELECT_ACCRUAL_DATE_BEFORE_DELAY_APP"));
      setTimeout(() => {
        history.push(`?caseId=${caseId}&selected=demandNoticeDetails`);
      }, 3000);
    }
    if (formData?.isDcaSkippedInEFiling?.code === "YES" && shouldShowConfirmDcaModal && formData?.isDcaSkippedInEFiling?.code !== prevIsDcaSkipped) {
      setShowConfirmDcaSkipModal(true);
      setShouldShowConfirmDcaModal(false);
      setPrevIsDcaSkipped("YES");
    } else if (prevIsDcaSkipped === "NO" && !shouldShowConfirmDcaModal && formData?.isDcaSkippedInEFiling?.code === "YES" && isDcaPageRefreshed) {
      setShowConfirmDcaSkipModal(true);
      setShouldShowConfirmDcaModal(false);
      setPrevIsDcaSkipped("YES");
      setIsDcaPageRefreshed(false);
    }
    if (formData?.isDcaSkippedInEFiling?.code === "NO") {
      setShowConfirmDcaSkipModal(false);
      setShouldShowConfirmDcaModal(true);
      setPrevIsDcaSkipped("NO");
    }
  }
};

export const showToastForComplainant = ({ formData, setValue, selected, setSuccessToast, formState, clearErrors }) => {
  if (selected === "complainantDetails") {
    if (formData?.complainantId?.complainantId && formData?.complainantId?.verificationType && formData?.complainantId?.isFirstRender) {
      setValue("complainantId", { ...formData?.complainantId, isFirstRender: false });
      setSuccessToast((prev) => ({
        ...prev,
        showSuccessToast: true,
        successMsg: "CS_AADHAR_VERIFIED_SUCCESS_MSG",
      }));
    }
    const formDataCopy = structuredClone(formData);
    const addressDet = formDataCopy?.complainantVerification?.individualDetails?.addressDetails;
    const addressDetSelect = formDataCopy?.complainantVerification?.individualDetails?.["addressDetails-select"];
    const currAddressDet = formDataCopy?.complainantVerification?.individualDetails?.currentAddressDetails;
    const currAddressDetSelect = formDataCopy?.complainantVerification?.individualDetails?.["currentAddressDetails-select"];
    const poaAddressDet = formDataCopy?.poaVerification?.individualDetails?.poaAddressDetails;
    const poaAddressDetSelect = formDataCopy?.poaVerification?.individualDetails?.["poaAddressDetails-select"];
    if (!!addressDet && !!addressDetSelect) {
      setValue("addressDetails", addressDet);
      setValue("addressDetails-select", addressDetSelect);
    }
    if (!!currAddressDet && !!currAddressDetSelect) {
      setValue("currentAddressDetails", {
        ...currAddressDet,
        isCurrAddrSame: formDataCopy?.complainantVerification?.individualDetails?.currentAddressDetails?.isCurrAddrSame,
      });
      setValue("currentAddressDetails-select", currAddressDetSelect);
    }
    if (!!poaAddressDet && !!poaAddressDetSelect) {
      setValue("poaAddressDetails", { ...poaAddressDet, typeOfAddress: formDataCopy?.addressDetails?.typeOfAddress });
      setValue("poaAddressDetails-select", poaAddressDetSelect);
    }
  }
};

export const checkIfscValidation = ({ formData, setValue, selected }) => {
  if (selected === "chequeDetails") {
    const formDataCopy = structuredClone(formData);
    for (const key in formDataCopy) {
      switch (key) {
        case "ifsc":
          if (Object.hasOwnProperty.call(formDataCopy, key)) {
            const oldValue = formDataCopy[key];
            let value = oldValue;

            if (typeof value === "string") {
              let updatedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
              if (updatedValue?.length > 11) {
                updatedValue = updatedValue.substring(0, 11);
              }

              if (updatedValue?.length < 5) {
                updatedValue = value.toUpperCase().replace(/[^A-Z]/g, "");
              }

              if (updatedValue?.length >= 5) {
                updatedValue = updatedValue.slice(0, 4).replace(/[^A-Z]/g, "") + "0" + updatedValue.slice(5);
              }

              if (updatedValue?.length === 11) {
                updatedValue = updatedValue.slice(0, 4) + "0" + updatedValue.slice(5, 11).replace(/[^A-Z0-9]/g, "");
              }

              if (updatedValue !== oldValue) {
                const element = document.querySelector(`[name="${key}"]`);
                const start = element?.selectionStart;
                const end = element?.selectionEnd;
                setValue(key, updatedValue);
                setTimeout(() => {
                  element?.setSelectionRange(start, end);
                }, 0);
              }
            }
          }
          break;
        case "chequeAmount":
          if (Object.hasOwnProperty.call(formDataCopy, key)) {
            const oldValue = formDataCopy[key];
            let value = oldValue;

            let updatedValue = value?.replace(/\D/g, "");
            if (updatedValue?.length > 12) {
              updatedValue = updatedValue.substring(0, 12);
            }

            if (updatedValue !== oldValue) {
              const element = document?.querySelector(`[name="${key}"]`);
              const start = element?.selectionStart;
              const end = element?.selectionEnd;
              setValue(key, updatedValue);
              setTimeout(() => {
                element?.setSelectionRange(start, end);
              }, 0);
            }
          }
          break;
        case "chequeNumber":
          if (Object.hasOwnProperty.call(formDataCopy, key)) {
            const oldValue = formDataCopy[key];
            let value = oldValue;

            let updatedValue = value?.replace(/\D/g, "");
            if (updatedValue?.length > 6) {
              updatedValue = updatedValue?.substring(0, 6);
            }
            if (updatedValue !== oldValue) {
              const element = document?.querySelector(`[name="${key}"]`);
              const start = element?.selectionStart;
              const end = element?.selectionEnd;
              setValue(key, updatedValue);
              setTimeout(() => {
                element?.setSelectionRange(start, end);
              }, 0);
            }
          }
          break;
        default:
          break;
      }
    }
  }
};

export const checkNameValidation = ({ formData, setValue, selected, reset, index, formdata, clearErrors, formState }) => {
  if (selected === "respondentDetails") {
    if (formData?.respondentFirstName || formData?.respondentMiddleName || formData?.respondentLastName || formData?.respondentAge) {
      const formDataCopy = structuredClone(formData);
      for (const key in formDataCopy) {
        if (["respondentFirstName", "respondentMiddleName", "respondentLastName"].includes(key) && Object.hasOwnProperty.call(formDataCopy, key)) {
          const oldValue = formDataCopy[key];
          let value = oldValue;
          if (typeof value === "string") {
            if (value.length > 100) {
              value = value.slice(0, 100);
            }

            let updatedValue = formatName(value);
            if (updatedValue !== oldValue) {
              const element = document.querySelector(`[name="${key}"]`);
              const start = element?.selectionStart;
              const end = element?.selectionEnd;
              setValue(key, updatedValue);
              setTimeout(() => {
                element?.setSelectionRange(start, end);
              }, 0);
            }
          }
        }
        if (key === "respondentAge" && Object.hasOwnProperty.call(formDataCopy, key)) {
          const oldValue = formDataCopy[key];
          let value = oldValue;

          let updatedValue = value?.replace(/\D/g, "");
          // Convert to number and restrict value to 150
          if (updatedValue && parseInt(updatedValue, 10) > 150) {
            updatedValue = updatedValue.substring(0, updatedValue.length - 1); // Disallow the extra digit
          }
          if (updatedValue !== oldValue) {
            const element = document?.querySelector(`[name="${key}"]`);
            const start = element?.selectionStart;
            const end = element?.selectionEnd;
            setValue(key, updatedValue);
            setTimeout(() => {
              element?.setSelectionRange(start, end);
            }, 0);
          }
        }
      }
    }
  }
  if (selected === "complainantDetails" || selected === "witnessDetails") {
    if (
      formData?.firstName ||
      formData?.middleName ||
      formData?.lastName ||
      formData?.witnessDesignation ||
      formData?.witnessAge ||
      formData?.complainantAge ||
      formData?.respondentAge ||
      formData?.poaAge
    ) {
      const formDataCopy = structuredClone(formData);
      for (const key in formDataCopy) {
        if (["firstName", "middleName", "lastName", "witnessDesignation"].includes(key) && Object.hasOwnProperty.call(formDataCopy, key)) {
          const oldValue = formDataCopy[key];
          let value = oldValue;
          if (typeof value === "string") {
            if (value.length > 100) {
              value = value.slice(0, 100);
            }

            let updatedValue = formatName(value);
            if (updatedValue !== oldValue) {
              const element = document.querySelector(`[name="${key}"]`);
              const start = element?.selectionStart;
              const end = element?.selectionEnd;
              setValue(key, updatedValue);
              setTimeout(() => {
                element?.setSelectionRange(start, end);
              }, 0);
            }
            if (selected === "witnessDetails") {
              if (updatedValue !== "" && ["firstName", "witnessDesignation"].includes(key)) {
                if (formState?.errors?.firstName) {
                  clearErrors("firstName");
                }
                if (formState?.errors?.witnessDesignation) {
                  clearErrors("witnessDesignation");
                }
              }
            }
          }
        }
        if (["complainantAge", "witnessAge"].includes(key) && Object.hasOwnProperty.call(formDataCopy, key)) {
          const oldValue = formDataCopy[key];
          let value = oldValue;

          let updatedValue = value?.replace(/\D/g, "");
          // Convert to number and restrict value to 150
          if (updatedValue && parseInt(updatedValue, 10) > 150) {
            updatedValue = updatedValue.substring(0, updatedValue.length - 1); // Disallow the extra digit
          }
          if (updatedValue !== oldValue) {
            const element = document?.querySelector(`[name="${key}"]`);
            const start = element?.selectionStart;
            const end = element?.selectionEnd;
            setValue(key, updatedValue);
            setTimeout(() => {
              element?.setSelectionRange(start, end);
            }, 0);
          }
        }
        if (key === "poaAge" && Object.hasOwnProperty.call(formDataCopy, key)) {
          const oldValue = formDataCopy[key];
          let value = oldValue;
          // keep only digits
          let updatedValue = value?.replace(/\D/g, "");
          // Max 3 digits
          if (updatedValue?.length > 3) {
            updatedValue = updatedValue.substring(0, 3);
          }
          if (updatedValue !== oldValue) {
            const element = document?.querySelector(`[name="${key}"]`);
            const start = element?.selectionStart;
            const end = element?.selectionEnd;
            setValue(key, updatedValue);
            setTimeout(() => {
              element?.setSelectionRange(start, end);
            }, 0);
          }
        }
      }
    }
  }

  // added for Nature of Debt/liablity
  if (selected === "debtLiabilityDetails") {
    if (formData?.liabilityNature) {
      const formDataCopy = structuredClone(formData);
      for (const key in formDataCopy) {
        if (["liabilityNature"].includes(key) && Object.hasOwnProperty.call(formDataCopy, key)) {
          const oldValue = formDataCopy[key];
          let value = oldValue;
          if (typeof value === "string") {
            if (value.length > 100) {
              value = value.slice(0, 100);
            }

            let updatedValue = formatName(value);
            if (updatedValue !== oldValue) {
              const element = document.querySelector(`[name="${key}"]`);
              const start = element?.selectionStart;
              const end = element?.selectionEnd;
              setValue(key, updatedValue);
              setTimeout(() => {
                element?.setSelectionRange(start, end);
              }, 0);
            }
          }
        }
      }
    }
  }
};

export const checkDuplicateMobileEmailValidation = ({
  formData,
  setValue,
  selected,
  setError,
  clearErrors,
  formdata,
  index,
  caseDetails,
  currentDisplayIndex,
}) => {
  const complainantMobileNumbersArray =
    caseDetails?.additionalDetails?.complainantDetails?.formdata
      .filter((data) => {
        if (data?.data?.complainantVerification?.mobileNumber) {
          return true;
        } else return false;
      })
      .map((data) => {
        return data?.data?.complainantVerification?.mobileNumber;
      }) || [];
  const respondentMobileNumbersArray =
    caseDetails?.additionalDetails?.respondentDetails?.formdata
      .filter((data) => {
        if (data?.data?.phonenumbers?.mobileNumber && data?.data?.phonenumbers?.mobileNumber?.length > 0) {
          return true;
        } else return false;
      })
      .map((data) => {
        return data?.data?.phonenumbers?.mobileNumber;
      })
      .reduce((acc, curr) => acc.concat(curr), []) || [];

  const witnessMobileNumbersArray =
    caseDetails?.witnessDetails
      ?.filter((data) => {
        if (data?.phonenumbers?.mobileNumber && data?.phonenumbers?.mobileNumber?.length > 0) {
          return true;
        } else return false;
      })
      ?.map((data) => {
        return data?.phonenumbers?.mobileNumber;
      })
      ?.reduce((acc, curr) => acc.concat(curr), []) || [];

  const respondentEmailsArray =
    caseDetails?.additionalDetails?.respondentDetails?.formdata
      .filter((data) => {
        if (data?.data?.emails?.emailId && data?.data?.emails?.emailId?.length > 0) {
          return true;
        } else return false;
      })
      .map((data) => {
        return data?.data?.emails?.emailId;
      })
      .reduce((acc, curr) => acc.concat(curr), []) || [];

  const witnessEmailsArray =
    caseDetails?.witnessDetails
      ?.filter((data) => {
        if (data?.emails?.emailId && data?.emails?.emailId?.length > 0) {
          return true;
        } else return false;
      })
      ?.map((data) => {
        return data?.emails?.emailId;
      })
      .reduce((acc, curr) => acc.concat(curr), []) || [];

  if (selected === "respondentDetails") {
    const currentMobileNumber = formData?.phonenumbers?.textfieldValue;
    if (currentMobileNumber && complainantMobileNumbersArray.some((number) => number === currentMobileNumber)) {
      setError("phonenumbers", { mobileNumber: "RESPONDENT_MOB_NUM_CAN_NOT_BE_SAME_AS_COMPLAINANT_MOB_NUM" });
    } else if (currentMobileNumber && witnessMobileNumbersArray.some((number) => number === currentMobileNumber)) {
      setError("phonenumbers", { mobileNumber: "RESPONDENT_MOB_NUM_CAN_NOT_BE_SAME_AS_WITNESS_MOB_NUM" });
    } else if (
      formdata &&
      formdata?.length > 0 &&
      formData?.phonenumbers?.textfieldValue &&
      formData?.phonenumbers?.textfieldValue?.length === 10 &&
      formdata
        .filter((data) => data.isenabled === true)
        ?.some((data) => data?.data?.phonenumbers?.mobileNumber?.some((number) => number === formData?.phonenumbers?.textfieldValue))
    ) {
      setError("phonenumbers", { mobileNumber: "DUPLICATE_MOBILE_NUMBER_FOR_RESPONDENT" });
    } else {
      clearErrors("phonenumbers");
    }

    const currentEmail = formData?.emails?.textfieldValue;
    if (currentEmail && witnessEmailsArray.some((email) => email === currentEmail)) {
      setError("emails", { emailId: "RESPONDENT_EMAIL_CAN_NOT_BE_SAME_AS_WITNESS_EMAIL" });
    } else if (
      formdata &&
      formdata?.length > 0 &&
      formData?.emails?.textfieldValue &&
      formdata
        .filter((data) => data.isenabled === true)
        ?.some((data) => data?.data?.emails?.emailId?.some((email) => email === formData?.emails?.textfieldValue))
    ) {
      setError("emails", { emailId: "DUPLICATE_EMAIL_ID_FOR_RESPONDENT" });
    } else {
      clearErrors("emails");
    }
  }
  if (selected === "witnessDetails") {
    const currentMobileNumber = formData?.phonenumbers?.textfieldValue;
    if (currentMobileNumber && respondentMobileNumbersArray.some((number) => number === currentMobileNumber)) {
      setError("phonenumbers", { mobileNumber: "WITNESS_MOB_NUM_CAN_NOT_BE_SAME_AS_RESPONDENT_MOB_NUM" });
    } else if (
      formdata &&
      formdata?.length > 0 &&
      formData?.phonenumbers?.textfieldValue &&
      formData?.phonenumbers?.textfieldValue?.length === 10 &&
      formdata
        .filter((data) => data.isenabled === true)
        ?.some((data) => data?.data?.phonenumbers?.mobileNumber?.some((number) => number === formData?.phonenumbers?.textfieldValue))
    ) {
      setError("phonenumbers", { mobileNumber: "DUPLICATE_MOBILE_NUMBER_FOR_WITNESS" });
    } else {
      clearErrors("phonenumbers");
    }

    const currentEmail = formData?.emails?.textfieldValue;
    if (currentEmail && respondentEmailsArray.some((email) => email === currentEmail)) {
      setError("emails", { emailId: "WITNESS_EMAIL_CAN_NOT_BE_SAME_AS_RESPONDENT_EMAIL" });
    } else if (
      formdata &&
      formdata?.length > 0 &&
      formData?.emails?.textfieldValue &&
      formdata
        .filter((data) => data.isenabled === true)
        ?.some((data) => data?.data?.emails?.emailId?.some((email) => email === formData?.emails?.textfieldValue))
    ) {
      setError("emails", { emailId: "DUPLICATE_EMAIL_ID_FOR_WITNESS" });
    } else {
      clearErrors("emails");
    }
  }
  if (selected === "complainantDetails") {
    const currentMobileNumber = formData?.complainantVerification?.mobileNumber;
    const currentPOAMobileNumber = formData?.poaVerification?.mobileNumber;
    if (currentMobileNumber && currentPOAMobileNumber && currentMobileNumber === currentPOAMobileNumber) {
      if (formData?.complainantVerification?.otpNumber && !formData?.poaVerification?.otpNumber) {
        setError("poaVerification", { mobileNumber: "POA_MOB_NUM_CAN_NOT_BE_SAME_AS_COMPLAINANT_MOB_NUM", isDuplicateNumber: true });
      }
      if (formData?.poaVerification?.otpNumber && !formData?.complainantVerification?.otpNumber) {
        setError("complainantVerification", { mobileNumber: "COMPLAINANT_MOB_NUM_CAN_NOT_BE_SAME_AS_POA_MOB_NUM", isDuplicateNumber: true });
      }
    } else if (currentMobileNumber && respondentMobileNumbersArray.some((number) => number === currentMobileNumber)) {
      setError("complainantVerification", { mobileNumber: "COMPLAINANT_MOB_NUM_CAN_NOT_BE_SAME_AS_RESPONDENT_MOB_NUM", isDuplicateNumber: true });
    } else if (
      formdata &&
      formdata?.length > 1 &&
      formData?.complainantVerification?.mobileNumber &&
      formData?.complainantVerification?.mobileNumber?.length === 10 &&
      formdata
        .filter((data) => data.isenabled === true)
        .filter((data) => data?.displayindex !== currentDisplayIndex)
        ?.some((data, idx) => idx !== index && data?.data?.complainantVerification?.mobileNumber === formData?.complainantVerification?.mobileNumber)
    ) {
      setError("complainantVerification", { mobileNumber: "DUPLICATE_MOBILE_NUMBER_FOR_COMPLAINANT", isDuplicateNumber: true });
    } else {
      clearErrors("complainantVerification");
      clearErrors("poaVerification");
    }
  }
};

export const checkOnlyCharInCheque = ({ formData, setValue, selected }) => {
  if (selected === "chequeDetails") {
    if (
      formData?.chequeSignatoryName ||
      formData?.payeeBankName ||
      formData?.payeeBranchName ||
      formData?.payerBankName ||
      formData?.payerBranchName ||
      formData?.name
    ) {
      const formDataCopy = structuredClone(formData);
      for (const key in formDataCopy) {
        if (Object.hasOwnProperty.call(formDataCopy, key)) {
          const oldValue = formDataCopy[key];
          let value = oldValue;
          if (key === "chequeSignatoryName" || key === "name") {
            if (typeof value === "string") {
              if (value.length > 100) {
                value = value.slice(0, 100);
              }

              let updatedValue = formatName(value);
              if (updatedValue !== oldValue) {
                const element = document.querySelector(`[name="${key}"]`);
                const start = element?.selectionStart;
                const end = element?.selectionEnd;
                setValue(key, updatedValue);
                setTimeout(() => {
                  element?.setSelectionRange(start, end);
                }, 0);
              }
            }
          } else if (key === "payeeBankName" || key === "payeeBranchName" || key === "payerBankName" || key === "payerBranchName") {
            if (typeof value === "string") {
              if (value.length > 200) {
                value = value.slice(0, 200);
              }

              let updatedValue = formatName(value);
              if (updatedValue !== oldValue) {
                const element = document.querySelector(`[name="${key}"]`);
                const start = element?.selectionStart;
                const end = element?.selectionEnd;
                setValue(key, updatedValue);
                setTimeout(() => {
                  element?.setSelectionRange(start, end);
                }, 0);
              }
            }
          }
        }
      }
    }
  } else if (selected === "debtLiabilityDetails") {
    if (formData?.totalAmount) {
      const formDataCopy = structuredClone(formData);
      for (const key in formDataCopy) {
        if (Object.hasOwnProperty.call(formDataCopy, key) && key === "totalAmount") {
          const oldValue = formDataCopy[key];
          let value = oldValue;
          if (typeof value === "string") {
            if (value.length > 12) {
              value = value.slice(0, 12);
            }

            if (value !== oldValue) {
              const element = document.querySelector(`[name="${key}"]`);
              const start = element?.selectionStart;
              const end = element?.selectionEnd;
              setValue(key, value);
              setTimeout(() => {
                element?.setSelectionRange(start, end);
              }, 0);
            }
          }
        }
      }
    }
  }
};

export const respondentValidation = ({
  setErrorMsg,
  t,
  formData,
  selected,
  caseDetails,
  setShowErrorToast,
  toast,
  setFormErrors,
  clearFormDataErrors,
}) => {
  if (selected === "respondentDetails") {
    const formDataCopy = structuredClone(formData);
    if ("inquiryAffidavitFileUpload" in formDataCopy) {
      if (
        formData?.addressDetails?.some(
          (address) =>
            (address?.addressDetails?.pincode !==
              caseDetails?.additionalDetails?.["complainantDetails"]?.formdata?.[0]?.data?.addressDetails?.pincode &&
              caseDetails?.additionalDetails?.["complainantDetails"]?.formdata?.[0]?.data?.complainantType?.code === "INDIVIDUAL") ||
            (address?.addressDetails?.pincode !==
              caseDetails?.additionalDetails?.["complainantDetails"]?.formdata?.[0]?.data?.addressCompanyDetails?.pincode &&
              caseDetails?.additionalDetails?.["complainantDetails"]?.formdata?.[0]?.data?.complainantType?.code === "REPRESENTATIVE")
        ) &&
        !Object.keys(formData?.inquiryAffidavitFileUpload?.document || {}).length
      ) {
        return false;
      }
    }
    if (!formDataCopy?.respondentType?.code) {
      setShowErrorToast(true);
      return true;
    }
  }

  const respondentMobileNUmbers = formData?.phonenumbers?.textfieldValue;
  const complainantMobileNumber = caseDetails?.additionalDetails?.complainantDetails?.formdata?.[0]?.data?.complainantVerification?.mobileNumber;
  if (
    formData &&
    formData?.phonenumbers?.textfieldValue &&
    formData?.phonenumbers?.textfieldValue?.length === 10 &&
    respondentMobileNUmbers &&
    respondentMobileNUmbers &&
    respondentMobileNUmbers === complainantMobileNumber
  ) {
    toast.error(t("RESPONDENT_MOB_NUM_CAN_NOT_BE_SAME_AS_COMPLAINANT_MOB_NUM"));
    setFormErrors("phonenumbers", { mobileNumber: "RESPONDENT_MOB_NUM_CAN_NOT_BE_SAME_AS_COMPLAINANT_MOB_NUM" });
    return true;
  } else {
    clearFormDataErrors("phonenumbers");
    return false;
  }
};

export const demandNoticeFileValidation = ({ formData, selected, setShowErrorToast, setFormErrors }) => {
  if (selected === "demandNoticeDetails") {
    for (const key of ["legalDemandNoticeFileUpload", "proofOfDispatchFileUpload"]) {
      if (!(key in formData) || formData[key]?.document?.length === 0) {
        setFormErrors(key, { type: "required" });
        setShowErrorToast(true);
        return true;
      }
    }

    if (formData?.proofOfService?.code === "YES" && formData?.["proofOfAcknowledgmentFileUpload"]?.document.length === 0) {
      setFormErrors("proofOfAcknowledgmentFileUpload", { type: "required" });
      setShowErrorToast(true);
      return true;
    }
  } else {
    return false;
  }
};

export const chequeDetailFileValidation = ({ formData, selected, setShowErrorToast, setFormErrors }) => {
  if (selected === "chequeDetails") {
    for (const key of ["bouncedChequeFileUpload", "returnMemoFileUpload"]) {
      if (!(key in formData) || formData[key]?.document?.length === 0 || !formData[key] || Object.keys(formData[key] || {}).length === 0) {
        setFormErrors(key, { type: "required" });
        setShowErrorToast(true);
        return true;
      }
    }
    if (formData?.chequeAmount === "0") {
      setFormErrors("chequeAmount", { message: "Amount cannot be zero" });
      setShowErrorToast(true);
      return true;
    }
  } else {
    return false;
  }
};

export const getAdvocatesAndPipRemainingFields = (formdata, t) => {
  const allErrorData = [];
  for (let i = 0; i < formdata?.length; i++) {
    const formData = formdata?.[i]?.data || {};
    const { boxComplainant, isComplainantPip, numberOfAdvocates, multipleAdvocateNameDetails, vakalatnamaFileUpload, pipAffidavitFileUpload } =
      formData?.multipleAdvocatesAndPip || {};

    let errorObject = {
      ADVOCATE_INFORMATION_MISSING: false,
      VAKALATNAMA_DOCUMENT_MISSING: false,
      AFFIDAVIT_DOCUMENT_MISSING: false,
      ADVOCATE_COUNT_DIFFER: false,
      NUMBER_OF_ADVOCATES_MISSING: false,
    };
    if (boxComplainant?.individualId) {
      let isAnAdvocateMissing = false;
      let isVakalatnamaFileMissing = false;
      let isPipAffidavitFileMissing = false;
      let isAdvocateCountDiffer = false;
      let isNumberOfAdvocatesMissing = false;

      if (isComplainantPip?.code === "NO") {
        // IF complainant is not party in person, an advocate must be present
        if (!multipleAdvocateNameDetails || (Array.isArray(multipleAdvocateNameDetails) && multipleAdvocateNameDetails?.length === 0)) {
          isAnAdvocateMissing = true;
        } else if (
          multipleAdvocateNameDetails &&
          Array.isArray(multipleAdvocateNameDetails) &&
          multipleAdvocateNameDetails?.length > 0 &&
          multipleAdvocateNameDetails?.some((adv) => !adv?.advocateBarRegNumberWithName?.advocateId)
        ) {
          isAnAdvocateMissing = true;
        }
        // IF complainant is not party in person, there must be a vakalathnama document uploaded.
        if (!vakalatnamaFileUpload || vakalatnamaFileUpload?.document?.length === 0) {
          isVakalatnamaFileMissing = true;
        }
        if (!numberOfAdvocates) {
          isNumberOfAdvocatesMissing = true;
        }
        if (numberOfAdvocates && multipleAdvocateNameDetails?.length !== numberOfAdvocates) {
          isAdvocateCountDiffer = true;
        }
      }
      if (isComplainantPip?.code === "YES") {
        // IF complainant is party in person, there must be a PIP affidavit document uploaded.
        if (!pipAffidavitFileUpload || pipAffidavitFileUpload?.document?.length === 0) {
          isPipAffidavitFileMissing = true;
        }
      }
      errorObject.ADVOCATE_INFORMATION_MISSING = isAnAdvocateMissing;
      errorObject.VAKALATNAMA_DOCUMENT_MISSING = isVakalatnamaFileMissing;
      errorObject.AFFIDAVIT_DOCUMENT_MISSING = isPipAffidavitFileMissing;
      errorObject.ADVOCATE_COUNT_DIFFER = isAdvocateCountDiffer;
      errorObject.NUMBER_OF_ADVOCATES_MISSING = isNumberOfAdvocatesMissing;
    }
    let mandatoryLeft = false;
    for (let key in errorObject) {
      if (errorObject[key] === true) {
        mandatoryLeft = true;
      }
    }

    if (mandatoryLeft) {
      const errorData = {
        index: boxComplainant?.index,
        complainant: boxComplainant?.firstName,
        errorKeys: Object.keys(errorObject)
          .filter((key) => errorObject[key])
          .map((key) => t(key)),
      };
      allErrorData.push(errorData);
    }
  }
  return allErrorData;
};

export const getProcessCourierRemainingFields = (formdata, t, isDelayCondonation) => {
  const allErrorData = [];
  for (let i = 0; i < formdata?.length; i++) {
    const formData = formdata?.[i]?.data || {};

    let errorObject = {
      NOTICE_PROCESS_COURIER_INFORMATION_MISSING: false,
      SUMMON_PROCESS_COURIER_INFORMATION_MISSING: false,
    };
    if (isDelayCondonation) {
      if (formData?.multipleAccusedProcessCourier?.noticeCourierService?.length === 0) {
        errorObject.NOTICE_PROCESS_COURIER_INFORMATION_MISSING = true;
      }
    } else {
      if (formData?.multipleAccusedProcessCourier?.summonsCourierService?.length === 0) {
        errorObject.SUMMON_PROCESS_COURIER_INFORMATION_MISSING = true;
      }
    }
    let mandatoryLeft = false;
    for (let key in errorObject) {
      if (errorObject[key] === true) {
        mandatoryLeft = true;
      }
    }

    if (mandatoryLeft) {
      const errorData = {
        index: formData?.multipleAccusedProcessCourier?.index,
        type: "Accused",
        complainant: formData?.multipleAccusedProcessCourier?.firstName,
        errorKeys: Object.keys(errorObject)
          .filter((key) => errorObject[key])
          .map((key) => t(key)),
      };
      allErrorData.push(errorData);
    }
  }
  return allErrorData;
};

export const advocateDetailsFileValidation = ({ formData, selected, setShowErrorToast, setFormErrors, t, isSubmitDisabled }) => {
  if (selected === "advocateDetails") {
    const { boxComplainant, isComplainantPip, multipleAdvocateNameDetails, vakalatnamaFileUpload, pipAffidavitFileUpload } =
      formData?.multipleAdvocatesAndPip || {};
    let errorObject = {
      advocateDetailsAbsent: false,
      vakalatnamaFileUploadAbsent: false,
      pipAffidavitFileUploadAbsent: false,
    };
    if (boxComplainant?.individualId) {
      let isAnAdvocateMissing = false;
      let isVakalatnamaFileMissing = false;
      let isPipAffidavitFileMissing = false;
      if (isComplainantPip?.code === "NO") {
        // IF complainant is not party in person, an advocate must be present
        if (!multipleAdvocateNameDetails || (Array.isArray(multipleAdvocateNameDetails) && multipleAdvocateNameDetails?.length === 0)) {
          isAnAdvocateMissing = true;
        } else if (
          multipleAdvocateNameDetails &&
          Array.isArray(multipleAdvocateNameDetails) &&
          multipleAdvocateNameDetails?.length > 0 &&
          multipleAdvocateNameDetails?.some((adv) => !adv?.advocateBarRegNumberWithName?.advocateId)
        ) {
          isAnAdvocateMissing = true;
        }
        // IF complainant is not party in person, there must be a vakalathnama document uploaded.
        if (!vakalatnamaFileUpload || vakalatnamaFileUpload?.document?.length === 0) {
          isVakalatnamaFileMissing = true;
        }
      }
      if (isComplainantPip?.code === "YES") {
        // IF complainant is party in person, there must be a PIP affidavit document uploaded.
        if (!pipAffidavitFileUpload || pipAffidavitFileUpload?.document?.length === 0) {
          isPipAffidavitFileMissing = true;
        }
      }
      errorObject = {
        advocateDetailsAbsent: isAnAdvocateMissing,
        vakalatnamaFileUploadAbsent: isVakalatnamaFileMissing,
        pipAffidavitFileUploadAbsent: isPipAffidavitFileMissing,
      };
    }
    let mandatoryLeft = false;
    for (let key in errorObject) {
      if (errorObject[key] === true) {
        mandatoryLeft = true;
      }
    }
    // setError("multipleAdvocatesAndPip", errorObject);
  }
};

export const complainantValidation = ({
  formData,
  t,
  caseDetails,
  selected,
  setShowErrorToast,
  toast,
  setFormErrors,
  formState,
  clearFormDataErrors,
  displayindex,
  setErrorMsg,
}) => {
  if (selected === "complainantDetails") {
    const complainantFields = sideMenuConfig
      ?.find((item, index) => item?.key === "litigentDetails")
      ?.children?.find((config) => config?.key === "complainantDetails");
    const complainantMandatoryFields = complainantFields?.mandatoryFields;
    const complainantDependentMandatoryFields = complainantFields?.dependentMandatoryFields;

    for (const key of complainantMandatoryFields) {
      const value = extractValue(formData, key);
      const isValueEmpty = isEmptyValue(value);
      if (isValueEmpty) {
        setShowErrorToast(true);
        setErrorMsg(`Mandatory field missing- Complainant ${displayindex + 1} (${key})`);
        return true;
      }
    }

    for (const obj of complainantDependentMandatoryFields) {
      if (formData?.[obj?.dependentOn]?.[obj?.dependentOnKey]) {
        const value = extractValue(formData, obj?.field);
        const isValueEmpty = isEmptyValue(value);
        if (isValueEmpty) {
          setShowErrorToast(true);
          setErrorMsg(`Mandatory field missing- Complainant ${displayindex + 1} (${obj?.field})`);
          return true;
        }
      }
    }
    if (
      formData?.complainantType?.code !== "INDIVIDUAL" &&
      !formData?.complainantTypeOfEntity?.code &&
      !Object.keys(formState?.errors).includes("complainantTypeOfEntity")
    ) {
      setShowErrorToast(true);
      setFormErrors("complainantTypeOfEntity", { message: "CORE_REQUIRED_FIELD_ERROR" });
      return true;
    }
    if (!formData?.complainantVerification?.mobileNumber || !formData?.complainantVerification?.otpNumber) {
      setShowErrorToast(true);
      setFormErrors("complainantVerification", { mobileNumber: "PLEASE_VERIFY_YOUR_PHONE_NUMBER" });
      return true;
    } else {
      clearFormDataErrors("complainantVerification");
    }
    const respondentData = caseDetails?.additionalDetails?.respondentDetails;
    const complainantMobileNumber = formData?.complainantVerification?.mobileNumber;
    if (respondentData) {
      const respondentMobileNumbers = respondentData?.formdata?.[0]?.data?.phonenumbers?.mobileNumber;
      if (respondentMobileNumbers && complainantMobileNumber) {
        for (let i = 0; i < respondentMobileNumbers.length; i++) {
          if (respondentMobileNumbers[i] === complainantMobileNumber) {
            toast.error(t("CHANGE_RESPONDENT_MOBILE_NUMBER_REGISTERED"));
            return true;
          }
        }
      }
    }
  } else {
    return false;
  }
};

export const signatureValidation = ({ formData, selected, setShowErrorToast, setErrorMsg, caseDetails }) => {
  if (selected === "addSignature") {
    let index = 0;
    if (
      !(
        Object.keys(formData || {}).length > 0 &&
        Object.keys(formData).reduce((res, curr) => {
          if (!res) return res;
          else {
            res = Boolean(
              caseDetails?.[curr]?.reduce((result, current) => {
                if (!result) return result;
                result = Boolean(formData?.[curr]?.[`${current?.name} ${index}`]);
                ++index;
                return result;
              }, true) &&
                formData[curr] &&
                Object.keys(formData[curr])?.length > 0
            );
            index = 0;
            return res;
          }
        }, true)
      )
    ) {
      setShowErrorToast(true);
      setErrorMsg("CS_PLEASE_ADD_SIGNATURE_BEFORE_SUBMIT");
      return true;
    }
  } else {
    setErrorMsg("");
    return false;
  }
};

export const accusedAddressValidation = ({ formData, selected, setAddressError, config }) => {
  const addressKey = "addressDetails";
  if (
    config
      ?.find((item) => item.body?.[0]?.key === addressKey)
      ?.body?.[0]?.populators?.inputs?.filter((data) => !data?.showOptional)
      ?.some((data) =>
        formData?.[addressKey]?.some((address) => {
          const isEmpty = /^\s*$/.test(address?.[addressKey]?.[data?.name]);
          return (
            isEmpty ||
            !address?.[addressKey]?.[data?.name]?.match(window?.Digit.Utils.getPattern(data?.validation?.patternType) || data?.validation?.pattern)
          );
        })
      )
  ) {
    setAddressError({ show: true, message: "CS_PLEASE_CHECK_ADDRESS_DETAILS_BEFORE_SUBMIT" });
    return true;
  }
};

export const ageValidation = ({ formData, selected, setFormErrors, clearFormDataErrors }) => {
  if (selected === "poaAge") {
    const poaAge = parseInt(formData?.poaAge, 10);
    if (poaAge < 18 || poaAge > 999) {
      setFormErrors("poaAge", { message: "ONLY_AGE_ALLOWED" });
      return true;
    }
    clearFormDataErrors("poaAge");
  } else if (selected === "complainantAge") {
    const complainantAge = parseInt(formData?.complainantAge, 10);
    if (complainantAge < 18 || complainantAge > 999) {
      setFormErrors("complainantAge", { message: "ONLY_AGE_ALLOWED" });
      return true;
    }
    clearFormDataErrors("complainantAge");
  } else if (selected === "respondentAge") {
    const respondentAge = parseInt(formData?.respondentAge, 10);
    if (respondentAge < 18 || respondentAge > 999) {
      setFormErrors("respondentAge", { message: "ONLY_AGE_ALLOWED" });
      return true;
    }
    clearFormDataErrors("respondentAge");
  }
};

export const addressValidation = ({ formData, selected, setAddressError, config }) => {
  if (
    config
      ?.find((item) =>
        formData?.[selected]?.code === "INDIVIDUAL" ? item.body?.[0]?.key === "addressDetails" : item.body?.[0]?.key === "addressCompanyDetails"
      )
      ?.body?.[0]?.populators?.inputs?.filter((data) => !data?.showOptional)
      ?.some((data) => {
        const isEmpty = /^\s*$/.test(
          formData?.[formData?.[selected]?.code === "INDIVIDUAL" ? "addressDetails" : "addressCompanyDetails"]?.[data?.name]
        );
        return (
          isEmpty ||
          !formData?.[formData?.[selected]?.code === "INDIVIDUAL" ? "addressDetails" : "addressCompanyDetails"]?.[data?.name]?.match(
            window?.Digit.Utils.getPattern(data?.validation?.patternType) || data?.validation?.pattern
          )
        );
      }) ||
    (formData?.transferredPOA?.code === "YES" &&
      config
        ?.find((item) =>
          formData?.[selected]?.code === "INDIVIDUAL" ? item.body?.[0]?.key === "addressDetails" : item.body?.[0]?.key === "addressCompanyDetails"
        )
        ?.body?.[0]?.populators?.inputs?.filter((data) => !data?.showOptional)
        ?.some((data) => {
          const isEmpty = /^\s*$/.test(formData?.poaAddressDetails?.[data?.name]);
          return data?.name !== "typeOfAddress"
            ? false
            : isEmpty ||
                !formData?.poaAddressDetails?.[data?.name]?.match(
                  window?.Digit.Utils.getPattern(data?.validation?.patternType) || data?.validation?.pattern
                );
        }))
  ) {
    setAddressError({ show: true, message: "CS_PLEASE_CHECK_ADDRESS_DETAILS_BEFORE_SUBMIT" });
    return true;
  }
};

export const chequeDateValidation = ({ selected, formData, setError, clearErrors }) => {
  if (selected === "chequeDetails") {
    for (const key in formData) {
      switch (key) {
        case "issuanceDate":
          if (new Date(formData?.issuanceDate).getTime() > new Date().getTime()) {
            setError("issuanceDate", { message: "CS_DATE_ERROR_MSG" });
          } else {
            clearErrors("issuanceDate");
          }
          break;
        case "depositDate":
          if (
            formData?.depositDate &&
            formData?.issuanceDate &&
            new Date(formData?.issuanceDate).getTime() > new Date(formData?.depositDate).getTime()
          ) {
            setError("depositDate", { message: "CS_DEPOSIT_DATE_ERROR_MSG" });
          } else if (selected === "chequeDetails" && new Date(formData?.depositDate).getTime() > new Date().getTime()) {
            setError("depositDate", { message: "CS_DATE_ERROR_MSG" });
          } else {
            clearErrors("depositDate");
          }
          break;
        default:
          break;
      }
    }
  }
};

export const delayApplicationValidation = ({ t, formData, selected, setShowErrorToast, setErrorMsg, toast, setFormErrors }) => {
  if (selected === "delayApplications") {
    if (
      formData?.delayCondonationType?.code === "NO" &&
      formData?.isDcaSkippedInEFiling?.code === "NO" &&
      (!formData?.condonationFileUpload?.document || formData?.condonationFileUpload?.document.length === 0)
    ) {
      setFormErrors("condonationFileUpload", { type: "required" });
      toast.error(t("ES_COMMON_PLEASE_ENTER_ALL_MANDATORY_FIELDS"));
      return true;
    }
  } else {
    return false;
  }
};

export const witnessDetailsValidation = ({ t, formData, selected, setShowErrorToast, setErrorMsg, toast, setFormErrors }) => {
  if (selected === "witnessDetails") {
    if (!(formData?.firstName || formData?.witnessDesignation)) {
      // setFormErrors("firstName", { message: "FIRST_LAST_NAME_MANDATORY_MESSAGE" });
      // setFormErrors("witnessDesignation",{ message: "FIRST_LAST_NAME_MANDATORY_MESSAGE" })
      toast.error(t("AT_LEAST_ONE_OUT_OF_FIRST_NAME_AND_WITNESS_DESIGNATION_IS_MANDATORY"));
      return true;
    }
  } else {
    return false;
  }
};

export const debtLiabilityValidation = ({ t, formData, selected, setShowErrorToast, setErrorMsg, toast, setFormErrors }) => {
  if (selected === "debtLiabilityDetails") {
    if (formData?.totalAmount === "0") {
      setFormErrors("totalAmount", { message: "Amount cannot be zero" });
      setShowErrorToast(true);
      return true;
    }
  } else {
    return false;
  }
};

export const prayerAndSwornValidation = ({ t, formData, selected, setShowErrorToast, setErrorMsg, toast, setFormErrors, clearFormDataErrors }) => {
  if (selected === "prayerSwornStatement") {
    let hasError = false;

    if ("SelectUploadDocWithName" in formData && Array.isArray(formData?.SelectUploadDocWithName)) {
      let index = 0;
      for (const key of formData?.SelectUploadDocWithName) {
        if (!key?.document || key.document?.length === 0) {
          setFormErrors("SelectUploadDocWithName", { message: "ES_COMMON_PLEASE_ENTER_ALL_MANDATORY_FIELDS", documentIndex: index });
          setShowErrorToast(true);
          hasError = true;
        } else {
          clearFormDataErrors("SelectUploadDocWithName");
        }
        index = index++;
      }
    }

    if (formData?.prayer?.text === "<p></p>\n" || formData?.memorandumOfComplaint?.text === "<p></p>\n") {
      setFormErrors("prayer", { message: "ES_COMMON_PLEASE_ENTER_ALL_MANDATORY_FIELDS" });
      setShowErrorToast(true);
      hasError = true;
    }

    return hasError;
  } else {
    return false;
  }
};

export const createIndividualUser = async ({ data, documentData, tenantId, isComplainant = true }) => {
  const complainantVerification = isComplainant ? data?.complainantVerification : data?.poaVerification;
  const identifierId = documentData
    ? documentData?.fileStore
      ? documentData?.fileStore
      : documentData?.file?.files?.[0]?.fileStoreId
    : isComplainant
    ? data?.complainantId?.complainantId
    : data?.poaComplainantId?.poaComplainantId;
  const identifierIdDetails = documentData
    ? {
        fileStoreId: identifierId,
        filename: documentData?.filename,
        documentType: documentData?.fileType,
      }
    : {};
  const identifierType = documentData
    ? isComplainant
      ? data?.complainantId?.complainantId?.selectIdTypeType?.type || data?.complainantId?.complainantId?.complainantId?.selectIdTypeType?.type
      : data?.poaComplainantId?.poaComplainantId?.selectIdTypeType?.type
    : "AADHAR";
  let Individual = {
    Individual: {
      tenantId: tenantId,
      name: {
        givenName: isComplainant ? data?.firstName : data?.poaFirstName,
        familyName: isComplainant ? data?.lastName : data?.poaLastName,
        otherNames: isComplainant ? data?.middleName : data?.poaMiddleName,
      },
      // dateOfBirth: new Date(data?.dateOfBirth).getTime(),
      userDetails: {
        username: complainantVerification?.userDetails?.userName,
        roles: [
          {
            code: "CITIZEN",
            name: "Citizen",
            tenantId: tenantId,
          },
          ...[
            "CASE_CREATOR",
            "CASE_EDITOR",
            "CASE_VIEWER",
            "EVIDENCE_CREATOR",
            "EVIDENCE_VIEWER",
            "EVIDENCE_EDITOR",
            "APPLICATION_CREATOR",
            "APPLICATION_VIEWER",
            "HEARING_VIEWER",
            "ORDER_VIEWER",
            "SUBMISSION_CREATOR",
            "SUBMISSION_RESPONDER",
            "SUBMISSION_DELETE",
            "TASK_VIEWER",
            "ADVOCATE_VIEWER",
            "CASE_RESPONDER",
            "HEARING_ACCEPTOR",
            "PENDING_TASK_CREATOR",
            "BAIL_BOND_CREATOR",
            "BAIL_BOND_VIEWER",
            "BAIL_BOND_EDITOR",
            "PLEA_SIGNER",
            "PLEA_EDITOR",
            "MEDIATION_SIGNER",
            "MEDIATION_EDITOR",
            "EXAMINATION_SIGNER",
            "EXAMINATION_EDITOR",
            "PLEA_VIEWER",
            "MEDIATION_VIEWER",
            "EXAMINATION_VIEWER",
          ]?.map((role) => ({
            code: role,
            name: role,
            tenantId: tenantId,
          })),
        ],

        type: complainantVerification?.userDetails?.type,
      },
      userUuid: complainantVerification?.userDetails?.uuid,
      userId: complainantVerification?.userDetails?.id,
      mobileNumber: complainantVerification?.userDetails?.mobileNumber,
      address: [
        {
          tenantId: tenantId,
          type: "PERMANENT",
          latitude: data?.addressDetails?.coordinates?.latitude,
          longitude: data?.addressDetails?.coordinates?.longitude,
          city: data?.addressDetails?.city,
          pincode: data?.addressDetails?.pincode || data?.["addressDetails-select"]?.pincode,
          addressLine1: data?.addressDetails?.state,
          addressLine2: data?.addressDetails?.district,
          street: data?.addressDetails?.locality,
        },
        {
          tenantId: tenantId,
          type: "CORRESPONDENCE",
          latitude: data?.currentAddressDetails?.coordinates?.latitude,
          longitude: data?.currentAddressDetails?.coordinates?.longitude,
          city: data?.currentAddressDetails?.city,
          pincode: data?.currentAddressDetails?.pincode || data?.["currentAddressDetails-select"]?.pincode,
          addressLine1: data?.currentAddressDetails?.state,
          addressLine2: data?.currentAddressDetails?.district,
          street: data?.currentAddressDetails?.locality,
        },
      ],
      identifiers: [
        {
          identifierType: identifierType,
          identifierId: identifierId,
        },
      ],
      isSystemUser: true,
      skills: [],
      additionalFields: {
        fields: [
          { key: "userType", value: userTypeOptions?.[0]?.code },
          { key: "userTypeDetail", value: JSON.stringify(userTypeOptions) },
          { key: "identifierIdDetails", value: JSON.stringify(identifierIdDetails) },
        ],
      },
      clientAuditDetails: {},
      auditDetails: {},
    },
  };
  const response = await window?.Digit.DRISTIService.postIndividualService(Individual, tenantId);
  const refreshToken = window.localStorage.getItem(`temp-refresh-token-${complainantVerification?.userDetails?.mobileNumber}`);
  window.localStorage.removeItem(`temp-refresh-token-${complainantVerification?.userDetails?.mobileNumber}`);
  if (refreshToken) {
    await getUserDetails(refreshToken, complainantVerification?.userDetails?.mobileNumber);
  }
  return response;
};

export const updateIndividualUser = async ({ data, documentData, tenantId, individualData }) => {
  const identifierId = documentData
    ? documentData?.fileStore
      ? documentData?.fileStore
      : documentData?.file?.files?.[0]?.fileStoreId
    : data?.complainantId?.complainantId;
  const identifierIdDetails = documentData
    ? {
        fileStoreId: identifierId,
        filename: documentData?.filename,
        documentType: documentData?.fileType,
      }
    : {};
  const identifierType = documentData ? data?.complainantId?.complainantId?.selectIdTypeType?.type : "AADHAR";
  let Individual = {
    Individual: {
      ...individualData,
      identifiers: [
        {
          ...individualData?.identifiers?.[0],
          identifierType: identifierType,
          identifierId: identifierId,
        },
      ],
      additionalFields: {
        ...individualData.additionalFields,
        fields: individualData.additionalFields.fields.map((field) =>
          field.key === "identifierIdDetails" ? { ...field, value: JSON.stringify(identifierIdDetails) } : field
        ),
      },
    },
  };
  const response = await window?.Digit.DRISTIService.updateIndividualUser(Individual, { tenantId });
  const refreshToken = window.localStorage.getItem(`temp-refresh-token-${data?.complainantVerification?.userDetails?.mobileNumber}`);
  window.localStorage.removeItem(`temp-refresh-token-${data?.complainantVerification?.userDetails?.mobileNumber}`);
  if (refreshToken) {
    await getUserDetails(refreshToken, data?.complainantVerification?.userDetails?.mobileNumber);
  }
  return response;
};

export const onDocumentUpload = async (documentType = "Document", fileData, filename, tenantId) => {
  if (fileData?.fileStore) return fileData;
  try {
    const fileUploadRes = await window?.Digit.UploadServices.Filestorage("DRISTI", fileData, tenantId);
    return { file: fileUploadRes?.data, fileType: fileData.type, filename };
  } catch (error) {
    throw new DocumentUploadError(`Document upload failed: ${error.message}`, documentType);
  }
};

export const sendDocumentForOcr = async (key, fileStoreId, filingNumber, tenantId, document) => {
  if ((efilingDocumentKeyAndTypeMapping[key] && document?.type === "image/jpeg") || document?.type === "application/pdf")
    await window?.Digit?.DRISTIService.sendDocuemntForOCR(
      {
        documentType: efilingDocumentKeyAndTypeMapping[key],
        fileStoreId: fileStoreId,
        filingNumber: filingNumber,
        tenantId: tenantId,
      },
      {}
    );
};

export const getAllAssignees = (caseDetails, getAdvocates = true, getLitigent = true) => {
  if (Array.isArray(caseDetails?.representatives || []) && caseDetails?.representatives?.length > 0) {
    return caseDetails?.representatives
      ?.reduce((res, curr) => {
        if (getAdvocates && curr && curr?.additionalDetails?.uuid) {
          res.push(curr?.additionalDetails?.uuid);
        }
        if (getLitigent && curr && curr?.representing && Array.isArray(curr?.representing || []) && curr?.representing?.length > 0) {
          const representingUuids = curr?.representing?.reduce((result, current) => {
            if (current && current?.additionalDetails?.uuid) {
              result.push(current?.additionalDetails?.uuid);
            }
            return result;
          }, []);
          res.push(representingUuids);
        }
        return res;
      }, [])
      ?.flat();
  } else if (Array.isArray(caseDetails?.litigants || []) && caseDetails?.litigants?.length > 0) {
    return caseDetails?.litigants
      ?.reduce((res, curr) => {
        if (curr && curr?.additionalDetails?.uuid) {
          res.push(curr?.additionalDetails?.uuid);
        }
        return res;
      }, [])
      ?.flat();
  }
  return null;
};

export const getAdvocates = (caseDetails) => {
  let litigants = {};
  let list = [];

  caseDetails?.litigants?.forEach((litigant) => {
    const poaHolder = (caseDetails?.poaHolders || [])
      ?.filter((holder) => holder?.representingLitigants?.some((lit) => lit?.individualId === litigant?.individualId))
      ?.map((holder) => holder?.additionalDetails?.uuid);

    list = caseDetails?.representatives
      ?.filter((item) => {
        return item?.representing?.some((lit) => lit?.individualId === litigant?.individualId) && item?.additionalDetails?.uuid;
      })
      .map((item) => item?.additionalDetails?.uuid);
    if (list?.length > 0) {
      litigants[litigant?.additionalDetails?.uuid] = list;
    } else {
      litigants[litigant?.additionalDetails?.uuid] = [litigant?.additionalDetails?.uuid, ...poaHolder];
    }
  });
  return litigants;
};

const documentUploadHandler = async (document, index, prevCaseDetails, data, pageConfig, key, selected, tenantId, documentType) => {
  const tempDocList = [];
  let tempFile;
  const isMultipleUpload =
    pageConfig?.formconfig
      ?.find((config) => config?.body?.[0]?.key === key)
      ?.body?.[0]?.populators?.inputs?.find((input) => input.name === "document")?.isMultipleUpload === true || false;

  const oldBouncedChequeFileUpload = prevCaseDetails?.caseDetails?.[selected]?.formdata?.[data?.displayindex]?.data?.[key];

  if (document && !document?.fileStore) {
    const uploadedData = await onDocumentUpload(documentType, document, document.name, tenantId);
    tempFile = {
      documentType: documentType,
      fileStore: uploadedData.file?.files?.[0]?.fileStoreId || document?.fileStore,
      documentName: uploadedData.filename || document?.documentName,
      fileName: pageConfig?.selectDocumentName?.[key],
    };
    if (uploadedData.file?.files?.[0]?.fileStoreId && efilingDocumentKeyAndTypeMapping[key]) {
      sendDocumentForOcr(key, uploadedData.file?.files?.[0]?.fileStoreId, prevCaseDetails?.filingNumber, tenantId, document);
    }
    if (oldBouncedChequeFileUpload !== undefined) {
      const xTemp = prevCaseDetails?.documents?.filter((doc) => doc.fileStore === oldBouncedChequeFileUpload?.document?.[index]?.fileStore)?.[0];
      tempDocList.push({
        ...xTemp,
        additionalDetails: {
          ...xTemp?.additionalDetails,
          latest: false,
        },
        isActive: false,
      });
    }
    tempDocList.push({
      ...tempFile,
      isActive: true,
      additionalDetails: {
        type: selected,
        displayindex: data?.displayindex,
        fileName: tempFile?.fileName,
        documentName: tempFile?.documentName,
        latest: true,
        key: key,
        ...(isMultipleUpload && {
          isMultipleUpload,
          id: data?.displayindex,
          index,
        }),
      },
    });
  } else tempFile = document;
  return { tempData: tempDocList, tempFile: tempFile };
};

const fetchBasicUserInfo = async (caseDetails, tenantId) => {
  const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
  const userUuid = userInfo?.uuid;
  const authorizedUuid = getAuthorizedUuid(userUuid);
  const individualData = await window?.Digit.DRISTIService.searchIndividualUser(
    {
      Individual: {
        userUuid: [authorizedUuid],
      },
    },
    { tenantId, limit: 1000, offset: 0 },
    "",
    authorizedUuid
  );

  return individualData?.Individual?.[0]?.individualId;
};

export const getComplainantName = (complainantDetails, t) => {
  const count = complainantDetails?.length;
  var concatenatedComplainantName = "";
  if (complainantDetails?.[0]?.data?.complainantType?.code === "INDIVIDUAL") {
    concatenatedComplainantName =
      complainantDetails?.[0]?.data?.firstName &&
      `${complainantDetails?.[0]?.data?.firstName || ""} ${complainantDetails?.[0]?.data?.lastName || ""}`.trim();
  } else concatenatedComplainantName = complainantDetails?.[0]?.data?.complainantCompanyName || "";
  if (count > 1) {
    concatenatedComplainantName = concatenatedComplainantName + ` and ${count - 1} ${t(count === 2 ? "TITLE_OTHER" : "TITLE_OTHERS")}`;
  }
  return concatenatedComplainantName;
};

export const getRespondentName = (respondentDetails, t) => {
  const count = respondentDetails?.length;
  var concatenatedRespondentName = "";
  if (respondentDetails?.[0]?.data?.respondentType?.code === "INDIVIDUAL") {
    concatenatedRespondentName =
      respondentDetails?.[0]?.data?.respondentFirstName &&
      `${respondentDetails?.[0]?.data?.respondentFirstName || ""} ${respondentDetails?.[0]?.data?.respondentLastName || ""}`.trim();
  } else concatenatedRespondentName = respondentDetails?.[0]?.data?.respondentCompanyName || "";
  if (count > 1) {
    concatenatedRespondentName = concatenatedRespondentName + ` and ${count - 1} ${t(count === 2 ? "TITLE_OTHER" : "TITLE_OTHERS")}`;
  }
  return concatenatedRespondentName;
};

const updateComplaintDocInCaseDoc = (docList, complaintDoc) => {
  const newDocList = structuredClone(docList || []);
  const index = newDocList.findIndex((doc) => doc.documentType === "case.complaint.unsigned");
  if (index > -1) {
    newDocList.splice(index, 1);
  }
  newDocList.push(complaintDoc);
  return newDocList;
};

const calculateTotalChequeAmount = (formData) => {
  let totalChequeAmount = 0;
  for (let i = 0; i < formData?.length; i++) {
    if (formData[i]?.data?.chequeAmount) {
      totalChequeAmount = totalChequeAmount + parseInt(formData[i].data.chequeAmount);
    }
  }
  return totalChequeAmount.toString();
};

export const updateCaseDetails = async ({
  t,
  isCompleted,
  setIsDisabled,
  tenantId,
  caseDetails,
  prevCaseDetails,
  selected,
  formdata,
  pageConfig,
  setFormDataValue,
  action = "SAVE_DRAFT",
  isSaveDraftEnabled = false,
  isCaseSignedState = false,
  setErrorCaseDetails = () => {},
  multiUploadList,
  scrutinyObj,
  caseComplaintDocument,
  filingType,
  isDelayCondonation,
}) => {
  const data = {};
  setIsDisabled(true);
  let tempDocList = structuredClone(caseDetails?.documents || []);

  const updateTempDocListMultiForm = (docList, docTypes) => {
    const indicesToRemove = tempDocList.map((doc, index) => (docTypes.includes(doc.documentType) ? index : -1)).filter((index) => index !== -1);

    for (let i = indicesToRemove.length - 1; i >= 0; i--) {
      tempDocList.splice(indicesToRemove[i], 1);
    }
    if (docList.length > 0) {
      for (let i = 0; i < docList.length; i++) {
        tempDocList.push(docList[i]);
      }
    }
  };

  const individualId = await fetchBasicUserInfo(prevCaseDetails, tenantId);

  function cloneFormDataRemoveIcon(originalFormDataArray) {
    return originalFormDataArray.map((originalFormData) => {
      if (originalFormData?.data?.advocateBarRegNumberWithName) {
        delete originalFormData.data.advocateBarRegNumberWithName[0].icon;
        const clonedFormData = structuredClone(originalFormData);
        return clonedFormData;
      } else return originalFormData;
    });
  }
  const updatedFormData = cloneFormDataRemoveIcon(formdata);
  async function processFormData() {
    try {
      const promises = updatedFormData.map(async (formItem, index) => {
        if (formItem?.isenabled) {
          const subPromises = multiUploadList.map(async (obj) => {
            const { key, fieldType } = obj;
            if (formItem?.data?.[key]?.[fieldType]?.length > 1) {
              let docData = structuredClone(formItem?.data?.[key]?.[fieldType]);
              // Combine multiple files and store the result in formItem
              const combinedDoc = await combineMultipleFiles(docData, `${t("COMBINED_DOC")}.pdf`, key);
              updatedFormData[index].data[key][fieldType] = combinedDoc; // Update the form data with the combined document
            }
          });
          await Promise.all(subPromises);
        }
      });
      await Promise.all(promises);
    } catch (error) {
      console.error("Error processing form data: ", error);
      throw error;
    }
  }
  await processFormData();

  const updateCaseDocuments = (key, newDocObj) => {
    const index = tempDocList.findIndex((item) => item.documentType === key);
    if (newDocObj !== false) {
      if (index !== -1) {
        tempDocList[index] = newDocObj;
      } else {
        tempDocList.push(newDocObj);
      }
    } else {
      if (index !== -1) {
        tempDocList.splice(index, 1);
      }
    }
  };

  function transformFileData(inputArray, tenantId = "kl", fileType = "application/pdf") {
    if (!Array.isArray(inputArray) || inputArray.length === 0) return null;

    const { fileStore, documentName } = inputArray[0];

    return {
      file: {
        files: [
          {
            fileStoreId: fileStore,
            tenantId,
          },
        ],
      },
      fileType,
      filename: documentName,
    };
  }

  if (selected === "complainantDetails") {
    let litigants = [];
    let poaHolders = [];
    const complainantVerification = {};
    const poaVerification = {};
    const litigantFilestoreIds = {};
    const poaFilestoreIds = {};
    // check -in new flow, mltiple complainant forms are possible, so iscompleted logic has to be updated
    // and logic to update litigants also has to be changed.
    if (isCompleted === true) {
      litigants = await Promise.all(
        updatedFormData
          .filter((item) => item.isenabled)
          .map(async (data, index) => {
            if (
              data?.data?.complainantVerification?.individualDetails?.document &&
              data?.data?.complainantVerification?.individualDetails?.individualId
            ) {
              const Individual = await DRISTIService.searchIndividualUser(
                {
                  Individual: {
                    individualId: data?.data?.complainantVerification?.individualDetails?.individualId,
                  },
                },
                { tenantId, limit: 1, offset: 0 }
              );
              const userUuid = Individual?.Individual?.[0]?.userUuid || "";
              if (
                scrutinyObj?.litigentDetails?.complainantDetails?.form?.some((item) =>
                  item.hasOwnProperty("complainantVerification.individualDetails.document")
                )
              ) {
                // get filestore and update individual user. (but only for newly updated id proofs. if not updated, keep as it is)
                if (data?.data?.complainantId?.complainantId?.ID_Proof?.[0]?.[1]?.file) {
                  const documentData = await onDocumentUpload(
                    documentsTypeMapping["complainantId"],
                    data?.data?.complainantId?.complainantId?.ID_Proof?.[0]?.[1]?.file,
                    data?.data?.complainantId?.complainantId?.ID_Proof?.[0]?.[0],
                    tenantId
                  );
                  !!setFormDataValue &&
                    setFormDataValue("complainantVerification", {
                      ...data?.data?.complainantVerification,
                      individualDetails: {
                        ...data?.data?.complainantVerification?.individualDetails,
                        document: [
                          {
                            ...data?.data?.complainantVerification?.individualDetails?.document?.[0],
                            documentType: documentData.fileType || documentData?.documentType,
                            fileStore: documentData.file?.files?.[0]?.fileStoreId || documentData?.fileStore,
                            documentName: documentData.filename || documentData?.documentName,
                            fileName: "ID Proof",
                          },
                        ],
                      },
                    });
                  complainantVerification[index] = {
                    individualDetails: {
                      ...data?.data?.complainantVerification?.individualDetails,
                      document: [
                        {
                          ...data?.data?.complainantVerification?.individualDetails?.document?.[0],
                          documentType: documentData.fileType || documentData?.documentType,
                          fileStore: documentData.file?.files?.[0]?.fileStoreId || documentData?.fileStore,
                          documentName: documentData.filename || documentData?.documentName,
                          fileName: "ID Proof",
                        },
                      ],
                    },
                  };
                  await updateIndividualUser({ data: data?.data, documentData, tenantId, individualData: Individual?.Individual?.[0] });
                }
              }
              return {
                tenantId,
                caseId: caseDetails?.id,
                partyCategory: data?.data?.complainantType?.code,
                individualId: data?.data?.complainantVerification?.individualDetails?.individualId,
                partyType: index === 0 ? "complainant.primary" : "complainant.additional",
                additionalDetails: {
                  fullName: getFullName(" ", data?.data?.firstName, data?.data?.middleName, data?.data?.lastName),
                  uuid: userUuid ? userUuid : null,
                  currentPosition: index + 1,
                },
              };
            } else {
              if (data?.data?.complainantId?.complainantId && data?.data?.complainantVerification?.isUserVerified) {
                if (data?.data?.complainantId?.verificationType !== "AADHAR") {
                  let documentData = {};

                  if (data?.data?.complainantVerification?.individualDetails?.document) {
                    documentData = transformFileData(data?.data?.complainantVerification?.individualDetails?.document);
                  } else {
                    documentData = await onDocumentUpload(
                      documentsTypeMapping["complainantId"],
                      data?.data?.complainantId?.complainantId?.ID_Proof?.[0]?.[1]?.file,
                      data?.data?.complainantId?.complainantId?.ID_Proof?.[0]?.[0],
                      tenantId
                    );
                  }

                  litigantFilestoreIds[index] = documentData;
                  !!setFormDataValue &&
                    setFormDataValue("complainantVerification", {
                      individualDetails: {
                        document: [
                          {
                            documentType: documentData.fileType || documentData?.documentType,
                            fileStore: documentData.file?.files?.[0]?.fileStoreId || documentData?.fileStore,
                            documentName: documentData.filename || documentData?.documentName,
                            fileName: "ID Proof",
                          },
                        ],
                      },
                    });
                  const Individual = await createIndividualUser({ data: data?.data, documentData, tenantId });

                  let permanentAddress;
                  let currentAddress;
                  const addressArray = Individual?.Individual?.address;
                  if (addressArray?.length > 1) {
                    permanentAddress = addressArray?.find((address) => address?.type === "PERMANENT");
                    currentAddress = addressArray?.find((address) => address?.type === "CORRESPONDENCE");
                  } else {
                    permanentAddress = addressArray?.[0];
                    currentAddress = addressArray?.[0];
                  }

                  const buildingName = permanentAddress?.buildingName || "";
                  const street = permanentAddress?.street || "";
                  const doorNo = permanentAddress?.doorNo || "";
                  const address = `${doorNo ? doorNo + "," : ""} ${buildingName ? buildingName + "," : ""} ${street}`.trim();

                  const buildingName1 = currentAddress?.buildingName || "";
                  const street1 = currentAddress?.street || "";
                  const doorNo1 = currentAddress?.doorNo || "";
                  const address1 = `${doorNo1 ? doorNo1 + "," : ""} ${buildingName1 ? buildingName1 + "," : ""} ${street1}`.trim();

                  const firstName = Individual?.Individual?.name?.givenName;
                  const lastName = Individual?.Individual?.name?.familyName;
                  const middleName = Individual?.Individual?.name?.otherNames;
                  const userUuid = Individual?.Individual?.userUuid;

                  complainantVerification[index] = {
                    individualDetails: {
                      document: [
                        {
                          documentType: documentData.fileType || documentData?.documentType,
                          fileStore: documentData.file?.files?.[0]?.fileStoreId || documentData?.fileStore,
                          documentName: documentData.filename || documentData?.documentName,
                          fileName: "ID Proof",
                        },
                      ],
                      individualId: Individual?.Individual?.individualId,
                      "addressDetails-select": {
                        pincode: permanentAddress?.pincode || "",
                        district: permanentAddress?.addressLine2 || "",
                        city: permanentAddress?.city || "",
                        state: permanentAddress?.addressLine1 || "",
                        coordinates: {
                          longitude: permanentAddress?.longitude || "",
                          latitude: permanentAddress?.latitude || "",
                        },
                        locality: address,
                      },
                      "currentAddressDetails-select": {
                        pincode: currentAddress?.pincode || "",
                        district: currentAddress?.addressLine2 || "",
                        city: currentAddress?.city || "",
                        state: currentAddress?.addressLine1 || "",
                        coordinates: {
                          longitude: currentAddress?.longitude || "",
                          latitude: currentAddress?.latitude || "",
                        },
                        locality: address1,
                        isCurrAddrSame:
                          addressArray?.length > 1
                            ? {
                                code: "NO",
                                name: "NO",
                              }
                            : {
                                code: "YES",
                                name: "YES",
                              },
                      },
                      addressDetails: {
                        pincode: permanentAddress?.pincode || "",
                        district: permanentAddress?.addressLine2 || "",
                        city: permanentAddress?.city || "",
                        state: permanentAddress?.addressLine1 || "",
                        coordinates: {
                          longitude: permanentAddress?.longitude || "",
                          latitude: permanentAddress?.latitude || "",
                        },
                        locality: address,
                      },
                      currentAddressDetails: {
                        pincode: currentAddress?.pincode || "",
                        district: currentAddress?.addressLine2 || "",
                        city: currentAddress?.city || "",
                        state: currentAddress?.addressLine1 || "",
                        coordinates: {
                          longitude: currentAddress?.longitude || "",
                          latitude: currentAddress?.latitude || "",
                        },
                        locality: address1,
                        isCurrAddrSame:
                          addressArray?.length > 1
                            ? {
                                code: "NO",
                                name: "NO",
                              }
                            : {
                                code: "YES",
                                name: "YES",
                              },
                      },
                    },
                    userDetails: null,
                  };
                  return {
                    tenantId,
                    caseId: caseDetails?.id,
                    partyCategory: data?.data?.complainantType?.code,
                    individualId: Individual?.Individual?.individualId,
                    partyType: index === 0 ? "complainant.primary" : "complainant.additional",
                    additionalDetails: {
                      fullName: getFullName(" ", firstName, middleName, lastName),
                      uuid: userUuid ? userUuid : null,
                      currentPosition: index + 1,
                    },
                  };
                } else {
                  const Individual = await createIndividualUser({ data: data?.data, tenantId });
                  let permanentAddress;
                  let currentAddress;
                  const addressArray = Individual?.Individual?.address;
                  if (addressArray?.length > 1) {
                    permanentAddress = addressArray?.find((address) => address?.type === "PERMANENT");
                    currentAddress = addressArray?.find((address) => address?.type === "CORRESPONDENCE");
                  } else {
                    permanentAddress = addressArray?.[0];
                    currentAddress = addressArray?.[0];
                  }

                  const buildingName = permanentAddress?.buildingName || "";
                  const street = permanentAddress?.street || "";
                  const doorNo = permanentAddress?.doorNo || "";
                  const address = `${doorNo ? doorNo + "," : ""} ${buildingName ? buildingName + "," : ""} ${street}`.trim();

                  const buildingName1 = currentAddress?.buildingName || "";
                  const street1 = currentAddress?.street || "";
                  const doorNo1 = currentAddress?.doorNo || "";
                  const address1 = `${doorNo1 ? doorNo1 + "," : ""} ${buildingName1 ? buildingName1 + "," : ""} ${street1}`.trim();

                  const firstName = Individual?.Individual?.name?.givenName;
                  const lastName = Individual?.Individual?.name?.familyName;
                  const middleName = Individual?.Individual?.name?.otherNames;
                  const userUuid = Individual?.Individual?.userUuid;

                  complainantVerification[index] = {
                    individualDetails: {
                      document: null,
                      individualId: Individual?.Individual?.individualId,
                      "addressDetails-select": {
                        pincode: permanentAddress?.pincode || "",
                        district: permanentAddress?.addressLine2 || "",
                        city: permanentAddress?.city || "",
                        state: permanentAddress?.addressLine1 || "",
                        coordinates: {
                          longitude: permanentAddress?.longitude || "",
                          latitude: permanentAddress?.latitude || "",
                        },
                        locality: address,
                      },
                      "currentAddressDetails-select": {
                        pincode: currentAddress?.pincode || "",
                        district: currentAddress?.addressLine2 || "",
                        city: currentAddress?.city || "",
                        state: currentAddress?.addressLine1 || "",
                        coordinates: {
                          longitude: currentAddress?.longitude || "",
                          latitude: currentAddress?.latitude || "",
                        },
                        locality: address1,
                        isCurrAddrSame:
                          addressArray?.length > 1
                            ? {
                                code: "NO",
                                name: "NO",
                              }
                            : {
                                code: "YES",
                                name: "YES",
                              },
                      },
                      addressDetails: {
                        pincode: permanentAddress?.pincode || "",
                        district: permanentAddress?.addressLine2 || "",
                        city: permanentAddress?.city || "",
                        state: permanentAddress?.addressLine1 || "",
                        coordinates: {
                          longitude: permanentAddress?.longitude || "",
                          latitude: permanentAddress?.latitude || "",
                        },
                        locality: address,
                      },
                      currentAddressDetails: {
                        pincode: currentAddress?.pincode || "",
                        district: currentAddress?.addressLine2 || "",
                        city: currentAddress?.city || "",
                        state: currentAddress?.addressLine1 || "",
                        coordinates: {
                          longitude: currentAddress?.longitude || "",
                          latitude: currentAddress?.latitude || "",
                        },
                        locality: address1,
                        isCurrAddrSame:
                          addressArray?.length > 1
                            ? {
                                code: "NO",
                                name: "NO",
                              }
                            : {
                                code: "YES",
                                name: "YES",
                              },
                      },
                    },
                    userDetails: null,
                  };
                  return {
                    tenantId,
                    caseId: caseDetails?.id,
                    partyCategory: data?.data?.complainantType?.code,
                    individualId: Individual?.Individual?.individualId,
                    partyType: index === 0 ? "complainant.primary" : "complainant.additional",
                    additionalDetails: {
                      fullName: getFullName(" ", firstName, middleName, lastName),
                      uuid: userUuid ? userUuid : null,
                      currentPosition: index + 1,
                    },
                  };
                }
              }
              return {};
            }
          })
      );

      poaHolders = await Promise.all(
        updatedFormData
          .filter((item) => item.isenabled)
          .map(async (data, index) => {
            if (data?.data?.poaVerification?.individualDetails?.document) {
              const Individual = await DRISTIService.searchIndividualUser(
                {
                  Individual: {
                    individualId: data?.data?.poaVerification?.individualDetails?.individualId,
                  },
                },
                { tenantId, limit: 1, offset: 0 }
              );
              const userUuid = Individual?.Individual?.[0]?.userUuid || "";

              if (
                scrutinyObj?.litigentDetails?.complainantDetails?.form?.some((item) =>
                  item.hasOwnProperty("poaVerification.individualDetails.document")
                )
              ) {
                // get filestore and update individual user. (but only for newly updated id proofs. if not updated, keep as it is)
                if (data?.data?.poaComplainantId?.poaComplainantId?.ID_Proof?.[0]?.[1]?.file) {
                  const documentData = await onDocumentUpload(
                    documentsTypeMapping["poaComplainantId"],
                    data?.data?.poaComplainantId?.poaComplainantId?.ID_Proof?.[0]?.[1]?.file,
                    data?.data?.poaComplainantId?.poaComplainantId?.ID_Proof?.[0]?.[0],
                    tenantId
                  );
                  !!setFormDataValue &&
                    setFormDataValue("poaVerification", {
                      ...data?.data?.poaVerification,
                      individualDetails: {
                        ...data?.data?.poaVerification?.individualDetails,
                        document: [
                          {
                            ...data?.data?.poaVerification?.individualDetails?.document?.[0],
                            documentType: documentData.fileType || documentData?.documentType,
                            fileStore: documentData.file?.files?.[0]?.fileStoreId || documentData?.fileStore,
                            documentName: documentData.filename || documentData?.documentName,
                            fileName: "ID Proof",
                          },
                        ],
                      },
                    });
                  poaVerification[index] = {
                    individualDetails: {
                      ...data?.data?.poaVerification?.individualDetails,
                      document: [
                        {
                          ...data?.data?.poaVerification?.individualDetails?.document?.[0],
                          documentType: documentData.fileType || documentData?.documentType,
                          fileStore: documentData.file?.files?.[0]?.fileStoreId || documentData?.fileStore,
                          documentName: documentData.filename || documentData?.documentName,
                          fileName: "ID Proof",
                        },
                      ],
                    },
                  };
                  await updateIndividualUser({ data: data?.data, documentData, tenantId, individualData: Individual?.Individual?.[0] });
                }
              }
              return {
                tenantId,
                caseId: caseDetails?.id,
                individualId: data?.data?.poaVerification?.individualDetails?.individualId,
                name: getFullName(" ", data?.data?.poaFirstName, data?.data?.poaMiddleName, data?.data?.poaLastName),
                poaType: "poa.regular",
                documents: data?.data?.poaVerification?.individualDetails?.document,
                representingLitigants: [
                  {
                    individualId: data?.data?.complainantVerification?.individualDetails?.individualId,
                  },
                ],
                additionalDetails: {
                  uuid: userUuid ? userUuid : null,
                },
              };
            } else {
              if (data?.data?.poaComplainantId?.poaComplainantId && data?.data?.poaVerification?.isUserVerified) {
                if (data?.data?.poaComplainantId?.verificationType !== "AADHAR") {
                  const documentData = await onDocumentUpload(
                    documentsTypeMapping["poaComplainantId"],
                    data?.data?.poaComplainantId?.poaComplainantId?.ID_Proof?.[0]?.[1]?.file,
                    data?.data?.poaComplainantId?.poaComplainantId?.ID_Proof?.[0]?.[0],
                    tenantId
                  );
                  poaFilestoreIds[index] = documentData;
                  !!setFormDataValue &&
                    setFormDataValue("poaVerification", {
                      individualDetails: {
                        document: [
                          {
                            documentType: documentData.fileType || documentData?.documentType,
                            fileStore: documentData.file?.files?.[0]?.fileStoreId || documentData?.fileStore,
                            documentName: documentData.filename || documentData?.documentName,
                            fileName: "ID Proof",
                          },
                        ],
                      },
                    });
                  const Individual = await createIndividualUser({ data: data?.data, documentData, tenantId, isComplainant: false });
                  const addressLine1 = Individual?.Individual?.address[0]?.addressLine1 || "";
                  const addressLine2 = Individual?.Individual?.address[0]?.addressLine2 || "";
                  const buildingName = Individual?.Individual?.address[0]?.buildingName || "";
                  const street = Individual?.Individual?.address[0]?.street || "";
                  const city = Individual?.Individual?.address[0]?.city || "";
                  const pincode = Individual?.Individual?.address[0]?.pincode || "";
                  const latitude = Individual?.Individual?.address[0]?.latitude || "";
                  const longitude = Individual?.Individual?.address[0]?.longitude || "";
                  const doorNo = Individual?.Individual?.address[0]?.doorNo || "";
                  const firstName = Individual?.Individual?.name?.givenName;
                  const lastName = Individual?.Individual?.name?.familyName;
                  const middleName = Individual?.Individual?.name?.otherNames;
                  const userUuid = Individual?.Individual?.userUuid;

                  const address = `${doorNo ? doorNo + "," : ""} ${buildingName ? buildingName + "," : ""} ${street}`.trim();

                  poaVerification[index] = {
                    individualDetails: {
                      document: [
                        {
                          documentType: documentData.fileType || documentData?.documentType,
                          fileStore: documentData.file?.files?.[0]?.fileStoreId || documentData?.fileStore,
                          documentName: documentData.filename || documentData?.documentName,
                          fileName: "ID Proof",
                        },
                      ],
                      individualId: Individual?.Individual?.individualId,
                      "poaAddressDetails-select": {
                        pincode: pincode,
                        district: addressLine2,
                        city: city,
                        state: addressLine1,
                        locality: address,
                      },
                      poaAddressDetails: {
                        pincode: pincode,
                        district: addressLine2,
                        city: city,
                        state: addressLine1,
                        coordinates: {
                          longitude: longitude,
                          latitude: latitude,
                        },
                        locality: address,
                      },
                    },
                    userDetails: null,
                  };
                  return {
                    tenantId,
                    caseId: caseDetails?.id,
                    individualId: Individual?.Individual?.individualId,
                    name: getFullName(" ", firstName, middleName, lastName),
                    poaType: "poa.regular",
                    documents: data?.data?.poaVerification?.individualDetails?.document,
                    representingLitigants: [
                      {
                        individualId: data?.data?.complainantVerification?.individualDetails?.individualId,
                      },
                    ],
                    additionalDetails: {
                      uuid: userUuid ? userUuid : null,
                    },
                  };
                }
              }
              return {};
            }
          })
      );
    }

    let docList = [];
    const newFormData = await Promise.all(
      updatedFormData
        .filter((item) => item.isenabled)
        .map(async (data, index) => {
          let updatedComplainantVerification = structuredClone(complainantVerification[index] || {});
          let updatedPoaVerification = structuredClone(poaVerification[index] || {});

          let documentData = {
            companyDetailsUpload: null,
            poaAuthorizationDocument: null,
          };
          const idProof = {
            complainantId: { complainantId: { complainantId: {} } },
          };
          const poaIdProof = {
            poaComplainantId: { poaComplainantId: { poaComplainantId: {} } },
          };

          const userSelectedIdType = isCompleted ? null : data?.data?.complainantId?.complainantId?.selectIdTypeType;
          const individualDetails = {};
          const poaIndividualDetails = {};
          if (data?.data?.complainantId?.complainantId?.ID_Proof?.[0]?.[1]?.file) {
            const documentType = documentsTypeMapping["complainantId"];
            let uploadedData = null;
            if (litigantFilestoreIds?.[index]) {
              uploadedData = litigantFilestoreIds?.[index];
            } else {
              uploadedData = await onDocumentUpload(
                documentType,
                data?.data?.complainantId?.complainantId?.ID_Proof?.[0]?.[1]?.file,
                data?.data?.complainantId?.complainantId?.ID_Proof?.[0]?.[0],
                tenantId
              );
            }
            const doc = {
              documentType,
              fileStore: uploadedData.file?.files?.[0]?.fileStoreId || uploadedData?.fileStore,
              documentName: uploadedData.filename || uploadedData?.documentName,
            };
            idProof.complainantId.complainantId.complainantId = {
              ID_Proof: [
                [
                  data?.data?.complainantId?.complainantId?.ID_Proof?.[0]?.[0],
                  {
                    file: doc,
                    fileStoreId: uploadedData?.file?.files?.[0]?.fileStoreId || uploadedData?.fileStore,
                  },
                ],
              ],
              ...(userSelectedIdType && { selectIdTypeType: userSelectedIdType }),
            };
            docList.push(doc);
            individualDetails.document = [uploadedData];
            updatedComplainantVerification.individualDetails = updatedComplainantVerification?.individualDetails
              ? { ...updatedComplainantVerification?.individualDetails, document: [doc] }
              : { ...data?.data?.complainantVerification?.individualDetails, document: [doc] };
          }
          if (
            !data?.data?.complainantVerification?.isUserVerified &&
            data?.data?.complainantId?.complainantId?.complainantId?.ID_Proof?.[0]?.[1]?.file?.fileStore
          ) {
            const doc = { ...data?.data?.complainantId?.complainantId?.complainantId?.ID_Proof?.[0]?.[1]?.file };
            docList.push(doc);
          }
          if (data?.data?.complainantVerification?.individualDetails?.document?.[0]?.fileStore) {
            const doc = {
              ...data?.data?.complainantVerification?.individualDetails?.document?.[0],
              documentType: documentsTypeMapping["complainantId"],
            };
            !individualDetails?.document && docList.push(doc);
          }
          if (data?.data?.companyDetailsUpload?.document) {
            documentData.companyDetailsUpload = {};
            documentData.companyDetailsUpload.document = await Promise.all(
              data?.data?.companyDetailsUpload?.document?.map(async (document) => {
                if (document) {
                  const documentType = documentsTypeMapping["complainantCompanyDetailsUpload"];
                  const uploadedData = await onDocumentUpload(documentType, document, document.name, tenantId);
                  const doc = {
                    documentType,
                    fileStore: uploadedData.file?.files?.[0]?.fileStoreId || document?.fileStore,
                    documentName: uploadedData.filename || document?.documentName,
                    fileName: "Company documents",
                  };
                  docList.push(doc);
                  return doc;
                }
              })
            );
            setFormDataValue("companyDetailsUpload", documentData?.companyDetailsUpload);
          }
          if (data?.data?.poaAuthorizationDocument?.poaDocument) {
            documentData.poaAuthorizationDocument = {};
            documentData.poaAuthorizationDocument.poaDocument = await Promise.all(
              data?.data?.poaAuthorizationDocument?.poaDocument?.map(async (document) => {
                if (document) {
                  const documentType = documentsTypeMapping["poaAuthorizationDocument"];
                  const uploadedData = await onDocumentUpload(documentType, document, document.name, tenantId);
                  const doc = {
                    documentType,
                    fileStore: uploadedData.file?.files?.[0]?.fileStoreId || document?.fileStore,
                    documentName: uploadedData.filename || document?.documentName,
                    fileName: "Company documents",
                  };
                  docList.push(doc);
                  return doc;
                }
              })
            );
            setFormDataValue("poaAuthorizationDocument", documentData?.poaAuthorizationDocument);
          }
          const complainantDocTypes = [
            documentsTypeMapping["complainantId"],
            documentsTypeMapping["complainantCompanyDetailsUpload"],
            documentsTypeMapping["poaAuthorizationDocument"],
          ];
          updateTempDocListMultiForm(docList, complainantDocTypes);

          //// updating information for POA
          if (data?.data?.poaComplainantId?.poaComplainantId?.ID_Proof?.[0]?.[1]?.file) {
            const documentType = documentsTypeMapping["poaComplainantId"];
            let uploadedData = null;
            if (poaFilestoreIds?.[index]) {
              uploadedData = poaFilestoreIds?.[index];
            } else {
              uploadedData = await onDocumentUpload(
                documentType,
                data?.data?.poaComplainantId?.poaComplainantId?.ID_Proof?.[0]?.[1]?.file,
                data?.data?.poaComplainantId?.poaComplainantId?.ID_Proof?.[0]?.[0],
                tenantId
              );
            }
            const doc = {
              documentType,
              fileStore: uploadedData.file?.files?.[0]?.fileStoreId || uploadedData?.fileStore,
              documentName: uploadedData.filename || uploadedData?.documentName,
            };
            poaIdProof.poaComplainantId.poaComplainantId.poaComplainantId = {
              ID_Proof: [
                [
                  data?.data?.poaComplainantId?.poaComplainantId?.ID_Proof?.[0]?.[0],
                  {
                    file: doc,
                    fileStoreId: uploadedData?.file?.files?.[0]?.fileStoreId || uploadedData?.fileStore,
                  },
                ],
              ],
            };
            docList.push(doc);
            poaIndividualDetails.document = [uploadedData];
            updatedPoaVerification.individualDetails = updatedPoaVerification?.individualDetails
              ? { ...updatedPoaVerification?.individualDetails, document: [doc] }
              : { ...data?.data?.poaVerification?.individualDetails, document: [doc] };
          }
          if (
            !data?.data?.poaVerification?.isUserVerified &&
            data?.data?.poaComplainantId?.poaComplainantId?.poaComplainantId?.ID_Proof?.[0]?.[1]?.file?.fileStore
          ) {
            const doc = { ...data?.data?.poaComplainantId?.poaComplainantId?.poaComplainantId?.ID_Proof?.[0]?.[1]?.file };
            docList.push(doc);
          }
          if (data?.data?.poaVerification?.individualDetails?.document?.[0]?.fileStore) {
            const doc = {
              ...data?.data?.poaVerification?.individualDetails?.document?.[0],
              documentType: documentsTypeMapping["poaComplainantId"],
            };
            !poaIndividualDetails?.document && docList.push(doc);
          }

          return {
            ...data,
            isFormCompleted: true,
            data: {
              ...data.data,
              ...documentData,
              firstName: data?.data?.firstName?.trim(),
              middleName: data?.data?.middleName?.trim(),
              lastName: data?.data?.lastName?.trim(),
              complainantVerification: {
                ...data?.data?.complainantVerification,
                ...updatedComplainantVerification,
                isUserVerified: Boolean(data?.data?.complainantVerification?.mobileNumber && data?.data?.complainantVerification?.otpNumber),
              },
              poaVerification: {
                ...data?.data?.poaVerification,
                ...updatedPoaVerification,
                isUserVerified: Boolean(data?.data?.poaVerification?.mobileNumber && data?.data?.poaVerification?.otpNumber),
              },
              ...(data?.data?.complainantId?.complainantId?.ID_Proof?.[0]?.[1]?.file && idProof),
              ...(data?.data?.poaComplainantId?.poaComplainantId?.ID_Proof?.[0]?.[1]?.file && poaIdProof),
            },
          };
        })
    );
    const caseLitigants = caseDetails?.litigants || [];

    // Logic to update the litigants with same id so that duplication does not happen in backend.
    // We will check that if a litigant is already present in litigants array in case search api data,
    // we will just update the new documents and representinng data to that object.
    const updatedLitigants = litigants.map((lit) => {
      const existingLit = caseLitigants.find((caseLit) => caseLit.individualId === lit.individualId);
      if (existingLit) {
        lit.id = existingLit?.id;
        lit.auditDetails = existingLit?.auditDetails;
        lit.hasSigned = existingLit?.hasSigned || false;
        // In case of PIP, if affidavit doc already exists then keep it as it is.
        if (existingLit?.documents?.[0]?.fileStore) {
          lit.documents = structuredClone(existingLit?.documents);
        }
        return lit;
      }
      return lit;
    });

    // If a litigant object was present previously and now that litigant is not present in form data,
    // the same object should again be copied with isActive as false and added in the updatedLitigants.

    caseLitigants.forEach((caseLit) => {
      const isAlreadyIncluded = updatedLitigants.some((lit) => lit?.individualId === caseLit?.individualId);
      if (!isAlreadyIncluded) {
        updatedLitigants.push({
          ...caseLit,
          isActive: false,
        });
      }
    });
    data.litigants = [...updatedLitigants];

    const mergedPoaHoldersMap = new Map();

    // Step 1: Merge PoA holders by individualId and combine their representing litigants
    for (const poa of poaHolders) {
      if (!poa?.individualId) continue;

      const existing = mergedPoaHoldersMap?.get(poa?.individualId);

      if (existing) {
        const newRepresenting =
          poa?.representingLitigants?.filter(
            (newRep) => !existing?.representingLitigants?.some((rep) => rep?.individualId === newRep?.individualId)
          ) || [];
        existing?.representingLitigants?.push(...newRepresenting);
      } else {
        mergedPoaHoldersMap?.set(poa?.individualId, { ...poa });
      }
    }

    // Step 2: Map document data to each representing litigant
    const finalPoaHolders = Array?.from(mergedPoaHoldersMap?.values())?.map((poaHolder) => ({
      ...poaHolder,
      representingLitigants:
        poaHolder?.representingLitigants?.map((litigant) => {
          const currFormData = newFormData?.find(
            (form) => form?.data?.complainantVerification?.individualDetails?.individualId === litigant?.individualId
          );
          return {
            ...litigant,
            documents: currFormData?.data?.poaAuthorizationDocument?.poaDocument,
          };
        }) || [],
    }));

    // Step 3: Inject existing backend PoA details (id, audit info, etc.)
    const updatedPoaHolders = finalPoaHolders?.map((poaHolder) => {
      const existingLit = caseDetails?.poaHolders?.find((poa) => poa?.individualId === poaHolder?.individualId);
      return existingLit
        ? {
            ...poaHolder,
            id: existingLit?.id,
            auditDetails: existingLit?.auditDetails,
            hasSigned: existingLit?.hasSigned || false,
          }
        : poaHolder;
    });

    // Step 4: Add previous PoAs not included in new data as inactive
    const oldPoAsToAdd =
      caseDetails?.poaHolders?.filter((poa) => !updatedPoaHolders?.some((newPoa) => newPoa?.individualId === poa?.individualId)) || [];

    data.poaHolders = [...updatedPoaHolders, ...oldPoAsToAdd?.map((poa) => ({ ...poa, isActive: false }))];

    data.additionalDetails = {
      ...caseDetails.additionalDetails,
      complainantDetails: {
        formdata: newFormData,
        isCompleted: isCompleted === "PAGE_CHANGE" ? caseDetails.additionalDetails?.[selected]?.isCompleted : isCompleted,
      },
    };
  }
  if (selected === "respondentDetails") {
    let docList = [];
    const newFormData = await Promise.all(
      updatedFormData
        .filter((item) => item.isenabled)
        .map(async (data) => {
          const documentData = {
            inquiryAffidavitFileUpload: null,
            companyDetailsUpload: null,
          };
          if (
            data?.data?.inquiryAffidavitFileUpload?.document &&
            Array.isArray(data?.data?.inquiryAffidavitFileUpload?.document) &&
            data?.data?.inquiryAffidavitFileUpload?.document.length > 0
          ) {
            documentData.inquiryAffidavitFileUpload = {};
            documentData.inquiryAffidavitFileUpload.document = await Promise.all(
              data?.data?.inquiryAffidavitFileUpload?.document?.map(async (document) => {
                if (document) {
                  const documentType = documentsTypeMapping["inquiryAffidavitFileUpload"];
                  const uploadedData = await onDocumentUpload(documentType, document, document.name, tenantId);
                  if (uploadedData.file?.files?.[0]?.fileStoreId && efilingDocumentKeyAndTypeMapping["inquiryAffidavitFileUpload"]) {
                    sendDocumentForOcr(
                      "inquiryAffidavitFileUpload",
                      uploadedData.file?.files?.[0]?.fileStoreId,
                      prevCaseDetails?.filingNumber,
                      tenantId,
                      document
                    );
                  }
                  const doc = {
                    documentType,
                    fileStore: uploadedData.file?.files?.[0]?.fileStoreId || document?.fileStore,
                    documentName: uploadedData.filename || document?.documentName,
                    fileName: t("AFFIDAVIT_UNDER_225"),
                  };
                  docList.push(doc);
                  return doc;
                }
              })
            );
            setFormDataValue("inquiryAffidavitFileUpload", documentData?.inquiryAffidavitFileUpload);
          }
          if (
            data?.data?.companyDetailsUpload?.document &&
            Array.isArray(data?.data?.companyDetailsUpload?.document) &&
            data?.data?.companyDetailsUpload?.document.length > 0
          ) {
            documentData.companyDetailsUpload = {};
            documentData.companyDetailsUpload.document = await Promise.all(
              data?.data?.companyDetailsUpload?.document?.map(async (document) => {
                if (document) {
                  const documentType = documentsTypeMapping["AccusedCompanyDetailsUpload"];
                  const uploadedData = await onDocumentUpload(documentType, document, document.name, tenantId);
                  const doc = {
                    documentType,
                    fileStore: uploadedData.file?.files?.[0]?.fileStoreId || document?.fileStore,
                    documentName: uploadedData.filename || document?.documentName,
                    fileName: "Company documents",
                  };
                  docList.push(doc);
                  return doc;
                }
              })
            );
            setFormDataValue("companyDetailsUpload", documentData?.companyDetailsUpload);
          }
          const respondentDocTypes = [documentsTypeMapping["inquiryAffidavitFileUpload"], documentsTypeMapping["AccusedCompanyDetailsUpload"]];
          updateTempDocListMultiForm(docList, respondentDocTypes);
          return {
            ...data,
            data: {
              ...data.data,
              respondentFirstName: data?.data?.respondentFirstName?.trim(),
              respondentMiddleName: data?.data?.respondentMiddleName?.trim(),
              respondentLastName: data?.data?.respondentLastName?.trim(),
              ...documentData,
            },
            uniqueId: data?.uniqueId || generateUUID(),
          };
        })
    );
    const newFormDataCopy = structuredClone(newFormData);
    for (let i = 0; i < newFormDataCopy.length; i++) {
      const obj = newFormDataCopy[i];
      if (obj?.data?.phonenumbers) {
        obj.data.phonenumbers.textfieldValue = "";
      }
      if (obj?.data?.emails) {
        obj.data.emails.textfieldValue = "";
      }
    }
    data.additionalDetails = {
      ...caseDetails.additionalDetails,
      respondentDetails: {
        formdata: newFormDataCopy,
        isCompleted: isCompleted === "PAGE_CHANGE" ? caseDetails.additionalDetails?.[selected]?.isCompleted : isCompleted,
      },
    };
  }
  if (selected === "chequeDetails") {
    let docList = [];
    const infoBoxData = {
      header: "CS_YOU_HAVE_CONFIRMED",
      scrutinyHeader: "CS_COMPLAINANT_HAVE_CONFIRMED",
      data: ["CS_CHEQUE_RETURNED_INSUFFICIENT_FUND"],
    };

    const newFormData = await Promise.all(
      updatedFormData
        .filter((item) => item.isenabled)
        .map(async (data) => {
          const documentData = {
            bouncedChequeFileUpload: null,
            depositChequeFileUpload: null,
            returnMemoFileUpload: null,
          };
          if (data?.data?.bouncedChequeFileUpload?.document) {
            documentData.bouncedChequeFileUpload = {};
            documentData.bouncedChequeFileUpload.document = await Promise.all(
              data?.data?.bouncedChequeFileUpload?.document?.map(async (document, index) => {
                const { tempData, tempFile } = await documentUploadHandler(
                  document,
                  index,
                  prevCaseDetails,
                  data,
                  pageConfig,
                  "bouncedChequeFileUpload",
                  selected,
                  tenantId,
                  documentsTypeMapping["bouncedChequeFileUpload"]
                );
                docList.push(tempFile);
                return tempFile;
              })
            );
          }
          if (data?.data?.depositChequeFileUpload?.document) {
            documentData.depositChequeFileUpload = {};
            documentData.depositChequeFileUpload.document = await Promise.all(
              data?.data?.depositChequeFileUpload?.document?.map(async (document, index) => {
                const { tempData, tempFile } = await documentUploadHandler(
                  document,
                  index,
                  prevCaseDetails,
                  data,
                  pageConfig,
                  "depositChequeFileUpload",
                  selected,
                  tenantId,
                  documentsTypeMapping["depositChequeFileUpload"]
                );
                docList.push(tempFile);
                return tempFile;
              })
            );
          }
          if (data?.data?.returnMemoFileUpload?.document) {
            documentData.returnMemoFileUpload = {};
            documentData.returnMemoFileUpload.document = await Promise.all(
              data?.data?.returnMemoFileUpload?.document?.map(async (document, index) => {
                const { tempData, tempFile } = await documentUploadHandler(
                  document,
                  index,
                  prevCaseDetails,
                  data,
                  pageConfig,
                  "returnMemoFileUpload",
                  selected,
                  tenantId,
                  documentsTypeMapping["returnMemoFileUpload"]
                );
                docList.push(tempFile);
                return tempFile;
              })
            );
          }
          setFormDataValue("bouncedChequeFileUpload", documentData?.bouncedChequeFileUpload);
          setFormDataValue("depositChequeFileUpload", documentData?.depositChequeFileUpload);
          setFormDataValue("returnMemoFileUpload", documentData?.returnMemoFileUpload);
          if (
            data?.data?.depositDate &&
            data?.data?.issuanceDate &&
            new Date(data?.data?.issuanceDate).setMonth(new Date(data?.data?.issuanceDate).getMonth() + 3) >
              new Date(data?.data?.depositDate).getTime()
          ) {
            infoBoxData.data.splice(0, 0, "CS_SIX_MONTH_BEFORE_DEPOSIT_TEXT");
          }
          const chequeDetailsDocTypes = [
            documentsTypeMapping["bouncedChequeFileUpload"],
            documentsTypeMapping["depositChequeFileUpload"],
            documentsTypeMapping["returnMemoFileUpload"],
          ];
          updateTempDocListMultiForm(docList, chequeDetailsDocTypes);

          return {
            ...data,
            data: {
              ...data.data,
              ...documentData,
              infoBoxData,
            },
          };
        })
    );
    data.caseDetails = {
      ...caseDetails.caseDetails,
      chequeDetails: {
        formdata: newFormData,
        isCompleted: isCompleted === "PAGE_CHANGE" ? caseDetails.caseDetails?.[selected]?.isCompleted : isCompleted,
      },
      debtLiabilityDetails: {
        ...caseDetails?.caseDetails?.debtLiabilityDetails,
        formdata: caseDetails?.caseDetails?.debtLiabilityDetails?.formdata?.map((data) => {
          if (data?.data?.liabilityType?.code === "FULL_LIABILITY" && newFormData) {
            const totalChequeAmount = calculateTotalChequeAmount(newFormData);
            return {
              ...data,
              data: {
                ...data.data,
                totalAmount: totalChequeAmount,
              },
            };
          } else return data;
        }),
      },
    };
  }
  if (selected === "debtLiabilityDetails") {
    const docType = documentsTypeMapping["debtLiabilityFileUpload"];
    const newFormData = await Promise.all(
      updatedFormData
        .filter((item) => item.isenabled)
        .map(async (data) => {
          const debtDocumentData = { debtLiabilityFileUpload: null };
          if (data?.data?.debtLiabilityFileUpload?.document) {
            debtDocumentData.debtLiabilityFileUpload = {};
            debtDocumentData.debtLiabilityFileUpload.document = await Promise.all(
              data?.data?.debtLiabilityFileUpload?.document?.map(async (document, index) => {
                const { tempData, tempFile } = await documentUploadHandler(
                  document,
                  index,
                  prevCaseDetails,
                  data,
                  pageConfig,
                  "debtLiabilityFileUpload",
                  selected,
                  tenantId,
                  docType
                );
                updateCaseDocuments(docType, tempFile);
                return tempFile;
              })
            );
            setFormDataValue("debtLiabilityFileUpload", debtDocumentData?.debtLiabilityFileUpload);
          } else {
            updateCaseDocuments(docType, false);
          }
          const totalChequeAmount = calculateTotalChequeAmount(caseDetails?.caseDetails?.chequeDetails?.formdata);
          return {
            ...data,
            data: {
              ...data.data,
              ...debtDocumentData,
              ...(data?.data?.liabilityType?.code === "FULL_LIABILITY" && {
                totalAmount: totalChequeAmount,
              }),
            },
          };
        })
    );
    data.caseDetails = {
      ...caseDetails.caseDetails,
      debtLiabilityDetails: {
        formdata: newFormData,
        isCompleted: isCompleted === "PAGE_CHANGE" ? caseDetails.caseDetails?.[selected]?.isCompleted : isCompleted,
      },
    };
  }
  if (selected === "witnessDetails") {
    const newFormDataCopy = structuredClone(updatedFormData.filter((item) => item.isenabled));

    for (let i = 0; i < newFormDataCopy.length; i++) {
      const obj = newFormDataCopy[i];

      if (obj?.data?.phonenumbers) {
        obj.data.phonenumbers.textfieldValue = "";
      }
      if (obj?.data?.emails) {
        obj.data.emails.textfieldValue = "";
      }
      if (!obj?.uniqueId) {
        obj.uniqueId = generateUUID();
      }
      obj.data.firstName = obj?.data?.firstName?.trim();
      obj.data.middleName = obj?.data?.middleName?.trim();
      obj.data.lastName = obj?.data?.lastName?.trim();
      obj.data.ownerType = "COMPLAINANT";
    }

    data.additionalDetails = {
      ...caseDetails.additionalDetails,
      witnessDetails: {
        formdata: newFormDataCopy,
        isCompleted: isCompleted === "PAGE_CHANGE" ? caseDetails.additionalDetails?.[selected]?.isCompleted : isCompleted,
      },
    };
  }

  if (selected === "demandNoticeDetails") {
    let docList = [];
    let infoBoxData = {};
    const newFormData = await Promise.all(
      updatedFormData
        .filter((item) => item.isenabled)
        .map(async (data) => {
          const demandNoticeDocumentData = {
            legalDemandNoticeFileUpload: null,
            proofOfDispatchFileUpload: null,
            proofOfAcknowledgmentFileUpload: null,
            proofOfReplyFileUpload: null,
          };
          const fileUploadKeys = Object.keys(demandNoticeDocumentData).filter((key) => data?.data?.[key]?.document);
          const result = checkChequeDepositDateValidity(caseDetails, data?.data?.dateOfDispatch);

          await Promise.all(
            fileUploadKeys.map(async (key) => {
              if (data?.data?.[key]?.document) {
                demandNoticeDocumentData[key] = demandNoticeDocumentData[key] || {};
                demandNoticeDocumentData[key].document = await Promise.all(
                  data?.data?.[key]?.document?.map(async (document, index) => {
                    const { tempData, tempFile } = await documentUploadHandler(
                      document,
                      index,
                      prevCaseDetails,
                      data,
                      pageConfig,
                      key,
                      selected,
                      tenantId,
                      documentsTypeMapping[key]
                    );
                    docList.push(tempFile);
                    return tempFile;
                  })
                );
                setFormDataValue(key, demandNoticeDocumentData[key]);
              }
            })
          );
          // Adding warning message based on a legal demand notice must be sent within 30 days of receiving the cheque return memo
          if (!data?.data?.infoBoxData) {
            infoBoxData = result?.isValid ? null : result?.info;
          } else {
            infoBoxData = result?.isValid ? null : result?.info;
          }

          return {
            ...data,
            data: {
              ...data.data,
              ...demandNoticeDocumentData,
              infoBoxData,
            },
          };
        })
    );
    const demandNoticeDocTypes = [
      documentsTypeMapping["legalDemandNoticeFileUpload"],
      documentsTypeMapping["proofOfDispatchFileUpload"],
      documentsTypeMapping["proofOfAcknowledgmentFileUpload"],
      documentsTypeMapping["proofOfReplyFileUpload"],
    ];
    updateTempDocListMultiForm(docList, demandNoticeDocTypes);
    data.caseDetails = {
      ...caseDetails.caseDetails,
      demandNoticeDetails: {
        formdata: newFormData,
        isCompleted: isCompleted === "PAGE_CHANGE" ? caseDetails.caseDetails?.[selected]?.isCompleted : isCompleted,
      },
    };
  }
  if (selected === "delayApplications") {
    const newFormData = await Promise.all(
      updatedFormData
        .filter((item) => item.isenabled)
        .map(async (data) => {
          const condonationDocumentData = { condonationFileUpload: null };
          const documentType = documentsTypeMapping["condonationFileUpload"];
          if (data?.data?.condonationFileUpload?.document) {
            condonationDocumentData.condonationFileUpload = {};
            condonationDocumentData.condonationFileUpload.document = await Promise.all(
              data?.data?.condonationFileUpload?.document?.map(async (document) => {
                if (document) {
                  const uploadedData = await onDocumentUpload(documentType, document, document.name, tenantId);
                  const doc = {
                    documentType,
                    fileStore: uploadedData.file?.files?.[0]?.fileStoreId || document?.fileStore,
                    documentName: uploadedData.filename || document?.documentName,
                    fileName: pageConfig?.selectDocumentName?.["condonationFileUpload"],
                  };
                  updateCaseDocuments(documentType, doc);
                  return doc;
                }
              })
            );
          } else {
            updateCaseDocuments(documentType, false);
          }
          return {
            ...data,
            data: {
              ...data.data,
              ...condonationDocumentData,
            },
          };
        })
    );
    data.caseDetails = {
      ...caseDetails.caseDetails,
      delayApplications: {
        formdata: newFormData,
        isCompleted: isCompleted === "PAGE_CHANGE" ? caseDetails.caseDetails?.[selected]?.isCompleted : isCompleted,
      },
    };
  }
  const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
  const userUuid = userInfo?.uuid; // use userUuid only if required explicitly, otherwise use only authorizedUuid.
  const authorizedUuid = getAuthorizedUuid(userUuid);
  if (selected === "prayerSwornStatement") {
    let additionalDocs = [];
    const newFormData = await Promise.all(
      updatedFormData
        .filter((item) => item.isenabled)
        .map(async (data) => {
          const documentData = { SelectUploadDocWithName: null, swornStatement: null };
          if (data?.data?.SelectUploadDocWithName) {
            documentData.SelectUploadDocWithName = await Promise.all(
              data?.data?.SelectUploadDocWithName?.map(async (docWithNameData) => {
                if (docWithNameData?.document?.[0] && !docWithNameData?.document?.[0]?.fileStore) {
                  const documentType = documentsTypeMapping["SelectUploadDocWithName"];
                  const document = await onDocumentUpload(
                    documentType,
                    docWithNameData?.document[0],
                    docWithNameData?.document[0]?.name,
                    tenantId
                  ).then(async (data) => {
                    const evidenceData = await DRISTIService.createEvidence({
                      artifact: {
                        artifactType: "OTHER",
                        sourceType: "COMPLAINANT",
                        caseId: caseDetails?.id,
                        asUser: authorizedUuid, // Sending uuid of the main advocate in case clerk/jr. adv is creating doc.
                        sourceID: individualId,
                        filingNumber: caseDetails?.filingNumber,
                        tenantId,
                        comments: [],
                        file: {
                          documentType: data.fileType || data?.documentType,
                          fileStore: data.file?.files?.[0]?.fileStoreId || data?.fileStore,
                          additionalDetails: {
                            name: docWithNameData?.docName,
                          },
                        },
                        filingType: filingType,
                        workflow: {
                          action: "TYPE DEPOSITION",
                          documents: [
                            {
                              documentType: data.fileType,
                              fileName: data.fileName,
                              fileStoreId: data.file?.files?.[0]?.fileStoreId,
                            },
                          ],
                        },
                      },
                    });
                    const doc = {
                      documentType,
                      fileStore: data.file?.files?.[0]?.fileStoreId || data?.fileStore,
                      documentName: data.filename || data?.documentName,
                      artifactId: evidenceData?.artifact?.id,
                      fileName: docWithNameData?.document[0]?.name,
                    };
                    additionalDocs.push(doc);
                    return [doc];
                  });
                  return {
                    document: document,
                    docName: docWithNameData?.docName,
                  };
                } else {
                  if (docWithNameData?.document?.[0]) {
                    additionalDocs.push(docWithNameData.document[0]);
                  }
                  return docWithNameData;
                }
              })
            );
          }

          const indicesToRemove = tempDocList
            .map((doc, index) => (doc.documentType === documentsTypeMapping["SelectUploadDocWithName"] ? index : -1))
            .filter((index) => index !== -1);

          for (let i = indicesToRemove.length - 1; i >= 0; i--) {
            tempDocList.splice(indicesToRemove[i], 1);
          }
          if (additionalDocs.length > 0) {
            for (let i = 0; i < additionalDocs.length; i++) {
              tempDocList.push(additionalDocs[i]);
            }
          }

          if (data?.data?.swornStatement?.document) {
            documentData.swornStatement = documentData.swornStatement || {};
            documentData.swornStatement.document = await Promise.all(
              data?.data?.swornStatement?.document?.map(async (document, index) => {
                const { tempData, tempFile } = await documentUploadHandler(
                  document,
                  index,
                  prevCaseDetails,
                  data,
                  pageConfig,
                  "swornStatement",
                  selected,
                  tenantId,
                  documentsTypeMapping["swornStatement"]
                );
                tempDocList = [...tempDocList, ...tempData];
                updateCaseDocuments(documentsTypeMapping["swornStatement"], tempFile);
                return tempFile;
              })
            );
            setFormDataValue("swornStatement", documentData?.swornStatement);
          }
          if (!data?.data?.swornStatement?.document) {
            updateCaseDocuments(documentsTypeMapping["swornStatement"], false);
          }
          return {
            ...data,
            data: {
              ...data.data,
              ...documentData,
            },
          };
        })
    );
    data.additionalDetails = {
      ...caseDetails.additionalDetails,
      prayerSwornStatement: {
        formdata: newFormData,
        isCompleted: isCompleted === "PAGE_CHANGE" ? caseDetails.additionalDetails?.[selected]?.isCompleted : isCompleted,
      },
    };
  }
  if (selected === "advocateDetails") {
    const caseRepresentatives = caseDetails?.representatives || [];
    const advocateDetails = [];
    const complainantDetails = [];
    let docList = [];
    const newFormData = await Promise.all(
      updatedFormData
        .filter((item) => item.isenabled)
        .map(async (data, index) => {
          const vakalatnamaDocumentData = { vakalatnamaFileUpload: null };
          if (data?.data?.multipleAdvocatesAndPip?.vakalatnamaFileUpload?.document) {
            vakalatnamaDocumentData.vakalatnamaFileUpload = {};
            vakalatnamaDocumentData.vakalatnamaFileUpload.document = await Promise.all(
              data?.data?.multipleAdvocatesAndPip?.vakalatnamaFileUpload?.document?.map(async (document) => {
                if (document) {
                  const documentType = documentsTypeMapping["vakalatnamaFileUpload"];
                  const uploadedData = await onDocumentUpload(documentType, document, document.name, tenantId);
                  if (uploadedData.file?.files?.[0]?.fileStoreId && efilingDocumentKeyAndTypeMapping["vakalatnamaFileUpload"]) {
                    sendDocumentForOcr(
                      "vakalatnamaFileUpload",
                      uploadedData.file?.files?.[0]?.fileStoreId,
                      prevCaseDetails?.filingNumber,
                      tenantId,
                      document
                    );
                  }
                  const doc = {
                    documentType,
                    fileStore: uploadedData.file?.files?.[0]?.fileStoreId || document?.fileStore,
                    documentName: uploadedData.filename || document?.documentName,
                    fileName: pageConfig?.selectDocumentName?.["vakalatnamaFileUpload"],
                  };
                  docList.push(doc);
                  complainantDetails.push({
                    individualId: data?.data?.multipleAdvocatesAndPip?.boxComplainant?.individualId,
                    pipAffidavitFileUpload: null,
                  });
                  return doc;
                }
              })
            );
            let updatedAdvocateDetails = data?.data?.multipleAdvocatesAndPip;
            updatedAdvocateDetails.vakalatnamaFileUpload = vakalatnamaDocumentData?.vakalatnamaFileUpload;

            setFormDataValue("MultipleAdvocatesAndPip", updatedAdvocateDetails);
          }
          const pipAffidavitDocumentData = { pipAffidavitFileUpload: null };
          if (data?.data?.multipleAdvocatesAndPip?.pipAffidavitFileUpload?.document) {
            pipAffidavitDocumentData.pipAffidavitFileUpload = {};
            pipAffidavitDocumentData.pipAffidavitFileUpload.document = await Promise.all(
              data?.data?.multipleAdvocatesAndPip?.pipAffidavitFileUpload?.document?.map(async (document) => {
                if (document) {
                  const documentType = documentsTypeMapping["pipAffidavitFileUpload"];
                  const uploadedData = await onDocumentUpload(documentType, document, document.name, tenantId);
                  const doc = {
                    documentType,
                    fileStore: uploadedData.file?.files?.[0]?.fileStoreId || document?.fileStore,
                    documentName: uploadedData.filename || document?.documentName,
                    fileName: pageConfig?.selectDocumentName?.["pipAffidavitFileUpload"],
                  };
                  docList.push(doc);
                  complainantDetails.push({
                    individualId: data?.data?.multipleAdvocatesAndPip?.boxComplainant?.individualId,
                    pipAffidavitFileUpload: doc,
                  });
                  return doc;
                }
              })
            );
            let updatedPipDetails = data?.data?.multipleAdvocatesAndPip;
            updatedPipDetails.pipAffidavitFileUpload = pipAffidavitDocumentData?.pipAffidavitFileUpload;

            setFormDataValue("MultipleAdvocatesAndPip", updatedPipDetails);
            // setFormDataValue("pipAffidavitFileUpload", pipAffidavitDocumentData?.pipAffidavitFileUpload);
          }
          const advocateDetailsDocTypes = [documentsTypeMapping["vakalatnamaFileUpload"], documentsTypeMapping["pipAffidavitFileUpload"]];
          updateTempDocListMultiForm(docList, advocateDetailsDocTypes);

          if (
            data?.data?.multipleAdvocatesAndPip?.multipleAdvocateNameDetails?.length > 0 &&
            data?.data?.multipleAdvocatesAndPip?.multipleAdvocateNameDetails?.length
          ) {
            const advSearchPromises = data?.data?.multipleAdvocatesAndPip?.multipleAdvocateNameDetails
              ?.filter((detail) => detail?.advocateBarRegNumberWithName?.barRegistrationNumberOriginal)
              .map((detail) => {
                return DRISTIService.searchAdvocateClerk("/advocate/v1/_search", {
                  criteria: [
                    {
                      barRegistrationNumber: detail?.advocateBarRegNumberWithName?.barRegistrationNumberOriginal,
                    },
                  ],
                  tenantId,
                });
              });

            const allAdvocateSearchData = await Promise.all(advSearchPromises);
            for (let i = 0; i < allAdvocateSearchData?.length; i++) {
              const document = vakalatnamaDocumentData?.vakalatnamaFileUpload?.document?.[0];
              advocateDetails.push({
                advocate: allAdvocateSearchData?.[i].advocates?.[0]?.responseList?.[0],
                complainant: {
                  individualId: data?.data?.multipleAdvocatesAndPip?.boxComplainant?.individualId,
                  vakalathnamaDoc: document ? [document] : [],
                },
              });
            }
          }
          return {
            ...data,
            isFormCompleted: true,
            data: {
              ...data.data,
              multipleAdvocatesAndPip: {
                ...data.data.multipleAdvocatesAndPip,
                vakalatnamaFileUpload: vakalatnamaDocumentData?.vakalatnamaFileUpload,
                pipAffidavitFileUpload: pipAffidavitDocumentData?.pipAffidavitFileUpload,
              },
            },
          };
        })
    );

    const updatedAdvocateDetails = [];
    let duplicateAdvocateDetails = advocateDetails.slice();

    for (let i = 0; i < advocateDetails?.length; i++) {
      const advObj = advocateDetails[i];
      if (updatedAdvocateDetails.some((obj) => obj.advocate?.individualId === advObj?.advocate?.individualId)) {
        continue;
      }
      const complainants = [];
      const indexArray = [];

      duplicateAdvocateDetails.forEach((dupObj, index) => {
        if (advObj.advocate?.individualId === dupObj?.advocate?.individualId) {
          complainants.push(dupObj?.complainant);
          indexArray.push(index);
        }
      });
      const newAdvObj = {
        advocate: advObj.advocate,
        complainants: complainants,
      };
      updatedAdvocateDetails.push(newAdvObj);
      duplicateAdvocateDetails = duplicateAdvocateDetails.filter((_, index) => !indexArray.includes(index));
    }

    const getRepresentings = (complIndvidualIdArray) => {
      let representings = [];
      if (caseDetails?.litigants && Array.isArray(caseDetails?.litigants)) {
        complIndvidualIdArray.forEach((complainant) => {
          const litigant = caseDetails?.litigants?.find((obj) => obj?.individualId === complainant?.individualId);
          if (litigant) {
            const representingData = {
              additionalDetails: {
                ...litigant?.additionalDetails,
              },
              tenantId,
              caseId: litigant?.caseId,
              partyCategory: litigant?.partyCategory,
              individualId: litigant?.individualId,
              partyType: litigant?.partyType?.includes("complainant") ? "complainant.primary" : "respondent.primary",
              documents: complainant?.vakalathnamaDoc,
            };
            representings.push(representingData);
          }
        });
        return representings;
      }
    };

    let representatives = [];
    representatives = updatedAdvocateDetails.map((data) => {
      const representing = getRepresentings(data?.complainants);
      return {
        tenantId,
        caseId: caseDetails?.id,
        advocateId: data?.advocate?.id,
        documents: [],
        additionalDetails: {
          advocateName: data?.advocate?.additionalDetails?.username,
          uuid: data?.advocate?.auditDetails?.createdBy,
        },
        representing: representing,
        advocateFilingStatus: "other", // For new advocates except case creator advocate
        // (if senior adv or his jr adv/clerk member created case on his behalf then its already present in existing case reprentatives as advocateFilingStatus: "caseOwner")
        //and it will be overridden automatically in updatedRepresentatives logic written below.
      };
    });

    // Logic to update the representatives with same id so that duplication does not happen in backend.
    // We will check that if a representative is already present in representatives array in case search api data,
    // we will just update the new documents and representinng data to that object.
    const updatedRepresentatives = representatives.map((rep) => {
      const existingRepresentative = caseRepresentatives.find((caseRep) => caseRep.advocateId === rep.advocateId);
      if (existingRepresentative) {
        const existingRep = structuredClone(existingRepresentative);
        if (!isEqual(existingRep.representing, rep.representing)) {
          const existingRepresenting = structuredClone(existingRep.representing || []);
          const newRepresenting = structuredClone(rep.representing || []);
          const updateRepresenting = [];
          //When the representing array in updated for a particular representative in formdata,
          //we check for the existing representing list from case data and if a representing object already exists,
          //then we just take that object (because it contains id for that representing) and put it in place of newer one.
          newRepresenting.forEach((obj) => {
            const objFound = existingRepresenting.find((o) => o.individualId === obj.individualId);
            if (objFound) {
              updateRepresenting.push(objFound);
            }
            if (!objFound) {
              updateRepresenting.push(obj);
            }
          });

          //Also if there was a representing array in existing representing list from case data,
          // but it is not present now in new formdata's representing list,
          //then we add the existing object with isActive as false.
          existingRepresenting.forEach((representingObj) => {
            const repObjectFound = updateRepresenting.find((o) => o.individualId === representingObj.individualId);
            if (!repObjectFound) {
              updateRepresenting.push({ ...representingObj, isActive: false });
            }
          });
          existingRep.representing = updateRepresenting;
        }
        if (!isEqual(existingRep.additionalDetails, rep.additionalDetails)) {
          existingRep.additionalDetails = rep.additionalDetails;
        }
        return existingRep;
      }
      return rep;
    });
    // If a representative object was present previously and now that representative is not present now,
    // the same object should again be copied with isActive as false and added in the updatedRepresentatives.
    caseRepresentatives.forEach((caseRep) => {
      const isAlreadyIncluded = updatedRepresentatives.some((rep) => rep.advocateId === caseRep.advocateId);

      if (!isAlreadyIncluded) {
        updatedRepresentatives.push({
          ...caseRep,
          isActive: false,
        });
      }
    });

    const updatedCaseLitigants = caseDetails?.litigants?.map((litigant) => {
      const lit = complainantDetails?.find((comp) => comp?.individualId === litigant?.individualId);
      if (lit) {
        const updatedDoc = lit?.pipAffidavitFileUpload ? structuredClone(lit?.pipAffidavitFileUpload) : null;
        if (updatedDoc) {
          const additionalDetails = {
            documentName: "UPLOAD_PIP_AFFIDAVIT",
          };
          updatedDoc.additionalDetails = additionalDetails;
        }
        const updatedLitigant = { ...litigant, documents: lit?.pipAffidavitFileUpload ? [updatedDoc] : [] };
        return updatedLitigant;
      } else return litigant;
    });

    data.litigants = [...updatedCaseLitigants];
    data.representatives = [...updatedRepresentatives];
    data.additionalDetails = {
      ...caseDetails.additionalDetails,
      advocateDetails: {
        formdata: newFormData,
        isCompleted: isCompleted === "PAGE_CHANGE" ? caseDetails.additionalDetails?.[selected]?.isCompleted : isCompleted,
      },
    };
  }
  if (selected === "processCourierService") {
    data.additionalDetails = {
      ...caseDetails.additionalDetails,
      processCourierService: {
        formdata: updatedFormData,
        isCompleted: isCompleted === "PAGE_CHANGE" ? caseDetails.additionalDetails?.[selected]?.isCompleted : isCompleted,
      },
    };
  }
  if (selected === "reviewCaseFile") {
    if (caseComplaintDocument) {
      tempDocList = updateComplaintDocInCaseDoc(tempDocList, caseComplaintDocument);
    }

    data.additionalDetails = {
      ...caseDetails.additionalDetails,
      reviewCaseFile: {
        formdata: updatedFormData,
        isCompleted: isCompleted === "PAGE_CHANGE" ? caseDetails.caseDetails?.[selected]?.isCompleted : isCompleted,
      },
      ...(caseComplaintDocument && { signedCaseDocument: caseComplaintDocument?.fileStore }),
    };
  }
  const complainantName = getComplainantName(
    data?.additionalDetails?.complainantDetails?.formdata || caseDetails?.additionalDetails?.complainantDetails?.formdata,
    t
  );
  const respondentName = getRespondentName(
    data?.additionalDetails?.respondentDetails?.formdata || caseDetails?.additionalDetails?.respondentDetails?.formdata,
    t
  );

  const caseTitle = ["DRAFT_IN_PROGRESS"].includes(caseDetails?.status)
    ? caseDetails?.additionalDetails?.modifiedCaseTitle || (complainantName || respondentName ? `${complainantName} vs ${respondentName}` : "")
    : caseDetails?.caseTitle;
  setErrorCaseDetails({
    ...caseDetails,
    documents: tempDocList,
    litigants: !caseDetails?.litigants ? [] : caseDetails?.litigants,
    ...data,
    caseTitle,
    linkedCases: caseDetails?.linkedCases ? caseDetails?.linkedCases : [],
    workflow: {
      ...caseDetails?.workflow,
      action: action,
    },
  });

  if (data?.additionalDetails?.processCourierService) {
    data.additionalDetails.processCourierService = {
      ...data?.additionalDetails?.processCourierService,
      formdata: data?.additionalDetails?.processCourierService?.formdata?.map((item) => {
        const courier = item?.data?.multipleAccusedProcessCourier;
        return {
          ...item,
          data: {
            ...item.data,
            multipleAccusedProcessCourier: {
              ...courier,
              noticeCourierService: isDelayCondonation ? courier?.noticeCourierService : [],
            },
          },
        };
      }),
    };
  }

  if (isSaveDraftEnabled && action === "SAVE_DRAFT") {
    return null;
  }
  if (isCaseSignedState && action === "SUBMIT_CASE") {
    return null;
  }

  const isSignedDocumentsPresent = tempDocList?.some((doc) => doc?.documentType === "case.complaint.signed");
  if (isSignedDocumentsPresent) tempDocList = tempDocList?.filter((doc) => doc?.documentType !== "case.complaint.unsigned");
  const updatedTempDocList = tempDocList?.map((doc) => {
    const existingDoc = caseDetails?.documents?.find((existingDoc) => existingDoc?.fileStore === doc?.fileStore);
    if (existingDoc) {
      return { ...doc, id: existingDoc?.id };
    }
    return doc;
  });
  const updatedData = transformCaseDataForUpdate(data, "witnessDetails");

  return await DRISTIService.caseUpdateService(
    {
      cases: {
        ...caseDetails,
        caseTitle,
        litigants: !caseDetails?.litigants ? [] : caseDetails?.litigants,
        ...updatedData,
        documents: updatedTempDocList,
        advocateCount:
          formdata?.[0]?.data?.numberOfAdvocate || caseDetails?.additionalDetails?.advocateDetails?.formdata[0]?.data?.numberOfAdvocate || 0,
        linkedCases: caseDetails?.linkedCases ? caseDetails?.linkedCases : [],
        workflow: {
          ...caseDetails?.workflow,
          action: action,
          assignes: [],
        },
      },
      tenantId,
    },
    tenantId
  );
};

export const transformCaseDataForFetching = (caseDetails, key) => {
  if (key === "witnessDetails" && caseDetails?.witnessDetails?.length > 0) {
    let updatedCaseData = structuredClone(caseDetails || {});
    updatedCaseData.additionalDetails = { ...(updatedCaseData?.additionalDetails || {}) };
    let isCompleted = true;

    const formdata = (caseDetails?.witnessDetails).map(({ uniqueId = "", uiData = {}, ...witnessFormData }) => {
      if (!uiData?.isCompleted) {
        isCompleted = false;
      }
      return {
        data: witnessFormData,
        isenabled: uiData?.isenabled,
        displayindex: uiData?.displayIndex || 0,
        uniqueId,
      };
    });

    updatedCaseData.additionalDetails[key] = {
      formdata,
      ...(isCompleted && { isCompleted }),
    };
    return updatedCaseData;
  }
  return caseDetails;
};

export const transformCaseDataForUpdate = (caseDetails, key) => {
  const updatedCaseData = structuredClone(caseDetails || {});

  if (key === "witnessDetails") {
    const { formdata = [], isCompleted = false } = caseDetails?.additionalDetails?.[key] || {};
    if (formdata?.length > 0) {
      const witnessDetails = formdata?.map(({ data, isenabled, displayindex, uniqueId }) => {
        return {
          ...data,
          uniqueId,
          uiData: {
            isenabled,
            displayIndex: displayindex,
            isCompleted: isCompleted ? true : false, // force true for all if group isCompleted is true
          },
        };
      });
      delete updatedCaseData.additionalDetails[key];
      updatedCaseData.witnessDetails = witnessDetails;
    } else updatedCaseData.witnessDetails = [];
  }
  return updatedCaseData;
};

export const mergeBreakdowns = (...breakdownArrays) => {
  const map = {};
  breakdownArrays?.flat()?.forEach((item) => {
    const codeKey = item?.code;
    if (!map[codeKey]) {
      map[codeKey] = { ...item };
    } else {
      map[codeKey].amount += item?.amount;
    }
  });
  return Object?.values(map);
};

export const createOrUpdateTask = async ({
  type,
  existingTask,
  accusedDetails,
  respondentFormData,
  filingNumber,
  tenantId,
  isUpfrontPayment,
  status,
}) => {
  if (existingTask && (!accusedDetails || accusedDetails?.length === 0)) {
    const expirePayload = {
      ...existingTask,
      workflow: { action: TaskManagementWorkflowAction.EXPIRE },
    };

    await DRISTIService.updateTaskManagementService({
      taskManagement: expirePayload,
    });

    return;
  }
  if (!accusedDetails || accusedDetails?.length === 0) return;

  const partyDetails = accusedDetails?.map((accused) => ({
    ...(status && { status }),
    addresses: accused?.addressDetails?.filter((addr) => addr?.checked) || [],
    deliveryChannels: accused?.[`${type?.toLowerCase()}CourierService`],
    respondentDetails: {
      ...respondentFormData?.find((acc) => acc?.uniqueId === (accused?.data?.uniqueId || accused?.uniqueId))?.data,
      uniqueId: accused?.uniqueId,
    },
  }));

  const taskManagementPayload = existingTask
    ? {
        ...existingTask,
        partyDetails,
        workflow: { action: isUpfrontPayment ? TaskManagementWorkflowAction.UPDATE_UPFRONT_PAYMENT : TaskManagementWorkflowAction.UPDATE },
      }
    : {
        filingNumber,
        tenantId,
        taskType: type,
        partyDetails,
        partyType: "RESPONDENT",
        workflow: { action: isUpfrontPayment ? TaskManagementWorkflowAction.CREATE_UPFRONT_PAYMENT : TaskManagementWorkflowAction.CREATE },
      };

  const serviceMethod = existingTask ? DRISTIService.updateTaskManagementService : DRISTIService.createTaskManagementService;

  await serviceMethod({ taskManagement: taskManagementPayload });
};
