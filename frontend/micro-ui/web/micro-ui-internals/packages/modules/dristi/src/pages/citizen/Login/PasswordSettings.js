import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardText, SubmitBar, BackButton } from "@egovernments/digit-ui-react-components";
import SelectOtp from "./SelectOtp";
import SetPassword from "./SetPassword";
import CustomToast from "@egovernments/digit-ui-module-dristi/src/components/CustomToast";

const STEP_OTP = "OTP";
const STEP_SET_PASSWORD = "SET_PASSWORD";

/**
 * Password Settings screen, reached from the profile menu.
 * Since this is NOT immediately after an OTP login, OTP verification is required before saving a new password.
 */
const PasswordSettings = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const Digit = window.Digit || {};
  const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
  const tenantId = window.localStorage.getItem("tenant-id");
  const mobileNumber = userInfo?.mobileNumber;

  const [step, setStep] = useState(STEP_OTP);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [showToast, setShowToast] = useState(null);

  const getUserType = () => Digit.UserService.getType();

  const sendOtp = async () => {
    try {
      await Digit.UserService.sendOtp(
        { otp: { mobileNumber, userType: getUserType(), type: "passwordreset", tenantId } },
        tenantId
      );
    } catch (err) {
      setShowToast({ error: true, label: t("ES_SOMETHING_WRONG") });
    }
  };

  React.useEffect(() => {
    if (mobileNumber) {
      sendOtp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The OTP itself is verified server-side when changePassword is called with it as otpReference,
  // so we just carry it forward here rather than making a separate verify call.
  const verifyOtpAndProceed = () => {
    setOtpError(false);
    setStep(STEP_SET_PASSWORD);
  };

  const handleSetPassword = async (newPassword) => {
    const requestData = {
      username: mobileNumber,
      newPassword,
      confirmPassword: newPassword,
      otpReference: otp,
      tenantId,
      type: getUserType()?.toUpperCase(),
    };
    await Digit.UserService.changePassword(requestData, tenantId);
    setShowToast({ error: false, label: t("PASSWORD_UPDATED_SUCCESSFULLY") });
    setTimeout(() => history.goBack(), 1500);
  };

  return (
    <div className="password-settings-wrapper">
      <div className="employeeBackbuttonAlign">
        <BackButton variant="white" style={{ borderBottom: "none" }} onClick={() => history.goBack()} />
      </div>
      {step === STEP_OTP && (
        <Card style={{ maxWidth: "480px", margin: "auto" }}>
          <CardHeader>{t("PASSWORD_SETTINGS")}</CardHeader>
          <CardText>
            {`${t("CS_LOGIN_OTP_TEXT")} `}
            <b>{`+91 - ${mobileNumber}`}</b>
          </CardText>
          <SelectOtp t={t} userType="employee" otp={otp} onOtpChange={setOtp} error={otpError} onResend={sendOtp} />
          <div style={{ marginTop: "16px" }}>
            <SubmitBar label={t("VERIFY")} onSubmit={verifyOtpAndProceed} disabled={otp?.length !== 6} />
          </div>
        </Card>
      )}
      {step === STEP_SET_PASSWORD && (
        <div className="login-v2">
          <SetPassword
            t={t}
            header="CS_CHANGE_PASSWORD_HEADING"
            subText="CS_CHANGE_PASSWORD_SUBTEXT"
            submitLabel="CS_COMMON_SUBMIT"
            onSubmit={handleSetPassword}
            onCancel={() => history.goBack()}
          />
        </div>
      )}
      {showToast && (
        <CustomToast
          error={showToast.error}
          label={showToast.label}
          errorId={null}
          onClose={() => setShowToast(null)}
          duration={5000}
        />
      )}
    </div>
  );
};

export default PasswordSettings;
