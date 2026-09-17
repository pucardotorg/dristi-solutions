import React from "react";
import Modal from "../../../../components/Modal";
import MonthlyCalendar from "@egovernments/digit-ui-module-hearings/src/pages/employee/CalendarView";
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
