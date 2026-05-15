import PropTypes from "prop-types";
import React from "react";
import Modal from "./Modal";
import CustomSubmitModal from "./CustomSubmitModal";

function SubmissionSuccessModal({ t, handleBack }) {
  return (
    <Modal
      actionCancelLabel={t("BACK_TO_HOME")}
      actionSaveLabel={t("NEXT_PENDING_TASK")}
      actionCancelOnSubmit={handleBack}
      actionSaveOnSubmit={handleBack}
    >
      <CustomSubmitModal t={t} submitModalInfo={{ header: t("SUCCESS_REVIEW_SUBMISSION"), subHeader: t("SUBTEXT_SUCCESS_REVIEW_SUBMISSION") }} />
    </Modal>
  );
}

SubmissionSuccessModal.propTypes = {
  t: PropTypes.func.isRequired,
  handleBack: PropTypes.func.isRequired,
};

export default SubmissionSuccessModal;
