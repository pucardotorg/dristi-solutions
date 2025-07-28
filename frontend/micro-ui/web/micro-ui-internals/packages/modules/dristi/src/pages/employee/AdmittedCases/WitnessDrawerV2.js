import React, { useState, useEffect, useMemo, useRef } from "react";
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

const WitnessDrawerV2 = ({ isOpen, onClose, tenantId, onSubmit, attendees, caseDetails, hearing, hearingId, setAddPartyModal }) => {
  const { t } = useTranslation();
  const textAreaRef = useRef(null);
  const [options, setOptions] = useState([]);
  const [witnessTypeOptions] = useState([
    { label: "PW", value: "PW" },
    { label: "DW", value: "DW" },
    { label: "CW", value: "CW" },
  ]);
  const [selectedWitnessType, setSelectedWitnessType] = useState({ label: "PW", value: "PW" });
  const [selectedWitness, setSelectedWitness] = useState({});
  const [witnessDepositionText, setWitnessDepositionText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProceeding, setIsProceeding] = useState(false);
  const [hearingData, setHearingData] = useState(hearing);
  const [witnessModalOpen, setWitnessModalOpen] = useState(false);
  const [signedDocumentUploadID, setSignedDocumentUploadID] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState({});
  const [activeTabs, setActiveTabs] = useState([]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [currentEvidence, setCurrentEvidence] = useState(null);
  const [showErrorToast, setShowErrorToast] = useState(null);
  const userInfo = Digit?.UserService?.getUser?.()?.info;
  const isInitialLoad = useRef(true);

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

  const evidenceList = useMemo(() => evidenceData?.artifacts?.[0], [evidenceData]);

  const { data: filingTypeData, isLoading: isFilingTypeLoading } = Digit.Hooks.dristi.useGetStatuteSection("common-masters", [
    { name: "FilingType" },
  ]);

  const filingType = useMemo(() => getFilingType(filingTypeData?.FilingType, "Direct"), [filingTypeData?.FilingType]);

  const onClickAddWitness = () => {
    setAddPartyModal(true);
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
            return {
              code: fullName,
              name: `${fullName} (Complainant, PoA Holder)`,
              uuid: allAdvocates[item?.additionalDetails?.uuid],
              partyUuid: item?.additionalDetails?.uuid,
              individualId: item?.individualId,
              isJoined: true,
              partyType: "complainant",
              representingLitigants: poaHolder?.representingLitigants?.map((lit) => lit?.individualId),
            };
          }
          return {
            code: fullName,
            name: `${fullName} (Complainant)`,
            uuid: allAdvocates[item?.additionalDetails?.uuid],
            partyUuid: item?.additionalDetails?.uuid,
            individualId: item?.individualId,
            isJoined: true,
            partyType: "complainant",
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
          return {
            code: fullName,
            name: `${fullName} (PoA Holder)`,
            representingLitigants: item?.representingLitigants?.map((lit) => lit?.individualId),
            individualId: item?.individualId,
            isJoined: true,
            partyType: "poaHolder",
          };
        }) || []
    );
  }, [caseDetails, complainants]);

  const respondents = useMemo(() => {
    return (
      caseDetails?.litigants
        ?.filter((item) => item?.partyType?.includes("respondent"))
        .map((item) => {
          const fullName = removeInvalidNameParts(item?.additionalDetails?.fullName);
          const uniqueId = caseDetails?.additionalDetails?.respondentDetails?.formdata?.find(
            (obj) => obj?.data?.respondentVerification?.individualDetails?.individualId === item?.individualId
          )?.uniqueId;
          return {
            code: fullName,
            name: `${fullName} (Accused)`,
            uuid: allAdvocates[item?.additionalDetails?.uuid],
            partyUuid: item?.additionalDetails?.uuid,
            individualId: item?.individualId,
            isJoined: true,
            partyType: "respondent",
            uniqueId,
          };
        }) || []
    );
  }, [caseDetails, allAdvocates]);

  const unJoinedLitigant = useMemo(() => {
    return (
      caseDetails?.additionalDetails?.respondentDetails?.formdata
        ?.filter((data) => !data?.data?.respondentVerification?.individualDetails?.individualId)
        ?.map((data) => {
          const fullName = constructFullName(data?.data?.respondentFirstName, data?.data?.respondentMiddleName, data?.data?.respondentLastName);
          return {
            code: fullName,
            name: `${fullName} (Accused)`,
            uuid: data?.data?.uuid,
            isJoined: false,
            partyType: "respondent",
            uniqueId: data?.uniqueId,
          };
        }) || []
    );
  }, [caseDetails]);

  const allParties = useMemo(() => [...complainants, ...poaHolders, ...respondents, ...unJoinedLitigant], [
    complainants,
    poaHolders,
    respondents,
    unJoinedLitigant,
  ]);

  // Process evidence list when data is loaded
  useEffect(() => {
    if (evidenceList?.length > 0) {
      // Use the whole evidence list directly
      const evidenceWithUnsaved = [...evidenceList];

      // Preserve any unsaved tabs that might exist
      const unsavedTabs = activeTabs?.filter((tab) => tab?.isNew);
      if (unsavedTabs?.length > 0) {
        evidenceWithUnsaved?.push(...unsavedTabs);
      }

      setActiveTabs(evidenceWithUnsaved);

      // Set the first tab as active if there are tabs and no tab is currently selected
      if (evidenceWithUnsaved.length > 0 && activeTabIndex === -1) {
        setActiveTabIndex(0);
        const firstTab = evidenceWithUnsaved[0];
        setCurrentEvidence(firstTab);

        // Update witness deposition text from tab content
        setWitnessDepositionText(firstTab?.description || "");

        // Try to find matching witness in options
        if (firstTab?.sourceName) {
          const matchingWitness = options?.find((opt) => opt?.value === firstTab?.sourceID);
          if (matchingWitness) {
            setSelectedWitness({ uuid: matchingWitness?.value });
          }
        }

        // Set witness type based on tab source type
        const witnessType = firstTab.sourceType === "COMPLAINANT" ? "PW" : firstTab.sourceType === "ACCUSED" ? "DW" : "CW";
        setSelectedWitnessType({ label: witnessType, value: witnessType });
      }
    } else if (isInitialLoad.current) {
      // If no evidence and it's initial load, reset tabs
      setActiveTabs([]);
      setActiveTabIndex(-1);
    }

    // Mark that initial load is complete
    isInitialLoad.current = false;
  }, [evidenceList, options, activeTabIndex, activeTabs]);

  useEffect(() => {
    if (caseDetails) {
      setAdditionalDetails(caseDetails?.additionalDetails);
      const witnessOptions =
        caseDetails?.additionalDetails?.witnessDetails?.formdata?.map((witness) => ({
          label: getFormattedName(witness?.data?.firstName, witness?.data?.middleName, witness?.data?.lastName, witness?.data?.witnessDesignation),
          value: witness.data.uuid,
        })) || [];

      const advocateOptions =
        caseDetails?.representatives?.map((rep) => ({
          label: rep?.additionalDetails?.advocateName,
          value: rep?.advocateId,
        })) || [];

      const partiesOption =
        allParties
          ?.filter((party) => party?.isJoined === true)
          .map((party) => ({
            label: party?.name,
            value: party?.partyType === "poaHolder" ? party?.individualId : party?.partyUuid,
          })) || [];

      const combinedOptions = [...witnessOptions, ...advocateOptions, ...partiesOption];
      setOptions(combinedOptions);

      // Only set default witness if no tabs are active and it's the initial load
      if (isInitialLoad.current && activeTabs.length === 0) {
        const selectedWitnessDefault = caseDetails?.additionalDetails?.witnessDetails?.formdata?.[0]?.data || {};
        setSelectedWitness(selectedWitnessDefault);
        setWitnessDepositionText(
          hearingData?.additionalDetails?.witnessDepositions?.find((witness) => witness.uuid === selectedWitnessDefault?.uuid)?.deposition || ""
        );
        isInitialLoad.current = false;
      }
    }
  }, [caseDetails, hearingData, allParties, activeTabs.length]);

  // Handle witness type dropdown change
  const handleWitnessTypeChange = (option) => {
    setSelectedWitnessType(option);
  };

  // Handle tab change
  const handleTabChange = async (index) => {
    // If current tab has content, save it before switching
    activeTabs?.forEach((tab) => {
      handleSaveDraft(tab);
    });
    if (index === activeTabs.length) {
      // This is the + tab, create a new draft
      createNewDraft();
    } else {
      // Switch to existing tab
      setActiveTabIndex(index);

      // Get the tab data
      const tab = activeTabs[index];
      if (tab) {
        // Update witness deposition text from tab content
        setWitnessDepositionText(tab.content || "");

        // Try to find matching witness in options
        const matchingWitness = options.find((opt) => opt.label.includes(tab.sourceName) || (tab.sourceID && opt.value === tab.sourceID));

        if (matchingWitness) {
          setSelectedWitness({ uuid: matchingWitness.value });
        }

        // Set witness type based on tab source type
        const witnessType = tab.sourceType === "COMPLAINANT" ? "PW" : tab.sourceType === "ACCUSED" ? "DW" : "CW";
        setSelectedWitnessType({ label: witnessType, value: witnessType });
      }
    }
  };

  // Create a new draft
  const createNewDraft = async () => {
    try {
      // Create a new draft with the current witness
      if (!selectedWitness?.uuid) {
        setShowErrorToast({ label: "Please select a witness first", error: true });
        return;
      }

      // Create a new temporary tab with the same structure as evidence items
      const newTab = {
        artifactNumber: null, // Will be set after saving
        sourceName: "Deposition", // Default name until saved
        sourceType: selectedWitnessType.value === "PW" ? "COMPLAINANT" : selectedWitnessType.value === "DW" ? "ACCUSED" : "COURT",
        sourceID: selectedWitness.uuid,
        content: "",
        artifactType: "WITNESS_DEPOSITION",
        caseId: caseDetails?.id,
        filingNumber: caseDetails?.filingNumber,
        tenantId,
        isNew: true, // Flag to identify unsaved tabs
      };

      // Add the new tab to the list and set it as active
      const updatedTabs = [...activeTabs, newTab];
      setActiveTabs(updatedTabs);
      setActiveTabIndex(updatedTabs.length - 1);
      setWitnessDepositionText(""); // Clear the text area for new draft

      // No need to call API yet - we'll create the evidence when user saves the draft
      setShowErrorToast({ label: "New draft created. Enter content and click Save Draft to save.", error: false });
    } catch (error) {
      console.error("Error creating draft:", error);
      setShowErrorToast({ label: "Failed to create new draft", error: true });
    }
  };

  const isDepositionSaved = useMemo(() => {
    return (
      hearingData?.additionalDetails?.witnessDepositions?.find((witness) => witness.uuid === selectedWitness?.uuid)?.isDepositionSaved === true ||
      hearingData?.additionalDetails?.witnessDepositions?.find((witness) => witness.uuid === selectedWitness?.uuid)?.isDepositionSaved === true
    );
  }, [selectedWitness, hearingData]);

  const handleDropdownChange = (selectedPartyOption) => {
    const selectedUUID = selectedPartyOption.value;
    let selectedData = additionalDetails?.witnessDetails?.formdata?.find((w) => w.data.uuid === selectedUUID)?.data;
    if (!selectedData) {
      const attendee = hearingData?.attendees?.find((a) => a.individualId === selectedUUID);
      if (attendee) {
        selectedData = {
          ...attendee,
          uuid: attendee.individualId,
        };
      }
    }
    if (!selectedData) {
      const party = allParties?.find((p) => p.partyUuid === selectedUUID);
      if (party) {
        selectedData = {
          ...party,
          uuid: party.partyUuid,
        };
      }
    }
    if (!selectedData) {
      const advocate = caseDetails?.representatives?.find((adv) => adv?.advocateId === selectedUUID);
      if (advocate) {
        selectedData = {
          ...advocate,
          uuid: advocate?.advocateId,
        };
      }
    }
    setSelectedWitness(selectedData || {});
    setWitnessDepositionText(hearingData?.additionalDetails?.witnessDepositions?.find((w) => w.uuid === selectedUUID)?.deposition || "");
  };

  const IsSelectedWitness = useMemo(() => {
    return !isEmpty(selectedWitness);
  }, [selectedWitness]);

  // Save witness deposition - either as draft or final
  const saveWitnessDeposition = async (saveAsDraft = false) => {
    if (!hearingData) return;

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
    setWitnessModalOpen(true);

    const updatedHearing = structuredClone(hearingData || {});
    updatedHearing.additionalDetails = updatedHearing.additionalDetails || {};
    updatedHearing.additionalDetails.witnessDepositions = updatedHearing.additionalDetails.witnessDepositions || [];
    // Find the index of the selected witness in witnessDepositions
    const witnessIndex = updatedHearing.additionalDetails.witnessDepositions.findIndex((witness) => witness.uuid === selectedWitness?.uuid);

    if (!isDepositionSaved) {
      if (witnessIndex !== -1) {
        // existing ones
        updatedHearing.additionalDetails.witnessDepositions[witnessIndex] = {
          ...updatedHearing.additionalDetails.witnessDepositions[witnessIndex],
          deposition: witnessDepositionText,
          isDepositionSaved: false,
        };
      } else {
        updatedHearing.additionalDetails.witnessDepositions.push({
          ...selectedWitness,
          deposition: witnessDepositionText,
          isDepositionSaved: false,
          uuid: selectedWitness?.uuid,
        });
      }
    }
  };

  const handleClose = () => {
    setWitnessModalOpen(false);
  };

  const handleSaveDraft = async (evidence) => {
    try {
      // if (!selectedWitness?.uuid) {
      //   setShowErrorToast({ label: "Please select a witness first", error: true });
      //   return;
      // }

      // if (!witnessDepositionText.trim()) {
      //   setShowErrorToast({ label: "Please enter deposition content", error: true });
      //   return;
      // }

      // Prepare witness name
      const witnessName = getFormattedName(
        selectedWitness?.firstName || selectedWitness?.name || selectedWitness?.additionalDetails?.advocateName,
        selectedWitness?.middleName,
        selectedWitness?.lastName,
        selectedWitness?.witnessDesignation
      );

      // Check if we need to create or update evidence
      if (evidence && evidence?.artifactNumber) {
        // Update existing evidence
        const updateEvidenceReqBody = {
          artifact: {
            artifactType: "WITNESS_DEPOSITION",
            artifactNumber: evidence.artifactNumber,
            caseId: caseDetails?.id,
            filingNumber: caseDetails?.filingNumber,
            tenantId,
            sourceType: selectedWitnessType.value === "PW" ? "COMPLAINANT" : selectedWitnessType.value === "DW" ? "ACCUSED" : "COURT",
            sourceID: selectedWitness.uuid,
            sourceName: witnessName,
            filingType: filingType,
            content: witnessDepositionText,
            additionalDetails: {
              uuid: userInfo?.uuid,
              witnessType: selectedWitnessType.value,
            },
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
      } else {
        // Create new evidence
        const createEvidenceReqBody = {
          artifact: {
            artifactType: "WITNESS_DEPOSITION",
            caseId: caseDetails?.id,
            filingNumber: caseDetails?.filingNumber,
            tenantId,
            sourceType: selectedWitnessType.value === "PW" ? "COMPLAINANT" : selectedWitnessType.value === "DW" ? "ACCUSED" : "COURT",
            sourceID: selectedWitness.uuid,
            sourceName: witnessName,
            filingType: filingType,
            content: witnessDepositionText,
            additionalDetails: {
              uuid: userInfo?.uuid,
              witnessType: selectedWitnessType.value,
            },
          },
        };

        const newEvidence = await DRISTIService.createEvidence(createEvidenceReqBody);

        // Update the tab in activeTabs directly with the new evidence
        if (newEvidence?.artifact) {
          const updatedTabs = [...activeTabs];
          if (activeTabs.length > 0 && activeTabs[activeTabIndex].isNew) {
            // Replace the unsaved tab with the new evidence
            updatedTabs[activeTabIndex] = newEvidence.artifact;
          } else {
            // Add as a new tab
            updatedTabs.push(newEvidence.artifact);
            setActiveTabIndex(updatedTabs.length - 1);
          }
          setActiveTabs(updatedTabs);
        }

        setShowErrorToast({ label: "New draft created successfully", error: false });
      }

      // Also refresh evidence list to ensure server and client are in sync
      evidenceRefetch();
    } catch (error) {
      console.error("Error saving draft:", error);
      setShowErrorToast({ label: "Failed to save draft", error: true });
    }
  };

  const handleProceed = async () => {
    try {
      setIsProceeding(true);
      const updatedHearing = structuredClone(hearingData || {});
      updatedHearing.additionalDetails = updatedHearing.additionalDetails || {};
      updatedHearing.additionalDetails.witnessDepositions = updatedHearing.additionalDetails.witnessDepositions || [];
      const witnessIndex = updatedHearing.additionalDetails.witnessDepositions.findIndex((witness) => witness.uuid === selectedWitness?.uuid);

      if (!isDepositionSaved) {
        if (witnessIndex !== -1) {
          // check for existing one
          updatedHearing.additionalDetails.witnessDepositions[witnessIndex].isDepositionSaved = true;
        } else {
          updatedHearing.additionalDetails.witnessDepositions.push({
            ...selectedWitness,
            isDepositionSaved: true,
          });
        }
      }
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

  if (isFilingTypeLoading) {
    return <Loader />;
  }

  return (
    <div className="bottom-drawer-wrapper">
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

            <div className="witness-tabs" style={{ display: "flex", marginTop: "16px", borderBottom: "1px solid #d6d5d4" }}>
              {/* Display tabs for both evidence list items and unsaved drafts */}
              {activeTabs.map((tab, index) => (
                <div
                  key={tab.artifactNumber || `new-tab-${index}`}
                  className={`witness-tab ${activeTabIndex === index ? "active" : ""}`}
                  onClick={() => handleTabChange(index)}
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
                  {tab.isNew ? t("CS_DEPOSITION") : `${t("CS_DEPOSITION")} (${tab.sourceName || "Deposition"})`}
                </div>
              ))}
              {/* Add new tab button */}
              <div
                className="witness-tab add-tab"
                onClick={() => handleTabChange(activeTabs.length)}
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", margin: "16px 0px 8px" }}>
              <LabelFieldPair>
                <CardLabel className="case-input-label">{t("ALL_PARTIES")}</CardLabel>
                <Dropdown
                  t={t}
                  option={options}
                  optionKey={"label"}
                  select={handleDropdownChange}
                  freeze={true}
                  disable={isProceeding}
                  selected={
                    IsSelectedWitness
                      ? {
                          label: getFormattedName(
                            selectedWitness?.firstName || selectedWitness?.name || selectedWitness?.additionalDetails?.advocateName,
                            selectedWitness?.middleName,
                            selectedWitness?.lastName,
                            selectedWitness?.witnessDesignation
                          ),
                          value: selectedWitness?.uuid,
                        }
                      : {}
                  }
                  style={{ width: "100%", height: "40px", fontSize: "16px", marginBottom: "0px" }}
                />
              </LabelFieldPair>
              <LabelFieldPair>
                <CardLabel className="case-input-label">{`Select Witness Type`}</CardLabel>
                <Dropdown
                  t={t}
                  option={witnessTypeOptions}
                  optionKey={"label"}
                  select={handleWitnessTypeChange}
                  freeze={true}
                  disable={isProceeding}
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

            <div style={{ gap: "16px", border: "1px solid", marginTop: "2px" }}>
              <TextArea
                ref={textAreaRef}
                style={{
                  width: "100%",
                  minHeight: "40vh",
                  fontSize: "large",
                  ...((isDepositionSaved || !IsSelectedWitness) && {
                    pointerEvents: "unset !important",
                  }),
                }}
                value={IsSelectedWitness ? witnessDepositionText || "" : ""}
                onChange={(e) => setWitnessDepositionText(e.target.value)}
                disabled={isDepositionSaved || !IsSelectedWitness || isProceeding}
              />
              {!isDepositionSaved && IsSelectedWitness && (
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
                onButtonClick={() => handleSaveDraft(currentEvidence)}
                style={{
                  width: "130px",
                  backgroundColor: "#fff",
                  color: "#0B6265",
                  border: "1px solid #0B6265",
                }}
              />
              <Button
                label={t("SAVE")}
                isDisabled={isDepositionSaved || !IsSelectedWitness || isProceeding}
                className={"order-drawer-save-btn"}
                onButtonClick={saveWitnessDeposition}
                style={{
                  width: "110px",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {witnessModalOpen && (
        <WitnessModal
          isProceeding={isProceeding}
          handleClose={handleClose}
          hearingId={hearingId}
          setSignedDocumentUploadID={setSignedDocumentUploadID}
          handleProceed={handleProceed}
        />
      )}

      {showErrorToast && <Toast error={showErrorToast?.error} label={showErrorToast?.label} isDleteBtn={true} onClose={closeToast} />}
    </div>
  );
};

export default WitnessDrawerV2;
