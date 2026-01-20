import React from "react";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import { CloseSvg } from "@egovernments/digit-ui-react-components";

function ConfirmDepositionDeleteModal({ t, onCancel, onSubmit, name, saveLabel, mainHeader, confirmMessage1, confirmMessage2 }) {
  const CloseBtn = (props) => {
    return (
      <div onClick={props?.onClick} style={{ height: "100%", display: "flex", alignItems: "center", paddingRight: "20px", cursor: "pointer" }}>
        <CloseSvg />
      </div>
    );
  };
  const Heading = (props) => {
    return <h1 className="heading-m">{props.label}</h1>;
  };

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
