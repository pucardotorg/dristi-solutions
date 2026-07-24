import React from "react";
import { Link } from "react-router-dom/cjs/react-router-dom.min";
import StateEmblemIcon from "../../../components/StateEmblemIcon";

const AlertIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 8v4.5" />
    <circle cx="12" cy="16" r=".6" fill="currentColor" stroke="none" />
    <path d="M10.3 3.9 2.4 18a1.9 1.9 0 0 0 1.7 2.9h15.8a1.9 1.9 0 0 0 1.7-2.9L13.7 3.9a1.9 1.9 0 0 0-3.4 0Z" />
  </svg>
);

const MobileNumberStep = ({ t, mobileNumber, onMobileChange, onSelect, canSubmit, isUserLoggedIn, error }) => {
  const isValid = mobileNumber?.length === 10 && mobileNumber.match(window?.Digit.Utils.getPattern("MobileNo"));

  return (
    <div className="login-v2-card">
      <div className="login-v2-brand">
        <StateEmblemIcon className="login-v2-emblem" />
        <div className="login-v2-org">
          24×7 <b>ONCOURTS</b>
        </div>
      </div>
      <h2 className="login-v2-heading">{t("CS_SIGNIN_TO_ACCOUNT")}</h2>
      <p className="login-v2-subtext">{t("CS_SIGNIN_WELCOME_BACK")}</p>

      <div className="login-v2-field">
        <label className="login-v2-label" htmlFor="login-v2-mobile">
          {t("CORE_COMMON_PHONE_NUMBER")}
        </label>
        <div className="login-v2-control">
          <span className="login-v2-prefix">+91</span>
          <input
            id="login-v2-mobile"
            className={`login-v2-input login-v2-has-prefix ${error ? "login-v2-err" : ""}`}
            inputMode="numeric"
            maxLength={10}
            placeholder={t("CS_MOBILE_NUMBER_PLACEHOLDER")}
            autoComplete="username"
            value={mobileNumber}
            onChange={onMobileChange}
          />
        </div>
        {error && (
          <div className="login-v2-error-text">
            <AlertIcon />
            <span>{error}</span>
          </div>
        )}
      </div>

      <button className="login-v2-btn" onClick={onSelect} disabled={!isValid || !canSubmit}>
        {t("CS_COMMON_SIGN_IN")}
      </button>

      {!isUserLoggedIn && (
        <div className="login-v2-form-links">
          <span>
            {t("CS_REGISTER_ACCOUNT")}{" "}
            <Link className="login-v2-link-btn" to={`/${window?.contextPath}/citizen/dristi/home/registration/mobile-number`}>
              {t("CS_REGISTER_LINK")}
            </Link>
          </span>
        </div>
      )}
    </div>
  );
};

export default MobileNumberStep;
