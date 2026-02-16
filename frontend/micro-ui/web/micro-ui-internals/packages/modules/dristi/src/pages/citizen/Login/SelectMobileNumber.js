import React from "react";
import FormStep from "../../../components/FormStep";
import { Link } from "react-router-dom/cjs/react-router-dom.min";

const SelectMobileNumber = ({
  t,
  onSelect,
  mobileNumber,
  onMobileChange,
  config,
  canSubmit,
  isRegister,
  isUserLoggedIn,
  className,
  cooldownTime = 0,
}) => {
  return (
    <div className={`login-form ${className}`}>
      <FormStep
        isDisabled={!(mobileNumber.length === 10 && mobileNumber.match(window?.Digit.Utils.getPattern("MobileNo")) && canSubmit)}
        onSelect={onSelect}
        config={config}
        t={t}
        componentInFront="+91"
        onChange={onMobileChange}
        value={mobileNumber}
        buttonStyle={{ color: "red" }}
      >
        {cooldownTime > 0 && (
          <div className="cooldown-timer">
            <p>{t("CS_RESEND_OTP_TIMER", { seconds: cooldownTime })}</p>
          </div>
        )}
      </FormStep>
      {!isRegister && (
        <h3>
          {t("CS_REGISTER_ACCOUNT")}
          <span className="link">
            <Link
              to={
                !isUserLoggedIn
                  ? `/${window?.contextPath}/citizen/dristi/home/registration/mobile-number`
                  : `/${window?.contextPath}/citizen/dristi/home/registration/user-name`
              }
            >
              {String(t("CS_REGISTER_LINK"))}
            </Link>
          </span>
        </h3>
      )}
    </div>
  );
};

export default SelectMobileNumber;
