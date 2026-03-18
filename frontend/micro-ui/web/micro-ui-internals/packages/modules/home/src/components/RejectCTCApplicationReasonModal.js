import React from "react";
import { CloseSvg, TextArea } from "@egovernments/digit-ui-react-components";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import { sanitizeData } from "@egovernments/digit-ui-module-dristi/src/Utils";

const CloseBtn = (props) => {
  return (
    <div onClick={props?.onClick} style={{ height: "100%", display: "flex", alignItems: "center", paddingRight: "20px", cursor: "pointer" }}>
      <CloseSvg />
    </div>
  );
};

const Heading = (props) => {
  return (
    <h1 className="heading-m" style={{ padding: 0, marginBottom: "8px" }}>
      {props.label}
    </h1>
  );
};

function RejectCTCApplicationReasonModal({ t, onGoBack, onReject, reason, setReason, isDisabled }) {
  return (
    <Modal
      headerBarMain={<Heading label={t("REASON_FOR_REJECTION")} />}
      headerBarEnd={<CloseBtn onClick={onGoBack} />}
      actionCancelLabel={t("CANCEL")}
      actionCancelOnSubmit={onGoBack}
      actionSaveLabel={t("REJECT")}
      actionSaveOnSubmit={() => onReject(reason)}
      isDisabled={!reason?.trim() || isDisabled}
      popupStyles={{ borderRadius: "4px" }}
      style={{ backgroundColor: "#DC2626", border: "none" }}
    >
      <div style={{ padding: "10px 0px" }}>
        <TextArea
          style={{ marginTop: "0px", height: "120px" }}
          placeholder={t("DESCRIPTION")}
          name="reasonForRejection"
          value={reason}
          onChange={(e) => setReason(sanitizeData(e.target.value))}
        />
      </div>
    </Modal>
  );
}

export default RejectCTCApplicationReasonModal;
