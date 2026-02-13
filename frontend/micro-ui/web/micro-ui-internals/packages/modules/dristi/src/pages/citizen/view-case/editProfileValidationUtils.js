import { Urls } from "../../../hooks";
import { DRISTIService } from "../../../services";
import { cleanString, combineMultipleFiles, documentsTypeMapping, getAuthorizedUuid } from "../../../Utils";
import { SubmissionWorkflowAction } from "../../../Utils/submissionWorkflow";
import { efilingDocumentKeyAndTypeMapping } from "../FileCase/Config/efilingDocumentKeyAndTypeMapping";
import { formatName, onDocumentUpload, sendDocumentForOcr } from "../FileCase/EfilingValidationUtils";

export const editComplainantValidation = ({
  formData,
  t,
  caseDetails,
  selected,
  setShowErrorToast,
  toast,
  setFormErrors,
  formState,
  clearFormDataErrors,
  currentComplainant,
}) => {
  if (selected === "complainantDetails") {
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
    if (
      !(
        formData?.complainantId?.complainantId?.ID_Proof?.[0]?.[1]?.file ||
        formData?.complainantId?.complainantId?.complainantId?.ID_Proof?.[0]?.[1]?.file ||
        formData?.complainantId?.complainantId === true
      )
    ) {
      setShowErrorToast(true);
      setFormErrors("complainantId", { message: "COMPLAINANT_ID_PROOF_IS_MANDATORY" });
      return true;
    } else {
      clearFormDataErrors("complainantId");
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

export const editRespondentValidation = ({
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

export const editCheckNameValidation = ({ formData, setValue, selected, reset, index, formdata, clearErrors, formState }) => {
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
  if (selected === "complainantDetails") {
    if (formData?.firstName || formData?.middleName || formData?.lastName || formData?.complainantAge) {
      const formDataCopy = structuredClone(formData);
      for (const key in formDataCopy) {
        if (["firstName", "middleName", "lastName"].includes(key) && Object.hasOwnProperty.call(formDataCopy, key)) {
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
        if (["complainantAge"].includes(key) && Object.hasOwnProperty.call(formDataCopy, key)) {
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
};

export const editCheckDuplicateMobileEmailValidation = ({
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
      ?.reduce((acc, curr) => acc.concat(curr), []) || [];

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
};

export const editShowToastForComplainant = ({ formData, setValue, selected, formState, clearErrors }) => {
  if (selected === "complainantDetails") {
    // const formDataCopy = structuredClone(formData);
    // const addressDet = formDataCopy?.complainantVerification?.individualDetails?.addressDetails;
    // const addressDetSelect = formDataCopy?.complainantVerification?.individualDetails?.["addressDetails-select"];
    // if (!!addressDet && !!addressDetSelect) {
    //   setValue("addressDetails", { ...addressDet, typeOfAddress: formDataCopy?.addressDetails?.typeOfAddress });
    //   setValue("addressDetails-select", addressDetSelect);
    // }
  }
};

export const updateProfileData = async ({
  t,
  tenantId,
  toast,
  caseId,
  uniqueId,
  isAdvocate,
  editorUuid,
  caseDetails,
  multiUploadList,
  prevCaseDetails,
  selected,
  formdata,
  complainantIdProofFileName,
  setFormDataValue,
  history,
  currentComplainant,
  individualId,
  userTypeCitizen,
  userInfo,
  sourceType,
  onBehalfOfUuid,
  filingType,
}) => {
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

  let profilePayload = {};
  let formdataPayload = {};
  let docList = [];

  if (selected === "complainantDetails") {
    const newFormData = await Promise.all(
      updatedFormData
        .filter((item) => item.isenabled)
        .map(async (data) => {
          const documentData = {
            complainantIDProofDocument: null,
            companyDetailsUpload: null,
            supportingDocument: null,
          };
          const idProof = data?.data?.complainantId?.complainantId?.ID_Proof || data?.data?.complainantId?.complainantId?.complainantId?.ID_Proof;
          if (idProof?.[0]?.[1]?.file) {
            const documentType = documentsTypeMapping["complainantId"];
            const uploadedData = await onDocumentUpload(documentType, idProof?.[0]?.[1]?.file, idProof?.[0]?.[0], tenantId);
            const doc = {
              documentType,
              fileStore: uploadedData.file?.files?.[0]?.fileStoreId || uploadedData?.fileStore,
              documentName: uploadedData.filename || uploadedData?.documentName,
            };

            documentData.complainantIDProofDocument = { document: [doc] };
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

          if (
            data?.data?.supportingDocument?.document &&
            Array.isArray(data?.data?.supportingDocument?.document) &&
            data?.data?.supportingDocument?.document.length > 0
          ) {
            documentData.supportingDocument = {};
            documentData.supportingDocument.document = await Promise.all(
              data?.data?.supportingDocument?.document?.map(async (document) => {
                if (document) {
                  const documentType = documentsTypeMapping["supportingDocument"];
                  const uploadedData = await onDocumentUpload(documentType, document, document.name, tenantId);
                  const doc = {
                    documentType,
                    fileStore: uploadedData.file?.files?.[0]?.fileStoreId || document?.fileStore,
                    documentName: uploadedData.filename || document?.documentName,
                    fileName: "supporting Document",
                  };
                  docList.push(doc);
                  return doc;
                }
              })
            );

            setFormDataValue("supportingDocument", documentData?.supportingDocument);
          }
          const updatedComplainantVerification = structuredClone(data?.data?.complainantVerification);
          updatedComplainantVerification.individualDetails.document =
            documentData?.complainantIDProofDocument?.document || updatedComplainantVerification?.individualDetails?.document || [];
          return {
            ...data,
            isFormCompleted: true,
            data: {
              ...data.data,
              ...documentData,
              complainantVerification: updatedComplainantVerification,
              complainantId: { complainantId: true },
            },
          };
        })
    );

    const { complainantIDProofDocument, reasonDetailsSeparator, reasonForChange, supportingDocument, ...remainingFormData } =
      newFormData?.[0]?.data || {};
    remainingFormData.transferredPOA = currentComplainant?.transferredPOA;
    if (currentComplainant?.transferredPOA?.showPoaDetails) {
      remainingFormData.poaVerification = currentComplainant?.poaVerification;
      remainingFormData.poaComplainantId = currentComplainant?.poaComplainantId;
      remainingFormData.poaFirstName = currentComplainant?.poaFirstName;
      remainingFormData.poaMiddleName = currentComplainant?.poaMiddleName;
      remainingFormData.poaLastName = currentComplainant?.poaLastName;
      remainingFormData.poaAge = currentComplainant?.poaAge;
      remainingFormData.poaAddressDetails = currentComplainant?.poaAddressDetails;
      remainingFormData["poaAddressDetails-select"] = currentComplainant?.["poaAddressDetails-select"];
      remainingFormData.poaAuthorizationDocument = currentComplainant?.poaAuthorizationDocument;
    }
    profilePayload = {
      tenantId,
      caseId,
      litigantDetails: {
        partyType: "complainant",
        uniqueId,
      },
      editorDetails: {
        isAdvocate,
        partyType: "complainant",
        uuid: editorUuid,
      },
      pendingTaskRefId: `MANUAL_${uniqueId}_${editorUuid}_${caseDetails?.id}`,
      newData: {
        complainantDetails: remainingFormData,
      },
      reason: reasonForChange?.text || "",
      document: supportingDocument?.document?.[0] || {},
    };

    formdataPayload = { ...remainingFormData, supportingDocument, reasonForChange };
  }

  if (selected === "respondentDetails") {
    const newFormData = await Promise.all(
      updatedFormData
        .filter((item) => item.isenabled)
        .map(async (data) => {
          const documentData = {
            inquiryAffidavitFileUpload: null,
            companyDetailsUpload: null,
            supportingDocument: null,
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

          if (
            data?.data?.supportingDocument?.document &&
            Array.isArray(data?.data?.supportingDocument?.document) &&
            data?.data?.supportingDocument?.document.length > 0
          ) {
            documentData.supportingDocument = {};
            documentData.supportingDocument.document = await Promise.all(
              data?.data?.supportingDocument?.document?.map(async (document) => {
                if (document) {
                  const documentType = documentsTypeMapping["supportingDocument"];
                  const uploadedData = await onDocumentUpload(documentType, document, document.name, tenantId);
                  const doc = {
                    documentType,
                    fileStore: uploadedData.file?.files?.[0]?.fileStoreId || document?.fileStore,
                    documentName: uploadedData.filename || document?.documentName,
                    fileName: "supporting Document",
                  };
                  docList.push(doc);
                  return doc;
                }
              })
            );

            setFormDataValue("supportingDocument", documentData?.supportingDocument);
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
    const { reasonDetailsSeparator, reasonForChange, supportingDocument, ...remainingFormData } = newFormDataCopy?.[0]?.data || {};
    const currentRespondent = caseDetails?.additionalDetails?.[selected]?.formdata?.find(
      (item, index) => item?.data?.respondentVerification?.individualDetails?.individualId === uniqueId || item?.uniqueId === uniqueId
    );
    const respVerification = currentRespondent?.data?.respondentVerification;
    if (respVerification) {
      remainingFormData.respondentVerification = { ...respVerification };
    }
    if (currentRespondent?.data) {
      const { inquiryAffidavitFileUpload, ...restData } = currentRespondent?.data || {};
      if (inquiryAffidavitFileUpload) {
        remainingFormData.inquiryAffidavitFileUpload = { ...inquiryAffidavitFileUpload };
      }
    }
    profilePayload = {
      tenantId,
      caseId,
      litigantDetails: {
        partyType: "respondent",
        uniqueId,
      },
      editorDetails: {
        isAdvocate,
        partyType: "respondent",
        uuid: editorUuid,
      },
      pendingTaskRefId: `MANUAL_${uniqueId}_${editorUuid}_${caseDetails?.id}`,
      newData: {
        respondentDetails: remainingFormData,
      },
      reason: reasonForChange?.text || "",
      document: supportingDocument?.document?.[0] || {},
    };

    formdataPayload = { ...remainingFormData, supportingDocument, reasonForChange };
  }

  let applicationSchema = {};
  if (userTypeCitizen === "ADVOCATE") {
    applicationSchema = {
      ...applicationSchema,
      applicationDetails: { ...applicationSchema?.applicationDetails, advocateIndividualId: individualId },
    };
  }
  const referenceId = `MANUAL_${uniqueId}_${editorUuid}_${caseDetails?.id}`;
  const userUuid = userInfo?.uuid;
  const authorizedUuid = getAuthorizedUuid(userUuid);

  const applicationReqBody = {
    tenantId,
    application: {
      ...applicationSchema,
      tenantId,
      filingNumber: caseDetails?.filingNumber,
      cnrNumber: caseDetails?.cnrNumber,
      cmpNumber: caseDetails?.cmpNumber,
      caseId: caseDetails?.id,
      referenceId: null,
      createdDate: new Date().getTime(),
      applicationType: "CORRECTION_IN_COMPLAINANT_DETAILS",
      status: caseDetails?.status,
      isActive: true,
      asUser: authorizedUuid, // Sending uuid of the main advocate in case clerk/jr. adv is creating doc.
      createdBy: userInfo?.uuid,
      statuteSection: { tenantId },
      additionalDetails: {
        formdata: {
          ...formdataPayload,
          submissionType: {
            code: "APPLICATION",
            name: "APPLICATION",
          },
          applicationType: {
            name: "APPLICATION_TYPE_CORRECTION_IN_COMPLAINANT_DETAILS",
            type: "CORRECTION_IN_COMPLAINANT_DETAILS",
            isActive: true,
          },
        },
        dateOfApplication: new Date().getTime(),
        uniqueId: uniqueId,
        profileEditType: selected,
        pendingTaskRefId: referenceId,
        onBehalOfName: null,
        partyType: sourceType?.toLowerCase(),
        isResponseRequired: true,
        owner: cleanString(userInfo?.name),
      },
      documents: docList,
      onBehalfOf: [onBehalfOfUuid],
      comment: [],
      workflow: {
        id: "workflow123",
        action: SubmissionWorkflowAction.SUBMIT,
        status: "in_progress",
        comments: "Workflow comments",
        documents: [{}],
      },
    },
  };

  try {
    // await DRISTIService.customApiService(Urls.dristi.pendingTask, {
    //   pendingTask: {
    //     name: "Review Litigant Details Change",
    //     entityType: "case-default",
    //     referenceId,
    //     status: "PROFILE_EDIT_REQUEST",
    //     assignedTo: [],
    //     assignedRole: ["JUDGE_ROLE"],
    //     cnrNumber: caseDetails?.cnrNumber,
    //     filingNumber: caseDetails?.filingNumber,
    //     caseId: caseDetails?.id,
    //     caseTitle: caseDetails?.caseTitle,
    //     isCompleted: false,
    //     additionalDetails: {
    //       dateOfApplication: new Date().getTime(),
    //       uniqueId: uniqueId,
    //     },
    //     tenantId,
    //   },
    // });

    // history.goBack();

    await DRISTIService.createProfileRequest(
      {
        profile: { ...profilePayload },
      },
      tenantId
    );

    const res = await DRISTIService.createApplication(applicationReqBody, { tenantId });

    return res;
  } catch (error) {
    toast.error(t("SOMETHING_WENT_WRONG"));
    console.error(error);
  }
};
