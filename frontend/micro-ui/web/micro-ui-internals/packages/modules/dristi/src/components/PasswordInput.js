import React, { useMemo, useState } from "react";
import { CardLabel, CardLabelError } from "@egovernments/digit-ui-react-components";
import { PASSWORD_MAX_LENGTH, PASSWORD_STRENGTH_LABELS, getPasswordStrength } from "../Utils/passwordUtils";

const EyeIcon = ({ visible }) =>
  visible ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 5C7 5 2.73 8.11 1 12.5 2.73 16.89 7 20 12 20s9.27-3.11 11-7.5C21.27 8.11 17 5 12 5zm0 12.5a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"
        fill="#505A5F"
      />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2 4.27l2.28 2.28.46.46A11.8 11.8 0 0 0 1 12.5C2.73 16.89 7 20 12 20a11.7 11.7 0 0 0 5.14-1.19l.47.47L19.73 21 21 19.73 3.27 3 2 4.27zm7.53 7.53l2.67 2.67a3 3 0 0 1-2.67-2.67zM12 7.5c-.6 0-1.17.11-1.7.31l1.86 1.86A3.02 3.02 0 0 1 15 12.34l1.86 1.86c.2-.53.31-1.1.31-1.7a5 5 0 0 0-5-5z"
        fill="#505A5F"
      />
    </svg>
  );

const PasswordInput = ({
  t,
  name = "password",
  label,
  value,
  onChange,
  placeholder,
  error,
  showStrengthMeter = false,
  autoComplete = "new-password",
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const strength = useMemo(() => (showStrengthMeter ? getPasswordStrength(value) : 0), [value, showStrengthMeter]);
  const strengthColors = ["#C33F3F", "#E5A22E", "#F1C40F", "#3DA13D", "#007E7E"];

  return (
    <div className="password-input-wrapper">
      {label && <CardLabel>{t(label)}</CardLabel>}
      <div className="password-input-field-container" style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <input
          className="password-input-field"
          type={isVisible ? "text" : "password"}
          name={name}
          value={value || ""}
          placeholder={placeholder ? t(placeholder) : ""}
          maxLength={PASSWORD_MAX_LENGTH}
          autoComplete={autoComplete}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: "100%",
            height: "40px",
            padding: "0 42px 0 10px",
            border: "1px solid #d6d5d4",
            backgroundColor: "#fff",
            fontSize: "16px",
            lineHeight: "40px",
            boxSizing: "border-box",
          }}
        />
        <button
          type="button"
          aria-label={isVisible ? "Hide password" : "Show password"}
          onClick={() => setIsVisible((prev) => !prev)}
          style={{
            position: "absolute",
            right: "10px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            padding: 0,
          }}
        >
          <EyeIcon visible={isVisible} />
        </button>
      </div>
      {showStrengthMeter && value && (
        <div className="password-strength-meter" style={{ marginTop: "8px" }}>
          <div style={{ display: "flex", gap: "4px" }}>
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                style={{
                  height: "4px",
                  flex: 1,
                  borderRadius: "2px",
                  backgroundColor: index < strength ? strengthColors[strength] : "#E7E7E7",
                }}
              />
            ))}
          </div>
          <span style={{ fontSize: "12px", color: strengthColors[strength], marginTop: "4px", display: "inline-block" }}>
            {t(PASSWORD_STRENGTH_LABELS[strength])}
          </span>
        </div>
      )}
      {error && <CardLabelError>{t(error)}</CardLabelError>}
    </div>
  );
};

export default PasswordInput;
