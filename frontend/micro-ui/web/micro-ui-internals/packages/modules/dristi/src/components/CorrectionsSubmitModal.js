import React from "react";
import PropTypes from "prop-types";
import Modal from "./Modal";
import CustomSubmitModal from "../pages/citizen/FileCase/admission/CustomSubmitModal";

function CorrectionsSubmitModal({ t, filingNumber, handleGoToHome, downloadPdf, caseDetails, tenantId }) {
  const modalInfo = {
    header: t("CS_CASE_RESUBMIT_SUCCESSFULLY"),
    subHeader: t("CS_CASE_RESUBMIT_SUCCESSFULLY_SUBTEXT"),
    caseInfo: [
      {
        key: t("CASE_FILE_NUMBER"),
        value: filingNumber,
        showCopy: true,
      },
    ],
    isArrow: false,
    showCopytext: true,
  };

  return (
    <Modal
      actionCancelLabel={t("CS_PRINT_CASE_FILE")}
      actionCancelOnSubmit={() => downloadPdf(tenantId, caseDetails?.additionalDetails?.signedCaseDocument)}
      actionSaveLabel={t("BACK_TO_HOME")}
      actionSaveOnSubmit={handleGoToHome}
      className={"orders-success-modal"}
    >
      <CustomSubmitModal t={t} submitModalInfo={modalInfo} />
    </Modal>
  );
}

CorrectionsSubmitModal.propTypes = {
  t: PropTypes.func,
  filingNumber: PropTypes.string,
  handleGoToHome: PropTypes.func,
  downloadPdf: PropTypes.func,
  caseDetails: PropTypes.object,
  tenantId: PropTypes.string,
};

export default CorrectionsSubmitModal;
