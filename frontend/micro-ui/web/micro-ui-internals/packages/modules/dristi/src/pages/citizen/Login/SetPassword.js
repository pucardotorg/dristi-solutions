import React, { useMemo, useState } from "react";
import { Card, CardHeader, CardText, SubmitBar } from "@egovernments/digit-ui-react-components";
import CustomToast from "@egovernments/digit-ui-module-dristi/src/components/CustomToast";
import PasswordInput from "../../../components/PasswordInput";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_STRENGTH_LABELS,
  getPasswordStrength,
  isCommonPassword,
  matchesUserIdentifier,
  validatePassword,
} from "../../../Utils/passwordUtils";

const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const CheckIcon = ({ size = 10 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const AlertIcon = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 8v4.5" />
    <circle cx="12" cy="16" r=".6" fill="currentColor" stroke="none" />
    <path d="M10.3 3.9 2.4 18a1.9 1.9 0 0 0 1.7 2.9h15.8a1.9 1.9 0 0 0 1.7-2.9L13.7 3.9a1.9 1.9 0 0 0-3.4 0Z" />
  </svg>
);

// Segment colours for the strength meter (weak -> strong).
const STRENGTH_COLORS = ["#e5484d", "#e5484d", "#e5a22e", "#0090ff", "#217a3a"];

// Inline style for a checklist tick circle, based on met/failed state.
const tickStyle = (met, fail) => ({
  width: "16px",
  height: "16px",
  minWidth: "16px",
  flex: "0 0 16px",
  boxSizing: "border-box",
  borderRadius: "50%",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff",
  border: `1.5px solid ${fail ? "#c1232a" : met ? "#217a3a" : "#b9bbc6"}`,
  background: fail ? "#c1232a" : met ? "#217a3a" : "transparent",
});

/**
 * Shared Set/Change Password form, styled to match the old DIGIT card look used across the login
 * screens. The caller verifies the user beforehand (via OTP) and wires `onSubmit(newPassword)`.
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

  const isCommon = isCommonPassword(password);
  const hasIdentifier = matchesUserIdentifier(password, blocklistIdentifiers);
  const tooLong = password.length > PASSWORD_MAX_LENGTH;
  const lengthOk = password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH;
  const commonOk = password.length >= PASSWORD_MIN_LENGTH && !isCommon;
  const identifierOk = password.length >= PASSWORD_MIN_LENGTH && !hasIdentifier;
  const matchOk = Boolean(confirmPassword) && confirmPassword === password;
  // When the password contains the user's name/email/number, only the dedicated 3rd item turns red;
  // the generic "common" item is not also flagged.
  const commonFail = isCommon && !hasIdentifier;

  const strength = useMemo(() => getPasswordStrength(password), [password]);
  // "TOO_COMMON" is shown only for an actual common password; a name/email/number match is surfaced
  // by its own checklist item, not here.
  const strengthLabel = !password ? "—" : commonFail ? t("TOO_COMMON") : t(PASSWORD_STRENGTH_LABELS[strength]);

  const canSubmit = lengthOk && commonOk && identifierOk && matchOk && !isSubmitting;

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

  const reqRow = (met, fail, text) => (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: fail ? "#c1232a" : met ? "#0b0c0c" : "#77787b" }}>
      <span style={tickStyle(met, fail)}>{(met || fail) && <CheckIcon size={10} />}</span>
      <span>{text}</span>
    </div>
  );

  return (
    <div className="login-form" style={{ maxWidth: "480px", width: "100%" }}>
      {onCancel && (
        <span
          onClick={onCancel}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            cursor: "pointer",
            marginBottom: "16px",
            fontWeight: 400,
            color: "#0b0c0c",
            fontSize: "14px",
          }}
        >
          <BackIcon />
          {t(backLabel)}
        </span>
      )}
      <Card>
        <CardHeader styles={{ fontSize: "24px" }}>{t(header)}</CardHeader>
        {subText && <CardText>{t(subText)}</CardText>}

        <PasswordInput
          t={t}
          label="CS_NEW_PASSWORD"
          placeholder="CS_PASSWORD_LENGTH_PLACEHOLDER"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
        />

        <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              style={{ height: "5px", flex: 1, borderRadius: "9999px", background: index < strength ? STRENGTH_COLORS[strength] : "#e0e1e6" }}
            />
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginTop: "7px" }}>
          <span style={{ color: "#77787b" }}>{t("CS_PASSWORD_STRENGTH")}</span>
          <span style={{ fontWeight: 600, color: !password ? "#77787b" : commonFail ? "#c1232a" : STRENGTH_COLORS[strength] }}>{strengthLabel}</span>
        </div>

        <div
          style={{
            background: "#f4f4f7",
            borderRadius: "6px",
            padding: "12px 14px",
            marginTop: "14px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {reqRow(lengthOk, tooLong, tooLong ? t("CS_PASSWORD_REQ_TOO_LONG") : t("CS_PASSWORD_REQ_LENGTH"))}
          {reqRow(commonOk, commonFail, commonFail ? t("CS_PASSWORD_REQ_COMMON_FAIL") : t("CS_PASSWORD_REQ_COMMON"))}
          {reqRow(identifierOk, hasIdentifier, t("NO_USER_NAME_EMAIL_OR_NUMBER"))}
        </div>
        <p style={{ fontSize: "12.5px", color: "#77787b", lineHeight: 1.45, marginTop: "10px" }}>{t("CS_PASSWORD_HINT")}</p>

        <div style={{ marginTop: "16px" }}>
          <PasswordInput
            t={t}
            label="CS_CONFIRM_PASSWORD"
            placeholder="CS_RE_ENTER_PASSWORD"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
          />
          {confirmPassword && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12.5px",
                marginTop: "8px",
                fontWeight: 500,
                color: matchOk ? "#2a7e3b" : "#c1232a",
              }}
            >
              {matchOk ? <CheckIcon size={14} /> : <AlertIcon size={14} />}
              <span>{matchOk ? t("CS_PASSWORDS_MATCH") : t("ERR_PASSWORD_DO_NOT_MATCH")}</span>
            </div>
          )}
        </div>

        <SubmitBar label={t(submitLabel)} onSubmit={handleSubmit} disabled={!canSubmit} />
      </Card>
      {onSkip && (
        <h3 style={{ textAlign: "center", marginTop: "12px" }}>
          <span className="link" style={{ cursor: "pointer" }} onClick={onSkip}>
            {t("CS_SKIP_FOR_NOW")}
          </span>
        </h3>
      )}
      {error && <CustomToast error={true} label={t(error)} errorId={null} onClose={() => setError(null)} duration={5000} />}
    </div>
  );
};

export default SetPassword;
