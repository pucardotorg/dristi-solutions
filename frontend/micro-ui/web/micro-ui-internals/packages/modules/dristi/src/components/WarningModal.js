import React from "react";
import Modal from "./Modal";
import { useTranslation } from "react-i18next";
import { CloseSvg } from "@egovernments/digit-ui-react-components";

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

const WarningModal = ({ t, heading, onCancel, onSubmit, info, setWarningModal, isSaveDraft, onSaveDraft }) => {
  const handleSaveOnSubmit = async () => {
    setWarningModal(false);
    return isSaveDraft ? await onSaveDraft(undefined, true) : await onSubmit("SAVE_DRAFT", false, true);
  };
  return (
    <Modal
      headerBarEnd={<CloseBtn onClick={onCancel} />}
      actionSaveLabel={t("CS_CORE_WEB_PROCEED")}
      actionSaveOnSubmit={handleSaveOnSubmit}
      actionCancelLabel={t("CS_EDIT_BACK")}
      actionCancelOnSubmit={onCancel}
      formId="modal-action"
      headerBarMain={<Heading label={heading} />}
      className="upload-signature-modal"
      submitTextClassName="upload-signature-button"
    >
      <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", padding: "16px 16px 0px 16px" }}>{info}</div>
    </Modal>
  );
};

export default WarningModal;
