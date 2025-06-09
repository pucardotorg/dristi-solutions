import React, { useState, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Dropdown, LabelFieldPair, CardLabel, Loader } from "@egovernments/digit-ui-react-components";
import { LeftArrow } from "../../../icons/svgIndex";
import Button from "../../../components/Button";
import { getFormattedName } from "../../../../../hearings/src/utils";
import isEmpty from "lodash/isEmpty";
import { TextArea } from "@egovernments/digit-ui-components";
import TranscriptComponent from "../../../../../hearings/src/pages/employee/Transcription";
import WitnessModal from "../../../../../hearings/src/components/WitnessModal";
import { Urls } from "../../../hooks";
import { getFilingType } from "../../../Utils";
import { hearingService } from "../../../../../hearings/src/hooks/services";

const WitnessDrawer = ({ isOpen, onClose, tenantId, onSubmit, attendees, caseDetails, hearing, hearingId, setAddPartyModal }) => {
  const { t } = useTranslation();
  const textAreaRef = useRef(null);
  const [options, setOptions] = useState([]);
  const [selectedWitness, setSelectedWitness] = useState({});
  const [witnessDepositionText, setWitnessDepositionText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProceeding, setIsProceeding] = useState(false);
  const [hearingData, setHearingData] = useState(hearing);
  const [witnessModalOpen, setWitnessModalOpen] = useState(false);
  const [signedDocumentUploadID, setSignedDocumentUploadID] = useState("");
  const userInfo = Digit?.UserService?.getUser?.()?.info;

  const { mutateAsync: _updateTranscriptRequest } = Digit.Hooks.useCustomAPIMutationHook({
    url: Urls.hearing.hearingUpdateTranscript,
    params: { applicationNumber: "", cnrNumber: "" },
    body: { tenantId, hearingType: "", status: "" },
    config: {
      mutationKey: "updateTranscript",
    },
  });

  const { data: filingTypeData, isLoading: isFilingTypeLoading } = Digit.Hooks.dristi.useGetStatuteSection("common-masters", [
    { name: "FilingType" },
  ]);

  const filingType = useMemo(() => getFilingType(filingTypeData?.FilingType, "CaseFiling"), [filingTypeData?.FilingType]);

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

  useEffect(() => {
    if (caseDetails) {
      setOptions(
        caseDetails?.additionalDetails?.witnessDetails?.formdata?.map((witness) => ({
          label: getFormattedName(witness?.data?.firstName, witness?.data?.middleName, witness?.data?.lastName, witness?.data?.witnessDesignation),
          value: witness.data.uuid,
        }))
      );
      const selectedWitnessDefault = caseDetails?.additionalDetails?.witnessDetails?.formdata?.[0]?.data || {};
      setSelectedWitness(selectedWitnessDefault);
      setWitnessDepositionText(
        hearingData?.additionalDetails?.witnessDepositions?.find((witness) => witness.uuid === selectedWitnessDefault?.uuid)?.deposition
      );
    }
  }, [caseDetails, hearingData?.additionalDetails?.witnessDepositions]);

  const isDepositionSaved = useMemo(() => {
    return (
      hearingData?.additionalDetails?.witnessDepositions?.find((witness) => witness.uuid === selectedWitness?.uuid)?.isDepositionSaved === true ||
      hearingData?.additionalDetails?.witnessDepositions?.find((witness) => witness.uuid === selectedWitness?.uuid)?.isDepositionSaved === true
    );
  }, [selectedWitness, hearingData]);

  const handleDropdownChange = (selectedWitnessOption) => {
    const selectedUUID = selectedWitnessOption.value;
    const selectedWitnessDeposition = caseDetails?.additionalDetails?.witnessDetails?.formdata?.find((w) => w.data.uuid === selectedUUID)?.data || {};
    setSelectedWitness(selectedWitnessDeposition);
    setWitnessDepositionText(
      hearingData?.additionalDetails?.witnessDepositions?.find((witness) => witness.uuid === selectedWitnessDeposition.uuid)?.deposition || ""
    );
  };

  const IsSelectedWitness = useMemo(() => {
    return !isEmpty(selectedWitness);
  }, [selectedWitness]);

  const saveWitnessDeposition = async () => {
    if (!hearingData) return;

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

      await _updateTranscriptRequest({ body: { hearing: updatedHearing } }).then((res) => {
        if (res?.hearing) {
          setHearingData(res.hearing);
        }
      });
    }
  };

  const handleClose = () => {
    setWitnessModalOpen(false);
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
        await _updateTranscriptRequest({ body: { hearing: updatedHearing } }).then((res) => {
          if (res?.hearing) {
            setHearingData(res.hearing);
          }
        });
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
            <LabelFieldPair className="case-label-field-pair">
              <CardLabel className="case-input-label">{`Select Witness`}</CardLabel>
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
                          selectedWitness?.firstName,
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
            <div className="drawer-footer" style={{ display: "flex", justifyContent: "start", flexDirection: "row" }}>
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
    </div>
  );
};

export default WitnessDrawer;
