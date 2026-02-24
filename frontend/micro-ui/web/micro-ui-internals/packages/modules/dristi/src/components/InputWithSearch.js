import React, { useState, useEffect, useRef } from "react";
import { TextInput, Button, CardLabelError, Tooltip } from "@egovernments/digit-ui-react-components";
import { OutlinedInfoIcon } from "../pages/citizen/FileCase/EFilingCases";
import { handleIfscAutofill } from "../pages/citizen/FileCase/EfilingValidationUtils";
import CustomErrorTooltip from "./CustomErrorTooltip";

function InputWithSearch({ t, config, formData = {}, onSelect, errors, setError, clearErrors }) {
  const fetchedIfsc = useRef({});
  const [value, setValue] = useState(formData?.[config.key]?.[config?.populators?.name] || "");

  useEffect(() => {
    setValue(formData?.[config.key]?.[config?.populators?.name] || "");
  }, [formData]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setValue(newValue);

    onSelect(config.key, { [config.populators.name]: newValue }, { shouldValidate: true });
  };

  const handleSearch = async () => {
    const ifsc = value;

    if (!ifsc || ifsc.length !== 11) {
      setError(config.key, { message: "CS_INVALID_IFSC" });
      return;
    }

    clearErrors(config.key);

    const prefix = config.populators.name.replace("Ifsc", "");

    await handleIfscAutofill({
      ifsc,
      bankField: `${prefix}BankName`,
      branchField: `${prefix}BranchName`,
      setValue: (field, value) => onSelect(field, value, { shouldValidate: false }),
      getValues: (field) => formData?.[field],
      setError,
      clearErrors,
      cache: fetchedIfsc,
    });
  };

  return (
    // <div className="custom-text-area-main-div">
    //   <div className="custom-text-area-header-div">
    //     <label className="digit-label custom-input-label">{t(config?.populators?.label)}</label>

    //     <CustomErrorTooltip message={t(config?.populators?.infoTooltipMessage)} showTooltip={Boolean(config?.populators?.infoTooltipMessage)} icon />
    //     <Button label={t(config?.populators?.buttonLabel)} onButtonClick={handleSearch} type="button" className="custom-search-button" />
    //   </div>
    //   {errors?.[config.key] && <CardLabelError>{t(errors[config.key]?.message || "CORE_REQUIRED_FIELD_ERROR")}</CardLabelError>}
    // </div>
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <label className="digit-label">{t(config?.populators?.label)}</label>
        <CustomErrorTooltip message={t(config?.populators?.infoTooltipMessage)} showTooltip={Boolean(config?.populators?.infoTooltipMessage)} icon />
      </div>
      {/* {config?.tooltipValue && config?.labelChildren === "OutlinedInfoIcon" && (
        <Tooltip content={t(config.tooltipValue)}>
          <span className="ifsc-tooltip-icon">
            <OutlinedInfoIcon />
          </span>
        </Tooltip>
      )} */}

      <div style={{ display: "flex", width: "100%", gap: "8px", alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <TextInput
            value={value}
            onChange={handleChange}
            placeholder={t(config?.populators?.placeholder)}
            className="ifsc-text-input"
            style={{ width: "100%" }}
          />
        </div>

        <div className="ifsc-search-btn">
          <Button
            label={t(config?.populators?.buttonLabel)}
            onButtonClick={handleSearch}
            className="ifsc-search-button"
            variation="primary"
            type="button"
          />
        </div>
      </div>

      {errors?.[config.key] && <CardLabelError>{t(errors[config.key]?.message || "CORE_REQUIRED_FIELD_ERROR")}</CardLabelError>}
    </div>
  );
}

export default InputWithSearch;
