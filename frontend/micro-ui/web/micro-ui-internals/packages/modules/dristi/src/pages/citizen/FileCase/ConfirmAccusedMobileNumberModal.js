import { CheckBox } from "@egovernments/digit-ui-react-components";
import React, { useState } from "react";
import Modal from "../../../components/Modal";
import { CloseBtn, Heading } from "../../../components/ModalComponents";

/**
 * Nudge shown on the review screen when phone number is not entered for one or more accused.
 * "Add Details" takes the user to the phone number field of the first such accused,
 * "Confirm" is enabled only after the user explicitly signs off on filing without it.
 */
function ConfirmAccusedMobileNumberModal({ t, accusedWithoutMobileNumberCount = 0, onAddDetails, onConfirm, onClose }) {
  const [isConfirmed, setIsConfirmed] = useState(false);

  return (
    <Modal
      headerBarMain={<Heading label={t("ACCUSED_PHONE_NUMBER_MISSING_HEADER")} />}
      headerBarEnd={<CloseBtn onClick={onClose} />}
      actionCancelLabel={t("CS_ADD_DETAILS")}
      actionCancelOnSubmit={onAddDetails}
      actionSaveLabel={t("CS_COMMON_CONFIRM")}
      actionSaveOnSubmit={onConfirm}
      isDisabled={!isConfirmed}
      formId="modal-action"
      className="accused-mobile-nudge-modal"
    >
      <div style={{ margin: "8px 0px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* <p>{`${t("ACCUSED_PHONE_NUMBER_MISSING_FIRST_HALF")} ${accusedWithoutMobileNumberCount} ${t(
          "ACCUSED_PHONE_NUMBER_MISSING_SECOND_HALF"
        )}`}</p>
        <p>{t("ACCUSED_PHONE_NUMBER_MISSING_SUBTEXT")}</p> */}
        <CheckBox label={t("ACCUSED_PHONE_NUMBER_MISSING_CONFIRMATION")} checked={isConfirmed} onChange={(e) => setIsConfirmed(e.target.checked)} />
      </div>
    </Modal>
  );
}

export default ConfirmAccusedMobileNumberModal;
