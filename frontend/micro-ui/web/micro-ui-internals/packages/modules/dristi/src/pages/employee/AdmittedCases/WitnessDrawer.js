import React, { useState, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Dropdown, LabelFieldPair, CardLabel } from "@egovernments/digit-ui-react-components";
import { LeftArrow } from "../../../icons/svgIndex";
import Button from "../../../components/Button";
import { getFormattedName } from "../../../../../hearings/src/utils";
import isEmpty from "lodash/isEmpty";
import { TextArea } from "@egovernments/digit-ui-components";
import TranscriptComponent from "../../../../../hearings/src/pages/employee/Transcription";

const WitnessDrawer = ({ isOpen, onClose, onSubmit, attendees, caseDetails, hearing, setAddPartyModal }) => {
  const { t } = useTranslation();
  const textAreaRef = useRef(null);

  const [orderData, setOrderData] = useState({
    attendees: [],
    botdText: "",
    hearingType: "",
    hearingDate: "",
    isCaseDisposed: "CASE_DISPOSED",
    partiesToAttendHearing: [],
  });
  const [options, setOptions] = useState([]);
  const [additionalDetails, setAdditionalDetails] = useState({});
  const [selectedWitness, setSelectedWitness] = useState({});
  const [witnessDepositionText, setWitnessDepositionText] = useState("");
  const [isRecording, setIsRecording] = useState(false);

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

  const isDepositionSaved = useMemo(() => {
    const witness = hearing?.additionalDetails?.witnessDepositions?.find((witness) => witness.uuid === selectedWitness?.uuid);
    return witness?.isDepositionSaved === true;
  }, [selectedWitness, hearing]);

  const handleDropdownChange = (selectedWitnessOption) => {
    const selectedUUID = selectedWitnessOption.value;
    const selectedWitnessDeposition = additionalDetails?.witnessDetails?.formdata?.find((w) => w.data.uuid === selectedUUID)?.data || {};
    setSelectedWitness(selectedWitnessDeposition);
    setWitnessDepositionText(
      hearing?.additionalDetails?.witnessDepositions?.find((witness) => witness.uuid === selectedWitnessDeposition.uuid)?.deposition || ""
    );
  };

  const IsSelectedWitness = useMemo(() => {
    return !isEmpty(selectedWitness);
  }, [selectedWitness]);

  if (!isOpen) return null;

  return (
    <div className="bottom-drawer-wrapper">
      <div className="bottom-drawer-overlay" onClick={onClose} />
      <div className={`bottom-drawer ${isOpen ? "open" : ""}`}>
        <div className="drawer-header">
          <div className="header-content">
            <button className="drawer-close-button" onClick={onClose}>
              <LeftArrow color="#0b0c0c" />
            </button>
            <h2>{t("CS_WITNESS")}</h2>
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
                disable={false}
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
                style={{ width: "100%", height: "40px", fontSize: "16px" }}
              />
            </LabelFieldPair>

            <div style={{ width: "151px", height: "19px", fontSize: "13px", color: "#007E7E", marginTop: "2px" }}>
              <button
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  margin: 0,
                  cursor: "pointer",
                  fontSize: "13px",
                  color: "#007E7E",
                  fontWeight: 700,
                }}
                onClick={onClickAddWitness}
              >
                + {t("CASE_ADD_PARTY")}
              </button>
            </div>

            <React.Fragment>
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
                disabled={isDepositionSaved || !IsSelectedWitness}
              />
              {!isDepositionSaved && IsSelectedWitness && (
                <TranscriptComponent
                  setWitnessDepositionText={setWitnessDepositionText}
                  isRecording={isRecording}
                  setIsRecording={setIsRecording}
                  activeTab={"Witness Deposition"}
                ></TranscriptComponent>
              )}
            </React.Fragment>
          </div>
        </div>

        <div className="drawer-footer">
          <Button label={t("Add Other Items")} variation="outlined" onClick={() => onSubmit("add-other-items")} />
          <Button label={t("SAVE_DRAFT")} className={"order-drawer-save-btn"} onClick={() => onSubmit("save-draft")} />
        </div>
      </div>
    </div>
  );
};

export default WitnessDrawer;
