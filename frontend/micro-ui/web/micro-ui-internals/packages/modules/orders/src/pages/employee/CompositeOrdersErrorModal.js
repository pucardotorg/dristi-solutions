import { CloseSvg, Modal } from "@egovernments/digit-ui-react-components";
import React from "react";

const Heading = (props) => {
  return (
    <h1 className="heading-m" style={{ marginLeft: "24px" }}>
      {props.label}
    </h1>
  );
};

const CloseBtn = (props) => {
  return (
    <div
      className="composite-orders-error-modal-close"
      onClick={props?.onClick}
      style={{ height: "100%", display: "flex", alignItems: "center", paddingRight: "20px", cursor: "pointer" }}
    >
      <CloseSvg />
    </div>
  );
};

function CompositeOrdersErrorModal({ t, showOrderValidationModal, setShowOrderValidationModal }) {
  const handleOnClose = () => {
    setShowOrderValidationModal({ showModal: false, errorMessage: "" });
  };

  return (
    <Modal
      headerBarMain={<Heading label={t("FIELD_ERROR")} />}
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
