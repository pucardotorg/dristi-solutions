import React from "react";
import Modal from "./Modal";
import { CloseBtn, Heading } from "./ModalComponents";

// Soft block for hearings scheduled on a court non-working day or a weekend.
// The court is never prevented from picking such a date, it only has to confirm.
const NonWorkingDayWarningModal = ({ t, selectedDate, onCancel, onConfirm }) => {
  const formattedDate = selectedDate ? new Date(selectedDate).toLocaleDateString("en-GB") : "";

  return (
    <Modal
      headerBarMain={<Heading label={t("COURT_NON_WORKING_DAY_WARNING_HEADER")} />}
      headerBarEnd={<CloseBtn onClick={onCancel} />}
      actionCancelLabel={t("CS_COMMON_BACK")}
      actionCancelOnSubmit={onCancel}
      actionSaveLabel={t("CS_COMMON_CONFIRM")}
      actionSaveOnSubmit={onConfirm}
      style={{ backgroundColor: "#BB2C2F" }}
      popupStyles={{ width: "auto", padding: "16px" }}
      className="non-working-day-warning-modal"
    >
      <div style={{ margin: "16px 0px" }}>
        <p style={{ margin: 0 }}>{t("COURT_NON_WORKING_DAY_WARNING_TEXT")}</p>
        {formattedDate && <p style={{ margin: "8px 0px 0px", fontWeight: 700 }}>{formattedDate}</p>}
      </div>
    </Modal>
  );
};

export default NonWorkingDayWarningModal;
