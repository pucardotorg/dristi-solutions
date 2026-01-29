import React from "react";
import { Dropdown, TextInput } from "@egovernments/digit-ui-react-components";
import { Controller } from "react-hook-form";

export const LinkLabel = (props) => {
  return (
    <label className="link-label" onClick={props.onClick} style={{ ...props.style }}>
      {props.children}
    </label>
  );
};

export const renderField = (t, field, formData, setValue, register, trigger, control) => {
  const fieldName = field?.populators?.name;

  const handleFieldChange = (e) => {
    if (field.type === "number") {
      const val = e.target.value;
      const regex = /^[0-9\b]+$/;
      if (val === "" || regex.test(val)) {
        setValue(fieldName, val);
      }
    } else {
      setValue(fieldName, e.target.value);
    }
  };

  switch (field?.type) {
    case "date":
    case "text":
    case "month":
    case "datetime-local":
      return (
        <Controller
          name={fieldName}
          control={control}
          rules={{
            required: field?.isMandatory ? `${t("CORE_COMMON_REQUIRED_MSG")}` : false,
            ...field?.populators?.validation,
          }}
          render={({ field: controllerField }) => {
            return (
              <TextInput
                t={t}
                type={field.type}
                value={formData?.[fieldName] || ""}
                onChange={handleFieldChange}
                disable={field.disable}
                placeholder={t(field?.populators?.placeholder || "")}
                onBlur={() => trigger(fieldName)}
                min={field?.populators?.min}
                max={field?.populators?.max}
                style={field.type === "date" ? { paddingRight: "3px" } : field?.populators?.style ? { ...field?.populators?.style } : {}}
                className={field?.populators?.className || ""}
              />
            );
          }}
        />
      );
    case "dropdown":
      return (
        <Controller
          name={fieldName}
          control={control}
          rules={{ required: field.isMandatory ? `${t("CORE_COMMON_REQUIRED_MSG")}` : false }}
          render={({ field: controllerField }) => (
            <Dropdown
              t={t}
              option={field?.populators?.options || []}
              selected={formData?.[fieldName] || null}
              value={formData?.[fieldName] || null}
              optionKey={field?.populators?.optionKey || "name"}
              select={(e) => {
                setValue(fieldName, e);
              }}
              onBlur={() => trigger(fieldName)}
              disable={field?.disable}
              placeholder={field?.populators?.placeholder ? t(field.populators.placeholder) : ""}
              className={field?.populators?.className || ""}
              style={field?.populators?.style || {}}
            />
          )}
        />
      );
    default:
      return null;
  }
};
