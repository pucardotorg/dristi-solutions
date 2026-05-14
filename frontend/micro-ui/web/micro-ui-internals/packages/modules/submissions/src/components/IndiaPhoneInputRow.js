import React from "react";
import { TextInput } from "@egovernments/digit-ui-react-components";

export const INDIA_MOBILE_PREFIX = "+91";

const modalLabelStyle = {
  display: "block",
  marginBottom: "8px",
  fontSize: "16px",
  fontWeight: "400",
  color: "#0B0C0C",
};

const modalRowWrapStyle = {
  display: "flex",
  border: "1px solid #D6D5D4",
  borderRadius: "4px",
  overflow: "hidden",
};

const modalPrefixStyle = {
  backgroundColor: "#F6F6F6",
  padding: "12px 16px",
  borderRight: "1px solid #D6D5D4",
  display: "flex",
  alignItems: "center",
  fontSize: "16px",
  color: "#0B0C0C",
  justifyContent: "center",
};

const modalInputStyle = {
  flex: 1,
  padding: "12px 16px",
  border: "none",
  outline: "none",
  fontSize: "16px",
  color: "#0B0C0C",
};

const modalErrorStyle = {
  marginTop: "8px",
  fontSize: "14px",
  color: "#D4351C",
  fontWeight: "400",
};

/**
 * Modal layout: label + +91 + native tel input (matches GenericNumberInputModal).
 */
export const ModalIndiaPhoneInputRow = ({ mobileNumber, onMobileNumberChange, error, errorMessage }) => {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={modalLabelStyle}>Phone Number</label>
      <div style={modalRowWrapStyle}>
        <div style={modalPrefixStyle}>{INDIA_MOBILE_PREFIX}</div>
        <input
          type="tel"
          value={mobileNumber}
          onChange={onMobileNumberChange}
          placeholder="Ex. 1234567890"
          style={modalInputStyle}
          maxLength={10}
        />
      </div>
      {error ? <div style={modalErrorStyle}>{errorMessage}</div> : null}
    </div>
  );
};

/**
 * Citizen open-API login layout: +91 prefix + Digit TextInput (matches CitizenOpenApiMobileLoginPage).
 */
export const CitizenDigitIndiaPhoneRow = ({ t, config, mobileNumber, setMobileNumber, setError, error }) => {
  return (
    <div className="text-input-width-size field-container">
      {config?.componentInFront ? (
        <span className={`citizen-card-input citizen-card-input--front bailbondloginPage ${error ? "error-border" : ""}`}>
          {config?.componentInFront}
        </span>
      ) : null}
      <TextInput
        t={t}
        className={`field desktop-w-full ${error ? "error-border" : ""}`}
        key={config?.key}
        name={config.name}
        value={mobileNumber}
        onChange={(e) => {
          setError(false);
          const newValue = e.target.value;
          const regex = config?.validation?.pattern;
          if (!regex || newValue === "" || new RegExp(regex).test(newValue)) {
            setMobileNumber(newValue);
          }
        }}
        isRequired={config?.validation?.isRequired}
        pattern={config?.validation?.pattern}
        errMsg={config?.validation?.errMsg}
        maxlength={config?.validation?.maxLength}
        minlength={config?.validation?.minLength}
        style={error ? { borderColor: "#BB2C2F" } : {}}
      />
    </div>
  );
};
