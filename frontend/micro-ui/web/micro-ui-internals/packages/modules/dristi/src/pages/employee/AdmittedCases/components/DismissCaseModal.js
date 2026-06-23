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
