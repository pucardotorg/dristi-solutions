import React from "react";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import { CloseSvg } from "@egovernments/digit-ui-react-components";

function ConfirmDepositionDeleteModal({ t, selectedWitness, selectedTab, allParties, onCancel, onSubmit }) {
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

  const sourceName = allParties?.find((p) => p?.uuid === selectedWitness?.value || p?.uniqueId === selectedWitness?.value)?.sourceName;

  return (
    <React.Fragment>
      <Modal
        actionCancelLabel={t("CS_BACK")}
        actionCancelOnSubmit={onCancel}
        actionSaveOnSubmit={onSubmit}
        actionSaveLabel={t("CS_CONFIRM_DELETE_DEPOSITION")}
        formId="modal-action"
        headerBarMain={<Heading label={t("DELETE_WITNESS_DEPOSITION")} />}
        headerBarEnd={<CloseBtn onClick={onCancel} />}
      >
        <div style={{ padding: "30px 0" }}>
          <span>{t("ARE_YOU_SURE_YOU_WANT_TO_DELETE_DEPOSITION")}</span>
          <span>{sourceName}</span>
          <span>{t("PLEASE_CONFIRM_DELETE_DEPOSITION")}</span>
        </div>
      </Modal>
    </React.Fragment>
  );
}

export default ConfirmDepositionDeleteModal;
