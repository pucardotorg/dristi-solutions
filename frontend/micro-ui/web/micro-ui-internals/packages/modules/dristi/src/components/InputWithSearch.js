import React, { useRef, useMemo } from "react";
import { TextInput, CardLabelError } from "@egovernments/digit-ui-react-components";
import { handleIfscAutofill } from "../pages/citizen/FileCase/EfilingValidationUtils";
import CustomErrorTooltip from "./CustomErrorTooltip";

function InputWithSearch({ t, config, formData = {}, onSelect, errors, setError, clearErrors }) {
  const fetchedIfsc = useRef({});
  const inputs = useMemo(() => config?.populators?.inputs || [], [config?.populators?.inputs]);

  function setValue(value, inputName) {
    const updatedValue = {
      ...formData?.[config.key],
      [inputName]: value,
    };

    onSelect(config.key, updatedValue, { shouldValidate: true });
  }
  const formatIFSC = (value = "") => {
    let updated = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    updated = updated.slice(0, 11);
    if (updated.length <= 4) {
      updated = updated.replace(/[^A-Z]/g, "");
    }
    if (updated.length >= 5) {
      updated = updated.slice(0, 4).replace(/[^A-Z]/g, "") + "0" + updated.slice(5);
    }
    if (updated.length > 5) {
      updated = updated.slice(0, 5) + updated.slice(5).replace(/[^A-Z0-9]/g, "");
    }

    return updated;
  };
  const handleChange = (e, input) => {
    let newValue = e.target.value;
    if (input.name.includes("Ifsc")) {
      newValue = formatIFSC(newValue);

      const prefix = input.name.replace("Ifsc", "");

      const updatedValue = {
        ...formData?.[config.key],
        [input.name]: newValue,
        BankReadOnly: false,
        BranchReadOnly: false,
      };

      onSelect(config.key, updatedValue, { shouldValidate: false });
      onSelect(`${prefix}BankName`, "", { shouldValidate: false });
      onSelect(`${prefix}BranchName`, "", { shouldValidate: false });

      clearErrors(`${prefix}BankName`);
      clearErrors(`${prefix}BranchName`);
      clearErrors(config.key);

      return;
    }
    setValue(newValue, input.name);
  };
  const handleSearch = async (input) => {
    const ifsc = formData?.[config.key]?.[input.name];

    if (!ifsc) {
      setError(config.key, { msg: "CORE_REQUIRED_FIELD_ERROR" });
      return;
    }

    if (ifsc.length !== 11) {
      setError(config.key, { msg: "CS_INVALID_IFSC" });
      return;
    }

    const prefix = input.name.replace("Ifsc", "");

    const success = await handleIfscAutofill({
      ifsc,
      bankField: `${prefix}BankName`,
      branchField: `${prefix}BranchName`,
      setValue: (field, value) => {
        if (field.includes("ReadOnly")) {
          const flagName = field.replace(prefix, "");
          onSelect(config.key, { ...formData?.[config.key], [flagName]: value }, { shouldValidate: false });
        } else {
          onSelect(field, value, { shouldValidate: false });
        }
      },
      getValues: (field) => formData?.[field],
      setError,
      clearErrors,
      cache: fetchedIfsc,
    });
    if (!success) {
      setError(config.key, { msg: "CS_INVALID_IFSC" });
    } else {
      clearErrors(config.key);
      clearErrors(input.name);
      onSelect(config.key, { ...formData?.[config.key], BankReadOnly: true, BranchReadOnly: true });
    }
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
                name={input?.name}
                value={formData?.[config.key]?.[input.name] || ""}
                onChange={(e) => handleChange(e, input)}
                placeholder={t(input?.placeholder)}
                className={`ifsc-text-input ${errors?.[config.key] ? "error" : ""}`}
                error={errors?.[config.key]}
                disable={config?.disable}
              />
            </div>

            <div>
              <button
                className="ifsc-search-btn"
                style={{ opacity: config?.disable ? 0.5 : 1 }}
                onClick={() => handleSearch(input)}
                type="button"
                disabled={config?.disable}
              >
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
