import React from "react";
import Modal from "./Modal";
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

const EditSendBackModal = ({ t, handleCancel, handleSubmit, headerLabel, saveLabel, cancelLabel, contentText }) => {
  return (
    <Modal
      headerBarMain={<Heading label={t(headerLabel)} />}
      headerBarEnd={<CloseBtn onClick={handleCancel} />}
      actionSaveLabel={t(saveLabel)}
      actionCancelLabel={t(cancelLabel)}
      actionCancelOnSubmit={handleCancel}
      style={{
        backgroundColor: "#007E7E",
      }}
      children={<div style={{ margin: "16px 0px" }}>{t(contentText)}</div>}
      actionSaveOnSubmit={handleSubmit}
    ></Modal>
  );
};

export default EditSendBackModal;
