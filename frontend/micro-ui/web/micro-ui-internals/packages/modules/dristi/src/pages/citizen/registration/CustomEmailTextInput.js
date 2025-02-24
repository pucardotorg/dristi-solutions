import { CardLabelError } from "@egovernments/digit-ui-components";
import { CardLabel, LabelFieldPair, TextInput } from "@egovernments/digit-ui-react-components";
import React, { useState } from "react";

const RoundedCheck = ({ className, height = "24", width = "24", style = {}, fill = "green", onClick = null }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" height={height} width={width} viewBox="0 0 24 24" fill={fill} className={className}>
      <path d="M0 0h24v24H0V0z" fill="none" />
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM9.29 16.29L5.7 12.7c-.39-.39-.39-1.02 0-1.41.39-.39 1.02-.39 1.41 0L10 14.17l6.88-6.88c.39-.39 1.02-.39 1.41 0 .39.39.39 1.02 0 1.41l-7.59 7.59c-.38.39-1.02.39-1.41 0z" />
    </svg>
  );
};

function CustomEmailTextInput({ t, config, onSelect, formData = {}, errors, setError, clearErrors }) {
  const userInfo = Digit.UserService.getUser()?.info;
  const [userEmail, setUserEmail] = useState(userInfo?.emailId || null);

  return (
    <React.Fragment>
      {config?.populators?.inputs?.map((input, index) => {
        return (
          <div className="phone-number-verification">
            <LabelFieldPair>
              <CardLabel className="card-label-smaller" style={{ fontWeight: "700" }}>
                {t(input.label)}
              </CardLabel>
            </LabelFieldPair>
            <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
              <div className="field user-details-form-style" style={{ display: "flex", width: "100%" }}>
                {config?.componentInFront ? (
                  <span className={`citizen-card-input citizen-card-input--front${errors[config.key] ? " alert-error-border" : ""}`}>
                    {config?.componentInFront}
                  </span>
                ) : null}
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
                    setUserEmail(null);
                    if (!input?.validation?.pattern.test(value)) {
                      setError(input?.name, {
                        type: "required",
                        message: input?.validation?.errMsg,
                      });
                    } else {
                      clearErrors(input?.name);
                    }
                    onSelect(config?.key, { ...formData?.[config.key], [input?.name]: value });
                  }}
                  textInputStyle={input?.textInputStyle}
                  defaultValue={undefined}
                  style={userEmail && input?.styles}
                  errorStyle={errors?.[input.name]}
                  {...input.validation}
                />
              </div>
              {userEmail && (
                <span
                  style={{
                    position: "absolute",
                    height: "40px",
                    right: "10px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <RoundedCheck />
                </span>
              )}
            </div>
            {errors[input?.name] && (
              <CardLabelError style={{ color: "red", fontSize: "12px" }}>
                {errors[input?.name]?.message ? errors[input?.name]?.message : t(errors[input?.name]) || t(input?.error)}
              </CardLabelError>
            )}{" "}
          </div>
        );
      })}
    </React.Fragment>
  );
}

export default CustomEmailTextInput;
