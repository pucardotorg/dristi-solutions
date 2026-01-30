import { CloseSvg, CardLabelError } from "@egovernments/digit-ui-react-components";
import CustomDatePickerV2 from "@egovernments/digit-ui-module-hearings/src/components/CustomDatePickerV2";
import { Toast } from "@egovernments/digit-ui-react-components";
import React, { useEffect, useMemo, useState } from "react";

const RemovalChip = ({ label, onRemove }) => {
  return (
    <div className="removal-custom-chip">
      <span>{label}</span>

      <span
        onClick={onRemove}
        className="removal-custom-chip__close"
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#a9a9a9")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#cfcfcf")}
      >
        <CloseSvg />
      </span>
    </div>
  );
};

function SelectBulkDateInputs({ t, config, onSelect, formData = {}, errors, clearErrors }) {
  const [showErrorToast, setShowErrorToast] = useState(null);

  const chipList = useMemo(() => formData?.[config.key] || [], [formData, config.key]);
  const inputs = useMemo(() => config?.populators?.inputs || [], [config?.populators?.inputs]);

  useEffect(() => {
    if (showErrorToast) {
      const timer = setTimeout(() => setShowErrorToast(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [showErrorToast]);

  const handleDateAdd = (date, input) => {
    if (!date) return;

    const dateObj = new Date(date);
    const d = String(dateObj.getDate()).padStart(2, "0");
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const y = dateObj.getFullYear();
    const formattedDate = `${d}-${m}-${y}`;

    const maxAllowed = input?.maxSelected || Infinity;

    if (chipList.includes(formattedDate)) {
      setShowErrorToast({ error: true, label: t("CS_DATE_ALREADY_SELECTED") });
      return;
    }

    if (chipList.length >= maxAllowed) {
      setShowErrorToast({ error: true, label: t("CS_MAX_LIMIT_REACHED") });
      return;
    }

    const newList = [...chipList, formattedDate];
    const sortedList = newList.sort((a, b) => {
      const [ad, am, ay] = a.split("-");
      const [bd, bm, by] = b.split("-");
      return new Date(ay, am - 1, ad) - new Date(by, bm - 1, bd);
    });
    clearErrors(config.key);
    onSelect(config.key, sortedList);
  };

  const handleRemove = (dateToRemove) => {
    const filteredDates = chipList.filter((date) => date !== dateToRemove);
    onSelect(config.key, filteredDates);
  };

  return (
    <div className="bulk-input-container-date-picker">
      {inputs.map((input) => {
        const isLimitReached = chipList?.length >= (input?.maxSelected || Infinity);

        return (
          <div key={input.name} style={{ width: "100%" }} className="bulk-input-date-picker-section">
            {!config?.disableScrutinyHeader && (
              <h2 className="card-label bolder" style={{ marginBottom: "revert" }}>
                {t(input.label)}
              </h2>
            )}

            <div style={{ display: "flex", flexDirection: "column" }}>
              <CustomDatePickerV2
                t={t}
                config={input}
                formData={{ [input.name]: "" }}
                onDateChange={(date) => handleDateAdd(date, input)}
                disable={config?.disable || isLimitReached}
                disableColor="#D6D5D4"
                disableBorderColor="#D6D5D4"
                disableBackgroundColor="white"
              />
            </div>

            {chipList?.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {chipList.map((date, index) => (
                  <RemovalChip key={index} label={date} onRemove={() => handleRemove(date)} />
                ))}
              </div>
            )}

            {isLimitReached && (
              <p style={{ fontSize: "14px", color: "#BB2C2F", marginBottom: 0 }}>
                {t("CS_MAX_LIMIT_REACHED")}: {input?.maxSelected}
              </p>
            )}

            {errors[config?.key] && (
              <CardLabelError style={input?.errorStyle}>{t(errors[config?.key]?.msg || "CORE_REQUIRED_FIELD_ERROR")}</CardLabelError>
            )}
          </div>
        );
      })}
      {showErrorToast && (
        <Toast error={showErrorToast?.error} label={showErrorToast?.label} isDleteBtn={true} onClose={() => setShowErrorToast(null)} />
      )}
    </div>
  );
}

export default SelectBulkDateInputs;
