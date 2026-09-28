import React from "react";
import Modal from "./Modal";
import { CloseBtn, Heading } from "./ModalComponents";

const Close = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="black">
    <path d="M0 0h24v24H0V0z" fill="none" />
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
  </svg>
);

const ClosBtn = (props) => {
  return (
    <div style={{ paddingTop: "20px", paddingLeft: "20px", cursor: "pointer" }} onClick={props.onClick}>
      <CloseBtn />
    </div>
  );
};

// Soft block for hearings scheduled on a court non-working day.
// The court is never prevented from picking such a date, it only has to confirm.
const NonWorkingDayWarningModal = ({ t, selectedDate, onCancel, onConfirm }) => {
  const formattedDate = selectedDate ? new Date(selectedDate).toLocaleDateString("en-GB") : "";

  return (
    <Modal
      headerBarMain={<Heading label={t("COURT_NON_WORKING_DAY_WARNING_HEADER")} />}
      headerBarEnd={<ClosBtn onClick={onCancel} />}
      actionCancelLabel={t("CS_COMMON_BACK")}
      actionCancelOnSubmit={onCancel}
      actionSaveLabel={t("CS_COMMON_CONFIRM")}
      actionSaveOnSubmit={onConfirm}
      style={{ backgroundColor: "#BB2C2F" }}
      popupStyles={{ width: "auto", padding: "16px" }}
      className="non-working-day-warning-modal"
    >
      <div style={{ margin: "16px", maxWidth: "35vw" }}>
        <p style={{ margin: 0 }}>{t("COURT_NON_WORKING_DAY_WARNING_TEXT")}</p>
        {formattedDate && <p style={{ margin: "8px 0px 0px", fontWeight: 700 }}>{formattedDate}</p>}
      </div>
    </Modal>
  );
};

export default NonWorkingDayWarningModal;
