import React, { useEffect } from "react";
import { TextInput, LabelFieldPair, SubmitBar } from "@egovernments/digit-ui-react-components";
import CustomDatePickerV2 from "@egovernments/digit-ui-module-hearings/src/components/CustomDatePickerV2";

const NewBulkRescheduleTable = ({
  t,
  loader,
  setStepper,
  newHearingData,
  setNewHearingData,
  defaultBulkFormData,
  bulkFormData,
  setBulkFormData,
  allHearings,
  setAllHearings,
  loading,
  handleBulkHearingSearch,
  hasBulkRescheduleAccess,
  bulkAllHearingsData,
}) => {
  const handleSelectChange = (checked, row) => {
    const rowId = row?.hearingBookingId;
    if (checked) {
      // Add back if not present
      if (!newHearingData?.some((obj) => obj?.hearingBookingId === rowId)) {
        setNewHearingData((prev) => [...prev, row]);
      }
    } else {
      // Remove from selection
      setNewHearingData((prev) => prev.filter((obj) => obj?.hearingBookingId !== rowId));
    }
  };

  // Optional: Select All checkbox
  const allSelected = newHearingData?.length > 0 && newHearingData?.length === allHearings?.length;
  const handleSelectAll = (checked) => {
    if (checked) {
      setNewHearingData(allHearings);
    } else {
      setNewHearingData([]);
    }
  };

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

  useEffect(() => {
    if (!bulkAllHearingsData) handleBulkHearingSearch(bulkFormData);
  }, []);

  const handleSearch = async () => {
    await handleBulkHearingSearch(bulkFormData);
  };

  const handleChange = (date, hearingBookingId, key) => {
    const selectedDate = new Date(date);
    const startTime = new Date(selectedDate);
    startTime.setHours(11, 0, 0, 0);
    const endTime = new Date(selectedDate);
    endTime.setHours(17, 0, 0, 0);
    const updatedTableData = newHearingData?.map((item) =>
      item?.hearingBookingId === hearingBookingId
        ? { ...item, [key]: selectedDate.getTime(), startTime: startTime.getTime(), endTime: endTime.getTime() }
        : item
    );
    setNewHearingData(updatedTableData);
    setAllHearings((prev) =>
      prev.map((item) =>
        item?.hearingBookingId === hearingBookingId
          ? { ...item, [key]: selectedDate.getTime(), startTime: startTime.getTime(), endTime: endTime.getTime() }
          : item
      )
    );
  };

  return (
    <div className="full-height-container">
      <div className="header">{t("BULK_RESCHEDULE_HEARINGS")}</div>
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
          <div className={`case-label-field-pair search-input`}>
            <input
              className="home-input"
              placeholder={t("SEARCH_CASE_NAME_OR_NUMBER")}
              style={{ width: "280px" }}
              type="text"
              value={bulkFormData?.searchableFields || ""}
              onChange={(e) => {
                setBulkFormData((prev) => ({ ...prev, searchableFields: e.target.value }));
              }}
            />
          </div>
          <button className="home-search-btn" onClick={handleSearch} disabled={loading}>
            {t("ES_COMMON_SEARCH")}
          </button>
          <button className="home-clear-btn" onClick={handleClear} disabled={loading}>
            {t("CLEAR")}
          </button>
        </div>
      </div>
      <div className="main-table-card" style={{ paddingBottom: "50px" }}>
        <div className="table-scroll">
          <table className="main-table">
            <thead>
              <tr>
                <th>
                  <input type="checkbox" className="custom-checkbox" checked={allSelected} onChange={(e) => handleSelectAll(e.target.checked)} />
                </th>
                <th>{t("CASE_TITLE")}</th>
                <th>{t("CS_CASE_ID")}</th>
                <th>{t("CS_STAGE")}</th>
                <th>{t("HEARING_TYPE")}</th>
                <th>{t("CURRENT_HEARING_DATE")}</th>
                <th>{t("NEW_HEARING_DATE")}</th>
              </tr>
            </thead>
            <tbody>
              {loading || loader ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 24 }}>
                    {t("LOADING")}
                  </td>
                </tr>
              ) : allHearings && allHearings?.length > 0 ? (
                allHearings?.map((row, index) => {
                  const rowId = row?.hearingBookingId;
                  return (
                    <tr key={rowId} className="custom-table-row">
                      <td>
                        <input
                          type="checkbox"
                          className="custom-checkbox"
                          checked={newHearingData?.some((obj) => obj?.hearingBookingId === rowId)}
                          onChange={(e) => handleSelectChange(e.target.checked, row)}
                        />
                      </td>
                      <td>{row?.title}</td>
                      <td>{row?.caseId}</td>
                      <td>{t(row?.caseStage)}</td>
                      <td>{t(row?.hearingType)}</td>
                      <td>{new Date(row.originalHearingDate).toLocaleDateString("en-GB")}</td>
                      <td>
                        <CustomDatePickerV2
                          t={t}
                          config={config}
                          formData={row}
                          onDateChange={(date) => handleChange(date, row?.hearingBookingId, config?.key)}
                          //   disable={skipScheduling}
                          disableColor="#D6D5D4"
                          disableBorderColor="#D6D5D4"
                          disableBackgroundColor="white"
                          styles={{ marginBottom: 0 }}
                        />
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
      <div className="bulk-submit-bar" style={{ backgroundColor: "#FFFFFF" }}>
        {hasBulkRescheduleAccess && (
          <SubmitBar
            label={t(`RESCHEDULE_ALL_HEARINGS`)}
            submit="submit"
            onSubmit={() => setStepper((prev) => prev + 1)}
            disabled={newHearingData?.length === 0}
          />
        )}
      </div>
    </div>
  );
};

export default NewBulkRescheduleTable;
