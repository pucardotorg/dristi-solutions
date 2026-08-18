import React from "react";
import CustomDatePicker from "./CustomDatePicker"; // Adjust path if needed
import { DateUtils } from "@egovernments/digit-ui-module-dristi/src/Utils";

const BulkRescheduleTable = ({ tableData, setNewHearingData, t }) => {
  const config = {
    key: "hearingDate",
    label: "Hearing Date",
    placeholder: "CS_COMMON_SELECT_DATE",
    customStyleLabelField: { display: "flex", justifyContent: "space-between" },
    disable: false,
  };

  const handleChange = (key, date, index) => {
    const selectedDate = new Date(date);
    const startTime = new Date(selectedDate);
    startTime.setHours(11, 0, 0, 0);
    const endTime = new Date(selectedDate);
    endTime.setHours(17, 0, 0, 0);
    const updatedTableData = tableData.map((item, i) =>
      i === index ? { ...item, [key]: selectedDate.getTime(), startTime: startTime.getTime(), endTime: endTime.getTime() } : item
    );
    setNewHearingData(updatedTableData);
  };

  return (
    <React.Fragment>
      <div className="reschedule-table-wrapper">
        <table className="reschedule-table">
          <thead>
            <tr>
              <th>{t("CASE_TITLE")}</th>
              <th>{t("CS_CASE_ID")}</th>
              <th>{t("CS_STAGE")}</th>
              <th>{t("HEARING_TYPE")}</th>
              <th>{t("CURRENT_HEARING_DATE")}</th>
              <th>{t("NEW_HEARING_DATE")}</th>
            </tr>
          </thead>
        </table>
        <div className="reschedule-table-scroll-body">
          <table className="reschedule-table">
            <tbody>
              {tableData?.map((item, index) => (
                <tr key={index}>
                  <td>{item?.title}</td>
                  <td>{item?.caseId}</td>
                  <td>{item?.caseStage}</td>
                  <td>{t(item?.hearingType)}</td>
                  <td>{DateUtils.getFormattedDate(item.originalHearingDate)}</td>
                  <td>
                    <CustomDatePicker t={t} config={config} formData={item} onSelect={(key, date) => handleChange(key, date, index)} errors={{}} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </React.Fragment>
  );
};

export default BulkRescheduleTable;
