import React, { useState, useEffect, useRef, useMemo } from "react";
import { TextInput, CardLabelError } from "@egovernments/digit-ui-react-components";
import { handleIfscAutofill } from "../pages/citizen/FileCase/EfilingValidationUtils";
import CustomErrorTooltip from "./CustomErrorTooltip";

function InputWithSearch({ t, config, formData = {}, onSelect, errors, setError, clearErrors }) {
  const fetchedIfsc = useRef({});
  const inputs = useMemo(() => config?.populators?.inputs || [], [config?.populators?.inputs]);
  const [formdata, setFormData] = useState(formData);

  useEffect(() => {
    setFormData(formData);
  }, [formData]);

  function setValue(value, inputName) {
    let updatedValue = {
      ...formData[config.key],
      [inputName]: value,
    };

    if (!value) {
      updatedValue = null;
    }

    setFormData((prev) => ({
      ...prev,
      [config.key]: {
        ...prev?.[config.key],
        [inputName]: value,
      },
    }));

    onSelect(config.key, updatedValue, { shouldValidate: true });
  }
  const handleChange = (e, input) => {
    const newValue = e.target.value;
    setValue(newValue, input.name);
  };
  const handleSearch = async (input) => {
    const ifsc = formdata?.[config.key]?.[input.name];

    if (!ifsc) {
      setError(config.key, { msg: "CORE_REQUIRED_FIELD_ERROR" });
      return;
    }

    if (ifsc.length !== 11) {
      setError(config.key, { msg: "CS_INVALID_IFSC" });
      return;
    }

    clearErrors(config.key);

    const prefix = input.name.replace("Ifsc", "");

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
  return inputs.map((input) => {
    return (
      <div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <label className="digit-label">{t(input?.label)}</label>
            <CustomErrorTooltip message={t(input?.infoTooltipMessage)} showTooltip={Boolean(input?.infoTooltipMessage)} icon />
          </div>

          <div style={{ display: "flex", width: "100%", gap: "8px", alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <TextInput
                value={formdata?.[config.key]?.[input.name] || ""}
                onChange={(e) => handleChange(e, input)}
                placeholder={t(input?.placeholder)}
                className={`ifsc-text-input ${errors?.[config.key] ? "error" : ""}`}
                error={errors?.[config.key]}
              />
            </div>

            <div>
              <button className="ifsc-search-btn" onClick={() => handleSearch(input)} type="button">
                {t("ES_COMMON_SEARCH")}
              </button>
            </div>
          </div>
        </div>
        {errors?.[config.key] && (
          <CardLabelError style={input?.errorStyle}>{t(errors[config.key]?.msg || "CORE_REQUIRED_FIELD_ERROR")}</CardLabelError>
        )}
      </div>
    );
  });
}

export default InputWithSearch;
