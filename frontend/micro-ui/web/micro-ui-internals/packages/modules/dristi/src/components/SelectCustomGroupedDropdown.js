import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { CardLabelError } from "@egovernments/digit-ui-react-components";
import { isEmptyObject } from "../Utils";
import isEqual from "lodash/isEqual";

function SelectCustomGroupedDropdown({ t, config, formData = {}, onSelect, errors }) {
  const name = config?.populators?.name || config?.key;
  const options = useMemo(() => config?.populators?.options || [], [config?.populators?.options]);
  const optionsKey = config?.populators?.optionsKey || "label";
  const valueKey = config?.populators?.valueKey || "value";

  const [selectedOption, setSelectedOption] = useState(formData?.[name] || null);

  useEffect(() => {
    if (!isEqual(formData?.[name], selectedOption)) {
      setSelectedOption(formData?.[name]);
    }
  }, [formData]);

  const handleChange = (selected) => {
    setSelectedOption(selected);
    onSelect(name, isEmptyObject(selected) ? null : selected, { shouldValidate: true });
  };

  return (
    <div className="custom-grouped-dropdown-wrapper" style={config?.populators?.styles}>
      <Select
        name={name}
        id={name}
        value={selectedOption}
        onChange={handleChange}
        options={options}
        getOptionLabel={(e) => t(e[optionsKey])}
        getOptionValue={(e) => e[valueKey]}
        isDisabled={config?.disable}
        placeholder={t("")}
        classNamePrefix="custom-select"
        styles={{
          control: (base) => ({
            ...base,
            borderColor: errors?.[name] ? "red" : "#333",
            minHeight: "40px",
            boxShadow: "none",
            borderRadius: 0,
            "&:hover": { borderColor: "#333" },
            ...config?.populators?.dropdownStyle,
          }),
          menu: (base) => ({
            ...base,
            zIndex: 9999,
          }),
          menuList: (base) => ({
            ...base,
            maxHeight: config?.populators?.optionsCustomStyle?.height || "30vh",
            overflowY: "auto",
          }),
          groupHeading: (base, state) => ({
            ...base,
            textTransform: "none",
            display: state.data.label ? "block" : "none",
            fontSize: "14px",
            color: "#333",
            padding: "8px 12px",
            backgroundColor: "#f5f5f5",
            borderTop: "1px solid #eee",
          }),
          option: (base, state) => ({
            ...base,
            padding: "10px 12px",
            backgroundColor: state.isFocused ? "#f0f0f0" : "white",
            color: "#000",
            cursor: "pointer",
          }),
        }}
        isSearchable={false}
        formatGroupLabel={(data) => (data.label ? <div style={{ fontWeight: "bold", padding: "4px 8px" }}>{t(data.label)}</div> : null)}
      />

      {errors?.[name] && (
        <CardLabelError style={config?.populators?.errorStyle}>{t(errors?.[name]?.msg || "CORE_REQUIRED_FIELD_ERROR")}</CardLabelError>
      )}
    </div>
  );
}

export default SelectCustomGroupedDropdown;