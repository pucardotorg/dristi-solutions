import { Urls } from "../hooks/services/Urls";

export const pleaWorkflowActions = {
  SAVEDRAFT: "SAVE_DRAFT",
  ESIGN: "INITIATE_E-SIGN",
  UPLOAD: "UPLOAD",
  EDIT: "EDIT",
};

const convertCodeToBoolean = (code) => {
  if (code === "YES") {
    return true;
  } else {
    return false;
  }
};

export const BooleanToCode = (value) => {
  if (value) {
    return { code: "YES", name: "YES" };
  } else {
    return { code: "NO", name: "NO" };
  }
};

export const _getCreatePleaPayload = (caseDetails, formData, tenantId, courtId) => {
  const payload = {
    digitalizedDocument: {
      tenantId: tenantId,
      type: "PLEA",
      caseId: caseDetails?.id,
      caseFilingNumber: caseDetails?.filingNumber,
      courtId: courtId,
      pleaDetails: {
        accusedName: formData?.accusedDetails?.code,
        accusedUniqueId: formData?.accusedDetails?.uniqueId,
        fatherName: formData?.fatherName,
        village: formData?.village,
        taluk: formData?.taluk,
        calling: formData?.calling,
        age: formData?.age,
        isChargesUnderstood: convertCodeToBoolean(formData?.isChargesUnderstood?.code),
        pleadGuilty: convertCodeToBoolean(formData?.pleadGuilty?.code),
        magistrateRemarks: formData?.magistrateRemarks?.text || "",
      },
      workflow: {
        action: pleaWorkflowActions.SAVEDRAFT,
        documents: [{}],
      },
    },
  };

  return payload;
};

export const _getUpdatePleaPayload = (t, pleaDetails, formData, tenantId, action, fileStoreId, pleaMobileNumber, partyUUID) => {
  let payload = {};
  if (action === pleaWorkflowActions.ESIGN) {
    const documents = Array.isArray(pleaDetails?.documents) ? pleaDetails.documents : [];
    const documentsFile = fileStoreId
      ? [
          {
            fileStore: fileStoreId,
            documentType: "UNSIGNED",
            additionalDetails: {
              name: `${t("PLEA")} (${pleaDetails?.pleaDetails?.accusedName}).pdf`,
            },
            tenantId,
          },
        ]
      : null;

    payload = {
      digitalizedDocument: {
        ...pleaDetails,
        pleaDetails: {
          ...pleaDetails.pleaDetails,
          accusedMobileNumber: pleaMobileNumber,
        },
        documents: documentsFile ? [...documentsFile] : documents,
        workflow: { ...pleaDetails.workflow, action, documents: [{}], ...(action === "INITIATE_E-SIGN" && partyUUID && { assignes: [partyUUID] }) },
      },
    };
  } else if (action === pleaWorkflowActions.UPLOAD) {
    const documents = Array.isArray(pleaDetails?.documents) ? pleaDetails.documents : [];
    const documentsFile = fileStoreId
      ? [
          {
            fileStore: fileStoreId,
            documentType: "SIGNED",
            additionalDetails: { name: `${t("PLEA")} (${pleaDetails?.pleaDetails?.accusedName}).pdf` },
            tenantId,
          },
        ]
      : null;

    payload = {
      digitalizedDocument: {
        ...pleaDetails,
        documents: documentsFile ? [...documentsFile] : documents,
        workflow: { ...pleaDetails.workflow, action, documents: [{}] },
      },
    };
  } else {
    payload = {
      digitalizedDocument: {
        ...pleaDetails,
        pleaDetails: {
          accusedName: formData?.accusedDetails?.code,
          accusedUniqueId: formData?.accusedDetails?.uniqueId,
          fatherName: formData?.fatherName,
          village: formData?.village,
          taluk: formData?.taluk,
          calling: formData?.calling,
          age: formData?.age,
          isChargesUnderstood: convertCodeToBoolean(formData?.isChargesUnderstood?.code),
          pleadGuilty: convertCodeToBoolean(formData?.pleadGuilty?.code),
          magistrateRemarks: formData?.magistrateRemarks?.text || "",
        },
        workflow: {
          ...pleaDetails.workflow,
          action: action,
          documents: [{}],
        },
      },
    };
  }

  return payload;
};

export const _getPdfConfig = (pleaResponseDetails, caseDetails, courtId, tenantId) => {
  return {
    id: pleaResponseDetails?.documentNumber,
    cnrNumber: caseDetails?.cnrNumber,
    pdfMap: "digitisation-plea",
    url: Urls.digitalization.pleaPreviewPdf,
    params: {
      tenantId,
      documentNumber: pleaResponseDetails?.documentNumber,
      cnrNumber: caseDetails?.cnrNumber,
      qrCode: false,
      documentType: "digitisation-plea",
      courtId: courtId,
    },
    enabled: !!pleaResponseDetails?.documentNumber && !!caseDetails?.cnrNumber,
  };
};

export const validateMobileNumber = (number) => {
  // Check if the number contains only digits
  const isNumeric = /^[0-9]+$/.test(number);

  if (!number) {
    return "Mobile number is required";
  }

  if (!isNumeric) {
    return "Mobile number should contain only digits";
  }

  if (number.length !== 10) {
    return "Mobile number should be exactly 10 digits";
  }

  return "";
};

export const formatName = (value, capitalize = true) => {
  let cleanedValue = value
    .replace(/[^a-zA-Z\s]/g, "")
    .trimStart()
    .replace(/ +/g, " ");

  if (!capitalize) return cleanedValue;

  return cleanedValue;
};

export const formatAge = (value) => {
  if (typeof value !== "string") return value;
  let cleaned = value.replace(/[^0-9]/g, "");
  cleaned = cleaned.replace(/^0+/, "");
  if (cleaned.length > 3) {
    cleaned = cleaned.slice(0, 3);
  }
  return cleaned;
};

export const checkTextValidation = ({ formData, setValue, reset, formdata, clearErrors, formState }) => {
  const formDataCopy = structuredClone(formData);

  for (const key in formDataCopy) {
    if (["fatherName", "village", "taluk", "calling"].includes(key) && Object.hasOwnProperty.call(formDataCopy, key)) {
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
          clearErrors(key);
          setTimeout(() => {
            element?.setSelectionRange(start, end);
          }, 0);
        }
      }
    }
    if (["age"].includes(key) && Object.hasOwnProperty.call(formDataCopy, key)) {
      const oldValue = formDataCopy[key];
      let value = oldValue;
      if (typeof value === "string") {
        let updatedValue = formatAge(value);
        if (updatedValue !== oldValue) {
          const element = document.querySelector(`[name="${key}"]`);
          const start = element?.selectionStart;
          const end = element?.selectionEnd;
          setValue(key, updatedValue);
          clearErrors("age");
          setTimeout(() => {
            element?.setSelectionRange(start, end);
          }, 0);
        }
      }
    }
  }
};
