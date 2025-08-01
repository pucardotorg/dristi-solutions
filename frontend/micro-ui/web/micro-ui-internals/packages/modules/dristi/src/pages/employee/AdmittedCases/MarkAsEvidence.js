import React, { useState } from "react";
import Modal from "../../../components/Modal";
import { Dropdown, Loader, CloseSvg, TextInput, LabelFieldPair, CardLabel } from "@egovernments/digit-ui-react-components";
import { DRISTIService } from "../../../services";
import { Urls } from "../../../hooks";
import { useMemo } from "react";
import SuccessBannerModal from "../../../../../submissions/src/components/SuccessBannerModal";
import SignatureSuccessModal from "../../../../../submissions/src/components/SignatureSuccessModal";

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

const MarkAsEvidence = ({ t, isEvidenceLoading = false, setShowMakeAsEvidenceModal, selectedItem, selectedRow, documentSubmission }) => {
  const [stepper, setStepper] = useState(2);
  console.log("selectedItem", selectedItem);
  console.log("selectedRow", selectedRow);
  console.log("documentSubmission", documentSubmission);

  const memoEvidenceValues = useMemo(() => {
    return {
      title: selectedRow?.artifactType,
      artifactNumber: selectedRow?.artifactNumber,
      sourceType: selectedRow?.sourceType,
      owner: selectedRow?.owner,
    };
  }, [selectedRow]);

  const evidenceType = [
    { code: "1", name: t("ACTIONS_MARK_EVIDENCE_TYPE_1") },
    { code: "2", name: t("ACTIONS_MARK_EVIDENCE_TYPE_2") },
  ];

  return (
    <React.Fragment>
      {stepper === 0 && (
        <Modal
          headerBarEnd={<CloseBtn onClick={() => (isEvidenceLoading ? null : setShowMakeAsEvidenceModal(false))} />}
          actionSaveLabel={t("CS_PROCEED")}
          actionSaveOnSubmit={() => setStepper(1)}
          actionCancelLabel={t("CS_COMMON_CANCEL")}
          isBackButtonDisabled={isEvidenceLoading}
          isDisabled={isEvidenceLoading}
          actionCancelOnSubmit={() => setShowMakeAsEvidenceModal(false)}
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
                style={{ minWidth: 120, textAlign: "start", marginBottom: "0px" }}
              />
            </LabelFieldPair>
            <LabelFieldPair>
              <CardLabel className="case-input-label">{t("UPLOADED_BY")}</CardLabel>
              <TextInput
                className="disabled text-input"
                type="text"
                value={t(memoEvidenceValues?.owner)}
                disabled
                style={{ minWidth: 120, textAlign: "start", marginBottom: "0px" }}
              />
            </LabelFieldPair>

            <LabelFieldPair>
              <CardLabel className="case-input-label">{t("EVIDENCE_MARKED_THROUGH")}</CardLabel>
              <Dropdown
                t={t}
                placeholder={`${t("PURPOSE")}`}
                option={[]}
                // selected={filters?.purpose}
                optionKey={"code"}
                select={(e) => {
                  //   setFilters((prev) => ({ ...prev, purpose: e }));
                }}
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
                  <TextInput
                    className="disabled text-input"
                    type="text"
                    value={t(memoEvidenceValues?.sourceType)}
                    disabled
                    style={{ textAlign: "start", marginBottom: "0px" }}
                  />
                  <TextInput className="text-input" type="text" value={"dsfd"} style={{ textAlign: "start", marginBottom: "0px" }} />
                </div>
              </LabelFieldPair>
            </div>
          </div>
        </Modal>
      )}

      {stepper === 1 && (
        <Modal
          headerBarEnd={<CloseBtn onClick={() => (isEvidenceLoading ? null : setStepper(0))} />}
          actionSaveLabel={t("SEND_FOR_SIGN")}
          actionSaveOnSubmit={() => setStepper(0)}
          actionCancelLabel={t("DOWNLOAD_CS_BACK")}
          isBackButtonDisabled={isEvidenceLoading}
          isDisabled={isEvidenceLoading}
          actionCancelOnSubmit={() => setStepper(0)}
          formId="modal-action"
          headerBarMain={<Heading label={t("CONFIRM_EVIDENCE_HEADER")} />}
          className="mark-evidence-modal"
          submitTextClassName="upload-signature-button"
          popupModuleMianClassName="mark-evidence-modal-main"
          popupModuleActionBarStyles={{ padding: "16px" }}
        >
          <div className="mark-evidence-modal-body">
            <div className="application-info" style={{ display: "flex", flexDirection: "column" }}>
              <div className="info-row">
                <div className="info-key" style={{ width: "300px" }}>
                  <h3>{t("DOCUMENT_TITLE")}</h3>
                </div>
                <div className="info-value">
                  <h3>{t(memoEvidenceValues?.title)}</h3>
                </div>
              </div>
              <div className="info-row">
                <div className="info-key" style={{ width: "300px" }}>
                  <h3>{t("UPLOADED_BY")}</h3>
                </div>
                <div className="info-value">
                  <h3>{t(memoEvidenceValues?.owner)}</h3>
                </div>
              </div>

              <div className="info-row">
                <div className="info-key" style={{ width: "300px" }}>
                  <h3>{t("EVIDENCE_MARKED_THROUGH")}</h3>
                </div>
                <div className="info-value">
                  <h3>{}</h3>
                </div>
              </div>
              <div className="info-row">
                <div className="info-key" style={{ width: "300px" }}>
                  <h3>{t("EVIDENCE_NUMBER")}</h3>
                </div>
                <div className="info-value">
                  {/* <h3>{JSON.stringify(documentSubmission[0]?.details.additionalDetails)}</h3> */}
                  <h3>{t(memoEvidenceValues?.sourceType)}</h3>
                </div>
              </div>
            </div>
            <LabelFieldPair>
              <CardLabel className="case-input-label">{t("UPLOADED_BY")}</CardLabel>
              <TextInput className="text-input" type="text" value={"dsfd"} style={{ minWidth: 120, textAlign: "start", marginBottom: "0px" }} />
            </LabelFieldPair>
          </div>
        </Modal>
      )}
      {stepper === 2 && (
        <SignatureSuccessModal
          t={t}
          handleCancel={() => setStepper(0)}
          handleSubmit={() => setStepper(3)}
          title="ADD_SIGNATURE"
          noteText="YOUR_CUSTOM_NOTE"
          containerStyle={{ padding: "20px", backgroundColor: "#f8f8f8" }}
          headingStyle={{ color: "#0b0c28", fontSize: "28px" }}
          signedBadgeStyle={{ backgroundColor: "#ccffcc", color: "#006600" }}
          infoCardStyle={{ fontStyle: "italic" }}
        />
      )}

      {stepper === 3 && <SuccessBannerModal t={t} handleCloseSuccessModal={() => setStepper(3)} message={"MARK_AS_EVIDENCE_SUCCESS"} />}
    </React.Fragment>
  );
};

export default MarkAsEvidence;
