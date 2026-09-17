import React from "react";
import { TextArea } from "@egovernments/digit-ui-react-components";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import { sanitizeData } from "@egovernments/digit-ui-module-dristi/src/Utils";
import { CloseBtn, Heading } from "@egovernments/digit-ui-module-dristi/src/components/ModalComponents";
function RejectCTCApplicationReasonModal({ t, onGoBack, onReject, reason, setReason, isDisabled }) {
  return (
    <Modal
      headerBarMain={<Heading style={{ padding: 0, marginBottom: "8px" }} label={t("REASON_FOR_REJECTION")} />}
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
