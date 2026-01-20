import { CardLabelError } from "@egovernments/digit-ui-components";
import { Button, RemoveableTag, TextInput } from "@egovernments/digit-ui-react-components";
import React, { useMemo, useState } from "react";

function SelectBulkDateInputs({ t, config, onSelect, formData = {}, errors }) {
  const [pickerValue, setPickerValue] = useState("");
  const [enableAdd, setEnableAdd] = useState(false);

  const formatForSave = (dateStr) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return `${d}-${m}-${y}`;
  };

  const parseForSort = (dateStr) => {
    const [d, m, y] = dateStr.split("-");
    return new Date(`${y}-${m}-${d}`).getTime();
  };

  const inputs = useMemo(() => config?.populators?.inputs || [], [config?.populators?.inputs]);

  const chipList = useMemo(() => formData?.[config.key] || [], [formData, config.key]);

  const handleAdd = (input) => {
    const formattedDate = formatForSave(pickerValue);
    const maxAllowed = input?.maxSelected || Infinity;

    if (chipList.length < maxAllowed && !chipList.includes(formattedDate)) {
      const newList = [...chipList, formattedDate];
      const sortedList = newList.sort((a, b) => parseForSort(a) - parseForSort(b));
      
      onSelect(config.key, sortedList);
      
      setPickerValue("");
      setEnableAdd(false);
    }
  };

  const handleRemove = (dateToRemove) => {
    const filteredDates = chipList.filter((date) => date !== dateToRemove);
    onSelect(config.key, filteredDates);
  };

  const onChange = (event, input) => {
    const { value } = event.target;
    const formattedDate = formatForSave(value);
    
    const maxAllowed = input?.maxSelected || Infinity;
    const isDuplicate = chipList.includes(formattedDate);
    const isLimitReached = chipList.length >= maxAllowed;
    const isBeforeMin = input.validation?.minDate && value < input.validation.minDate;

    setPickerValue(value);
    setEnableAdd(!!value && !isDuplicate && !isLimitReached && !isBeforeMin);
  };

  return inputs.map((input) => {
    const maxAllowed = input?.maxSelected || Infinity;
    const isLimitReached = chipList.length >= maxAllowed;

    return (
      <div key={input.name} className={`bulk-input-class ${input.className || ""}`} style={{ width: "100%", marginBottom: "1.5rem" }}>
        {!config?.disableScrutinyHeader && (
          <h3 className="bulk-input-header" style={{ marginBottom: "8px", fontWeight: "600" }}>
            {t(input.label)}
          </h3>
        )}
        
        <div className="bulk-input-main" style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <TextInput
              type="date"
              value={pickerValue}
              onChange={(event) => onChange(event, input)}
              name={input.name}
              min={input.validation?.minDate}
              disable={input?.disable || config?.disable || isLimitReached}
            />
            {isLimitReached && (
              <p style={{ fontSize: "14px", color: "#BB2C2F", marginTop: "4px" }}>
                {t("CS_MAX_LIMIT_REACHED")}: {maxAllowed}
              </p>
            )}
          </div>
          <Button
            label={t("CS_ADD")}
            isDisabled={!enableAdd || isLimitReached}
            onButtonClick={() => handleAdd(input)}
            style={{ marginTop: "4px" }}
          />
        </div>

        {errors?.[config?.key] && (
          <CardLabelError style={{ margin: "8px 0" }}>
            {t(input.error || input.validation?.errMsg || "CORE_REQUIRED_FIELD_ERROR")}
          </CardLabelError>
        )}

        {chipList?.length > 0 && (
          <div className="tag-container" style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
            {chipList.map((date, index) => (
              <RemoveableTag
                key={index}
                text={date}
                disabled={config?.disable}
                onClick={() => handleRemove(date)}
                extraStyles={{
                  tagStyles: { background: "#F3F3F3", border: "1px solid #B1B4B6" }
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  });
}

export default SelectBulkDateInputs;