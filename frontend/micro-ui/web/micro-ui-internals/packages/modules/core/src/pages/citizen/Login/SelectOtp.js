import { CardLabelError, CardText, FormStep, OTPInput } from "@egovernments/digit-ui-react-components";
import React, { Fragment, useState } from "react";
import PropTypes from "prop-types";
import useInterval from "../../../hooks/useInterval";

const ResendOtpButton = ({ onClick, className, label }) => (
  <button type="button" className={className} onClick={onClick} style={{ background: "none", border: "none", padding: 0 }}>
    {label}
  </button>
);

ResendOtpButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  className: PropTypes.string,
  label: PropTypes.string,
};

const SelectOtp = ({ config, otp, onOtpChange, onResend, onSelect, t, error, userType = "citizen", canSubmit }) => {
  const [timeLeft, setTimeLeft] = useState(30);

  useInterval(
    () => {
      setTimeLeft(timeLeft - 1);
    },
    timeLeft > 0 ? 1000 : null
  );

  const handleResendOtp = () => {
    onResend();
    setTimeLeft(2);
  };

  if (userType === "employee") {
    return (
      <Fragment>
        <OTPInput length={6} onChange={onOtpChange} value={otp} />
        {timeLeft > 0 ? (
          <CardText>{`${t("CS_RESEND_ANOTHER_OTP")} ${timeLeft} ${t("CS_RESEND_SECONDS")}`}</CardText>
        ) : (
          <ResendOtpButton className="card-text-button resend-otp" onClick={handleResendOtp} label={t("CS_RESEND_OTP")} />
        )}
        {!error && <CardLabelError>{t("CS_INVALID_OTP")}</CardLabelError>}
      </Fragment>
    );
  }

  return (
    <FormStep onSelect={onSelect} config={config} t={t} isDisabled={!(otp?.length === 6 && canSubmit)}>
      <OTPInput length={6} onChange={onOtpChange} value={otp} />
      {timeLeft > 0 ? (
        <CardText>{`${t("CS_RESEND_ANOTHER_OTP")} ${timeLeft} ${t("CS_RESEND_SECONDS")}`}</CardText>
      ) : (
        <ResendOtpButton className="card-text-button" onClick={handleResendOtp} label={t("CS_RESEND_OTP")} />
      )}
      {!error && <CardLabelError>{t("CS_INVALID_OTP")}</CardLabelError>}
    </FormStep>
  );
};

SelectOtp.propTypes = {
  config: PropTypes.object,
  otp: PropTypes.string,
  onOtpChange: PropTypes.func.isRequired,
  onResend: PropTypes.func.isRequired,
  onSelect: PropTypes.func,
  t: PropTypes.func.isRequired,
  error: PropTypes.bool,
  userType: PropTypes.string,
  canSubmit: PropTypes.bool,
};

export default SelectOtp;
