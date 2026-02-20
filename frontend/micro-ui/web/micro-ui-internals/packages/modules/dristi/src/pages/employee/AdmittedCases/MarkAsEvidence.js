import React, { useEffect, useState, useMemo } from "react";
import Modal from "../../../components/Modal";
import { Dropdown, Loader, CloseSvg, TextInput, LabelFieldPair, CardLabel } from "@egovernments/digit-ui-react-components";
import { DRISTIService } from "../../../services";
import SuccessBannerModal from "../../../../../submissions/src/components/SuccessBannerModal";
import { MarkAsEvidenceAction } from "../../../Utils/submissionWorkflow";
import { getFullName } from "../../../../../cases/src/utils/joinCaseUtils";
import { Urls } from "../../../hooks";
import { useHistory } from "react-router-dom";
import { InfoCard } from "@egovernments/digit-ui-components";
import { sanitizeData } from "../../../Utils";
import { getFormattedName } from "@egovernments/digit-ui-module-orders/src/utils";
import axiosInstance from "@egovernments/digit-ui-module-core/src/Utils/axiosInstance";

// Helper functions for button labels and actions
const getButtonLabels = (isJudge, evidenceDetails, currentDiaryEntry = false, t) => {
  return {
    // Primary action button label
    saveLabel: isJudge
      ? evidenceDetails?.isEvidence || evidenceDetails?.evidenceMarkedStatus === "COMPLETED"
        ? currentDiaryEntry
          ? t("CORE_COMMON_SAVE")
          : false
        : t("CS_ESIGN")
      : evidenceDetails?.evidenceMarkedStatus === "DRAFT_IN_PROGRESS"
      ? t("SEND_FOR_SIGN")
      : ((evidenceDetails?.isEvidence || evidenceDetails?.evidenceMarkedStatus === "COMPLETED") && currentDiaryEntry) ||
        evidenceDetails?.evidenceMarkedStatus === "PENDING_BULK_E-SIGN"
      ? t("CORE_COMMON_SAVE")
      : false,

    // Custom action button label (only shown conditionally)
    customLabel: isJudge && evidenceDetails?.evidenceMarkedStatus === "DRAFT_IN_PROGRESS" ? t("SEND_FOR_SIGN") : false,

    // Cancel/back button label
    cancelLabel:
      evidenceDetails?.evidenceMarkedStatus === "DRAFT_IN_PROGRESS" ||
      (evidenceDetails?.evidenceMarkedStatus === null && !evidenceDetails?.isEvidence)
        ? t("CS_BULK_BACK")
        : evidenceDetails?.isEvidence || evidenceDetails?.evidenceMarkedStatus === "COMPLETED"
        ? currentDiaryEntry && t("CS_BULK_CANCEL")
        : t("EDIT_DETAILS"),
  };
};

const handleUpdateBusinessOfDayEntry = async (evidenceDetails, currentDiaryEntry, businessOfTheDay, history) => {
  try {
    await DRISTIService.aDiaryEntryUpdate(
      {
        diaryEntry: {
          ...currentDiaryEntry,
          businessOfDay: businessOfTheDay,
        },
      },
      {}
    ).then(async () => {
      history.goBack();
    });
  } catch (error) {
    console.error("error: ", error);
  }
};
// Helper function to get button actions
const getButtonActions = (
  isJudge,
  handleSubmit,
  onESignClick,
  handleCancel,
  markAsEvidenceAction,
  handleUpdateBusinessOfDayEntry,
  evidenceDetails,
  currentDiaryEntry,
  businessOfDay,
  history
) => {
  return {
    // Primary action handler
    saveAction: () => {
      if ((evidenceDetails?.isEvidence || evidenceDetails?.evidenceMarkedStatus === "COMPLETED") && currentDiaryEntry) {
        return handleUpdateBusinessOfDayEntry(evidenceDetails, currentDiaryEntry, businessOfDay, history);
      }
      if (evidenceDetails?.evidenceMarkedStatus === "PENDING_BULK_E-SIGN" && !isJudge) {
        return handleSubmit();
      }
      return isJudge ? onESignClick() : handleSubmit(isJudge ? "" : markAsEvidenceAction?.BULKSIGN);
    },

    // Custom action handler
    customAction: () => handleSubmit(markAsEvidenceAction?.BULKSIGN),

    // Cancel action handler
    cancelAction: handleCancel,
  };
};

// Function to clear evidence session data after process completion
export const clearEvidenceSessionData = () => {
  sessionStorage.removeItem("esignProcess");
  sessionStorage.removeItem("markAsEvidenceStepper");
  sessionStorage.removeItem("markAsEvidenceSelectedItem");
  sessionStorage.removeItem("signStatus");
  sessionStorage.removeItem("bulkMarkAsEvidenceLimit");
  sessionStorage.removeItem("bulkMarkAsEvidenceOffset");
  sessionStorage.removeItem("homeActiveTab");
  sessionStorage.removeItem("bulkMarkAsEvidenceSignCaseTitle");
  sessionStorage.removeItem("homeActiveTab");
};

const Heading = (props) => {
  return <h1 className="heading-m">{props.label}</h1>;
};

const CloseBtn = (props) => {
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

const MarkAsEvidence = ({
  t,
  isEvidenceLoading = false,
  setShowMakeAsEvidenceModal,
  selectedRow,
  showToast,
  paginatedData,
  evidenceDetailsObj,
  setDocumentCounter = (e) => {},
}) => {
  const [loader, setLoader] = useState(false); // Loader state for API calls
  const [stepper, setStepper] = useState(0);
  const courtId = localStorage.getItem("courtId");
  const userInfo = Digit.UserService.getUser()?.info;
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo?.type]);
  const roles = useMemo(() => userInfo?.roles, [userInfo]);
  const isJudge = useMemo(() => roles?.some((role) => role.code === "JUDGE_ROLE"), [roles]);
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const [evidenceDetails, setEvidenceDetails] = useState(evidenceDetailsObj || {});
  const [caseDetails, setCaseDetails] = useState({});
  const [businessOfDay, setBusinessOfDay] = useState("");
  const [evidenceNumber, setEvidenceNumber] = useState("");
  const [evidenceNumberError, setEvidenceNumberError] = useState("");
  const [sealFileStoreId, setSealFileStoreId] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [witnessTagValues, setWitnessTagValues] = useState([]);
  const name = "Signature";
  const pageModule = "en";
  const accessToken = window.localStorage.getItem("token");
  const history = useHistory();
  const currentDiaryEntry = history.location?.state?.diaryEntry;
  const [witnessTag, setWitnessTag] = useState(null);
  const [evidenceTag, setEvidenceTag] = useState({ tagLabel: "", value: "" });
  const [taggedEvidenceNumber, setTaggedEvidenceNumber] = useState("");
  const mockESignEnabled = window?.globalConfigs?.getConfig("mockESignEnabled") === "true" ? true : false;

  const isFormValid = useMemo(() => {
    return witnessTag !== null && evidenceNumber?.trim().length > 0;
  }, [witnessTag, evidenceNumber]);
  const filingNumber = useMemo(() => {
    if (evidenceDetailsObj?.filingNumber) {
      return evidenceDetailsObj?.filingNumber;
    }
    const sessionData = JSON.parse(sessionStorage.getItem("markAsEvidenceSelectedItem"));
    return sessionData?.filingNumber;
  }, [evidenceDetailsObj?.filingNumber]);
  const artifactNumber = useMemo(() => {
    if (evidenceDetailsObj?.artifactNumber) {
      return evidenceDetailsObj?.artifactNumber;
    }
    const sessionData = JSON.parse(sessionStorage.getItem("markAsEvidenceSelectedItem"));
    return sessionData?.artifactNumber || evidenceDetailsObj?.artifactNumber;
  }, [evidenceDetailsObj?.artifactNumber]);
  const { handleEsign, checkSignStatus } = Digit.Hooks.orders.useESign();
  const [isSigned, setIsSigned] = useState(false);

  const [formData, setFormData] = useState({});
  const onSelect = (key, value) => {
    if (value?.Signature === null) {
      setFormData({});
      setIsSigned(false);
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [key]: value,
      }));
    }
  };

  const { data: EvidenceNumberFormat, isLoading } = Digit.Hooks.useCommonMDMS(Digit.ULBService.getStateId(), "Evidence", ["Tag"], {
    select: (data) => {
      return { data: data?.Evidence?.Tag };
    },
    retry: false,
  });

  const memoEvidenceValues = useMemo(() => {
    return {
      title: evidenceDetails?.additionalDetails?.formdata?.documentTitle || evidenceDetails?.artifactType,
      artifactNumber: evidenceDetails?.artifactNumber,
      sourceType: evidenceDetails?.sourceType,
      owner: evidenceDetails?.owner,
    };
  }, [evidenceDetails]);

  const evitanceTagOptions = useMemo(() => {
    return (
      EvidenceNumberFormat?.data?.map((item) => {
        return {
          tagLabel: item?.evidenceTag,
          value: item?.evidenceTag,
        };
      }) || []
    );
  }, [EvidenceNumberFormat]);

  useEffect(() => {
    const tag = EvidenceNumberFormat?.data?.find((item) => item?.sourceType === evidenceDetails?.sourceType)?.evidenceTag;
    if (tag && tag !== evidenceTag?.value) {
      setEvidenceTag({ tagLabel: tag, value: tag });
    }
  }, [EvidenceNumberFormat, evidenceDetails]); // evidence?.value dependency is excluded on purpose, DO NOT ADD IT..

  const disableEvidenceTagDropDown = useMemo(() => {
    return ["ACCUSED", "COMPLAINANT"]?.includes(evidenceDetails?.sourceType);
  }, [evidenceDetails?.sourceType]);

  const onDocumentUpload = async (fileData, filename) => {
    try {
      const fileUploadRes = await Digit.UploadServices.Filestorage("DRISTI", fileData, Digit.ULBService.getCurrentTenantId());
      return { file: fileUploadRes?.data, fileType: fileData.type, filename };
    } catch (error) {
      console.error("Failed to upload document:", error);
      throw error; // or handle error appropriately
    }
  };

  // Commented out unused hook
  // const { downloadFilesAsZip } = Digit.Hooks.dristi.useDownloadFiles();
  // const downloadFiles = async () => {
  //   try {
  //     const response = await downloadFilesAsZip(
  //       tenantId,
  //       [
  //         { fileStoreId: "c694ddb7-414f-43f2-9f96-e49ceca67a67", fileName: "Document1" },
  //         { fileStoreId: "33bd7436-c10b-4ede-b93a-1dc05256560e", fileName: "Document2" },
  //       ],
  //       "MyArchive"
  //     );
  //   } catch (error) {
  //     console.error("Error downloading files:", error);
  //   }
  // };
  // downloadFiles();
  const getMarkAsEvidencePdf = async () => {
    try {
      const response = await axiosInstance.post(
        Urls.dristi.getMarkAsEvidencePdf,
        {
          RequestInfo: {
            authToken: accessToken,
            userInfo: userInfo,
            msgId: `${Date.now()}|${Digit.StoreData.getCurrentLanguage()}`,
            apiId: "Dristi",
          },
          Evidence: {
            courtId: courtId,
            markedAs: `${taggedEvidenceNumber || `${evidenceTag?.value}${evidenceNumber}`}`,
            caseNumber:
              (caseDetails?.isLPRCase ? caseDetails?.lprNumber : caseDetails?.courtCaseNumber) ||
              caseDetails?.courtCaseNumber ||
              caseDetails?.cmpNumber ||
              caseDetails?.filingNumber,
            markedThrough: witnessTag?.code,
          },
        },
        {
          params: {
            tenantId,
            qrCode: false,
            evidencePdfType: "evidence-seal",
          },
          responseType: "blob",
        }
      );

      const contentDisposition = response.headers["content-disposition"];
      const filename = contentDisposition ? contentDisposition.split("filename=")[1]?.replace(/['"]/g, "") : "marked_as_evidence_seal.pdf";

      const pdfFile = new File([response?.data], filename, { type: "application/pdf" });
      try {
        const document = await onDocumentUpload(pdfFile, pdfFile?.name);
        const fileStoreId = document?.file?.files?.[0]?.fileStoreId;
        setSealFileStoreId(fileStoreId);
        return fileStoreId;
      } catch (error) {
        throw error;
      }
    } catch (error) {
      console.error("Error creating PDF seal:", error);
      showToast("error", t("ERROR_CREATING_EVIDENCE_SEAL"), 5000);
      return null;
    }
  };

  const uploadModalConfig = useMemo(() => {
    return {
      key: "uploadSignature",
      populators: {
        inputs: [
          {
            name,
            type: "DragDropComponent",
            uploadGuidelines: "Ensure the image is not blurry and under 5MB.",
            maxFileSize: 10,
            maxFileErrorMessage: "CS_FILE_LIMIT_10_MB",
            fileTypes: ["JPG", "PNG", "JPEG", "PDF"],
            isMultipleUpload: false,
          },
        ],
        validation: {},
      },
    };
  }, [name]);

  const getCustomEvidenceNumber = (evidenceNumber, filingNumber) => {
    try {
      if (typeof evidenceNumber !== "string" || typeof filingNumber !== "string") {
        throw new Error("Both evidenceNumber and filingNumber must be strings");
      }

      if (evidenceNumber.length > 1) {
        if (filingNumber && evidenceNumber.startsWith(filingNumber) && evidenceNumber.length > filingNumber.length + 2) {
          return evidenceNumber.slice(filingNumber.length + 2).trim();
        } else {
          return evidenceNumber.slice(1);
        }
      }

      return evidenceNumber;
    } catch (error) {
      console.error("Error getting custom evidence number:", error);
      return null;
    }
  };

  const getCustomTaggedEvidenceNumber = (evidenceNumber, filingNumber) => {
    try {
      if (typeof evidenceNumber !== "string" || typeof filingNumber !== "string") {
        throw new Error("Both evidenceNumber and filingNumber must be strings");
      }

      if (evidenceNumber.length > 1) {
        if (filingNumber && evidenceNumber.startsWith(filingNumber) && evidenceNumber.length > filingNumber.length + 2) {
          return evidenceNumber.slice(filingNumber.length + 1).trim();
        } else {
          return evidenceNumber;
        }
      }

      return evidenceNumber;
    } catch (error) {
      console.error("Error getting custom evidence number:", error);
      return null;
    }
  };

  const getEvidenceDetails = async () => {
    try {
      setLoader(true);
      const response = await DRISTIService.searchEvidence(
        {
          criteria: {
            courtId: courtId,
            filingNumber: filingNumber,
            artifactNumber: artifactNumber,
            tenantId,
          },

          tenantId,
        },
        {}
      );
      // const customEvidenceNumber =
      //   response?.artifacts?.[0]?.evidenceNumber?.length > 1
      //     ? response?.artifacts?.[0]?.evidenceNumber?.slice(1)
      //     : response?.artifacts?.[0]?.evidenceNumber;
      const customEvidenceNumber = getCustomEvidenceNumber(response?.artifacts?.[0]?.evidenceNumber, response?.artifacts?.[0]?.filingNumber);
      setStepper(response?.artifacts?.[0]?.evidenceMarkedStatus === null ? 0 : 1);
      setEvidenceNumber(customEvidenceNumber);
      setEvidenceDetails(response?.artifacts?.[0]);

      // Set businessOfDay from additionalDetails if available
      if (response?.artifacts?.[0]?.additionalDetails?.botd) {
        setBusinessOfDay(response?.artifacts?.[0]?.additionalDetails?.botd);
      }

      // Set ownerName from additionalDetails if available
      if (response?.artifacts?.[0]?.additionalDetails?.ownerName) {
        setOwnerName(response?.artifacts?.[0]?.additionalDetails?.ownerName);
      } else if (response?.artifacts?.[0]?.owner) {
        setOwnerName(response?.artifacts?.[0]?.owner);
      } else if (response?.artifacts?.[0]?.sourceID) {
        // If owner name is missing, get it from individual details
        getIndividualDetails(response?.artifacts?.[0]?.sourceID);
      }
    } catch (error) {
      showToast("error", t("ERROR_FETCHING_EVIDENCE_DETAILS"), 5000);
    } finally {
      setLoader(false);
    }
  };
  const getCaseDetails = async () => {
    try {
      setLoader(true);
      const response = await DRISTIService.searchCaseService(
        {
          criteria: [
            {
              filingNumber: filingNumber,
              ...(courtId && userType === "employee" && { courtId }),
            },
          ],
          tenantId,
        },
        {}
      );
      // Check if tag ends with a number
      const hasNumberSuffix = (tag) => {
        if (!tag || !tag.trim()) return false;
        return /\d+$/.test(tag);
      };
      const witnessList = response?.criteria[0]?.responseList[0]?.witnessDetails?.map((witness) => {
        const data = witness || {};
        return data?.witnessTag && hasNumberSuffix(data?.witnessTag)
          ? {
              witnessTag: data.witnessTag || "",
              firstName: data.firstName || "",
              lastName: data.lastName || "",
              middleName: data.middleName || "",
              fullName: getFormattedName(data?.firstName, data?.middleName, data?.lastName, data?.witnessDesignation, null), //here
              code: data.witnessTag,
              displayName:
                data?.witnessTag + " (" + getFormattedName(data?.firstName, data?.middleName, data?.lastName, data?.witnessDesignation, null) + ")",
            }
          : null;
      });
      const LitigantList = (response?.criteria?.[0]?.responseList?.[0]?.litigants || [])?.map((litigant) => {
        const data = litigant?.additionalDetails?.tag || null;
        return data && hasNumberSuffix(data)
          ? {
              witnessTag: data || "",
              fullName: litigant?.additionalDetails?.fullName,
              code: data,
              displayName: data + " (" + litigant?.additionalDetails?.fullName + ")",
            }
          : null;
      });
      const advList = (response?.criteria?.[0]?.responseList?.[0]?.representatives || [])?.map((adv) => {
        const data = adv?.additionalDetails?.tag || null;
        return data && hasNumberSuffix(data)
          ? {
              witnessTag: data || "",
              fullName: adv?.additionalDetails?.advocateName,
              code: data,
              displayName: data + " (" + adv?.additionalDetails?.advocateName + ")",
            }
          : null;
      });
      const poaList = (response?.criteria?.[0]?.responseList?.[0]?.poaHolders || [])?.map((poa) => {
        const data = poa?.additionalDetails?.tag || null;
        return data && hasNumberSuffix(data)
          ? {
              witnessTag: data || "",
              fullName: poa?.name,
              code: data,
              displayName: data + " (" + poa?.name + ")",
            }
          : null;
      });
      const combined = [...(witnessList || []), ...(LitigantList || []), ...(advList || []), ...(poaList || [])];
      const sessionData = JSON.parse(sessionStorage.getItem("markAsEvidenceSelectedItem"));

      const evidenceTag = evidenceDetails?.tag || sessionData?.tag;
      const isDeletedDraft = evidenceDetails?.evidenceMarkedStatus === "DELETED_DRAFT" || sessionData?.evidenceMarkedStatus === "DELETED_DRAFT";

      if (evidenceTag && !isDeletedDraft) {
        setWitnessTag(combined?.find((user) => user?.code === evidenceTag));
      } else {
        setWitnessTag(null);
      }
      if (evidenceDetails?.isEvidence && !evidenceDetails?.additionalDetails?.botd) {
        getAdiaryEntries(response?.criteria[0]?.responseList[0]?.cmpNumber || filingNumber);
      }
      setWitnessTagValues(combined?.filter(Boolean));
      setCaseDetails(response?.criteria[0]?.responseList[0]);
    } catch (error) {
      showToast("error", t("ERROR_FETCHING_CASE_DETAILS"), 5000);
    } finally {
      setLoader(false);
    }
  };
  const getIndividualDetails = async (sourceId) => {
    try {
      setLoader(true);
      const individualResponse = await DRISTIService.searchIndividualUser(
        {
          Individual: {
            individualId: sourceId,
          },
        },
        { tenantId, limit: 1000, offset: 0 }
      );
      const individualData = individualResponse?.Individual?.[0];
      const fullName = getFullName(" ", individualData?.name?.givenName, individualData?.name?.otherNames, individualData?.name?.familyName);
      setOwnerName(fullName);

      // Store owner name in additionalDetails to avoid repeated API calls
      if (fullName && evidenceDetails?.id) {
        const updatedEvidenceDetails = {
          ...evidenceDetails,
          additionalDetails: {
            ...(evidenceDetails?.additionalDetails || {}),
            ownerName: fullName,
          },
        };
        setEvidenceDetails(updatedEvidenceDetails);

        // Update the evidence with owner name in additionalDetails
        await DRISTIService.updateEvidence({ artifact: updatedEvidenceDetails }, {});
      }
    } catch (error) {
      console.error("Error fetching individual details:", error);
    } finally {
      setLoader(false);
    }
  };
  const getAdiaryEntries = async (caseNumber) => {
    try {
      setLoader(true);
      const adiaryResponse = await DRISTIService.aDiaryEntrySearch(
        {
          criteria: {
            tenantId: tenantId,
            courtId: courtId,
            caseId: caseNumber || caseDetails?.cmpNumber || filingNumber,
            referenceId: artifactNumber,
          },
          pagination: {
            limit: 10,
            offSet: 0,
          },
        },
        { tenantId }
      );
      if (!businessOfDay || businessOfDay === "" || businessOfDay === null) {
        setBusinessOfDay(adiaryResponse?.entries?.[0]?.businessOfDay);
      }
    } catch (error) {
      console.error("Error fetching adiary entries:", error);
    } finally {
      setLoader(false);
    }
  };
  useEffect(() => {
    if (!evidenceDetailsObj && !sessionStorage.getItem("markAsEvidenceSelectedItem")) {
      getEvidenceDetails();
    } else if (sessionStorage.getItem("markAsEvidenceSelectedItem")) {
      const sessionData = JSON.parse(sessionStorage.getItem("markAsEvidenceSelectedItem"));
      setEvidenceDetails(sessionData);

      // Set evidence details from session storage
      if (sessionData?.evidenceNumber) {
        // const customEvidenceNumber = sessionData.evidenceNumber.length > 1 ? sessionData.evidenceNumber.slice(1) : sessionData.evidenceNumber;
        const customEvidenceNumber = getCustomEvidenceNumber(sessionData.evidenceNumber, sessionData?.filingNumber);

        setEvidenceNumber(customEvidenceNumber);
        const customTaggedEvidenceNumber = getCustomTaggedEvidenceNumber(evidenceDetailsObj?.evidenceNumber, evidenceDetailsObj?.filingNumber);
        setTaggedEvidenceNumber(customTaggedEvidenceNumber);
      }

      // Set business of day from session storage
      if (sessionData?.additionalDetails?.botd) {
        setBusinessOfDay(sessionData.additionalDetails.botd);
      }

      // Set owner name from session storage
      if (sessionData?.additionalDetails?.ownerName) {
        setOwnerName(sessionData.additionalDetails.ownerName);
      } else if (sessionData?.owner) {
        setOwnerName(sessionData.owner);
      }

      // Set stepper from session storage if available
      if (sessionStorage.getItem("markAsEvidenceStepper")) {
        setStepper(parseInt(sessionStorage.getItem("markAsEvidenceStepper")));
      } else {
        setStepper(sessionData?.evidenceMarkedStatus === null ? 0 : 1);
      }
    } else {
      // Handle from props
      if (evidenceDetailsObj) {
        // Check for owner name in additionalDetails first, then check regular owner, finally fetch if needed
        if (evidenceDetailsObj?.additionalDetails?.ownerName) {
          setOwnerName(evidenceDetailsObj.additionalDetails.ownerName);
        } else if (evidenceDetailsObj?.owner) {
          setOwnerName(evidenceDetailsObj.owner);
        } else if (evidenceDetailsObj?.sourceID) {
          getIndividualDetails(evidenceDetailsObj.sourceID);
        }

        // Set stepper based on evidence status
        setStepper(evidenceDetailsObj?.evidenceNumber === null ? 0 : 1);

        // Set evidence number
        // const customEvidenceNumber =
        //   evidenceDetailsObj?.evidenceNumber?.length > 1 ? evidenceDetailsObj.evidenceNumber.slice(1) : evidenceDetailsObj.evidenceNumber;
        const customEvidenceNumber = getCustomEvidenceNumber(evidenceDetailsObj?.evidenceNumber, evidenceDetailsObj?.filingNumber);

        setEvidenceNumber(customEvidenceNumber);
        const customTaggedEvidenceNumber = getCustomTaggedEvidenceNumber(evidenceDetailsObj?.evidenceNumber, evidenceDetailsObj?.filingNumber);
        setTaggedEvidenceNumber(customTaggedEvidenceNumber);

        // Set business of day from props
        setBusinessOfDay(evidenceDetailsObj?.additionalDetails?.botd || null);
      }
    }
    // Get case details if filing number is available
    if (filingNumber) {
      getCaseDetails();
    }
  }, [filingNumber, courtId, userType, tenantId, artifactNumber, evidenceDetailsObj, t]);
  useEffect(() => {
    checkSignStatus(name, formData, uploadModalConfig, onSelect, setIsSigned);
  }, [checkSignStatus, name, formData, uploadModalConfig, setIsSigned]);

  const handleMarkEvidence = async (action, seal = null, isEvidence = false, markedOverride = null) => {
    try {
      const markedPart = markedOverride || `${evidenceTag?.value}${evidenceNumber}`;
      const payload = {
        ...evidenceDetails,
        evidenceNumber: `${filingNumber}-${markedPart}`,
        isEvidenceMarkedFlow: action ? true : false,
        tag: witnessTag?.code,
        isEvidence: isEvidence,
        additionalDetails: {
          ...evidenceDetails?.additionalDetails,
          botd: businessOfDay || `Document marked as evidence exhibit number ${markedPart}`,
          ownerName: ownerName,
        },
        ...(seal !== null && { seal }),
        workflow: {
          action: action,
        },
      };
      await DRISTIService.updateEvidence({ artifact: payload }, {}).then((res) => {
        setEvidenceDetails(res?.artifact);
      });
      setEvidenceNumberError("");
      return true;
    } catch (error) {
      if (error?.response?.data?.Errors?.[0]?.code === "EVIDENCE_NUMBER_EXISTS_EXCEPTION") {
        setEvidenceNumberError(error?.response?.data?.Errors?.[0]?.code);
        setStepper(0);
      } else showToast("error", t("EVIDENCE_UPDATE_ERROR_MESSAGE"), 5000);
      return false;
    }
  };

  const handleSubmit = async (action) => {
    try {
      setLoader(true);
      if (stepper === 0) {
        clearEvidenceSessionData();
        const nextTagged = `${evidenceTag?.value}${evidenceNumber}`;
        setBusinessOfDay(`Document marked as evidence exhibit number ${nextTagged}`);
        setTaggedEvidenceNumber(nextTagged);

        const nextAction =
          evidenceDetails?.evidenceMarkedStatus === null
            ? MarkAsEvidenceAction?.CREATE
            : evidenceDetails?.evidenceMarkedStatus === "DELETED_DRAFT"
            ? MarkAsEvidenceAction.RECREATE
            : MarkAsEvidenceAction?.SAVEDRAFT;
        await handleMarkEvidence(nextAction, null, false, nextTagged).then((res) => {
          if (res) {
            setStepper(1);
          }
        });
      } else if (stepper === 1 && !isSigned) {
        let fileStoreId = evidenceDetails?.seal?.fileStore;
        if (action) {
          fileStoreId = await getMarkAsEvidencePdf();
        }
        if (fileStoreId && action !== null) {
          const seal = {
            documentType: "unsignedSeal",
            fileStore: fileStoreId,
            additionalDetails: {
              documentName: "markAsEvidence.pdf",
            },
          };

          await handleMarkEvidence(action, seal).then((res) => {
            if (res && action === "EDIT") {
              setStepper(0);
            }
            if (res && action === "SUBMIT_BULK_E-SIGN") {
              setShowMakeAsEvidenceModal(false);
              setDocumentCounter((prevCount) => prevCount + 1);
              showToast("success", t("SUCCESSFULLY_SENT_FOR_E-SIGNING_MARKED_MESSAGE"), 5000);
            }
          });
        }
      } else if (stepper === 1 && isSigned) {
        if (!mockESignEnabled && sessionStorage.getItem("fileStoreId") === null) {
          showToast("error", t("EVIDENCE_UPDATE_ERROR_MESSAGE"), 5000);
          return;
        }
        let fileStore = "";
        if (mockESignEnabled) {
          fileStore = sealFileStoreId;
        } else {
          fileStore = sessionStorage.getItem("fileStoreId");
        }
        const seal = {
          documentType: "SIGNED",
          fileStore: fileStore,
          additionalDetails: {
            documentName: "markAsEvidenceSigned.pdf",
          },
        };
        await handleMarkEvidence(action, seal, true).then(async (res) => {
          if (res) {
            const response = await Digit.HearingService.searchHearings(
              {
                criteria: {
                  tenantId: Digit.ULBService.getCurrentTenantId(),
                  filingNumber: filingNumber,
                  ...(courtId && { courtId: courtId }),
                },
              },
              {}
            );
            const nextHearing = response?.HearingList?.filter((hearing) => hearing.status === "SCHEDULED");
            await DRISTIService.addADiaryEntry(
              {
                diaryEntry: {
                  courtId: courtId,
                  businessOfDay: businessOfDay,
                  tenantId: tenantId,
                  entryDate: new Date().setHours(0, 0, 0, 0),
                  caseNumber:
                    (caseDetails?.isLPRCase ? caseDetails?.lprNumber : caseDetails?.courtCaseNumber) ||
                    caseDetails?.courtCaseNumber ||
                    caseDetails?.cmpNumber ||
                    caseDetails?.filingNumber,
                  referenceId: artifactNumber,
                  referenceType: "Documents",
                  hearingDate: (Array.isArray(nextHearing) && nextHearing.length > 0 && nextHearing[0]?.startTime) || null,
                  additionalDetails: {
                    filingNumber: filingNumber,
                    caseId: caseDetails?.id,
                  },
                },
              },
              {}
            ).catch((error) => {
              console.error("error: ", error);
            });
            setStepper(2);

            clearEvidenceSessionData();
            sessionStorage.removeItem("fileStoreId");
          } else {
            setStepper(1);
            setIsSigned(false);
            setFormData({});
          }
        });
      }
    } catch (error) {
      showToast("error", t("EVIDENCE_UPDATE_ERROR_MESSAGE"), 5000);
    } finally {
      setLoader(false);
    }
  };

  const handleCancel = async () => {
    try {
      clearEvidenceSessionData();
      if (currentDiaryEntry) {
        history.goBack();
      }
      if (stepper === 0) {
        setShowMakeAsEvidenceModal(false);
        setDocumentCounter((prevCount) => prevCount + 1);
      } else if (stepper === 1) {
        if (isSigned) {
          setIsSigned(false);
          setFormData({});
        }
        if (evidenceDetails?.evidenceMarkedStatus === "DRAFT_IN_PROGRESS" || evidenceDetails?.evidenceMarkedStatus === null) {
          setStepper(0);
        } else if (
          (!evidenceDetails?.isEvidence || evidenceDetails?.evidenceMarkedStatus !== "COMPLETED") &&
          evidenceDetails?.evidenceMarkedStatus !== "DRAFT_IN_PROGRESS"
        ) {
          await handleMarkEvidence(MarkAsEvidenceAction?.EDIT).then((res) => {
            if (res) {
              setStepper(0);
            }
          });
        } else {
          setShowMakeAsEvidenceModal(false);
          setDocumentCounter((prevCount) => prevCount + 1);
        }
      }
    } catch (error) {
      console.error("Error in handleCancel:", error);
    }
  };

  const onESignClick = async () => {
    try {
      setLoader(true);
      let file = sealFileStoreId;
      if (!sealFileStoreId) {
        file = await getMarkAsEvidencePdf();
        if (!file) {
          throw new Error("Failed to generate PDF file store ID");
        }
      }

      if (mockESignEnabled) {
        setIsSigned(true);
        setLoader(false);
        return;
      }

      const updatedEvidenceDetails = {
        ...evidenceDetails,
        additionalDetails: {
          ...(evidenceDetails?.additionalDetails || {}),
          botd: businessOfDay,
        },
      };

      sessionStorage.setItem("markAsEvidenceStepper", stepper);
      sessionStorage.setItem("markAsEvidenceSelectedItem", JSON.stringify(updatedEvidenceDetails));
      sessionStorage.setItem("homeActiveTab", "BULK_EVIDENCE_SIGN");
      if (paginatedData?.limit) sessionStorage.setItem("bulkMarkAsEvidenceLimit", paginatedData?.limit);
      if (paginatedData?.caseTitle) sessionStorage.setItem("bulkMarkAsEvidenceSignCaseTitle", paginatedData?.caseTitle);
      if (paginatedData?.offset) sessionStorage.setItem("bulkMarkAsEvidenceOffset", paginatedData?.offset);

      sessionStorage.removeItem("fileStoreId");
      handleEsign(name, pageModule, file, "Judge/Magistrate");
    } catch (error) {
      showToast("error", t("ERROR_ESIGN_EVIDENCE"), 5000);
      setLoader(false);
    } finally {
      setLoader(false);
    }
  };

  if (isLoading) return <Loader />;

  return (
    <React.Fragment>
      {loader && (
        <div
          style={{
            width: "100vw",
            height: "100vh",
            zIndex: "10001",
            position: "fixed",
            right: "0",
            display: "flex",
            top: "0",
            background: "rgb(234 234 245 / 50%)",
            alignItems: "center",
            justifyContent: "center",
          }}
          className="submit-loader"
        >
          <Loader />
        </div>
      )}
      {stepper === 0 && (
        <Modal
          headerBarEnd={<CloseBtn onClick={() => (isEvidenceLoading ? null : handleCancel())} />}
          actionSaveLabel={t("CS_PROCEED")}
          actionSaveOnSubmit={handleSubmit}
          actionCancelLabel={t("CS_COMMON_CANCEL")}
          isBackButtonDisabled={isEvidenceLoading}
          isDisabled={isEvidenceLoading || !isFormValid}
          actionCancelOnSubmit={handleCancel}
          formId="modal-action"
          headerBarMain={<Heading label={t("ACTIONS_MARK_EVIDENCE_TEXT")} />}
          className="mark-evidence-modal"
          submitTextClassName="upload-signature-button"
          popupModuleMianClassName="mark-evidence-modal-main"
          popupModuleActionBarStyles={{ padding: "16px" }}
        >
          <div
            className="mark-evidence-modal-body"
            style={{ display: "flex", flexDirection: "column", padding: 24, borderBottom: "1px solid #E8E8E8", gap: "24px" }}
          >
            <LabelFieldPair>
              <CardLabel className="case-input-label">{t("DOCUMENT_TITLE")}</CardLabel>
              <TextInput
                className="disabled text-input"
                type="text"
                value={t(memoEvidenceValues?.title)}
                disabled
                style={{ minWidth: 120, textAlign: "start", marginBottom: "0px", color: "black" }}
              />
            </LabelFieldPair>
            <LabelFieldPair>
              <CardLabel className="case-input-label">{t("UPLOADED_BY")}</CardLabel>
              <TextInput
                className="disabled text-input"
                type="text"
                value={evidenceDetails?.sourceType === "COURT" ? t("COURT") : memoEvidenceValues?.owner || ownerName}
                disabled
                style={{ minWidth: 120, textAlign: "start", marginBottom: "0px" }}
              />
            </LabelFieldPair>

            <LabelFieldPair>
              <CardLabel className="case-input-label">{t("EVIDENCE_MARKED_THROUGH")}</CardLabel>
              <Dropdown
                t={t}
                placeholder={
                  Array?.isArray(witnessTagValues) && witnessTagValues?.length > 0 ? t("CS_WITNESS_DEPOSITION") : t("NO_WITNESS_DEPOSITION")
                }
                option={witnessTagValues ? witnessTagValues : []}
                selected={witnessTag}
                optionKey={"displayName"}
                select={(e) => {
                  setWitnessTag(e);
                }}
                disable={Array?.isArray(witnessTagValues) && witnessTagValues?.length > 0 ? false : true}
                topbarOptionsClassName={"top-bar-option"}
                style={{
                  marginBottom: "1px",
                  width: "100%",
                }}
              />
            </LabelFieldPair>
            <div>
              <LabelFieldPair>
                <CardLabel className="case-input-label">{t("EVIDENCE_NUMBER")}</CardLabel>
                <div style={{ display: "flex", gap: "10px" }}>
                  <Dropdown
                    t={t}
                    option={evitanceTagOptions}
                    selected={evidenceTag}
                    optionKey={"tagLabel"}
                    select={(e) => {
                      setEvidenceTag(e);
                    }}
                    disable={disableEvidenceTagDropDown}
                    topbarOptionsClassName={"top-bar-option"}
                    style={{
                      marginBottom: "1px",
                      width: "100%",
                    }}
                  />
                  <TextInput
                    className="text-input"
                    type="text"
                    value={evidenceNumber}
                    onChange={(e) => setEvidenceNumber(sanitizeData(e.target.value))}
                    maxlength={10}
                    style={{ textAlign: "start", marginBottom: "0px" }}
                  />
                </div>
                {evidenceNumberError && <div style={{ color: "red", fontSize: "12px", paddingTop: "5px" }}>{t(evidenceNumberError)}</div>}
              </LabelFieldPair>
            </div>
          </div>
        </Modal>
      )}

      {stepper === 1 && !isSigned && (
        <Modal
          headerBarEnd={
            <CloseBtn
              onClick={() => {
                clearEvidenceSessionData();
                if (currentDiaryEntry) {
                  history.goBack();
                }
                if (!isEvidenceLoading) {
                  setShowMakeAsEvidenceModal(false);
                  setDocumentCounter((prevCount) => prevCount + 1);
                }
              }}
            />
          }
          actionSaveLabel={getButtonLabels(isJudge, evidenceDetails, currentDiaryEntry, t).saveLabel}
          actionCustomLabelSubmit={
            getButtonActions(
              isJudge,
              handleSubmit,
              onESignClick,
              handleCancel,
              MarkAsEvidenceAction,
              handleUpdateBusinessOfDayEntry,
              evidenceDetails,
              currentDiaryEntry,
              businessOfDay,
              history
            ).customAction
          }
          actionCustomLabel={getButtonLabels(isJudge, evidenceDetails, currentDiaryEntry, t).customLabel}
          actionSaveOnSubmit={
            getButtonActions(
              isJudge,
              handleSubmit,
              onESignClick,
              handleCancel,
              MarkAsEvidenceAction,
              handleUpdateBusinessOfDayEntry,
              evidenceDetails,
              currentDiaryEntry,
              businessOfDay,
              history
            ).saveAction
          }
          actionCancelLabel={getButtonLabels(isJudge, evidenceDetails, currentDiaryEntry, t).cancelLabel}
          isBackButtonDisabled={isEvidenceLoading}
          isDisabled={isEvidenceLoading}
          actionCancelOnSubmit={
            getButtonActions(
              isJudge,
              handleSubmit,
              onESignClick,
              handleCancel,
              MarkAsEvidenceAction,
              handleUpdateBusinessOfDayEntry,
              evidenceDetails,
              currentDiaryEntry,
              businessOfDay,
              history
            ).cancelAction
          }
          formId="modal-action"
          customActionTextStyle={{ color: "#007e7e" }}
          customActionStyle={{ background: "transparent", border: "1px solid #007e7e" }}
          headerBarMain={
            <Heading
              label={
                evidenceDetails?.evidenceMarkedStatus === "DRAFT_IN_PROGRESS" || evidenceDetails?.evidenceMarkedStatus === null
                  ? t("CONFIRM_EVIDENCE_HEADER")
                  : t("EVIDENCE_DETAILS")
              }
            />
          }
          className="mark-evidence-modal"
          submitTextClassName="upload-signature-button"
          popupModuleMianClassName="mark-evidence-modal-main"
          popupModuleActionBarStyles={{ padding: "16px" }}
        >
          <div className="mark-evidence-modal-body">
            <div className="application-info" style={{ display: "flex", flexDirection: "column" }}>
              <div className="info-row" style={{ display: "flex" }}>
                <div className="info-key" style={{ width: "200px", minWidth: "200px" }}>
                  <h3>{t("DOCUMENT_TITLE")}</h3>
                </div>
                <div className="info-value" style={{ flex: 1, maxWidth: "300px", overflowY: "auto" }}>
                  <h3>{t(memoEvidenceValues?.title)}</h3>
                </div>
              </div>
              <div className="info-row" style={{ display: "flex" }}>
                <div className="info-key" style={{ width: "200px", minWidth: "200px" }}>
                  <h3>{t("UPLOADED_BY")}</h3>
                </div>
                <div className="info-value" style={{ flex: 1, maxWidth: "300px", overflowY: "auto" }}>
                  <h3>{evidenceDetails?.sourceType === "COURT" ? t("COURT") : memoEvidenceValues?.owner || ownerName}</h3>
                </div>
              </div>

              <div className="info-row" style={{ display: "flex" }}>
                <div className="info-key" style={{ width: "200px", minWidth: "200px" }}>
                  <h3>{t("EVIDENCE_MARKED_THROUGH")}</h3>
                </div>
                <div className="info-value" style={{ flex: 1, maxWidth: "300px", overflowY: "auto" }}>
                  <h3>{witnessTag?.displayName}</h3>
                </div>
              </div>
              <div className="info-row" style={{ display: "flex" }}>
                <div className="info-key" style={{ width: "200px", minWidth: "200px" }}>
                  <h3>{t("EVIDENCE_NUMBER")}</h3>
                </div>
                <div className="info-value" style={{ flex: 1, maxWidth: "300px", overflowY: "auto" }}>
                  <h3>{`${taggedEvidenceNumber}`}</h3>
                </div>
              </div>
            </div>
            <LabelFieldPair>
              <CardLabel className="case-input-label">{t("BUSINESS_OF_THE_DAY")}</CardLabel>
              <TextInput
                className={evidenceDetails?.isEvidence && !currentDiaryEntry ? "text-input disabled" : "text-input"}
                type="text"
                value={businessOfDay}
                onChange={(e) => setBusinessOfDay(sanitizeData(e.target.value))}
                disabled={evidenceDetails?.isEvidence && !currentDiaryEntry}
                style={{ minWidth: 120, textAlign: "start", marginBottom: "0px" }}
              />
            </LabelFieldPair>
          </div>
        </Modal>
      )}

      {stepper === 1 && isSigned && (
        <Modal
          headerBarMain={<Heading label={t("ADD_SIGNATURE")} />}
          headerBarEnd={<CloseBtn onClick={handleCancel} />}
          actionCancelLabel={t("CS_COMMON_BACK")}
          actionCancelOnSubmit={handleCancel}
          actionSaveLabel={t("SUBMIT_BUTTON")}
          actionSaveOnSubmit={() => handleSubmit(MarkAsEvidenceAction?.ESIGN)}
          className="add-signature-modal"
        >
          <div className="add-signature-main-div">
            <InfoCard
              variant={"default"}
              label={t("PLEASE_NOTE")}
              additionalElements={[
                <span key="note">{t("YOU_ARE_ADDING_YOUR_SIGNATURE_TO_THE")}</span>,
                <span style={{ fontWeight: "bold" }} key="note">
                  {t("EVIDENCE_HEADING")}
                </span>,
              ]}
              inline
              textStyle={{}}
              className={`custom-info-card`}
            />
            <div style={{ display: "flex", flexDirection: "row", gap: "16px" }}>
              <h1
                style={{
                  margin: 0,
                  fontFamily: "Roboto",
                  fontSize: "24px",
                  fontWeight: 700,
                  lineHeight: "28.13px",
                  textAlign: "left",
                  color: "#3d3c3c",
                }}
              >
                {t("YOUR_SIGNATURE")}
              </h1>
              <h2
                style={{
                  margin: 0,
                  fontFamily: "Roboto",
                  fontSize: "14px",
                  fontWeight: 400,
                  lineHeight: "16.41px",
                  textAlign: "center",
                  color: "#00703c",
                  padding: "6px",
                  backgroundColor: "#e4f2e4",
                  borderRadius: "999px",
                }}
              >
                {t("SIGNED")}
              </h2>
            </div>
          </div>
        </Modal>
      )}

      {stepper === 2 && (
        <SuccessBannerModal
          t={t}
          handleCloseSuccessModal={() => {
            clearEvidenceSessionData();
            setShowMakeAsEvidenceModal(false);
            setDocumentCounter((prevCount) => prevCount + 1);
          }}
          message={"MARK_AS_EVIDENCE_SUCCESS"}
        />
      )}
    </React.Fragment>
  );
};

export default MarkAsEvidence;
