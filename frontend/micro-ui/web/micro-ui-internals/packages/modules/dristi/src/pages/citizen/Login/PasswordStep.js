import React, { useState } from "react";
import StateEmblemIcon from "../../../components/StateEmblemIcon";
import ImageCaptcha from "../../../components/ImageCaptcha";
import { verifyCaptcha } from "../../../Utils/captchaUtils";

const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7" />
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

const formatMobile = (m) => (m || "").replace(/(\d{5})(\d{5})/, "$1 $2");

const PasswordStep = ({ t, mobileNumber, password, onPasswordChange, onSelect, canSubmit, error, onBack, onSwitchToOtp }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaError, setCaptchaError] = useState(false);
  const [captchaNonce, setCaptchaNonce] = useState(0);
  const isValid = password?.length >= 8;

  const handleSubmit = () => {
    if (!verifyCaptcha(captchaInput, captchaAnswer)) {
      setCaptchaError(true);
      setCaptchaInput("");
      // Force a fresh challenge by remounting the widget.
      setCaptchaNonce((n) => n + 1);
      return;
    }
    setCaptchaError(false);
    onSelect();
  };

  return (
    <div className="login-v2-card">
      <button className="login-v2-back-link" onClick={onBack}>
        <BackIcon />
        {t("CS_COMMON_BACK")}
      </button>
      <div className="login-v2-brand" style={{ marginBottom: "18px" }}>
        <StateEmblemIcon className="login-v2-emblem" />
      </div>
      <h2 className="login-v2-heading">{t("CS_ENTER_PASSWORD_HEADING")}</h2>
      <p className="login-v2-subtext">{t("CS_ENTER_PASSWORD_SUBTEXT")}</p>

      <div className="login-v2-mobtag">
        <span>+91 {formatMobile(mobileNumber)}</span>
        <button className="login-v2-mobtag-change" onClick={onBack}>
          {t("CS_COMMON_CHANGE")}
        </button>
      </div>

      <div className="login-v2-field">
        <label className="login-v2-label" htmlFor="login-v2-password">
          {t("CS_PASSWORD")}
        </label>
        <div className="login-v2-control">
          <input
            id="login-v2-password"
            className={`login-v2-input login-v2-has-suffix ${error ? "login-v2-err" : ""}`}
            type={isVisible ? "text" : "password"}
            placeholder={t("CS_ENTER_PASSWORD")}
            autoComplete="current-password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
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
        {error && (
          <div className="login-v2-error-text">
            <AlertIcon />
            <span>{error}</span>
          </div>
        )}
      </div>

      <ImageCaptcha
        key={captchaNonce}
        t={t}
        value={captchaInput}
        onChange={(val) => {
          setCaptchaInput(val);
          setCaptchaError(false);
        }}
        onAnswerChange={setCaptchaAnswer}
        error={captchaError}
      />

      <button className="login-v2-btn" onClick={handleSubmit} disabled={!isValid || !canSubmit}>
        {t("CS_COMMON_SIGN_IN")}
      </button>
      <div className="login-v2-form-links">
        <button className="login-v2-link-btn" onClick={onSwitchToOtp}>
          {t("CS_FORGOT_PASSWORD_LOGIN_WITH_OTP")}
        </button>
      </div>
    </div>
  );
};

export default PasswordStep;
