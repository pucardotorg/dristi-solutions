import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Dropdown, LabelFieldPair, CardLabel, Loader, Toast } from "@egovernments/digit-ui-react-components";
import { LeftArrow, CustomAddIcon } from "../../../icons/svgIndex";
import Button from "../../../components/Button";
import { getFormattedName } from "../../../../../hearings/src/utils";
import isEmpty from "lodash/isEmpty";
import { TextArea } from "@egovernments/digit-ui-components";
import TranscriptComponent from "../../../../../hearings/src/pages/employee/Transcription";
import WitnessModal from "../../../../../hearings/src/components/WitnessModal";
import { Urls } from "../../../hooks";
import { getFilingType } from "../../../Utils";
import { hearingService } from "../../../../../hearings/src/hooks/services";
import { getAdvocates } from "@egovernments/digit-ui-module-orders/src/utils/caseUtils";
import { constructFullName, removeInvalidNameParts } from "@egovernments/digit-ui-module-orders/src/utils";
import useSearchEvidenceService from "../../../../../submissions/src/hooks/submissions/useSearchEvidenceService";
import { DRISTIService } from "../../../services";
import { submissionService } from "../../../../../submissions/src/hooks/services";
import WitnessDepositionReviewModal from "./WitnessDepositionReviewModal";
import ConfirmWitnessModal from "./ConfirmWitnessModal";
import isEqual from "lodash/isEqual";
import WitnessDepositionSignatureModal from "./WitnessDepositionSignatureModal";
import useDownloadCasePdf from "../../../hooks/dristi/useDownloadCasePdf";
import WitnessDepositionESignLockModal from "./WitnessDepositionESignLockModal";
import AddWitnessMobileNumberModal from "./AddWitnessMobileNumberModal";
import SuccessBannerModal from "../../../../../submissions/src/components/SuccessBannerModal";
import AddWitnessModal from "@egovernments/digit-ui-module-hearings/src/pages/employee/AddWitnessModal";

const formatAddress = (addr) => {
  if (!addr) return "";
  // const { addressLine1 = "", addressLine2 = "", buildingName = "", street = "", city = "", pincode = "" } = addr;

  const { locality = "", city = "", district = "", state = "", pincode = "" } = addr;

  return `${locality}, ${city}, ${district}, ${state}, ${pincode}`.trim();
};

const WitnessDrawerV2 = ({
  isOpen,
  onClose,
  tenantId,
  onSubmit,
  attendees,
  caseDetails,
  hearing,
  hearingId,
  setAddPartyModal,
  artifactNumber = null,
  refetchCaseData,
}) => {
  const { t } = useTranslation();
  const textAreaRef = useRef(null);
  const [options, setOptions] = useState([]);
  const [witnessTypeOptions] = useState([
    { label: "PW", value: "PW" },
    { label: "DW", value: "DW" },
    { label: "CW", value: "CW" },
  ]);
  const [selectedWitnessType, setSelectedWitnessType] = useState({});
  const [selectedWitness, setSelectedWitness] = useState({});
  const [witnessDepositionText, setWitnessDepositionText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProceeding, setIsProceeding] = useState(false);
  const [hearingData, setHearingData] = useState(hearing);
  const [witnessModalOpen, setWitnessModalOpen] = useState(false);
  const [signedDocumentUploadID, setSignedDocumentUploadID] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState({});
  const [activeTabs, setActiveTabs] = useState([]);
  const [activeTabIndex, setActiveTabIndex] = useState(0); // set activetabindex based on new or already existing tab.
  const [currentEvidence, setCurrentEvidence] = useState(null);
  const [showErrorToast, setShowErrorToast] = useState(null);
  const userInfo = Digit?.UserService?.getUser?.()?.info;
  const urlParams = new URLSearchParams(window.location.search);
  const [showWitnessDepositionReview, setShowWitnessDepositionReview] = useState(false);
  const [witnessDepositionFileStoreId, setWitnessDepositionFileStoreId] = useState("");
  const [showSignatureModal, setShowsignatureModal] = useState(false);
  const [showConfirmWitnessModal, setShowConfirmWitnessModal] = useState(false);
  const [currentArtifactNumber, setCurrentArtifactNumber] = useState(null);
  const [witnessDepositionUploadLoader, setWitnessDepositionUploadLoader] = useState(false);
  const [showWitnessDepositionESign, setShowWitnessDepositionESign] = useState(false);
  const { downloadPdf } = useDownloadCasePdf();
  const [showAddWitnessMobileNumberModal, setShowAddWitnessMobileNumberModal] = useState(false);
  const [witnesMobileNumber, setWitnessMobileNumber] = useState("");
  const [witnessDepositionSignatureURL, setWitnessDepositionSignatureURL] = useState("");
  const [showUploadSignature, setShowUploadSignature] = useState(false);
  const [loader, setLoader] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [disableWitnessType, setDisableWitnessType] = useState(false);
  const [obtainedTag, setObtainedTag] = useState("");

  const closeToast = () => {
    setShowErrorToast(null);
  };

  // Sync currentArtifactNumber with artifactNumber prop
  useEffect(() => {
    setCurrentArtifactNumber(artifactNumber || null);
  }, [artifactNumber]);

  useEffect(() => {
    if (showErrorToast) {
      const timer = setTimeout(() => {
        setShowErrorToast(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showErrorToast]);

  // API to fetch draft depositions
  const { data: evidenceData, isloading: isEvidenceLoading, refetch: evidenceRefetch } = useSearchEvidenceService(
    {
      criteria: {
        filingNumber: caseDetails?.filingNumber,
        artifactType: "WITNESS_DEPOSITION",
        tenantId,
        ...(caseDetails?.courtId && { courtId: caseDetails?.courtId }),
      },
      tenantId,
    },
    {},
    caseDetails?.filingNumber,
    Boolean(caseDetails?.filingNumber && caseDetails?.courtId)
  );

  const evidenceList = useMemo(
    () =>
      evidenceData?.artifacts
        ?.filter((artifact) => artifact?.status === "DRAFT_IN_PROGRESS")
        ?.filter((artifact) => (artifactNumber ? artifactNumber === artifact?.artifactNumber : true)),
    [evidenceData, artifactNumber]
  );
  const { data: filingTypeData, isLoading: isFilingTypeLoading } = Digit.Hooks.dristi.useGetStatuteSection("common-masters", [
    { name: "FilingType" },
  ]);
  const filingType = useMemo(() => getFilingType(filingTypeData?.FilingType, "CaseFiling"), [filingTypeData?.FilingType]);

  const onClickAddWitness = () => {
    setWitnessModalOpen(true);
  };
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const allAdvocates = useMemo(() => getAdvocates(caseDetails), [caseDetails]);

  const complainants = useMemo(() => {
    return (
      caseDetails?.litigants
        ?.filter((item) => item?.partyType?.includes("complainant"))
        ?.map((item) => {
          const fullName = removeInvalidNameParts(item?.additionalDetails?.fullName);
          const poaHolder = caseDetails?.poaHolders?.find((poa) => poa?.individualId === item?.individualId);
          if (poaHolder) {
            const userData = caseDetails?.additionalDetails?.complainantDetails?.formdata?.find(
              (data) => data?.data?.poaVerification?.individualDetails?.individualId === item?.individualId
            )?.data;

            const mobileNumber = userData?.poaVerification?.mobileNumber;
            const age = userData?.poaAge || "";
            const address = formatAddress(userData?.poaAddressDetails);
            const tag = item?.additionalDetails?.tag;

            return {
              code: fullName,
              name: `${fullName} (Complainant, PoA Holder)`,
              representedByUuid: allAdvocates[item?.additionalDetails?.uuid],
              uuid: item?.additionalDetails?.uuid,
              individualId: item?.individualId,
              isJoined: true,
              partyType: "complainant",
              representingLitigants: poaHolder?.representingLitigants?.map((lit) => lit?.individualId),
              witnessMobileNumbers: mobileNumber ? [mobileNumber] : [],
              sourceName: fullName,
              age,
              address,
              designation: "",
              tag,
            };
          }

          const userData = caseDetails?.additionalDetails?.complainantDetails?.formdata?.find(
            (data) => data?.data?.complainantVerification?.individualDetails?.individualId === item?.individualId
          )?.data;

          const mobileNumber = userData?.complainantVerification?.mobileNumber;
          const age = userData?.complainantAge || "";
          const address = formatAddress(userData?.addressDetails);
          const designation = userData?.complainantDesignation || "";
          const tag = item?.additionalDetails?.tag;
          return {
            code: fullName,
            name: `${fullName} (Complainant)`,
            representedByUuid: allAdvocates[item?.additionalDetails?.uuid],
            uuid: item?.additionalDetails?.uuid,
            individualId: item?.individualId,
            isJoined: true,
            partyType: "complainant",
            age,
            address,
            designation: designation,
            witnessMobileNumbers: mobileNumber ? [mobileNumber] : [],
            sourceName: fullName,
            tag,
          };
        }) || []
    );
  }, [caseDetails, allAdvocates]);

  const poaHolders = useMemo(() => {
    const complainantIds = new Set(complainants?.map((c) => c?.individualId));
    return (
      caseDetails?.poaHolders
        ?.filter((item) => !complainantIds.has(item?.individualId))
        ?.map((item) => {
          const fullName = removeInvalidNameParts(item?.name);

          const userData = caseDetails?.additionalDetails?.complainantDetails?.formdata?.find(
            (data) => data?.data?.poaVerification?.individualDetails?.individualId === item?.individualId
          )?.data;

          const mobileNumber = userData?.poaVerification?.mobileNumber;
          const age = userData?.poaAge || "";
          const address = formatAddress(userData?.poaAddressDetails);
          const tag = item?.additionalDetails?.tag;
          return {
            code: fullName,
            name: `${fullName} (PoA Holder)`,
            uuid: item?.additionalDetails?.uuid,
            representedByUuid: allAdvocates[item?.additionalDetails?.uuid],
            representingLitigants: item?.representingLitigants?.map((lit) => lit?.individualId),
            individualId: item?.individualId,
            isJoined: true,
            partyType: "poaHolder",
            witnessMobileNumbers: mobileNumber ? [mobileNumber] : [],
            sourceName: fullName,
            age,
            address,
            designation: "",
            tag,
          };
        }) || []
    );
  }, [caseDetails, complainants, allAdvocates]);

  const respondents = useMemo(() => {
    return (
      caseDetails?.litigants
        ?.filter((item) => item?.partyType?.includes("respondent"))
        .map((item) => {
          const fullName = removeInvalidNameParts(item?.additionalDetails?.fullName);
          const userData = caseDetails?.additionalDetails?.respondentDetails?.formdata?.find(
            (obj) => obj?.data?.respondentVerification?.individualDetails?.individualId === item?.individualId
          );
          const uniqueId = userData?.uniqueId;
          const mobileNumber = userData?.data?.phonenumbers?.mobileNumber;
          const age = userData?.data?.respondentAge || "";
          const address = formatAddress(userData?.data?.addressDetails?.[0]?.addressDetails);
          const designation = "";
          const tag = item?.additionalDetails?.tag;

          return {
            code: fullName,
            name: `${fullName} (Accused)`,
            representedByUuid: allAdvocates[item?.additionalDetails?.uuid],
            uuid: item?.additionalDetails?.uuid,
            individualId: item?.individualId,
            isJoined: true,
            partyType: "respondent",
            uniqueId,
            witnessMobileNumbers: mobileNumber?.length > 0 ? mobileNumber : [],
            sourceName: fullName,
            age,
            address,
            designation,
            tag,
          };
        }) || []
    );
  }, [caseDetails, allAdvocates]);

  const advocates = useMemo(
    () =>
      caseDetails?.representatives?.map((rep) => {
        const advocates = caseDetails?.additionalDetails?.advocateDetails?.formdata;

        let mobileNumber = null;
        for (let i = 0; i < advocates?.length; i++) {
          for (let j = 0; j < advocates[i]?.data?.multipleAdvocatesAndPip?.multipleAdvocateNameDetails?.length; j++) {
            const advocateData = advocates[i]?.data?.multipleAdvocatesAndPip?.multipleAdvocateNameDetails?.[j];
            if (advocateData?.advocateBarRegNumberWithName?.advocateUuid === rep?.additionalDetails?.uuid) {
              mobileNumber = advocateData?.advocateNameDetails?.advocateMobileNumber;
              break;
            }
          }
        }
        const tag = rep?.additionalDetails?.tag;
        return {
          name: `${rep?.additionalDetails?.advocateName} (Advocate)`,
          partyType: `ADVOCATE`,
          uuid: rep?.additionalDetails?.uuid,
          representingList: rep?.representing?.map((client) => removeInvalidNameParts(client?.additionalDetails?.fullName))?.join(", "),
          witnessMobileNumbers: mobileNumber ? [mobileNumber] : [],
          sourceName: rep?.additionalDetails?.advocateName,
          address: "",
          age: "",
          designation: "",
          tag,
        };
      }) || [],
    [caseDetails]
  );

  const witnesses = useMemo(
    () =>
      caseDetails?.additionalDetails?.witnessDetails?.formdata?.map((witness) => {
        const mobileNumber = witness?.data?.phonenumbers?.mobileNumber;
        const address = formatAddress(witness?.data?.addressDetails?.[0]?.addressDetails);
        const tag = witness?.data?.witnessTag;
        const uniqueId = witness?.uniqueId || witness?.data?.uuid;

        return {
          name: getFormattedName(
            witness?.data?.firstName,
            witness?.data?.middleName,
            witness?.data?.lastName,
            witness?.data?.witnessDesignation,
            "(Witness)"
          ),
          age: witness?.data?.witnessAge || "",
          gender: witness?.data?.gender,
          designation: witness?.data?.witnessDesignation || "",
          address,
          uniqueId,
          partyType: "witness",
          witnessMobileNumbers: mobileNumber?.length > 0 ? mobileNumber : [],
          sourceName: getFormattedName(
            witness?.data?.firstName,
            witness?.data?.middleName,
            witness?.data?.lastName,
            witness?.data?.witnessDesignation
          ),
          tag,
        };
      }) || [],
    [caseDetails]
  );

  const allParties = useMemo(() => [...complainants, ...poaHolders, ...respondents, ...advocates, ...witnesses], [
    complainants,
    poaHolders,
    respondents,
    advocates,
    witnesses,
  ]);

  // Create a new draft
  const createNewDraft = useCallback(
    async (evidenceList = []) => {
      try {
        const newTab = {
          artifactNumber: null, // Will be set after saving
          sourceName: "Deposition", // Default name until saved
          sourceType: selectedWitnessType?.value === "PW" ? "COMPLAINANT" : selectedWitnessType?.value === "DW" ? "ACCUSED" : "COURT",
          sourceID: selectedWitness?.value,
          content: "",
          artifactType: "WITNESS_DEPOSITION",
          caseId: caseDetails?.id,
          filingNumber: caseDetails?.filingNumber,
          tenantId,
          isNew: true, // Flag to identify unsaved tabs
        };

        // Add the new tab to the list and set it as active
        const updatedTabs = [...evidenceList, newTab];
        setActiveTabs(updatedTabs);
        setActiveTabIndex(updatedTabs.length - 1);
        setWitnessDepositionText(""); // Clear the text area for new draft

        // No need to call API yet - we'll create the evidence when user saves the draft
      } catch (error) {
        console.error("Error creating draft:", error);
      }
    },
    [selectedWitnessType, selectedWitness, caseDetails, tenantId, activeTabs, setActiveTabs, setActiveTabIndex, setWitnessDepositionText]
  );

  useEffect(() => {
    const partiesOption =
      allParties?.map((party) => ({
        label: party?.name,
        value: party?.uuid || party?.uniqueId, // For witnesses, uuid is not available so we use uniqueId.
      })) || [];

    setOptions(partiesOption);
  }, [caseDetails, hearingData, allParties, activeTabs.length]);

  useEffect(() => {
    createNewDraft([]);
  }, []);

  // Process evidence list when data is loaded
  useEffect(() => {
    if (!isEvidenceLoading && evidenceList?.length > 0) {
      const evidenceWithUnsaved = [...evidenceList];
      if (currentArtifactNumber) {
        const artifact = evidenceWithUnsaved?.find((tab) => tab?.artifactNumber === currentArtifactNumber);
        if (artifact) {
          const activeindex = evidenceWithUnsaved?.findIndex((tab) => tab?.artifactNumber === currentArtifactNumber);
          const selectedUUID = artifact?.sourceID;
          const matchingWitness = options.find((opt) => opt?.value === selectedUUID);
          setActiveTabs(evidenceWithUnsaved); // basically we show only that particular tab when editing an evidence(it will have corresponding artifact number)
          setActiveTabIndex(activeindex);
          setCurrentEvidence(evidenceWithUnsaved[activeindex]);
          setSelectedWitness({ label: matchingWitness?.label, value: matchingWitness?.value });
          let witnessType = evidenceWithUnsaved[activeindex]?.tag;
          const isTag = allParties?.find((party) => (party?.uuid || party?.uniqueId) === selectedUUID)?.tag;
          if (isTag) {
            witnessType = isTag;
          }
          setSelectedWitnessType({ label: witnessType, value: witnessType });
          setWitnessDepositionText(artifact?.description || "");
          return;
        }
      } else {
        const newTab = {
          artifactNumber: null, // Will be set after saving
          sourceName: "Deposition", // Default name until saved
          sourceType: selectedWitnessType?.value === "PW" ? "COMPLAINANT" : selectedWitnessType?.value === "DW" ? "ACCUSED" : "COURT",
          sourceID: selectedWitness?.value,
          content: "",
          artifactType: "WITNESS_DEPOSITION",
          caseId: caseDetails?.id,
          filingNumber: caseDetails?.filingNumber,
          tenantId,
          isNew: true, // Flag to identify unsaved tabs
        };

        // Add the new tab to the list and set it as active
        const updatedTabs = [...evidenceList, newTab];

        if (!isEqual(updatedTabs, activeTabs)) {
          setActiveTabs(updatedTabs);
          setActiveTabIndex(updatedTabs.length - 1);
          setWitnessDepositionText(""); // Clear the text area for new draft
          setSelectedWitness({});
          setSelectedWitnessType({});
        }
      }
    }
  }, [evidenceList, options, artifactNumber, currentArtifactNumber, isEvidenceLoading]);

  useEffect(() => {
    const isTag = allParties?.find((party) => (party?.uuid || party?.uniqueId) === selectedWitness?.value)?.tag;
    if (isTag && isTag !== selectedWitnessType?.value) {
      setSelectedWitnessType({ label: isTag, value: isTag });
      setDisableWitnessType(true);
    } else if (isTag && isTag === selectedWitnessType?.value && !disableWitnessType) {
      setDisableWitnessType(true);
    } else if (!isTag && disableWitnessType) {
      setDisableWitnessType(false);
    }
  }, [selectedWitness, selectedWitnessType, allParties, disableWitnessType]);

  // Handle witness type dropdown change
  const handleWitnessTypeChange = (option) => {
    setSelectedWitnessType({ label: option?.value, value: option?.value });
  };

  const handleAddNewDraft = async () => {
    const newTab = {
      artifactNumber: null, // Will be set after saving
      sourceName: "Deposition", // Default name until saved
      sourceType: selectedWitnessType?.value === "PW" ? "COMPLAINANT" : selectedWitnessType?.value === "DW" ? "ACCUSED" : "COURT",
      sourceID: selectedWitness?.value,
      content: "",
      artifactType: "WITNESS_DEPOSITION",
      caseId: caseDetails?.id,
      filingNumber: caseDetails?.filingNumber,
      tenantId,
      isNew: true, // Flag to identify unsaved tabs
    };

    // Add the new tab to the list and set it as active
    const updatedTabs = [...evidenceList, newTab];
    setActiveTabs(updatedTabs);
    setActiveTabIndex(updatedTabs.length - 1);
    setWitnessDepositionText(""); // Clear the text area for new draft
    setCurrentArtifactNumber(null);
    setSelectedWitness({});
    setSelectedWitnessType({});
  };

  // Handle tab change
  const handleTabChange = async (tab) => {
    const currentArtifact = activeTabs?.find((t) => t?.artifactNumber === tab?.artifactNumber);
    if (activeTabs?.find((tab) => tab?.isNew && selectedWitness?.value)) {
      handleSaveDraft(false, currentArtifact?.artifactNumber);
    } else {
      setCurrentArtifactNumber(currentArtifact?.artifactNumber);
    }
  };

  const handleDropdownChange = (selectedPartyOption) => {
    const selectedUUID = selectedPartyOption?.value;
    const matchingWitness = options.find((opt) => opt?.value === selectedUUID);
    setSelectedWitness({ label: matchingWitness?.label, value: matchingWitness?.value });
    setSelectedWitnessType({});
    setWitnessDepositionText("");
  };

  const IsSelectedWitness = useMemo(() => {
    return !isEmpty(selectedWitness);
  }, [selectedWitness]);

  const caseCourtId = useMemo(() => caseDetails?.courtId, [caseDetails]);

  const cnrNumber = useMemo(() => caseDetails?.cnrNumber, [caseDetails]);

  const handleSaveDraft = async (submit = false, newCurrentArtifactNumber = null, backAction = false) => {
    if (!selectedWitness?.value) {
      setShowErrorToast({ label: t("PLEASE_SELECT_WITNESS_FIRST"), error: true });
      if (backAction) {
        onClose();
      }
      return;
    }

    if (!selectedWitnessType?.value) {
      setShowErrorToast({ label: t("PLEASE_MARK_WITNESS"), error: true });
      if (backAction) {
        onClose();
      }
      return;
    }

    if (!witnessDepositionText.trim() && submit) {
      setShowErrorToast({ label: t("PLEASE_ENTER_DEPOSITION"), error: true });
      if (backAction) {
        onClose();
      }
      return;
    }

    try {
      setLoader(true);

      const party = allParties?.find((p) => p?.uuid === selectedWitness?.value || p?.uniqueId === selectedWitness?.value);

      // Check if we need to create or update evidence
      const artifactNum = artifactNumber || currentArtifactNumber;
      if (artifactNum) {
        const evidence = activeTabs?.find((tab) => tab?.artifactNumber === artifactNum);
        // Update existing evidence
        const updateEvidenceReqBody = {
          artifact: {
            ...evidence,
            sourceType: selectedWitnessType.value === "PW" ? "COMPLAINANT" : selectedWitnessType.value === "DW" ? "ACCUSED" : "COURT",
            tag: selectedWitnessType?.value,
            sourceID: selectedWitness.value,
            sourceName: party?.sourceName,
            description: witnessDepositionText,
            additionalDetails: {
              witnessDetails: {
                address: party?.address || "",
                designation: party?.designation || "",
                age: party?.age || "",
              },
            },
            isEvidenceMarkedFlow: false,
            workflow: {
              action: "SAVE_DRAFT",
            },
          },
        };

        const updatedEvidence = await DRISTIService.updateEvidence(updateEvidenceReqBody);

        // Update the tab in activeTabs directly
        if (updatedEvidence?.artifact) {
          const updatedTabs = [...activeTabs];
          if (newCurrentArtifactNumber) {
            setCurrentArtifactNumber(newCurrentArtifactNumber);
          } else {
            setCurrentArtifactNumber(updatedEvidence?.artifact?.artifactNumber);
          }
          setActiveTabs(updatedTabs);
          setObtainedTag(updatedEvidence?.artifact?.tag);
        }

        setShowErrorToast({ label: "Draft updated successfully", error: false });
      } else {
        // Create new evidence
        const createEvidenceReqBody = {
          artifact: {
            artifactType: "WITNESS_DEPOSITION",
            caseId: caseDetails?.id,
            filingNumber: caseDetails?.filingNumber,
            tenantId,
            sourceType: selectedWitnessType?.value === "PW" ? "COMPLAINANT" : selectedWitnessType?.value === "DW" ? "ACCUSED" : "COURT",
            tag: selectedWitnessType?.value,
            sourceID: selectedWitness?.value,
            sourceName: party?.sourceName, // confirm?
            filingType: filingType,
            description: witnessDepositionText,
            additionalDetails: {
              witnessDetails: {
                address: party?.address || "",
                designation: party?.designation || "",
                age: party?.age || "",
              },
            },
            comments: [],
            workflow: {
              action: "SAVE_DRAFT",
            },
          },
        };

        const newEvidence = await submissionService.createEvidence(createEvidenceReqBody);

        if (newEvidence?.artifact) {
          const updatedTabs = [...activeTabs];
          if (activeTabs?.length > 0 && activeTabs?.[activeTabIndex]?.isNew) {
            updatedTabs[activeTabIndex] = newEvidence?.artifact;
          } else {
            updatedTabs.push(newEvidence?.artifact);
            setActiveTabIndex(updatedTabs.length - 1);
          }
          setActiveTabs(updatedTabs);
          setObtainedTag(newEvidence?.artifact?.tag);
          if (newCurrentArtifactNumber) {
            setCurrentArtifactNumber(newCurrentArtifactNumber);
          } else {
            setCurrentArtifactNumber(newEvidence.artifact?.artifactNumber);
            setCurrentEvidence(newEvidence.artifact);
          }
        }

        setShowErrorToast({ label: t("WITNESS_DEPOSITION_CREATED_SUCCESSFULLY"), error: false });
      }

      // Also refresh evidence list to ensure server and client are in sync
      evidenceRefetch();
    } catch (error) {
      console.error("Error saving draft:", error);
      setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
    } finally {
      setLoader(false);
      if (backAction) {
        onClose();
      }
      if (submit) {
        if (!disableWitnessType) {
          setShowConfirmWitnessModal(true);
        } else {
          setShowWitnessDepositionReview(true);
        }
      }
    }
  };

  const handleConfirmWitnessAndSign = async (evidence) => {
    try {
      // Check if we need to create or update evidence
      const evidence = activeTabs?.find((tab) => tab?.artifactNumber === currentArtifactNumber);
      const party = allParties?.find((p) => p?.uuid === selectedWitness?.value || p?.uniqueId === selectedWitness?.value);
      if (evidence?.artifactNumber) {
        // Update existing evidence
        const updateEvidenceReqBody = {
          artifact: {
            ...evidence,
            filingType: "CASE_FILING",
            tag: selectedWitnessType?.value,
            sourceID: selectedWitness?.value,
            sourceName: party?.sourceName,
            workflow: {
              action: "SUBMIT",
            },
            isEvidenceMarkedFlow: false,
          },
        };

        const updatedEvidence = await DRISTIService.updateEvidence(updateEvidenceReqBody);

        // Update the tab in activeTabs directly
        if (updatedEvidence?.artifact) {
          const updatedTabs = [...activeTabs];
          setActiveTabs(updatedTabs);
        }

        setShowErrorToast({ label: "Draft updated successfully", error: false });
      }
      setDisableWitnessType(true);

      // Also refresh evidence list to ensure server and client are in sync
      evidenceRefetch();
    } catch (error) {
      console.error("Error saving draft:", error);
      setShowErrorToast({ label: "Failed to save draft", error: true });
    } finally {
      setShowConfirmWitnessModal(false);
      setShowWitnessDepositionReview(true);
      evidenceRefetch();
    }
  };

  const handleCloseSignatureModal = () => {
    setShowsignatureModal(false);
    setShowWitnessDepositionReview(true);
  };

  const handleDownload = () => {
    downloadPdf(tenantId, witnessDepositionFileStoreId);
  };

  const updateWitnessDepositionDocument = async (fileStoreId = null, action, witnessMobileNumbers) => {
    try {
      const documents = Array.isArray(currentEvidence?.file) ? currentEvidence.file : {};
      const documentsFile = fileStoreId
        ? [
            {
              fileStore: fileStoreId,
              documentType: action === "UPLOAD" ? "SIGNED" : "UNSIGNED",
              additionalDetails: { name: `${t("WITNESS_DEPOSITION")}.pdf` },
              tenantId,
            },
          ]
        : null;

      const currentParty = allParties?.find((p) => (p?.uuid || p?.uniqueId) === selectedWitness?.value);

      let workflow = { ...currentEvidence?.artifact?.workflow, action };
      if (action === "INITIATE_E-SIGN") {
        workflow.additionalDetails = { excludeRoles: ["EVIDENCE_CREATOR"] };
        if (currentParty?.partyType !== "witness") {
          workflow.assignes = [currentEvidence?.sourceID];
        }
      }

      const evidence = activeTabs?.find((tab) => tab?.artifactNumber === currentArtifactNumber);
      const party = allParties?.find((p) => p?.uuid === selectedWitness?.value || p?.uniqueId === selectedWitness?.value);

      const updateEvidenceReqBody = {
        artifact: {
          ...evidence,
          file: documentsFile ? documentsFile?.[0] : documents,
          tag: selectedWitnessType?.value,
          sourceID: selectedWitness?.value,
          sourceName: party?.sourceName,
          workflow,
          isEvidenceMarkedFlow: false,
          witnessMobileNumbers: witnessMobileNumbers ? witnessMobileNumbers : currentEvidence?.witnessMobileNumbers || [],
        },
      };

      const updatedEvidence = await DRISTIService.updateEvidence(updateEvidenceReqBody);

      return updatedEvidence;
    } catch (error) {
      console.error("error:", error);
      throw error;
    }
  };

  const handleESign = async (number = "") => {
    // TODO: call Api then close this modal and show next modal
    try {
      const currentParty = allParties?.find((p) => (p?.uuid || p?.uniqueId) === selectedWitness?.value);
      const currnetEvidenceUpdated = structuredClone(currentEvidence);
      let witnessMobileNum = [];
      if (currentParty?.witnessMobileNumbers?.length > 0) {
        witnessMobileNum = currentParty?.witnessMobileNumbers;
      } else if (witnesMobileNumber) {
        witnessMobileNum = [witnesMobileNumber];
      } else if (number) {
        witnessMobileNum = [number];
      }
      // if no mobile numbers present then show add mobile number modal otherwise e sign action.
      if (witnessMobileNum?.length === 0) {
        setShowsignatureModal(false);
        setShowAddWitnessMobileNumberModal(true);
        return;
      }
      currnetEvidenceUpdated.workflow = {
        action: "INITIATE_E-SIGN",
        witnessMobileNumbers: witnessMobileNum,
      };
      const updatedEvidence = await updateWitnessDepositionDocument(witnessDepositionFileStoreId, "INITIATE_E-SIGN", witnessMobileNum);
      setWitnessDepositionSignatureURL(updatedEvidence?.artifact?.shortenedUrl);
      setShowAddWitnessMobileNumberModal(false);
      setShowsignatureModal(false);
      setShowWitnessDepositionESign(true);
      evidenceRefetch();
      setCurrentArtifactNumber(null);
    } catch (error) {
      console.error("Error while updating bail bond:", error);
      setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
    } finally {
      // evidenceRefetch();
      setShowsignatureModal(false);
    }
  };

  const handleSubmitSignature = async (fileStoreId) => {
    // TODO: api call with fileStoreID then
    try {
      setLoader(false);
      const res = await updateWitnessDepositionDocument(fileStoreId, "UPLOAD");
      setShowsignatureModal(false);
      setShowUploadSignature(false);
      setShowSuccessModal(true);
      evidenceRefetch();
      setCurrentArtifactNumber(null);
    } catch (error) {
      console.error("Error while updating bail bond:", error);
      setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
    } finally {
      setLoader(false);
      setShowsignatureModal(false);
      setShowUploadSignature(false);
    }
  };

  const handleCloseWitnessDrawer = () => {
    handleSaveDraft(null, null, true);
  };

  if (isFilingTypeLoading || isEvidenceLoading) {
    return <Loader />;
  }

  return (
    <div className="bottom-drawer-wrapper">
      {loader && (
        <div
          style={{
            width: "100vw",
            height: "100vh",
            zIndex: "9999",
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
      <div className="bottom-drawer-overlay" onClick={onClose} />
      <div className={`bottom-drawer ${isOpen ? "open" : ""}`}>
        <div className="drawer-header">
          <div className="header-content">
            <button className="drawer-close-button" onClick={handleCloseWitnessDrawer}>
              <LeftArrow color="#0b0c0c" />
            </button>
            <h2>{t("CS_WITNESS_DEPOSITION")}</h2>
          </div>
        </div>
        <div className="drawer-content">
          <div className="drawer-section">
            {/* Tabs UI for draft depositions */}

            <div className="witness-tabs" style={{ display: "flex", marginTop: "16px", borderBottom: "1px solid #d6d5d4", overflowX: "scroll" }}>
              {/* Display tabs for both evidence list items and unsaved drafts */}
              {activeTabs
                ?.filter((tab) => !tab?.isNew)
                .map((tab, index) => (
                  <div
                    key={tab.artifactNumber || `new-tab-${index}`}
                    className={`witness-tab ${activeTabIndex === index ? "active" : ""}`}
                    onClick={() => handleTabChange(tab)}
                    style={{
                      padding: "8px 16px",
                      marginRight: "8px",
                      cursor: "pointer",
                      fontSize: "16px",
                      backgroundColor: "transparent",
                      color: activeTabIndex === index ? "#0A5757" : "#6F767E",
                      borderBottom: activeTabIndex === index ? "2px solid #0A5757" : "none",
                      fontWeight: activeTabIndex === index ? "bold" : "normal",
                    }}
                  >
                    {`${t("CS_DEPOSITION")} (${tab?.sourceName})`}
                  </div>
                ))}
              {/* Add new tab button */}
              {!artifactNumber && (
                <div
                  className="witness-tab add-tab"
                  onClick={() => handleAddNewDraft()}
                  style={{
                    padding: "8px 18px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    fill: "#0B6265",
                  }}
                >
                  <CustomAddIcon width="17" height="17" fill="#0A5757" />
                </div>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", margin: "16px 0px 0px" }}>
              <LabelFieldPair>
                <CardLabel className="case-input-label">{t("ALL_PARTIES")}</CardLabel>
                <Dropdown
                  t={t}
                  option={options}
                  optionKey={"label"}
                  select={handleDropdownChange}
                  freeze={true}
                  disable={isProceeding}
                  selected={selectedWitness}
                  style={{ width: "100%", height: "40px", fontSize: "16px", marginBottom: "0px" }}
                />
              </LabelFieldPair>
              <LabelFieldPair>
                <CardLabel className="case-input-label">{t("WITNESS_MARKED_AS")}</CardLabel>
                <Dropdown
                  t={t}
                  option={witnessTypeOptions}
                  optionKey={"label"}
                  select={handleWitnessTypeChange}
                  freeze={true}
                  disable={isProceeding || disableWitnessType}
                  selected={selectedWitnessType}
                  style={{ width: "100%", height: "40px", fontSize: "16px", marginBottom: "0px" }}
                />
              </LabelFieldPair>
            </div>

            <div style={{ height: "19px", color: "#007E7E", marginTop: "2px" }}>
              <button
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  margin: 0,
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "rgb(0, 126, 126)",
                  fontWeight: 700,
                }}
                onClick={onClickAddWitness}
              >
                + {t("ADD_NEW_WITNESS")}
              </button>
            </div>

            <div style={{ marginTop: "16px" }}>{t("CS_DESCRIPTION")}</div>

            <div style={{ gap: "16px", border: "1px solid" }}>
              <TextArea
                ref={textAreaRef}
                style={{
                  width: "100%",
                  minHeight: "40vh",
                  fontSize: "large",
                  ...(!IsSelectedWitness && {
                    pointerEvents: "unset !important",
                  }),
                }}
                value={IsSelectedWitness ? witnessDepositionText || "" : ""}
                onChange={(e) => setWitnessDepositionText(e.target.value)}
                disabled={isProceeding}
              />
              {IsSelectedWitness && (
                <TranscriptComponent
                  setWitnessDepositionText={setWitnessDepositionText}
                  isRecording={isRecording}
                  setIsRecording={setIsRecording}
                  activeTab={"Witness Deposition"}
                ></TranscriptComponent>
              )}
            </div>
            <div className="drawer-footer" style={{ display: "flex", justifyContent: "end", flexDirection: "row", gap: "16px" }}>
              <Button
                label={t("SAVE_DRAFT")}
                isDisabled={!IsSelectedWitness || isProceeding}
                onButtonClick={() => handleSaveDraft()}
                style={{
                  width: "130px",
                  backgroundColor: "#fff",
                  color: "#0B6265",
                  border: "1px solid #0B6265",
                  boxShadow: "none",
                }}
              />
              <Button
                label={t("SUBMIT_BUTTON")}
                isDisabled={!IsSelectedWitness || isProceeding || witnessDepositionText?.length === 0}
                className={"order-drawer-save-btn"}
                onButtonClick={() => handleSaveDraft(true)}
                style={{
                  width: "110px",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {witnessModalOpen && (
        <AddWitnessModal
          onCancel={() => setWitnessModalOpen(false)}
          onDismiss={() => setWitnessModalOpen(false)}
          tenantId={tenantId}
          caseDetails={caseDetails}
          isJudge={true}
          onAddSuccess={() => {
            setWitnessModalOpen(false);
            refetchCaseData();
          }}
          showToast={setShowErrorToast}
        ></AddWitnessModal>
      )}

      {showWitnessDepositionReview && (
        <WitnessDepositionReviewModal
          t={t}
          handleBack={() => {
            setShowWitnessDepositionReview(false);
          }}
          setShowWitnessDepositionReview={setShowWitnessDepositionReview}
          setShowsignatureModal={setShowsignatureModal}
          currentEvidence={currentEvidence}
          courtId={caseCourtId}
          cnrNumber={cnrNumber}
          setWitnessDepositionFileStoreId={setWitnessDepositionFileStoreId}
        />
      )}

      {showSignatureModal && (
        <WitnessDepositionSignatureModal
          t={t}
          handleCloseSignatureModal={handleCloseSignatureModal}
          handleDownload={handleDownload}
          handleESign={() => handleESign("")}
          setShowUploadSignature={setShowUploadSignature}
          showUploadSignature={showUploadSignature}
          handleSubmit={handleSubmitSignature}
          setLoader={setWitnessDepositionUploadLoader}
          loader={witnessDepositionUploadLoader}
          witnessDepositionFileStoreId={witnessDepositionFileStoreId}
        />
      )}

      {showAddWitnessMobileNumberModal && (
        <AddWitnessMobileNumberModal
          t={t}
          handleClose={() => {
            setShowAddWitnessMobileNumberModal(false);
            setShowAddWitnessMobileNumberModal(false);
            setShowsignatureModal(true);
            setWitnessMobileNumber("");
          }}
          submit={(mobileNumber) => handleESign(mobileNumber)}
          witnesMobileNumber={witnesMobileNumber}
          setWitnessMobileNumber={setWitnessMobileNumber}
        />
      )}

      {showWitnessDepositionESign && (
        <WitnessDepositionESignLockModal
          t={t}
          handleSaveOnSubmit={() => {
            setShowWitnessDepositionESign(false);
            evidenceRefetch();
          }}
          witnessDepositionSignatureURL={witnessDepositionSignatureURL}
        />
      )}

      {showConfirmWitnessModal && (
        <ConfirmWitnessModal
          t={t}
          selectedWitness={selectedWitness}
          witnessTag={obtainedTag}
          onCancel={() => setShowConfirmWitnessModal(false)}
          onSubmit={handleConfirmWitnessAndSign}
          allParties={allParties}
        />
      )}
      {showSuccessModal && (
        <SuccessBannerModal
          t={t}
          handleCloseSuccessModal={() => {
            setShowSuccessModal(false);
            evidenceRefetch();
            setCurrentEvidence(null);
          }}
          message={"WITNESS_DEPOSITION_SUCCESS_BANNER_HEADER"}
        />
      )}

      {showErrorToast && <Toast error={showErrorToast?.error} label={showErrorToast?.label} isDleteBtn={true} onClose={closeToast} />}
    </div>
  );
};

export default WitnessDrawerV2;
