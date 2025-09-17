import React, { useState, useEffect } from "react";
import { TextInput, LabelFieldPair } from "@egovernments/digit-ui-react-components";
import { hearingService } from "@egovernments/digit-ui-module-hearings/src/hooks/services";
import CustomDatePickerV2 from "@egovernments/digit-ui-module-hearings/src/components/CustomDatePickerV2";
import { ActionBar, SubmitBar } from "@egovernments/digit-ui-components";

const NewBulkRescheduleTable = ({
  t,
  showToast = () => {},
  onSumbitReschedule,
  newHearingData,
  setNewHearingData,
  defaultBulkFormData,
  bulkFormData,
  setBulkFormData,
  bulkHearingsCount,
}) => {
  const [loading, setIsLoader] = useState(false);
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const judgeId = localStorage.getItem("judgeId");
  const courtId = localStorage.getItem("courtId");

  const config = {
    type: "component",
    component: "CustomDatePicker",
    key: "hearingDate",
    // label: "NEXT_DATE_OF_HEARING",
    className: "order-date-picker",
    isMandatory: true,
    placeholder: "DD/MM/YYYY",
    customStyleLabelField: { display: "flex", justifyContent: "space-between" },
    populators: {
      name: "nextHearingDate",
      error: "CORE_REQUIRED_FIELD_ERROR",
    },
  };

  const formatDate = (date) => {
    const newDateForm = new Date(date);
    return (
      newDateForm.getFullYear() + "-" + String(newDateForm.getMonth() + 1).padStart(2, "0") + "-" + String(newDateForm.getDate()).padStart(2, "0")
    );
  };

  const handleClear = async () => {
    setBulkFormData(defaultBulkFormData);
    await handleBulkHearingSearch(defaultBulkFormData);
  };

  const handleBulkHearingSearch = async (newFormData) => {
    try {
      setIsLoader(true);
      const tentativeDates = await hearingService?.bulkReschedule({
        BulkReschedule: {
          judgeId,
          courtId,
          scheduleAfter: newFormData?.toDate + 24 * 60 * 60 * 1000 + 1, //we are sending next day
          tenantId,
          startTime: newFormData?.fromDate,
          endTime: newFormData?.toDate + 24 * 60 * 60 * 1000 - 1, // End of the day
          slotIds: newFormData?.slotIds?.map((slot) => slot?.id) || [],
          reason: newFormData?.reason,
        },
      });
      if (tentativeDates?.Hearings?.length === 0) {
        showToast("error", t("NO_NEW_HEARINGS_AVAILABLE"), 5000);
        return;
      }
      setNewHearingData(tentativeDates?.Hearings);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoader(false);
    }
  };

  useEffect(() => {
    handleBulkHearingSearch(bulkFormData);
  }, []);

  const handleSearch = async () => {
    await handleBulkHearingSearch(bulkFormData);
  };

  const handleChange = (date, index, key) => {
    const selectedDate = new Date(date);
    const startTime = new Date(selectedDate);
    startTime.setHours(11, 0, 0, 0);
    const endTime = new Date(selectedDate);
    endTime.setHours(17, 0, 0, 0);
    const updatedTableData = newHearingData?.map((item, i) =>
      i === index ? { ...item, [key]: selectedDate.getTime(), startTime: startTime.getTime(), endTime: endTime.getTime() } : item
    );
    setNewHearingData(updatedTableData);
  };

  return (
    <div className="full-height-container">
      <div className="filter-bar">
        <div className="filter-fields">
          <LabelFieldPair className={`case-label-field-pair `}>
            <div className="date-arrow-group">
              <TextInput
                className="home-input"
                key={"fromDate"}
                type={"date"}
                value={bulkFormData?.fromDate ? formatDate(bulkFormData?.fromDate) : ""}
                onChange={(e) => {
                  setBulkFormData((prev) => ({ ...prev, fromDate: new Date(e.target.value).setHours(0, 0, 0, 0) }));
                }}
                style={{ minWidth: 120, textAlign: "center" }}
                // disabled={loading}
              />
            </div>
          </LabelFieldPair>
          <LabelFieldPair className={`case-label-field-pair `}>
            <div className="date-arrow-group">
              <TextInput
                className="home-input"
                key={"toDate"}
                type={"date"}
                value={bulkFormData?.toDate ? formatDate(bulkFormData?.toDate) : ""}
                onChange={(e) => {
                  setBulkFormData((prev) => ({ ...prev, toDate: new Date(e.target.value).setHours(0, 0, 0, 0) }));
                }}
                style={{ minWidth: 120, textAlign: "center" }}
                // disabled={loading}
              />
            </div>
          </LabelFieldPair>
        </div>
        <div className="filter-actions">
          <button className="home-search-btn" onClick={handleSearch} disabled={loading}>
            {t("ES_COMMON_SEARCH")}
          </button>
          <button className="home-clear-btn" onClick={handleClear} disabled={loading}>
            {t("CLEAR")}
          </button>
        </div>
      </div>
      <div className="main-table-card">
        <div className="table-scroll">
          <table className="main-table">
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
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 24 }}>
                    {t("LOADING")}
                  </td>
                </tr>
              ) : newHearingData && newHearingData?.length > 0 ? (
                newHearingData?.map((row, index) => {
                  return (
                    <tr key={row?.id || index} className="custom-table-row">
                      <td>{row?.title}</td>
                      <td>{row?.caseId}</td>
                      <td>{row?.caseStage}</td>
                      <td>{t(row?.hearingType)}</td>
                      <td>{new Date(row.originalHearingDate).toLocaleDateString("en-GB")}</td>
                      <td>
                        <CustomDatePickerV2
                          t={t}
                          config={config}
                          formData={row}
                          onDateChange={(date) => handleChange(date, index, config?.key)}
                          //   disable={skipScheduling}
                          disableColor="#D6D5D4"
                          disableBorderColor="#D6D5D4"
                          disableBackgroundColor="white"
                        />{" "}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 24 }}>
                    {t("NO_HEARING_DATA_FOUND")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <ActionBar
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#fff",
          padding: "16px 24px",
          boxShadow: "none",
          borderTop: "1px solid #BBBBBD",
        }}
      >
        <SubmitBar
          label={t("RESCHEDULE_ALL_HEARINGS")}
          style={{ boxShadow: "none" }}
          onSubmit={onSumbitReschedule}
          disabled={bulkHearingsCount === 0}
        />
      </ActionBar>
    </div>
  );
};

export default NewBulkRescheduleTable;
