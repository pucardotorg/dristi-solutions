import { combineMultipleFiles } from "@egovernments/digit-ui-module-dristi/src/Utils";
import { SubmissionWorkflowState } from "@egovernments/digit-ui-module-dristi/src/Utils/submissionWorkflow";
import { validateAdvocateSuretyContactNumber } from "./bailBondUtils";

export const BAIL_APPLICATION_EXCLUDED_STATUSES = [
  "PENDING_RESPONSE",
  "PENDING_ADMISSION_HEARING",
  "ADMISSION_HEARING_SCHEDULED",
  "PENDING_NOTICE",
  "CASE_ADMITTED",
  "PENDING_ADMISSION",
];

export const stateSla = {
  RE_SCHEDULE: 2 * 24 * 3600 * 1000,
  CHECKOUT_REQUEST: 2 * 24 * 3600 * 1000,
  ESIGN_THE_SUBMISSION: 2 * 24 * 3600 * 1000,
  MAKE_PAYMENT_SUBMISSION: 2 * 24 * 3600 * 1000,
};

export const _getApplicationAmount = (applicationTypeAmountList, applicationType) => {
  const applicationTypeAmount = applicationTypeAmountList?.find((amount) => amount?.type === applicationType);
  return applicationTypeAmount?.totalAmount || 20;
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

export const getModifiedForm = (formConfig, formData) => {
  const updatedConfig = formConfig?.filter((config) => {
    const dependentKeys = config?.dependentKey;
    if (!dependentKeys) {
      return config;
    }
    let show = true;
    for (const key in dependentKeys) {
      const nameArray = dependentKeys[key];
      for (const name of nameArray) {
        if (Array.isArray(formData?.[key]?.[name]) && formData?.[key]?.[name]?.length === 0) {
          show = false;
        } else show = show && Boolean(formData?.[key]?.[name]);
      }
    }
    return show && config;
  });

  return updatedConfig;
};

export const extractOrderNumber = (orderItemId) => {
  if (!orderItemId || typeof orderItemId !== "string") return orderItemId || "";
  return orderItemId?.includes("_") ? orderItemId?.split("_")?.pop() : orderItemId;
};

export const cleanString = (input) => {
  return input
    .replace(/\b(null|undefined)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

//  Editing restricted for some application types
export const restrictedApplicationTypes = [
  "ADDING_WITNESSES",
  "EXTENSION_SUBMISSION_DEADLINE",
  "DOCUMENT",
  "RE_SCHEDULE",
  "CHECKOUT_REQUEST",
  "SUBMIT_BAIL_DOCUMENTS",
  "CORRECTION_IN_COMPLAINANT_DETAILS",
];

export const getReviewModalCancelButtonLabel = (application) => {
  if (application?.applicationType === "APPLICATION_TO_CHANGE_POWER_OF_ATTORNEY_DETAILS") {
    return null;
  }

  const isRestricted = restrictedApplicationTypes.includes(application?.applicationType);

  if (application?.status === SubmissionWorkflowState.PENDINGESIGN && !isRestricted) {
    return "EDIT";
  }

  return "CS_COMMON_BACK";
};

export const onDocumentUpload = async (fileData, filename, tenantId) => {
  if (fileData?.fileStore) return fileData;
  try {
    const fileUploadRes = await window?.Digit.UploadServices.Filestorage("DRISTI", fileData, tenantId);
    return { file: fileUploadRes?.data, fileType: fileData.type, filename };
  } catch (error) {
    throw error;
  }
};

// move to utils
export const replaceUploadedDocsWithCombinedFile = async (t, formData, tenantId) => {
  if (formData?.supportingDocuments?.length) {
    for (let index = 0; index < formData.supportingDocuments.length; index++) {
      const doc = formData?.supportingDocuments[index];
      if (doc?.submissionDocuments?.uploadedDocs?.length > 0) {
        const hasFileTypeDoc = doc?.submissionDocuments?.uploadedDocs?.some((doc) => doc instanceof File || (doc.file && doc.file instanceof File));
        if (hasFileTypeDoc) {
          try {
            const docTitle = doc?.documentTitle;
            const combinedDocName = docTitle ? `${docTitle}.pdf` : `${t("SUPPORTING_DOCS")} ${index + 1}.pdf`;
            const combinedDocumentFile = await combineMultipleFiles(doc.submissionDocuments.uploadedDocs, combinedDocName, "submissionDocuments");
            const docs = await onDocumentUpload(combinedDocumentFile?.[0], combinedDocName, tenantId);
            const file = {
              documentType: docs?.fileType,
              fileStore: docs?.file?.files?.[0]?.fileStoreId,
              additionalDetails: { name: docs?.filename || combinedDocName },
            };
            doc.submissionDocuments.uploadedDocs = [file];
          } catch (error) {
            console.error("Error combining or uploading documents for index:", index, error);
            throw new Error("Failed to combine and update uploaded documents.");
          }
        }
      }
    }
  }
  return formData;
};

export const handleDocumentUploadValidation = (
  t,
  formData,
  applicationType,
  setFormState,
  setFormErrors,
  clearFormDataErrors,
  userInfo,
  setShowErrorToast,
  formdata
) => {
  let documentErrorFlag = false;
  if (applicationType && ["SUBMIT_BAIL_DOCUMENTS", "DELAY_CONDONATION", "PRODUCTION_DOCUMENTS"].includes(applicationType)) {
    formData?.supportingDocuments?.forEach((docs, index) => {
      if (!docs?.submissionDocuments?.uploadedDocs?.length && !Object.keys(setFormState.current?.errors).includes(`submissionDocuments_${index}`)) {
        setFormErrors.current(`submissionDocuments_${index}`, { message: t("CORE_REQUIRED_FIELD_ERROR") });
        documentErrorFlag = true;
      } else if (
        docs?.submissionDocuments?.uploadedDocs?.length &&
        Object.keys(setFormState.current?.errors).includes(`submissionDocuments_${index}`)
      ) {
        clearFormDataErrors.current(`submissionDocuments_${index}`);
      }
    });
  }
  if (applicationType === "REQUEST_FOR_BAIL") {
    const addSurety = formData?.addSurety;
    const isSuretySelected = typeof addSurety === "object" ? addSurety?.code === "YES" || addSurety?.showSurety === true : addSurety === "YES";
    if (isSuretySelected && Array.isArray(formData?.sureties)) {
      formData.sureties.forEach((s, idx) => {
        const identityDocs = s?.identityProof?.uploadedDocs || s?.identityProof?.document || [];
        const solvencyDocs = s?.proofOfSolvency?.uploadedDocs || s?.proofOfSolvency?.document || [];
        if (!identityDocs?.length && !Object.keys(setFormState.current?.errors).includes(`identityProof_${idx}`)) {
          setFormErrors.current(`identityProof_${idx}`, { message: t("CORE_REQUIRED_FIELD_ERROR") });
          documentErrorFlag = true;
        } else if (identityDocs?.length && Object.keys(setFormState.current?.errors).includes(`identityProof_${idx}`)) {
          clearFormDataErrors.current(`identityProof_${idx}`);
        }
        if (!solvencyDocs?.length && !Object.keys(setFormState.current?.errors).includes(`proofOfSolvency_${idx}`)) {
          setFormErrors.current(`proofOfSolvency_${idx}`, { message: t("CORE_REQUIRED_FIELD_ERROR") });
          documentErrorFlag = true;
        } else if (solvencyDocs?.length && Object.keys(setFormState.current?.errors).includes(`proofOfSolvency_${idx}`)) {
          clearFormDataErrors.current(`proofOfSolvency_${idx}`);
        }
      });
    }

    if (validateAdvocateSuretyContactNumber(t, formData?.sureties, userInfo, setShowErrorToast)) {
      return true;
    }
  }
  if (applicationType === "PRODUCTION_DOCUMENTS") {
    formdata?.submissionDocuments?.submissionDocuments?.forEach((docs, index) => {
      if (!docs?.documentType && !Object.keys(setFormState.current?.errors).includes(`submissionDocuments_${index}`)) {
        setFormErrors.current(`documentType_${index}`, { message: t("CORE_REQUIRED_FIELD_ERROR") });
      } else if (docs?.document?.fileStore && Object.keys(setFormState.current?.errors).includes(`submissionDocuments_${index}`)) {
        clearFormDataErrors.current(`documentType_${index}`);
      }
      if (!docs?.document?.fileStore && !Object.keys(setFormState.current?.errors).includes(`submissionDocuments_${index}`)) {
        setFormErrors.current(`submissionDocuments_${index}`, { message: t("CORE_REQUIRED_FIELD_ERROR") });
        documentErrorFlag = true;
      } else if (docs?.document?.fileStore && Object.keys(setFormState.current?.errors).includes(`submissionDocuments_${index}`)) {
        clearFormDataErrors.current(`submissionDocuments_${index}`);
      }
    });
  }
  return documentErrorFlag;
};

export const uploadDocumentsIfAny = async ({ documents, tenantId, documentsList }) => {
  if (!Array.isArray(documents) || documents.length === 0) return documents;

  const uploadPromises = documents?.map(async (doc) => {
    if (doc?.fileStore) return doc;

    const uploadedDoc = await onDocumentUpload(doc, doc?.name, tenantId);

    const file = {
      documentType: uploadedDoc?.fileType,
      fileStore: uploadedDoc?.file?.files?.[0]?.fileStoreId,
      documentName: uploadedDoc?.filename,
    };

    documentsList.push(uploadedDoc);
    return file;
  });

  return Promise.all(uploadPromises);
};

const getSurety = (applicationDetails) => {
  return Array.isArray(applicationDetails?.applicationDetails?.sureties)
    ? applicationDetails?.applicationDetails?.sureties.map((s, index) => ({
        id: s?.id || s?.index || null,
        name: s?.name || "",
        fatherName: s?.fatherName || "",
        mobileNumber: s?.mobileNumber || "",
        address: s?.address || {},
        email: s?.email || "",
        documents: [
          ...(applicationDetails?.applicationDetails?.applicationDocuments?.filter((doc) => doc?.suretyIndex === s?.suretyIndex) || []),
        ].map((d) => ({
          ...d,
          documentName: d?.documentTitle,
          isActive: true,
        })),
      }))
    : [];
};

export const _getDefaultFormValue = (t, applicationDetails) => {
  if (applicationDetails?.applicationType === "REQUEST_FOR_BAIL") {
    const sureties = getSurety(applicationDetails);
    const formdata = {
      ...applicationDetails?.additionalDetails?.formdata,
      litigantFatherName:
        applicationDetails?.applicationDetails?.litigantFatherName || applicationDetails?.additionalDetails?.formdata?.litigantFatherName || "",
      reasonForApplicationOfBail: {
        text:
          applicationDetails?.applicationDetails?.reasonForApplicationOfBail ||
          applicationDetails?.additionalDetails?.formdata?.reasonForApplicationOfBail?.text ||
          "",
      },
      prayer: {
        text: applicationDetails?.applicationDetails?.prayer || applicationDetails?.additionalDetails?.formdata?.prayer?.text || "",
      },
      addSurety: applicationDetails?.applicationDetails?.sureties?.length
        ? { code: "YES", name: t("YES"), showSurety: true }
        : { code: "NO", name: t("NO"), showSurety: false },
      sureties: sureties?.map((surety) => ({
        id: surety?.id,
        name: surety?.name,
        fatherName: surety?.fatherName,
        mobileNumber: surety?.mobileNumber,
        address: surety?.address,
        email: surety?.email,
        identityProof: {
          document: surety?.documents?.filter((doc) => doc?.documentType === "IDENTITY_PROOF" && doc?.isActive === true) || [],
        },
        proofOfSolvency: {
          document: surety?.documents?.filter((doc) => doc?.documentType === "PROOF_OF_SOLVENCY" && doc?.isActive === true) || [],
        },
        otherDocuments: {
          document: surety?.documents?.filter((doc) => doc?.documentType === "OTHER_DOCUMENTS" && doc?.isActive === true) || [],
        },
      })),
    };

    return formdata;
  }
  return applicationDetails?.additionalDetails?.formdata || {};
};

export const _getFinalDocumentList = (applicationDetails, documents) => {
  const applicationDocs = applicationDetails?.documents || [];
  const uploadedDocs = documents || [];

  const uploadedDocMap = new Map(uploadedDocs?.map((doc) => [doc?.fileStore, doc]));

  const finalDocuments = [];

  for (const appDoc of applicationDocs) {
    const isPresent = uploadedDocMap?.has(appDoc?.fileStore);

    finalDocuments.push({
      ...appDoc,
      isActive: isPresent,
    });

    if (isPresent) {
      uploadedDocMap?.delete(appDoc?.fileStore);
    }
  }

  finalDocuments.push(...uploadedDocMap?.values());
  return finalDocuments;
};
