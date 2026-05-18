import React from "react";
import Modal from "../../../../components/Modal";
import { Heading, CloseBtn } from "../utils/componentUtils";

const DismissCaseModal = ({ t, showDismissCaseConfirmation, setShowDismissCaseConfirmation, handleActionModal }) => {
  if (!showDismissCaseConfirmation) return null;

  return (
    <Modal
      headerBarMain={<Heading label={t("DISMISS_CASE_CONFIRMATION")} />}
      headerBarEnd={
        <CloseBtn
          onClick={() => {
            setShowDismissCaseConfirmation(false);
          }}
        />
      }
      actionSaveLabel={t("CS_DISMISS")}
      actionCancelLabel={t("CS_BACK")}
      actionCancelOnSubmit={() => {
        setShowDismissCaseConfirmation(false);
      }}
      style={{
        backgroundColor: "#BB2C2F",
      }}
      children={<div style={{ margin: "16px 0px" }}>{t("DISMISS_CASE_CONFIRMATION_TEXT")}</div>}
      actionSaveOnSubmit={() => {
        handleActionModal();
      }}
    />
  );
};

export default DismissCaseModal;
