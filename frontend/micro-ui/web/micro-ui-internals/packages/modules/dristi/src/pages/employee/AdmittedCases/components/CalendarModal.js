import React from "react";
import Modal from "../../../../components/Modal";
import MonthlyCalendar from "@egovernments/digit-ui-module-hearings/src/pages/employee/CalendarView";
import { Heading, CloseBtn } from "../utils/componentUtils";

const CalendarModal = ({ t, showCalendarModal, setShowCalendarModal }) => {
  if (!showCalendarModal) return null;

  return (
    <Modal
      headerBarMain={<Heading label={t("CS_CASE_VIEW_CALENDAR")} />}
      headerBarEnd={
        <CloseBtn
          onClick={() => {
            setShowCalendarModal(false);
          }}
        />
      }
      actionSaveLabel={t("CS_CLOSE")}
      actionSaveOnSubmit={() => {
        setShowCalendarModal(false);
      }}
      popupStyles={{ width: "75vw" }}
    >
      <div style={{ margin: "16px 0px" }}>
        <MonthlyCalendar hideRight={true} />
      </div>
    </Modal>
  );
};

export default CalendarModal;
