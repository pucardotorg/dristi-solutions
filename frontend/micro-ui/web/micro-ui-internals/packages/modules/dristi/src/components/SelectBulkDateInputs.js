import { CloseSvg, CardLabelError } from "@egovernments/digit-ui-react-components";
import CustomDatePickerV2 from "@egovernments/digit-ui-module-hearings/src/components/CustomDatePickerV2";
import CustomToast from "@egovernments/digit-ui-module-dristi/src/components/CustomToast";
import PropTypes from "prop-types";
import React, { useMemo, useState } from "react";

const RemovalChip = ({ label, onRemove }) => {
  return (
    <div className="removal-custom-chip">
      <span>{label}</span>

      <button
        type="button"
        onClick={onRemove}
        className="removal-custom-chip__close"
        aria-label={`Remove ${label}`}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#a9a9a9";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#cfcfcf";
        }}
        style={{ border: "none", background: "#cfcfcf", cursor: "pointer", display: "inline-flex", alignItems: "center" }}
      >
        <CloseSvg />
      </button>
    </div>
  );
};

RemovalChip.propTypes = {
  label: PropTypes.string.isRequired,
  onRemove: PropTypes.func.isRequired,
};

function SelectBulkDateInputs({ t, config, onSelect, formData = {}, errors, clearErrors }) {
  const [showToast, setShowToast] = useState(null);

  const chipList = useMemo(() => formData?.[config.key] || [], [formData, config.key]);
  const inputs = useMemo(() => config?.populators?.inputs || [], [config?.populators?.inputs]);

  const handleDateAdd = (date, input) => {
    if (!date) return;

    const dateObj = new Date(date);
    const d = String(dateObj.getDate()).padStart(2, "0");
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const y = dateObj.getFullYear();
    const formattedDate = `${d}-${m}-${y}`;

    const maxAllowed = input?.maxSelected || Infinity;

    if (chipList.includes(formattedDate)) {
      setShowToast({ error: true, label: t("CS_DATE_ALREADY_SELECTED"), errorId: null });
      return;
    }

    if (chipList.length >= maxAllowed) {
      setShowToast({ error: true, label: t("CS_MAX_LIMIT_REACHED"), errorId: null });
      return;
    }

    const sortedList = [...chipList, formattedDate].sort((a, b) => {
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
                isShowHearing={input?.isShowHearing}
              />
            </div>

            {chipList?.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {chipList.map((date) => (
                  <RemovalChip key={date} label={date} onRemove={() => handleRemove(date)} />
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
      {showToast && (
        <CustomToast
          error={showToast?.error}
          label={showToast?.label}
          errorId={showToast?.errorId}
          onClose={() => setShowToast(null)}
          duration={showToast?.errorId ? 7000 : 5000}
        />
      )}
    </div>
  );
}

SelectBulkDateInputs.propTypes = {
  clearErrors: PropTypes.func.isRequired,
  config: PropTypes.shape({
    disable: PropTypes.bool,
    disableScrutinyHeader: PropTypes.bool,
    key: PropTypes.string.isRequired,
    populators: PropTypes.shape({
      inputs: PropTypes.array,
    }),
  }).isRequired,
  errors: PropTypes.object,
  formData: PropTypes.object,
  onSelect: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
};

export default SelectBulkDateInputs;
