import { TextInput } from "@egovernments/digit-ui-react-components";
import React from "react";

function CustomTextInput({ t, config, onSelect, formData = {}, errors, setError, clearErrors }) {
  return (
    <React.Fragment>
      {config?.populators?.inputs?.map((input, index) => {
        return (
          <div className="phone-number-verification">
            <div style={{marginBottom:"3px"}}>{t(input.label)}</div>
            <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
              <div className="field user-details-form-style" style={{ display: "flex", width: "100%" }}>
                <TextInput
                  key={input.name}
                  value={formData?.[config?.key]?.[input?.name]}
                  name={config.name}
                  minlength={input?.validation?.minLength}
                  maxlength={input?.validation?.maxLength}
                  title={input?.validation?.title}
                  disable={input?.disable || config?.disable}
                  isMandatory={errors[input?.name]}
                  onChange={(e) => {
                    const value = e.target.value;
                    onSelect(config?.key, { ...formData?.[config.key], [input?.name]: value });
                  }}
                  textInputStyle={input?.textInputStyle}
                  defaultValue={undefined}
                  style={input?.styles}
                  errorStyle={errors?.[input.name]}
                  {...input.validation}
                />
              </div>
            </div>
          </div>
        );
      })}
    </React.Fragment>
  );
}

export default CustomTextInput;
