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

  const evidenceList = useMemo(() => evidenceData?.artifacts?.filter((artifact) => artifact?.status === "DRAFT_IN_PROGRESS"), [evidenceData]);

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

      if (artifactNumber) {
        const artifact = evidenceWithUnsaved?.find((tab) => tab?.artifactNumber === artifactNumber);
        if (artifact) {
          setActiveTabs([artifact]); // basically we show only that particular tab when editing an evidence(it will have corresponding artifact number)
          setActiveTabIndex(0);
          setCurrentEvidence(artifact);
          setSelectedWitnessType({ label: artifact?.tag, value: artifact?.tag });
          setWitnessDepositionText(artifact?.description || "");
          return;
        }
      } else if (currentArtifactNumber) {
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
    // if (currentArtifact) {
    //   setCurrentArtifactNumber(currentArtifact?.artifactNumber);

    //   // setActiveTabIndex(tab?.index);
    //   // setCurrentEvidence(tab);
    //   // setWitnessDepositionText(tab?.description || "");
    //   // setSelectedWitnessType({ label: tab?.tag, value: tab?.tag });
    // }
    if (activeTabs?.find((tab) => tab?.isNew && selectedWitness?.value)) {
      handleSaveDraft(false, currentArtifact?.artifactNumber);
    } else {
      setCurrentArtifactNumber(currentArtifact?.artifactNumber);
    }
  };

  const handleDropdownChange = (selectedPartyOption) => {
    // let selectedData = additionalDetails?.witnessDetails?.formdata?.find((w) => w.data.uuid === selectedUUID)?.data;
    // if (!selectedData) {
    //   const attendee = hearingData?.attendees?.find((a) => a.individualId === selectedUUID);
    //   if (attendee) {
    //     selectedData = {
    //       ...attendee,
    //       uuid: attendee.individualId,
    //     };
    //   }
    // }
    // if (!selectedData) {
    //   const party = allParties?.find((p) => p.partyUuid === selectedUUID);
    //   if (party) {
    //     selectedData = {
    //       ...party,
    //       uuid: party.partyUuid,
    //     };
    //   }
    // }
    // if (!selectedData) {
    //   const advocate = caseDetails?.representatives?.find((adv) => adv?.advocateId === selectedUUID);
    //   if (advocate) {
    //     selectedData = {
    //       ...advocate,
    //       uuid: advocate?.advocateId,
    //     };
    //   }
    // }
    const selectedUUID = selectedPartyOption?.value;
    const matchingWitness = options.find((opt) => opt?.value === selectedUUID);
    setSelectedWitness({ label: matchingWitness?.label, value: matchingWitness?.value });
    setSelectedWitnessType({});
    setWitnessDepositionText("");
  };

  const IsSelectedWitness = useMemo(() => {
    return !isEmpty(selectedWitness);
  }, [selectedWitness]);

  // Save witness deposition - either as draft or final
  const saveWitnessDeposition = async (saveAsDraft = false) => {
    if (!selectedWitness?.uuid) {
      setShowErrorToast({ message: "Please select a witness first", variant: "error" });
      return;
    }

    if (saveAsDraft) {
      try {
        // Save as draft using the draft API
        const draftData = {
          hearingId,
          witnessId: selectedWitness.uuid,
          witnessName: getFormattedName(
            selectedWitness?.firstName || selectedWitness?.name || selectedWitness?.additionalDetails?.advocateName,
            selectedWitness?.middleName,
            selectedWitness?.lastName,
            selectedWitness?.witnessDesignation
          ),
          witnessType: selectedWitnessType.value,
          content: witnessDepositionText,
          tenantId,
          id: activeTabIndex >= 0 && activeTabIndex < activeTabs.length ? activeTabs[activeTabIndex].id : undefined,
        };

        const response = await Digit.DRISTIService.saveDraftDeposition(draftData);

        if (response?.id) {
          // Refresh drafts list
          evidenceRefetch();
          setShowErrorToast({ message: "Draft saved successfully", variant: "success" });
        }
      } catch (error) {
        console.error("Error saving draft:", error);
        setShowErrorToast({ message: "Error saving draft", variant: "error" });
      }
      return;
    }

    // Continue with regular save process for final deposition
    // setWitnessModalOpen(true);
  };

  const caseCourtId = useMemo(() => caseDetails?.courtId, [caseDetails]);

  const cnrNumber = useMemo(() => caseDetails?.cnrNumber, [caseDetails]);

  const filingNumber = useMemo(() => caseDetails?.filingNumber, [caseDetails]);

  const handleClose = () => {
    setWitnessModalOpen(false);
  };

  const handleSaveDraft = async (submit = false, newCurrentArtifactNumber = null) => {
    if (!selectedWitness?.value) {
      setShowErrorToast({ message: "Please select a witness first", variant: "error" });
      return;
    }

    if (!witnessDepositionText.trim()) {
      setShowErrorToast({ message: "Please enter deposition content", variant: "error" });
      return;
    }

    try {
      // if (!selectedWitness?.uuid) {
      //   setShowErrorToast({ label: "Please select a witness first", error: true });
      //   return;
      // }

      // if (!witnessDepositionText.trim()) {
      //   setShowErrorToast({ label: "Please enter deposition content", error: true });
      //   return;
      // }
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
            // artifactType: "WITNESS_DEPOSITION",
            // artifactNumber: evidence.artifactNumber,
            // caseId: caseDetails?.id,
            // filingNumber: caseDetails?.filingNumber,
            // tenantId,
            sourceType: selectedWitnessType.value === "PW" ? "COMPLAINANT" : selectedWitnessType.value === "DW" ? "ACCUSED" : "COURT",
            sourceID: selectedWitness.value,
            sourceName: party?.sourceName,
            // filingType: filingType,
            description: witnessDepositionText,
            // additionalDetails: { ...party },
            additionalDetails: {
              witnessDetails: {
                address: evidence?.additionalDetails?.witnessDetails?.address || "",
                designation: evidence?.additionalDetails?.witnessDetails?.designation || "",
                age: evidence?.additionalDetails?.witnessDetails?.age || "",
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
          //   updatedTabs[tabIndex] = updatedEvidence.artifact;
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

        setShowErrorToast({ label: "New draft created successfully", error: false });
      }

      // Also refresh evidence list to ensure server and client are in sync
      evidenceRefetch();
    } catch (error) {
      console.error("Error saving draft:", error);
      setShowErrorToast({ label: "Failed to save draft", error: true });
    } finally {
      setLoader(false);
      if (submit) {
        if (!disableWitnessType) {
          setShowConfirmWitnessModal(true);
        } else {
          setShowWitnessDepositionReview(true);
        }
      }
    }
  };

  const handleProceed = async () => {
    try {
      setIsProceeding(true);
      const updatedHearing = structuredClone(hearingData || {});
      updatedHearing.additionalDetails = updatedHearing.additionalDetails || {};
      updatedHearing.additionalDetails.witnessDepositions = updatedHearing.additionalDetails.witnessDepositions || [];
      const witnessIndex = updatedHearing.additionalDetails.witnessDepositions.findIndex((witness) => witness.uuid === selectedWitness?.uuid);

      const documents = Array.isArray(hearingData?.documents) ? hearingData.documents : [];
      const documentsFile =
        signedDocumentUploadID !== ""
          ? {
              documentType: "SIGNED",
              fileStore: signedDocumentUploadID,
            }
          : null;

      const reqBody = {
        hearing: {
          ...hearingData,
          documents: documentsFile ? [...documents, documentsFile] : documents,
        },
      };
      const docs = {
        // documentType: "image/png",
        fileStore: signedDocumentUploadID,
        additionalDetails: {
          name: "Witness Deposition",
        },
      };

      const evidenceReqBody = {
        artifact: {
          artifactType: "WITNESS_DEPOSITION",
          caseId: caseDetails?.id,
          filingNumber: caseDetails?.filingNumber,
          tenantId,
          comments: [],
          file: docs,
          sourceType: "COURT",
          sourceID: userInfo?.uuid,
          filingType: filingType,
          additionalDetails: {
            uuid: userInfo?.uuid,
          },
        },
      };
      await Digit?.DRISTIService.createEvidence(evidenceReqBody);

      const updateWitness = await hearingService.customApiService(
        Urls.hearing.uploadWitnesspdf,
        { tenantId: tenantId, hearing: reqBody?.hearing, hearingType: "", status: "" },
        { applicationNumber: "", cnrNumber: "" }
      );
      setIsProceeding(false);
      setWitnessModalOpen(false);
    } catch (error) {
      setIsProceeding(false);
      console.error("Error updating witness:", error);
    }
  };

  const handleConfirmWitnessAndSign = async (evidence) => {
    try {
      const party = allParties?.find((p) => p?.uuid === selectedWitness?.uuid || p?.uniqueId === selectedWitness?.uuid);

      // Check if we need to create or update evidence
      const evidence = activeTabs?.find((tab) => tab?.artifactNumber === currentArtifactNumber);
      if (evidence?.artifactNumber) {
        // Update existing evidence
        const updateEvidenceReqBody = {
          artifact: {
            ...evidence,
            filingType: "CASE_FILING",
            tag: obtainedTag,
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
          //   updatedTabs[tabIndex] = updatedEvidence.artifact;
          setActiveTabs(updatedTabs);
        }

        setShowErrorToast({ label: "Draft updated successfully", error: false });
      }

      // Also refresh evidence list to ensure server and client are in sync
      evidenceRefetch();
    } catch (error) {
      console.error("Error saving draft:", error);
      setShowErrorToast({ label: "Failed to save draft", error: true });
    } finally {
      setShowConfirmWitnessModal(false);
      setShowWitnessDepositionReview(true);
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

      let workflow = { ...currentEvidence?.artifact?.workflow, action };
      if (action === "INITIATE_E-SIGN") {
        workflow.assignes = [currentEvidence?.sourceID];
        workflow.additionalDetails = { excludeRoles: ["EVIDENCE_CREATOR"] };
      }

      const updateEvidenceReqBody = {
        artifact: {
          ...currentEvidence,
          file: documentsFile ? documentsFile?.[0] : documents,
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
    } catch (error) {
      console.error("Error while updating bail bond:", error);
      setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
    } finally {
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
    } catch (error) {
      console.error("Error while updating bail bond:", error);
      setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
    } finally {
      setLoader(false);
      setShowsignatureModal(false);
      setShowUploadSignature(false);
    }
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
            <button className="drawer-close-button" onClick={onClose}>
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
        <SuccessBannerModal t={t} handleCloseSuccessModal={() => setShowSuccessModal(false)} message={"WITNESS_DEPOSITION_SUCCESS_BANNER_HEADER"} />
      )}

      {showErrorToast && <Toast error={showErrorToast?.error} label={showErrorToast?.label} isDleteBtn={true} onClose={closeToast} />}
    </div>
  );
};

export default WitnessDrawerV2;
