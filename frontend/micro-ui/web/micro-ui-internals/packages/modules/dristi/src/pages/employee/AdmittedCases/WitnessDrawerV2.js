import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Dropdown, LabelFieldPair, CardLabel, Loader, Toast } from "@egovernments/digit-ui-react-components";
import { LeftArrow, CustomAddIcon, CustomDeleteIcon } from "../../../icons/svgIndex";
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
import ConfirmDepositionDeleteModal from "./ConfirmDepositionDeleteModal";
import useCaseDetailSearchService from "../../../hooks/dristi/useCaseDetailSearchService";
import { searchIndividualUserWithUuid } from "../../../../../cases/src/utils/joinCaseUtils";
import SelectCustomFormatterTextArea from "../../../components/SelectCustomFormatterTextArea";

const formatAddress = (addr) => {
  if (!addr) return "";
  // const { addressLine1 = "", addressLine2 = "", buildingName = "", street = "", city = "", pincode = "" } = addr;

  const { locality = "", city = "", district = "", state = "", pincode = "" } = addr;

  return `${locality}, ${city}, ${district}, ${state}, ${pincode}`.trim();
};

const formatAddressFromIndividualData = (addr) => {
  if (!addr) return "";
  const { addressLine1 = "", addressLine2 = "", buildingName = "", street = "", city = "", pincode = "" } = addr;

  return `${addressLine1}, ${addressLine2}, ${buildingName}, ${street}, ${city}, ${pincode}`.trim();
};

const WitnessDrawerV2 = ({
  isOpen,
  onClose,
  tenantId,
  onSubmit,
  attendees,
  // caseDetails,
  hearing,
  hearingId,
  artifactNumber = null,
  caseId,
  courtId,
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
  const [showWitnessDepositionReview, setShowWitnessDepositionReview] = useState(localStorage.getItem("showPdfPreview") || false);
  const [witnessDepositionFileStoreId, setWitnessDepositionFileStoreId] = useState("");
  const [showSignatureModal, setShowsignatureModal] = useState(false);
  const [showConfirmWitnessModal, setShowConfirmWitnessModal] = useState(false);
  const [currentArtifactNumber, setCurrentArtifactNumber] = useState(artifactNumber || localStorage.getItem("artifactNumber") || null);
  const [witnessDepositionUploadLoader, setWitnessDepositionUploadLoader] = useState(false);
  const [showWitnessDepositionESign, setShowWitnessDepositionESign] = useState(false);
  const { downloadPdf } = useDownloadCasePdf();
  const [showAddWitnessMobileNumberModal, setShowAddWitnessMobileNumberModal] = useState(false);
  const [witnesMobileNumber, setWitnessMobileNumber] = useState("");
  const [witnessDepositionSignatureURL, setWitnessDepositionSignatureURL] = useState("");
  const [showUploadSignature, setShowUploadSignature] = useState(false);
  const [loader, setLoader] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  // const [disableWitnessType, setDisableWitnessType] = useState(false);
  const [obtainedTag, setObtainedTag] = useState("");
  const [showConfirmDeleteDepositionModal, setShowConfirmDeleteDepositionModal] = useState({ show: false, tab: {} });
  const [advocatesData, setAdvocatesData] = useState([]);
  const [respondentsData, setRespondentsData] = useState([]);

  const closeToast = () => {
    setShowErrorToast(null);
  };

  const formatDepositionText = (text) => {
    if (!text) return "";
    return text.replace(/\\n/g, "<wbr>").replace(/\n/g, "<wbr>");
  };

  useEffect(() => {
    if (showErrorToast) {
      const timer = setTimeout(() => {
        setShowErrorToast(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showErrorToast]);

  const { data: apiCaseData, isLoading: caseApiLoading, refetch: refetchCaseData, isFetching: isCaseFetching } = useCaseDetailSearchService(
    {
      criteria: {
        caseId: caseId,
        ...(courtId && { courtId }),
      },
      tenantId,
    },
    {},
    `dristi-admitted-${caseId}`,
    caseId,
    Boolean(caseId)
  );

  const caseDetails = useMemo(() => apiCaseData?.cases || {}, [apiCaseData]);

  // Fetch mobile numbers for advocates when missing from local data
  useEffect(() => {
    const fetchAdvocateData = async () => {
      const advocatesWithFetchedData = await Promise.all(
        (caseDetails?.representatives || []).map(async (rep) => {
          const advocates = caseDetails?.additionalDetails?.advocateDetails?.formdata;
          let ownerType = "";
          for (let i = 0; i < rep?.representing?.length; i++) {
            const represetingObj = rep?.representing?.[i];
            if (represetingObj?.partyType?.toLowerCase().includes("respondent")) {
              ownerType = "ACCUSED";
            } else if (represetingObj?.partyType?.toLowerCase().includes("complainant")) {
              ownerType = "COMPLAINANT";
            }
            break;
          }

          // First try to get mobile number from local data (your original logic)
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

          let individualData = {};
          if (rep?.additionalDetails?.uuid && tenantId) {
            try {
              individualData = await searchIndividualUserWithUuid(rep?.additionalDetails?.uuid, tenantId);
              mobileNumber = individualData?.Individual?.[0]?.mobileNumber || individualData?.Individual?.[0]?.userDetails?.username || "";
            } catch (error) {
              console.error("Error fetching individual data:", error);
            }
          }

          const tag = rep?.additionalDetails?.tag;
          const address = formatAddressFromIndividualData(individualData?.Individual?.[0]?.address?.[0]);
          return {
            name: `${rep?.additionalDetails?.advocateName} (Advocate)`,
            partyType: `ADVOCATE`,
            uuid: rep?.additionalDetails?.uuid,
            representingList: rep?.representing?.map((client) => removeInvalidNameParts(client?.additionalDetails?.fullName))?.join(", "),
            mobileNumbers: mobileNumber ? [mobileNumber] : [],
            sourceName: rep?.additionalDetails?.advocateName,
            address: address || "",
            age: "",
            designation: "",
            tag,
            ownerType,
          };
        })
      );

      setAdvocatesData(advocatesWithFetchedData);
    };

    fetchAdvocateData();
  }, [caseDetails, tenantId]);

  // Fetch mobile numbers for respondents when missing from local data
  useEffect(() => {
    const fetchRespondentData = async () => {
      const respondentsWithFetchedData = await Promise.all(
        caseDetails?.litigants
          ?.filter((item) => item?.partyType?.includes("respondent"))
          .map(async (item) => {
            const fullName = removeInvalidNameParts(item?.additionalDetails?.fullName);
            const userData = caseDetails?.additionalDetails?.respondentDetails?.formdata?.find(
              (obj) => obj?.data?.respondentVerification?.individualDetails?.individualId === item?.individualId
            );
            const uniqueId = userData?.uniqueId;
            let mobileNumber = userData?.data?.phonenumbers?.mobileNumber || [];
            const age = userData?.data?.respondentAge || "";
            let address = formatAddress(userData?.data?.addressDetails?.[0]?.addressDetails);
            const designation = "";
            const tag = item?.additionalDetails?.tag || "";

            let individualData = {};
            if (item?.additionalDetails?.uuid && tenantId) {
              try {
                individualData = await searchIndividualUserWithUuid(item?.additionalDetails?.uuid, tenantId);
                // Use API data if local data is missing or append if new number found
                const newMobileNumber = individualData?.Individual?.[0]?.mobileNumber
                  ? individualData?.Individual?.[0]?.mobileNumber
                  : individualData?.Individual?.[0]?.userDetails?.username
                  ? individualData?.Individual?.[0]?.userDetails?.username
                  : "";

                if (!mobileNumber || mobileNumber?.length === 0) {
                  mobileNumber = newMobileNumber ? [newMobileNumber] : [];
                } else if (newMobileNumber && !mobileNumber?.includes(newMobileNumber)) {
                  mobileNumber = [...mobileNumber, newMobileNumber];
                }
                if (!address) {
                  address = formatAddressFromIndividualData(individualData?.Individual?.[0]?.address?.[0]);
                }
              } catch (error) {
                console.error("Error fetching respondent individual data:", error);
              }
            }

            return {
              code: fullName,
              name: `${fullName} (Accused)`,
              uuid: item?.additionalDetails?.uuid,
              individualId: item?.individualId,
              isJoined: true,
              partyType: "respondent",
              uniqueId,
              mobileNumbers: mobileNumber?.length > 0 ? mobileNumber : [],
              sourceName: fullName,
              age,
              address: address || "",
              designation,
              tag,
              ownerType: "ACCUSED",
            };
          }) || []
      );

      setRespondentsData(respondentsWithFetchedData);
    };

    fetchRespondentData();
  }, [caseDetails, tenantId]);

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

  const evidenceList = useMemo(() => evidenceData?.artifacts?.filter((artifact) => artifact?.status === "DRAFT_IN_PROGRESS") || [], [evidenceData]);
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
              mobileNumbers: mobileNumber ? [mobileNumber] : [],
              sourceName: fullName,
              age,
              address,
              designation: "",
              tag,
              ownerType: "COMPLAINANT",
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
            mobileNumbers: mobileNumber ? [mobileNumber] : [],
            sourceName: fullName,
            tag,
            ownerType: "COMPLAINANT",
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
            mobileNumbers: mobileNumber ? [mobileNumber] : [],
            sourceName: fullName,
            age,
            address,
            designation: "",
            tag,
            ownerType: "COMPLAINANT",
          };
        }) || []
    );
  }, [caseDetails, complainants, allAdvocates]);

  const respondents = useMemo(() => respondentsData, [respondentsData]);

  const advocates = useMemo(() => advocatesData, [advocatesData]);

  const witnesses = useMemo(
    () =>
      caseDetails?.witnessDetails?.map((witness) => {
        const mobileNumber = witness?.phonenumbers?.mobileNumber;
        const address = formatAddress(witness?.addressDetails?.[0]?.addressDetails);
        const tag = witness?.witnessTag;
        const uniqueId = witness?.uniqueId || witness?.uuid;

        return {
          name: getFormattedName(witness?.firstName, witness?.middleName, witness?.lastName, witness?.witnessDesignation, "(Witness)"),
          age: witness?.witnessAge || "",
          gender: witness?.gender,
          witnessName: getFormattedName(witness?.firstName, witness?.middleName, witness?.lastName),
          designation: witness?.witnessDesignation || "",
          address,
          uniqueId,
          partyType: "witness",
          mobileNumbers: mobileNumber?.length > 0 ? mobileNumber : [],
          sourceName: getFormattedName(witness?.firstName, witness?.middleName, witness?.lastName, witness?.witnessDesignation),
          tag,
          ownerType: witness?.ownerType || "",
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
    async (evidenceList = [], isEvidenceRefetch = false) => {
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
        setCurrentArtifactNumber(null);
        setSelectedWitness({});
        setSelectedWitnessType({});
        setWitnessDepositionText(""); // Clear the text area for new draft
        isEvidenceRefetch && evidenceRefetch();
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
    if (!(currentArtifactNumber || localStorage.getItem("artifactNumber"))) {
      createNewDraft([]);
    }
  }, []);

  // Process evidence list when data is loaded
  useEffect(() => {
    if (!isEvidenceLoading) {
      const evidenceWithUnsaved = [...evidenceList];
      const artifactNumber = localStorage.getItem("artifactNumber");
      const artifactNum = currentArtifactNumber || artifactNumber;
      if (artifactNum) {
        const artifact = evidenceWithUnsaved?.find((tab) => tab?.artifactNumber === artifactNum);
        if (artifact) {
          const activeindex = evidenceWithUnsaved?.findIndex((tab) => tab?.artifactNumber === artifactNum);
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
          setWitnessDepositionText(formatDepositionText(artifact?.description) || "");
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
      // setDisableWitnessType(true);
    }

    // else if (isTag && isTag === selectedWitnessType?.value && !disableWitnessType) {
    //   setDisableWitnessType(true);
    // } else if (!isTag && disableWitnessType) {
    //   setDisableWitnessType(false);
    // }
  }, [selectedWitness, selectedWitnessType, allParties]);

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
    const currentArtifact = activeTabs?.find((t) => t?.artifactNumber === currentArtifactNumber);
    const newArtifact = activeTabs?.find((t) => t?.artifactNumber === tab?.artifactNumber);

    if (currentArtifact?.artifactNumber) {
      if (
        !isEqual(selectedWitness?.value, currentArtifact?.sourceID) ||
        !isEqual(selectedWitnessType?.value, currentArtifact?.tag) ||
        !isEqual(formatDepositionText(witnessDepositionText), formatDepositionText(currentArtifact?.description))
      ) {
        handleSaveDraft(false, tab?.artifactNumber);
      }
      setCurrentArtifactNumber(tab?.artifactNumber);
    } else if (activeTabs?.find((tab) => tab?.isNew && selectedWitness?.value)) {
      handleSaveDraft(false, currentArtifactNumber);
    }
    setCurrentArtifactNumber(tab?.artifactNumber);
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
  const filingNumber = useMemo(() => caseDetails?.filingNumber, [caseDetails]);

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

    const formattedText = formatDepositionText(witnessDepositionText);
    if (!formattedText.trim() && submit) {
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

        if (
          !backAction ||
          (backAction &&
            (!isEqual(selectedWitness?.value, evidence?.sourceID) ||
              !isEqual(selectedWitnessType?.value, evidence?.tag) ||
              !isEqual(formatDepositionText(witnessDepositionText), formatDepositionText(evidence?.description))))
        ) {
          // Update existing evidence
          const updateEvidenceReqBody = {
            artifact: {
              ...evidence,
              sourceType: selectedWitnessType.value === "PW" ? "COMPLAINANT" : selectedWitnessType.value === "DW" ? "ACCUSED" : "COURT",
              tag: selectedWitnessType?.value,
              sourceID: selectedWitness.value,
              sourceName: party?.sourceName,
              description: formatDepositionText(witnessDepositionText),
              additionalDetails: {
                witnessDetails: {
                  address: party?.address || "",
                  designation: party?.designation || "",
                  age: party?.age || "",
                  ownerType: party?.ownerType || "",
                  name: party?.witnessName || party?.sourceName || "",
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

          setShowErrorToast({ label: t("WITNESS_DEPOSITION_UPDATED_SUCCESSFULLY"), error: false });
        }
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
            description: formatDepositionText(witnessDepositionText),
            additionalDetails: {
              witnessDetails: {
                address: party?.address || "",
                designation: party?.designation || "",
                age: party?.age || "",
                ownerType: party?.ownerType || "",
                name: party?.witnessName || party?.sourceName || "",
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
      if (submit) {
        if (!isWitnessTypeDisabled) {
          setShowConfirmWitnessModal(true);
        } else {
          setShowWitnessDepositionReview(true);
        }
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
    } finally {
      setLoader(false);
      if (backAction) {
        onClose();
      }
    }
  };

  const isWitnessTypeDisabled = useMemo(() => {
    const party = allParties?.find((p) => p?.uuid === selectedWitness?.value || p?.uniqueId === selectedWitness?.value);

    // Check if tag ends with a number
    const hasNumberSuffix = (tag) => {
      if (!tag || !tag.trim()) return false;
      return /\d+$/.test(tag); // same as Java's ".*\\d+$"
    };

    return hasNumberSuffix(party?.tag);
  }, [selectedWitness, allParties]);

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
        // if (updatedEvidence?.artifact) {
        //   const updatedTabs = [...activeTabs];
        //   setActiveTabs(updatedTabs);
        //   setCurrentEvidence(updatedEvidence?.artifact);
        // }

        setShowErrorToast({ label: t("WITNESS_MARKED_SUCCESSFULLY"), error: false });
        localStorage.setItem("artifactNumber", updatedEvidence?.artifact?.artifactNumber);
        localStorage.setItem("showPdfPreview", true);
        setCurrentEvidence(updatedEvidence?.artifact);
        setCurrentArtifactNumber(updatedEvidence?.artifact?.artifactNumber);

        // setDisableWitnessType(true);
        setShowWitnessDepositionReview(true);
        setShowConfirmWitnessModal(false);
      }

      evidenceRefetch();
      refetchCaseData();
    } catch (error) {
      console.error("Failed to save witness marking:", error);
      setShowErrorToast({ label: t("FAILED_TO_SAVE_WITNESS_MARKING"), error: true });
    } finally {
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
              additionalDetails: { name: `${t("WITNESS_DEPOSITION")} (${selectedWitnessType?.value || ""})` },
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
      if (currentParty?.mobileNumbers?.length > 0) {
        witnessMobileNum = currentParty?.mobileNumbers;
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
      setWitnessDepositionText("");
    }
  };

  const handleCloseWitnessDrawer = () => {
    handleSaveDraft(null, null, true);
  };

  const handleConfirmDeleteDeposition = async (selectedTab) => {
    try {
      if (!selectedTab?.artifactNumber) {
        const deletedEvidenceIndex = activeTabs?.length - 1;
        const updatedActiveTabs = activeTabs?.filter((tab) => tab?.artifactNumber);
        setActiveTabs(updatedActiveTabs);
        const newCurrentEvidence = updatedActiveTabs?.[deletedEvidenceIndex - 1];
        if (newCurrentEvidence?.artifactNumber) {
          setCurrentEvidence(newCurrentEvidence);
          setCurrentArtifactNumber(newCurrentEvidence?.artifactNumber);
        } else {
          setCurrentArtifactNumber(null);
        }
        // evidenceRefetch();
        return;
      }

      // If the witness deposition has artifact number.
      const evidence = activeTabs?.find((tab) => tab?.artifactNumber === selectedTab?.artifactNumber);
      const party = allParties?.find((p) => p?.uuid === selectedWitness?.value || p?.uniqueId === selectedWitness?.value);
      const deletedEvidenceIndex = activeTabs?.findIndex((tab) => tab?.artifactNumber === selectedTab?.artifactNumber);

      if (evidence?.artifactNumber) {
        // Update existing evidence
        setLoader(true);
        const updateEvidenceReqBody = {
          artifact: {
            ...evidence,
            tag: evidence?.tag,
            sourceID: evidence?.sourceID,
            sourceName: evidence?.sourceName,
            isActive: false,
            workflow: {
              action: "DELETE_DRAFT",
            },
          },
        };

        const updatedEvidence = await DRISTIService.updateEvidence(updateEvidenceReqBody);
        setShowErrorToast({ label: t("WITNESS_DEPOSITION_DELETED_SUCCESSFULLY"), error: false });
        const updatedActiveTabs = activeTabs?.filter((tab) => tab?.artifactNumber !== selectedTab?.artifactNumber);
        setActiveTabs(updatedActiveTabs);
        if (deletedEvidenceIndex === activeTabs?.length - 1) {
          const newCurrentEvidence = updatedActiveTabs?.[deletedEvidenceIndex - 1];
          if (newCurrentEvidence?.artifactNumber) {
            setCurrentEvidence(newCurrentEvidence);
            setCurrentArtifactNumber(newCurrentEvidence?.artifactNumber);
          } else {
            setCurrentArtifactNumber(null);
          }
        } else {
          const newCurrentEvidence = updatedActiveTabs?.[deletedEvidenceIndex];
          if (newCurrentEvidence?.artifactNumber) {
            setCurrentEvidence(newCurrentEvidence);
            setCurrentArtifactNumber(newCurrentEvidence?.artifactNumber);
          } else {
            setCurrentArtifactNumber(null);
            setActiveTabs(updatedActiveTabs);
          }
        }
        setShowConfirmDeleteDepositionModal({ show: false, tab: {} });
        evidenceRefetch();
      }
    } catch (error) {
      console.error("Error while deleting witness deposition bond:", error);
      setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
    } finally {
      setLoader(false);
    }
  };

  const handleAddNewDepositionDraft = async () => {
    if (!selectedWitness?.value) {
      setShowErrorToast({ label: t("PLEASE_SELECT_WITNESS_FIRST"), error: true });

      return;
    }

    if (!selectedWitnessType?.value) {
      setShowErrorToast({ label: t("PLEASE_MARK_WITNESS"), error: true });
      return;
    }

    try {
      setLoader(true);

      const party = allParties?.find((p) => p?.uuid === selectedWitness?.value || p?.uniqueId === selectedWitness?.value);
      // Check if we need to create or update evidence
      const artifactNum = artifactNumber || currentArtifactNumber;
      if (artifactNum) {
        const currentActiveIndex = activeTabs?.findIndex((tab) => tab?.artifactNumber === artifactNum);
        const evidence = activeTabs?.find((tab) => tab?.artifactNumber === artifactNum);

        if (
          !isEqual(selectedWitness?.value, evidence?.sourceID) ||
          !isEqual(selectedWitnessType?.value, evidence?.tag) ||
          !isEqual(formatDepositionText(witnessDepositionText), formatDepositionText(evidence?.description))
        ) {
          // Update existing evidence
          const updateEvidenceReqBody = {
            artifact: {
              ...evidence,
              sourceType: selectedWitnessType.value === "PW" ? "COMPLAINANT" : selectedWitnessType.value === "DW" ? "ACCUSED" : "COURT",
              tag: selectedWitnessType?.value,
              sourceID: selectedWitness.value,
              sourceName: party?.sourceName,
              description: formatDepositionText(witnessDepositionText),
              additionalDetails: {
                witnessDetails: {
                  address: party?.address || "",
                  designation: party?.designation || "",
                  age: party?.age || "",
                  ownerType: party?.ownerType || "",
                  name: party?.witnessName || party?.sourceName || "",
                },
              },
              isEvidenceMarkedFlow: false,
              workflow: {
                action: "SAVE_DRAFT",
              },
            },
          };

          const updatedEvidence = await DRISTIService.updateEvidence(updateEvidenceReqBody);

          if (updatedEvidence?.artifact) {
            // Update the activeTabs array by replacing the updated evidence object
            const updatedTabs = [...activeTabs];
            if (currentActiveIndex !== -1) {
              updatedTabs[currentActiveIndex] = updatedEvidence.artifact;
              setActiveTabs(updatedTabs);
              setCurrentEvidence(updatedEvidence.artifact);
              setShowErrorToast({ label: t("WITNESS_DEPOSITION_UPDATED_SUCCESSFULLY"), error: false });
              setCurrentArtifactNumber(null);
              createNewDraft(updatedTabs, true);
            }
          }
        } else {
          setCurrentArtifactNumber(null);
          createNewDraft(activeTabs, true);
        }
      } else {
        // Create new evidence
        const currentActiveIndex = activeTabs?.findIndex((tab) => !tab?.artifactNumber);

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
            description: formatDepositionText(witnessDepositionText),
            additionalDetails: {
              witnessDetails: {
                address: party?.address || "",
                designation: party?.designation || "",
                age: party?.age || "",
                ownerType: party?.ownerType || "",
                name: party?.witnessName || party?.sourceName || "",
              },
            },
            comments: [],
            workflow: {
              action: "SAVE_DRAFT",
            },
          },
        };

        const updatedEvidence = await submissionService.createEvidence(createEvidenceReqBody);

        if (updatedEvidence?.artifact) {
          // Update the activeTabs array by replacing the updated evidence object
          const updatedTabs = [...activeTabs];
          if (currentActiveIndex !== -1) {
            updatedTabs[currentActiveIndex] = updatedEvidence.artifact;
            setActiveTabs(updatedTabs);
            setCurrentEvidence(updatedEvidence.artifact);
            setShowErrorToast({ label: t("WITNESS_DEPOSITION_UPDATED_SUCCESSFULLY"), error: false });
            setCurrentArtifactNumber(null);
            createNewDraft(updatedTabs, true);
          }
        }
      }

      // Also refresh evidence list to ensure server and client are in sync
    } catch (error) {
      console.error("Error saving draft:", error);
      setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
    } finally {
      setLoader(false);
    }
  };

  const CONFIG_KEY = "witnessDeposition";
  const FIELD_NAME = "comment";

  const formData = {
    [CONFIG_KEY]: {
      [FIELD_NAME]: IsSelectedWitness ? witnessDepositionText : "",
    },
  };

  const onSelect = (key, value) => {
    if (key === CONFIG_KEY && value?.[FIELD_NAME] !== undefined) {
      setWitnessDepositionText(value[FIELD_NAME]);
    }
  };

  if (isFilingTypeLoading || isEvidenceLoading || caseApiLoading) {
    return <Loader />;
  }

  const isDisabled = isProceeding;

  const config = {
    key: CONFIG_KEY,
    disable: isDisabled,
    populators: {
      inputs: [
        {
          name: FIELD_NAME,
          rows: 10,
          isOptional: false,
          style: {
            width: "100%",
            minHeight: "40vh",
            fontSize: "large",
            opacity: isDisabled ? 0.5 : 1,
            pointerEvents: !IsSelectedWitness ? "unset !important" : "auto",
            backgroundColor: isDisabled ? "#f5f5f5" : "white",
            color: isDisabled ? "#666" : "black",
          },
        },
      ],
    },
    disableScrutinyHeader: true,
  };
  return (
    <React.Fragment>
      <style>
        {`
        .rdw-editor-wrapper{
          height: 375px;
          }
        `}
      </style>
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

              <div className="witness-tabs" style={{ display: "flex", marginTop: "16px", borderBottom: "1px solid #d6d5d4", overflowX: "auto" }}>
                {/* Display tabs for both evidence list items and unsaved drafts */}
                {activeTabs?.map((tab, index) => (
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
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "8px",
                    }}
                  >
                    <span>{tab?.isNew ? `${t("CS_DEPOSITION")} (${t("UNSAVED")})` : `${t("CS_DEPOSITION")} (${tab?.sourceName})`}</span>
                    <span
                      style={{
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        marginLeft: "8px",
                      }}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent tab change when clicking delete
                        if (tab?.artifactNumber) {
                          setShowConfirmDeleteDepositionModal({ show: true, tab: tab });
                        } else {
                          handleConfirmDeleteDeposition(tab);
                        }
                      }}
                    >
                      <CustomDeleteIcon />
                    </span>
                  </div>
                ))}
                {/* Add new tab button */}
                {
                  <div
                    className="witness-tab add-tab"
                    onClick={() => handleAddNewDepositionDraft()}
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
                }
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", margin: "16px 0px 0px" }}>
                <LabelFieldPair>
                  <CardLabel className="case-input-label">{t("ALL_PARTIES")}</CardLabel>
                  <Dropdown
                    t={t}
                    option={options?.sort((a, b) => a?.label?.localeCompare(b?.label))}
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
                    option={witnessTypeOptions?.sort((a, b) => a?.label?.localeCompare(b?.label))}
                    optionKey={"label"}
                    select={handleWitnessTypeChange}
                    freeze={true}
                    disable={isProceeding || isWitnessTypeDisabled}
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

              <div style={{ gap: "16px", border: "1px solid" }} className="witness-editor">
                <SelectCustomFormatterTextArea
                  key={`${activeTabIndex}-${selectedWitness?.value}-${currentArtifactNumber}`}
                  t={t}
                  config={config}
                  formData={formData}
                  onSelect={onSelect}
                  errors={{}}
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
            isEmployee={true}
            onAddSuccess={() => {
              setWitnessModalOpen(false);
              refetchCaseData();
            }}
            showToast={setShowErrorToast}
            style={{ top: "57%" }}
          ></AddWitnessModal>
        )}

        {showWitnessDepositionReview && (
          <WitnessDepositionReviewModal
            t={t}
            handleBack={() => {
              setShowWitnessDepositionReview(false);
              localStorage.removeItem("artifactNumber");
              localStorage.removeItem("showPdfPreview");
            }}
            setShowWitnessDepositionReview={setShowWitnessDepositionReview}
            setShowsignatureModal={setShowsignatureModal}
            currentEvidence={currentEvidence}
            courtId={caseCourtId}
            cnrNumber={cnrNumber}
            filingNumber={filingNumber}
            setWitnessDepositionFileStoreId={setWitnessDepositionFileStoreId}
            tag={obtainedTag || selectedWitnessType?.value}
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
            allParties={allParties}
            mainHeader={"CS_ADD_WITNESS_MOBILE_NUMBER"}
            selectedPartyId={selectedWitness?.value}
          />
        )}

        {showWitnessDepositionESign && (
          <WitnessDepositionESignLockModal
            t={t}
            handleSaveOnSubmit={() => {
              setShowWitnessDepositionESign(false);
              evidenceRefetch();
            }}
            url={witnessDepositionSignatureURL}
            header={"WITNESS_DEPOSITION_BANNER_HEADER"}
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

        {showConfirmDeleteDepositionModal?.show && (
          <ConfirmDepositionDeleteModal
            t={t}
            selectedWitness={selectedWitness}
            allParties={allParties}
            onCancel={() => setShowConfirmDeleteDepositionModal({ show: false, tab: {} })}
            onSubmit={() => handleConfirmDeleteDeposition(showConfirmDeleteDepositionModal?.tab)}
            name={showConfirmDeleteDepositionModal?.tab?.sourceName}
            saveLabel={"CS_CONFIRM_DELETE_DEPOSITION"}
            mainHeader={"DELETE_WITNESS_DEPOSITION"}
            confirmMessage1={"ARE_YOU_SURE_YOU_WANT_TO_DELETE_DEPOSITION"}
            confirmMessage2={"PLEASE_CONFIRM_DELETE_DEPOSITION"}
          />
        )}
        {showSuccessModal && (
          <SuccessBannerModal
            t={t}
            handleCloseSuccessModal={() => {
              setShowSuccessModal(false);
              evidenceRefetch();
              setCurrentEvidence(null);
              setWitnessDepositionUploadLoader(false);
              setWitnessDepositionText("");
            }}
            message={"WITNESS_DEPOSITION_SUCCESS_BANNER_HEADER"}
          />
        )}

        {showErrorToast && <Toast error={showErrorToast?.error} label={showErrorToast?.label} isDleteBtn={true} onClose={closeToast} />}
      </div>
    </React.Fragment>
  );
};

export default WitnessDrawerV2;
