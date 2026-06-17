import React from "react";
import PropTypes from "prop-types";
import Modal from "./Modal";
import { CloseBtn } from "./ModalComponents";

const EvidenceHeading = ({ label }) => (
  <div className="evidence-title">
    <h1 className="heading-m">{label}</h1>
  </div>
);

EvidenceHeading.propTypes = {
  label: PropTypes.string,
};

function ConfirmEvidenceAction({
  t,
  setShowConfirmationModal,
  handleAction,
  isDisabled = false,
  isBackButtonDisabled = false,
  isFromActions = false,
  setMenuData,
}) {
  const actionSaveLabel = isFromActions ? t("ACTIONS_MARK_EVIDENCE_TEXT") : t("MARK_EVIDENCE_TEXT");

  return (
    <Modal
      headerBarEnd={
        <CloseBtn
          onClick={() => {
            setShowConfirmationModal(null);
            if (setMenuData) {
              setMenuData(null);
            }
          }}
          disabled={isBackButtonDisabled}
        />
      }
      headerBarMain={<EvidenceHeading label={isFromActions ? t("ACTIONS_MARK_SUBMISSION_HEADER") : t("MARK_SUBMISSION_HEADER")} />}
      actionCancelLabel={t("CS_COMMON_BACK")}
      actionSaveLabel={actionSaveLabel}
      isDisabled={isDisabled}
      isBackButtonDisabled={isBackButtonDisabled}
      actionCancelOnSubmit={() => {
        setShowConfirmationModal(null);
        if (setMenuData) {
          setMenuData(null);
        }
      }}
      actionSaveOnSubmit={() => {
        handleAction(false);
      }}
    >
      <div style={{ marginTop: 10, marginBottom: 10 }}>{isFromActions ? t("ACTIONS_MARK_SUBMISSION_TEXT") : t("MARK_SUBMISSION_TEXT")}</div>
    </Modal>
  );
}

ConfirmEvidenceAction.propTypes = {
  t: PropTypes.func,
  setShowConfirmationModal: PropTypes.func,
  handleAction: PropTypes.func,
  isDisabled: PropTypes.bool,
  isBackButtonDisabled: PropTypes.bool,
  isFromActions: PropTypes.bool,
  setMenuData: PropTypes.func,
};

export default ConfirmEvidenceAction;
