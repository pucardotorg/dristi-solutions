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

export const _getCreatePleaPayload = (caseDetails, formData, tenantId) => {
  const payload = {
    digitalizedDocument: {
      tenantId: tenantId,
      type: "PLEA",
      caseId: caseDetails?.id,
      caseFilingNumber: caseDetails?.filingNumber,
      pleaDetails: {
        accusedName: formData?.accusedDetails?.code,
        accusedUniqueId: formData?.accusedDetails?.uniqueId,
        fatherName: formData?.fatherName,
        village: formData?.village,
        taluk: formData?.taluk,
        caste: formData?.caste,
        calling: formData?.calling,
        religion: formData?.religion,
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

export const _getUploadPleaPayload = (t, pleaDetails, formData, tenantId, action, fileStoreId) => {
  let payload = {};
  if (action !== pleaWorkflowActions.SAVEDRAFT) {
    const documents = Array.isArray(pleaDetails?.documents) ? pleaDetails.documents : [];
    const documentsFile = fileStoreId
      ? [
          {
            fileStore: fileStoreId,
            documentType: action === pleaWorkflowActions.UPLOAD ? "SIGNED" : "UNSIGNED",
            additionalDetails: { name: `${t(`Plea (${pleaDetails?.pleaDetails?.accusedName})`)}.pdf` },
            tenantId,
          },
        ]
      : null;

    payload = {
      bail: {
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
          caste: formData?.caste,
          calling: formData?.calling,
          religion: formData?.religion,
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
