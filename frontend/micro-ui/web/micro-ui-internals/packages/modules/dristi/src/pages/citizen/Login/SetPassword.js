import React, { useMemo, useState } from "react";
import CustomToast from "@egovernments/digit-ui-module-dristi/src/components/CustomToast";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_STRENGTH_LABELS,
  getPasswordStrength,
  isBlocklistedPassword,
  validatePassword,
} from "../../../Utils/passwordUtils";

const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const KeyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7.5" cy="15.5" r="4.5" />
    <path d="m10.7 12.3 8.6-8.6M17 6l2.5 2.5M14.5 8.5 17 11" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const AlertIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 8v4.5" />
    <circle cx="12" cy="16" r=".6" fill="currentColor" stroke="none" />
    <path d="M10.3 3.9 2.4 18a1.9 1.9 0 0 0 1.7 2.9h15.8a1.9 1.9 0 0 0 1.7-2.9L13.7 3.9a1.9 1.9 0 0 0-3.4 0Z" />
  </svg>
);

const EyeIcon = ({ visible }) =>
  visible ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.7 5.1A9.8 9.8 0 0 1 12 5c6.5 0 10 7 10 7a13.2 13.2 0 0 1-2.2 3M6.1 6.2A13.3 13.3 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 4.3-1M3 3l18 18M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

// Colours mirror the design tokens (destructive / warning / info / success) driving the strength meter.
const STRENGTH_COLORS = ["#e5484d", "#e5484d", "#ffc53d", "#0090ff", "#46a758"];

const PasswordField = ({ t, id, label, placeholder, value, onChange, autoComplete, error }) => {
  const [isVisible, setIsVisible] = useState(false);
  return (
    <div className="login-v2-field" style={{ marginBottom: 0 }}>
      <label className="login-v2-label" htmlFor={id}>
        {t(label)}
      </label>
      <div className="login-v2-control">
        <input
          id={id}
          className={`login-v2-input login-v2-has-suffix ${error ? "login-v2-err" : ""}`}
          type={isVisible ? "text" : "password"}
          placeholder={placeholder ? t(placeholder) : ""}
          maxLength={PASSWORD_MAX_LENGTH}
          autoComplete={autoComplete}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          className="login-v2-suffix"
          aria-label={isVisible ? "Hide password" : "Show password"}
          onClick={() => setIsVisible((prev) => !prev)}
        >
          <EyeIcon visible={isVisible} />
        </button>
      </div>
    </div>
  );
};

/**
 * Shared Set/Change Password form styled to match the login-v2 design (`scr-setpw`).
 * The caller is responsible for verifying the user beforehand (via OTP) and wiring
 * `onSubmit(newPassword)` to Digit.UserService.changePassword.
 */
const SetPassword = ({
  t,
  header = "SET_PASSWORD",
  subText,
  onSubmit,
  onCancel,
  backLabel = "CS_COMMON_BACK",
  onSkip,
  submitLabel = "CS_SAVE_PASSWORD",
  blocklistIdentifiers = [],
}) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordValidation = useMemo(() => validatePassword(password, blocklistIdentifiers), [password, blocklistIdentifiers]);

  const isCommon = isBlocklistedPassword(password, blocklistIdentifiers);
  const tooLong = password.length > PASSWORD_MAX_LENGTH;
  const lengthOk = password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH;
  const commonOk = password.length >= PASSWORD_MIN_LENGTH && !isCommon;
  const matchOk = Boolean(confirmPassword) && confirmPassword === password;

  const strength = useMemo(() => getPasswordStrength(password, blocklistIdentifiers), [password, blocklistIdentifiers]);
  const strengthLabel = password ? t(PASSWORD_STRENGTH_LABELS[strength]) : "—";

  const canSubmit = lengthOk && commonOk && matchOk && !isSubmitting;

  const handleSubmit = async () => {
    if (!passwordValidation.isValid) {
      setError(passwordValidation.errorKey);
      return;
    }
    if (password !== confirmPassword) {
      setError("ERR_PASSWORD_DO_NOT_MATCH");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(password);
    } catch (err) {
      setError(err?.response?.data?.error?.fields?.[0]?.message || "ES_SOMETHING_WRONG");
    } finally {
      setIsSubmitting(false);
    }
  };

  const lengthReqClass = tooLong ? "login-v2-req login-v2-req-fail" : lengthOk ? "login-v2-req login-v2-req-met" : "login-v2-req";
  const commonReqClass = isCommon ? "login-v2-req login-v2-req-fail" : commonOk ? "login-v2-req login-v2-req-met" : "login-v2-req";

  return (
    <div className="login-v2-card">
      {onCancel && (
        <button className="login-v2-back-link" onClick={onCancel}>
          <BackIcon />
          {t(backLabel)}
        </button>
      )}
      <div className="login-v2-icon-box">
        <KeyIcon />
      </div>
      <h2 className="login-v2-heading">{t(header)}</h2>
      {subText && <p className="login-v2-subtext">{t(subText)}</p>}

      <PasswordField
        t={t}
        id="login-v2-new-password"
        label="CS_NEW_PASSWORD"
        placeholder="CS_PASSWORD_LENGTH_PLACEHOLDER"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        error={tooLong || isCommon}
      />

      <div className="login-v2-meter">
        {[0, 1, 2, 3].map((index) => (
          <span
            key={index}
            className="login-v2-meter-seg"
            style={{ background: index < strength ? STRENGTH_COLORS[strength] : "var(--neutral-5)" }}
          />
        ))}
      </div>
      <div className="login-v2-meter-label">
        <span style={{ color: "var(--muted-foreground)" }}>{t("CS_PASSWORD_STRENGTH")}</span>
        <span style={{ color: !password ? "var(--muted-foreground)" : isCommon ? "var(--destructive)" : STRENGTH_COLORS[strength] }}>
          {strengthLabel}
        </span>
      </div>

      <ul className="login-v2-req-list">
        <li className={lengthReqClass}>
          <span className="login-v2-req-tick">
            <CheckIcon />
          </span>
          {tooLong ? t("CS_PASSWORD_REQ_TOO_LONG") : t("CS_PASSWORD_REQ_LENGTH")}
        </li>
        <li className={commonReqClass}>
          <span className="login-v2-req-tick">
            <CheckIcon />
          </span>
          {isCommon ? t("CS_PASSWORD_REQ_COMMON_FAIL") : t("CS_PASSWORD_REQ_COMMON")}
        </li>
      </ul>
      <p className="login-v2-hint">{t("CS_PASSWORD_HINT")}</p>

      <div style={{ marginTop: "16px" }}>
        <PasswordField
          t={t}
          id="login-v2-confirm-password"
          label="CS_CONFIRM_PASSWORD"
          placeholder="CS_RE_ENTER_PASSWORD"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
          error={Boolean(confirmPassword) && !matchOk}
        />
        {confirmPassword && (
          <div className={`login-v2-match-note ${matchOk ? "login-v2-match-ok" : "login-v2-match-bad"}`}>
            {matchOk ? <CheckIcon /> : <AlertIcon />}
            <span>{matchOk ? t("CS_PASSWORDS_MATCH") : t("ERR_PASSWORD_DO_NOT_MATCH")}</span>
          </div>
        )}
      </div>

      <button className="login-v2-btn" style={{ marginTop: "16px" }} onClick={handleSubmit} disabled={!canSubmit}>
        {t(submitLabel)}
      </button>

      {onSkip && (
        <div className="login-v2-form-links">
          <button className="login-v2-link-btn" onClick={onSkip} disabled={isSubmitting}>
            {t("CS_SKIP_FOR_NOW")}
          </button>
        </div>
      )}
      {error && <CustomToast error={true} label={t(error)} errorId={null} onClose={() => setError(null)} duration={5000} />}
    </div>
  );
};

export default SetPassword;
