import React from "react";
import Modal from "../../../../components/Modal";
import { CloseSvg } from "@egovernments/digit-ui-react-components";

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

const BailBondTaskModal = ({ t, showBailBondModal, setShowBailBondModal, isBailBondTaskExists, createBailBondTask, bailBondLoading }) => {
  if (!showBailBondModal) return null;

  if (!isBailBondTaskExists) {
    return (
      <Modal
        headerBarEnd={<CloseBtn onClick={() => !bailBondLoading && setShowBailBondModal(false)} />}
        actionSaveLabel={t("CS_COMMON_CONFIRM")}
        actionSaveOnSubmit={createBailBondTask}
        actionCancelLabel={t("CS_COMMON_CANCEL")}
        isBackButtonDisabled={bailBondLoading}
        isDisabled={bailBondLoading}
        actionCancelOnSubmit={() => setShowBailBondModal(false)}
        formId="modal-action"
        headerBarMain={<Heading label={t("CREATE_BAIL_BOND_TASK")} />}
        className="upload-signature-modal"
        submitTextClassName="upload-signature-button"
      >
        <div style={{ margin: "16px 16px" }}>{t("CREATE_BAIL_BOND_TASK_TEXT")}</div>
      </Modal>
    );
  }

  return (
    <Modal
      headerBarEnd={<CloseBtn onClick={() => setShowBailBondModal(false)} />}
      actionSaveLabel={t("CS_COMMON_CLOSE")}
      actionSaveOnSubmit={() => setShowBailBondModal(false)}
      formId="modal-action"
      headerBarMain={<Heading label={t("TASK_ALREADY_EXISTS")} />}
      className="upload-signature-modal"
      submitTextClassName="upload-signature-button"
    >
      <div style={{ margin: "16px 16px" }}>{t("TASK_ALREADY_EXISTS_TEXT")}</div>
    </Modal>
  );
};

export default BailBondTaskModal;
