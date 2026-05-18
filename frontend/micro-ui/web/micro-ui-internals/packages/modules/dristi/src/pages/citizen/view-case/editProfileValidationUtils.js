import {
  runEditComplainantNameAgeValidation,
  runRespondentNameAgeValidation,
} from "../../../configs/shared/nameValidationShared";
import {
  clearBulkContactTextfieldValues,
  getComplainantMobileNumbers,
  getWitnessEmails,
  getWitnessMobileNumbers,
  shouldSkipRespondentInquiryAffidavitValidation,
  validateComplainantMobileNotInRespondentList,
  validateRespondentMobileEmailDuplicates,
  validateRespondentMobileNotSameAsComplainant,
} from "../../../configs/shared/profileValidationShared";
import { DRISTIService } from "../../../services";
import { cleanString, combineMultipleFiles, documentsTypeMapping, getAuthorizedUuid } from "../../../Utils";
import { SubmissionWorkflowAction } from "../../../Utils/submissionWorkflow";
import { efilingDocumentKeyAndTypeMapping } from "../FileCase/Config/efilingDocumentKeyAndTypeMapping";
import { formatName, onDocumentUpload, sendDocumentForOcr } from "../FileCase/EfilingValidationUtils";

export const editComplainantValidation = ({ formData, t, caseDetails, selected, setShowToast, setFormErrors, formState, clearFormDataErrors }) => {
  if (selected === "complainantDetails") {
    if (
      formData?.complainantType?.code !== "INDIVIDUAL" &&
      !formData?.complainantTypeOfEntity?.code &&
      !Object.keys(formState?.errors).includes("complainantTypeOfEntity")
    ) {
      setShowToast({ label: t("ES_COMMON_PLEASE_ENTER_ALL_MANDATORY_FIELDS"), error: true });
      setFormErrors("complainantTypeOfEntity", { message: "CORE_REQUIRED_FIELD_ERROR" });
      return true;
    }
    if (!formData?.complainantVerification?.mobileNumber || !formData?.complainantVerification?.otpNumber) {
      setShowToast({ label: t("ES_COMMON_PLEASE_ENTER_ALL_MANDATORY_FIELDS"), error: true });
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
      setShowToast({ label: t("ES_COMMON_PLEASE_ENTER_ALL_MANDATORY_FIELDS"), error: true });
      setFormErrors("complainantId", { message: "COMPLAINANT_ID_PROOF_IS_MANDATORY" });
      return true;
    } else {
      clearFormDataErrors("complainantId");
    }
    if (validateComplainantMobileNotInRespondentList({ formData, caseDetails, setShowToast, t })) {
      return true;
    }
  } else {
    return false;
  }
};

export const editRespondentValidation = ({ t, formData, selected, caseDetails, setShowToast, setFormErrors, clearFormDataErrors }) => {
  if (selected === "respondentDetails") {
    const formDataCopy = structuredClone(formData);
    if (shouldSkipRespondentInquiryAffidavitValidation(formData, caseDetails)) {
      return false;
    }
    if (!formDataCopy?.respondentType?.code) {
      setShowToast({ label: t("ES_COMMON_PLEASE_ENTER_ALL_MANDATORY_FIELDS"), error: true });
      return true;
    }
  }

  return validateRespondentMobileNotSameAsComplainant({
    formData,
    caseDetails,
    setShowToast,
    setFormErrors,
    clearFormDataErrors,
    t,
  });
};

export const editCheckNameValidation = ({ formData, setValue, selected, reset, index, formdata, clearErrors, formState }) => {
  if (selected === "respondentDetails") {
    runRespondentNameAgeValidation({ formData, setValue, formatName });
  }
  if (selected === "complainantDetails") {
    runEditComplainantNameAgeValidation({ formData, setValue, formatName });
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
  if (selected === "respondentDetails") {
    validateRespondentMobileEmailDuplicates({
      formData,
      formdata,
      setError,
      clearErrors,
      complainantMobileNumbers: getComplainantMobileNumbers(caseDetails),
      witnessMobileNumbers: getWitnessMobileNumbers(caseDetails),
      witnessEmails: getWitnessEmails(caseDetails),
    });
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
  setShowToast,
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
    clearBulkContactTextfieldValues(newFormDataCopy);
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
    console.error("Profile validation failed:", error);
    const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
    setShowToast({ label: t("PROFILE_VALIDATION_FAILED"), error: true, errorId });
  }
};
