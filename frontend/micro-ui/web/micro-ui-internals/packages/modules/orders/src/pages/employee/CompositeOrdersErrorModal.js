import { Modal } from "@egovernments/digit-ui-react-components";
import React from "react";
import { CloseBtn, Heading } from "@egovernments/digit-ui-module-dristi/src/components/ModalComponents";
function CompositeOrdersErrorModal({ t, showOrderValidationModal, setShowOrderValidationModal }) {
  const handleOnClose = () => {
    setShowOrderValidationModal({ showModal: false, errorMessage: "" });
  };

  return (
    <Modal
      headerBarMain={<Heading style={{ marginLeft: "24px" }} label={t("FIELD_ERROR")} />}
      headerBarEnd={<CloseBtn onClick={handleOnClose} />}
      actionSaveLabel={t("CS_BACK")}
      actionSaveOnSubmit={handleOnClose}
      popUpStyleMain={{ zIndex: "1000" }}
    >
      <div>
        <h2>{showOrderValidationModal?.errorMessage}</h2>
      </div>
    </Modal>
  );
}

export default CompositeOrdersErrorModal;
