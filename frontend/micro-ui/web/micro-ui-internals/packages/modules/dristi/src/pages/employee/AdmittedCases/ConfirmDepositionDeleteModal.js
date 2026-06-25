import React from "react";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import { CloseBtn, Heading } from "../../../components/ModalComponents";
function ConfirmDepositionDeleteModal({ t, onCancel, onSubmit, name, saveLabel, mainHeader, confirmMessage1, confirmMessage2 }) {
  
  
  return (
    <React.Fragment>
      <Modal
        actionCancelLabel={t("CS_BACK")}
        actionCancelOnSubmit={onCancel}
        actionSaveOnSubmit={onSubmit}
        actionSaveLabel={t(saveLabel)}
        formId="modal-action"
        headerBarMain={<Heading label={t(mainHeader)} />}
        headerBarEnd={<CloseBtn onClick={onCancel} />}
      >
        <div style={{ padding: "30px 0" }}>
          <span>{t(confirmMessage1)}</span>
          <span>{name}</span>
          <span>{t(confirmMessage2)}</span>
        </div>
      </Modal>
    </React.Fragment>
  );
}

export default ConfirmDepositionDeleteModal;
