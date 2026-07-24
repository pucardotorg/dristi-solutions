import React, { useMemo, useState } from "react";
import { Card, CardHeader, CardText, SubmitBar } from "@egovernments/digit-ui-react-components";
import PasswordInput from "../../../components/PasswordInput";
import CustomToast from "@egovernments/digit-ui-module-dristi/src/components/CustomToast";
import { validatePassword } from "../../../Utils/passwordUtils";

/**
 * Shared Set/Change Password form (no OTP entry here - the caller is responsible for verifying
 * the user beforehand and wiring `onSubmit(newPassword)` to Digit.UserService.changePassword).
 */
const SetPassword = ({ t, header = "SET_PASSWORD", subText, onSubmit, onCancel, isChangePassword = false, submitLabel = "CS_COMMON_SUBMIT" }) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordValidation = useMemo(() => validatePassword(password), [password]);

  const mismatchError = touched && confirmPassword && password !== confirmPassword ? "ERR_PASSWORD_DO_NOT_MATCH" : null;

  const canSubmit = password && confirmPassword && passwordValidation.isValid && password === confirmPassword && !isSubmitting;

  const handleSubmit = async () => {
    setTouched(true);
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

  return (
    <div className="set-password-wrapper">
      <Card style={{ maxWidth: "480px", margin: "auto" }}>
        <CardHeader>{t(header)}</CardHeader>
        {subText && <CardText>{t(subText)}</CardText>}
        <PasswordInput
          t={t}
          name="newPassword"
          label={isChangePassword ? "CS_NEW_PASSWORD" : "CS_PASSWORD"}
          placeholder="CS_ENTER_PASSWORD"
          value={password}
          onChange={(value) => {
            setPassword(value);
            setTouched(true);
          }}
          showStrengthMeter
          error={touched && password && !passwordValidation.isValid ? passwordValidation.errorKey : null}
        />
        <div style={{ marginTop: "16px" }}>
          <PasswordInput
            t={t}
            name="confirmPassword"
            label="CS_CONFIRM_PASSWORD"
            placeholder="CS_RE_ENTER_PASSWORD"
            value={confirmPassword}
            onChange={(value) => {
              setConfirmPassword(value);
              setTouched(true);
            }}
            error={mismatchError}
          />
        </div>
        <div className="set-password-actions" style={{ display: "flex", gap: "16px", marginTop: "24px" }}>
          {onCancel && (
            <SubmitBar
              label={t("CS_COMMON_CANCEL")}
              onSubmit={onCancel}
              style={{ backgroundColor: "#fff", border: "1px solid #007E7E", color: "#007E7E" }}
            />
          )}
          <SubmitBar label={t(submitLabel)} onSubmit={handleSubmit} disabled={!canSubmit} />
        </div>
      </Card>
      {error && <CustomToast error={true} label={t(error)} errorId={null} onClose={() => setError(null)} duration={5000} />}
    </div>
  );
};

export default SetPassword;
