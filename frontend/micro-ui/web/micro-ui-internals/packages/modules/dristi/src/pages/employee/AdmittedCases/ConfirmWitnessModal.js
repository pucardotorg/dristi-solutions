import React from "react";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import { CloseBtn, Heading } from "../../../components/ModalComponents";
function ConfirmWitnessModal({ t, selectedWitness, witnessTag, onCancel, onSubmit, allParties }) {
  
  
  const sourceName = allParties?.find((p) => p?.uuid === selectedWitness?.value || p?.uniqueId === selectedWitness?.value)?.sourceName;

  return (
    <React.Fragment>
      <Modal
        actionCancelLabel={t("CS_BACK")}
        actionCancelOnSubmit={onCancel}
        actionSaveOnSubmit={onSubmit}
        actionSaveLabel={t("SUBMIT_AND_E_SIGN")}
        formId="modal-action"
        headerBarMain={<Heading label={t("CS_CONFIRM_CORRECTION")} />}
        headerBarEnd={<CloseBtn onClick={onCancel} />}
      >
        <div style={{ padding: "30px 0" }}>
          <span>{t("ARE_YOU_SURE_YOU_WANT_TO_MARK")}</span>
          <span>{sourceName}</span>
          <span>{t("AS")}</span>
          <span>{witnessTag}</span>
          <span>{t("THIS_ACTION_CAN_NOT_BE_REVERSED_LATER")}</span>
        </div>
      </Modal>
    </React.Fragment>
  );
}

export default ConfirmWitnessModal;
