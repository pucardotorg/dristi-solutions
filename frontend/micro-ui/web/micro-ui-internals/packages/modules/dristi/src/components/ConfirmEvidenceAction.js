import React, { useState } from "react";
import Modal from "./Modal";
import { CheckBox, CloseSvg, TextArea } from "@egovernments/digit-ui-react-components";

function ConfirmEvidenceAction({ t, setShowConfirmationModal, handleAction, isEvidence, isDisabled = false, isFromActions = false }) {
  const CloseBtn = (props) => {
    return (
      <div onClick={props?.onClick} style={{ height: "100%", display: "flex", alignItems: "center", paddingRight: "20px", cursor: "pointer" }}>
        <CloseSvg />
      </div>
    );
  };
  const Heading = (props) => {
    return (
      <div className="evidence-title">
        <h1 className="heading-m">{props.label}</h1>
      </div>
    );
  };

  const actionSaveLabel = isFromActions ? t("ACTIONS_MARK_EVIDENCE_TEXT") : t("MARK_EVIDENCE_TEXT");

  return (
    <Modal
      headerBarEnd={
        <CloseBtn
          onClick={() => {
            setShowConfirmationModal(null);
          }}
        />
      }
      headerBarMain={<Heading label={isFromActions ? t("ACTIONS_MARK_SUBMISSION_HEADER") : t("MARK_SUBMISSION_HEADER")} />}
      actionCancelLabel={t("CS_COMMON_BACK")}
      actionSaveLabel={actionSaveLabel}
      isDisabled={isDisabled}
      actionCancelOnSubmit={() => {
        setShowConfirmationModal(null);
      }}
      actionSaveOnSubmit={() => {
        handleAction(false);
      }}
    >
      <div style={{ marginTop: 10, marginBottom: 10 }}>{isFromActions ? t("ACTIONS_MARK_SUBMISSION_TEXT") : t("MARK_SUBMISSION_TEXT")}</div>
    </Modal>
  );
}

export default ConfirmEvidenceAction;
