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

const PendingDelayModal = ({ t, showPendingDelayApplication, setShowPendingDelayApplication }) => {
  if (!showPendingDelayApplication) return null;

  return (
    <Modal
      headerBarMain={<Heading label={t("PENDING_DELAY_CONDONATION_HEADER")} />}
      headerBarEnd={
        <CloseBtn
          onClick={() => {
            setShowPendingDelayApplication(false);
          }}
        />
      }
      actionSaveLabel={t("CS_CLOSE")}
      children={<div style={{ margin: "16px 0px" }}>{t("PENDING_DELAY_CONDONATION_APPLICATION_TEXT")}</div>}
      actionSaveOnSubmit={() => {
        setShowPendingDelayApplication(false);
      }}
    />
  );
};

export default PendingDelayModal;
