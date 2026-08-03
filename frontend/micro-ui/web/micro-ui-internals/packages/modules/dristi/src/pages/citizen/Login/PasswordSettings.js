import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axiosInstance from "@egovernments/digit-ui-module-core/src/Utils/axiosInstance";
import { Loader } from "@egovernments/digit-ui-react-components";
import OtpStep from "./OtpStep";
import SetPassword from "./SetPassword";
import CustomToast from "@egovernments/digit-ui-module-dristi/src/components/CustomToast";

const STEP_FORM = "FORM";
const STEP_OTP = "OTP";

/**
 * Password Settings screen, reached from the profile menu. It reuses the exact "set a password"
 * experience from the login flow: enter the new password, verify with a password-reset OTP, then
 * save it via the no-login update endpoint.
 */
const PasswordSettings = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const Digit = window.Digit || {};
  const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
  const tenantId = window.localStorage.getItem("tenant-id");
  const mobileNumber = userInfo?.mobileNumber;

  // Whether this user still has no password set (persisted from the login auth response). Drives
  // "Set a password" vs "Change your password" wording on this screen.
  const passwordNotSet = userInfo?.showPasswordSetupPrompt === true;

  const [step, setStep] = useState(STEP_FORM);
  const [newPassword, setNewPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [canSubmitOtp, setCanSubmitOtp] = useState(true);
  const [showToast, setShowToast] = useState(null);
  const [loader, setLoader] = useState(false); // full-screen overlay shown while a password API call is in flight

  const getUserType = () => Digit.UserService.getType();
  const goHome = () => history.push(`/${window?.contextPath}/citizen/dristi/home`);

  const buildRequestInfo = () => ({
    apiId: "Rainmaker",
    msgId: `${Date.now()}|${Digit?.StoreData?.getCurrentLanguage?.() || "en_IN"}`,
    ts: 0,
    authToken: window.localStorage.getItem("token"),
    userInfo,
  });

  const sendPasswordResetOtp = async () => {
    await Digit.UserService.sendOtp({ otp: { mobileNumber, tenantId, type: "passwordreset", userType: getUserType()?.toUpperCase() } }, tenantId);
  };

  // Step 1: the user submitted a new password on the form - send the OTP and move to verification.
  const startOtp = async (password) => {
    setNewPassword(password);
    setOtpError(false);
    setCanSubmitOtp(true);
    setOtp("");
    setLoader(true);
    try {
      await sendPasswordResetOtp();
      setStep(STEP_OTP);
    } finally {
      setLoader(false);
    }
  };

  const resendOtp = async () => {
    setOtpError(false);
    setOtp("");
    setLoader(true);
    try {
      await sendPasswordResetOtp();
    } finally {
      setLoader(false);
    }
  };

  // Step 2: verify the OTP and persist the new password via the no-login update endpoint.
  const submitNewPassword = async () => {
    setOtpError(false);
    setCanSubmitOtp(false);
    setLoader(true);
    try {
      await axiosInstance.post(
        "/user/password/nologin/_update",
        {
          RequestInfo: buildRequestInfo(),
          otpReference: otp,
          userName: mobileNumber,
          newPassword,
          tenantId,
          type: getUserType()?.toUpperCase(),
        },
        { params: { tenantId } }
      );
      // Password now exists, so subsequent screens should read "Change your password".
      window.localStorage.setItem("showPasswordSetupPrompt", "false");
      setShowToast({ error: false, label: t("PASSWORD_UPDATED_SUCCESSFULLY") });
      setTimeout(goHome, 1500);
    } catch (err) {
      setCanSubmitOtp(true);
      setOtpError(err?.response?.data?.error_description === "Account locked" ? t("MAX_RETRIES_EXCEEDED") : t("CS_INVALID_OTP"));
      setOtp("");
    } finally {
      setLoader(false);
    }
  };

  return (
    <div className="login-v2">
      {loader && (
        <div
          style={{
            width: "100vw",
            height: "100vh",
            zIndex: "999999999999999999",
            position: "fixed",
            right: "0",
            display: "flex",
            top: "0",
            background: "rgb(234 234 245 / 50%)",
            alignItems: "center",
            justifyContent: "center",
          }}
          className="submit-loader"
        >
          <Loader />
        </div>
      )}
      {step === STEP_OTP ? (
        <OtpStep
          mobileNumber={mobileNumber || ""}
          otp={otp}
          onOtpChange={setOtp}
          onSelect={submitNewPassword}
          onResend={resendOtp}
          onBack={() => {
            setOtpError(false);
            setOtp("");
            setStep(STEP_FORM);
          }}
          canSubmit={canSubmitOtp}
          error={otpError}
          t={t}
        />
      ) : (
        <SetPassword
          t={t}
          header={passwordNotSet ? "SET_PASSWORD" : "CS_CHANGE_PASSWORD_HEADING"}
          subText={passwordNotSet ? "SET_PASSWORD_PROMPT_MESSAGE" : "CS_CHANGE_PASSWORD_SUBTEXT"}
          submitLabel="CS_COMMON_CONTINUE"
          onCancel={goHome}
          backLabel="RETURN_TO_HOME"
          onSubmit={startOtp}
          blocklistIdentifiers={[mobileNumber, userInfo?.emailId]}
        />
      )}
      {showToast && <CustomToast error={showToast.error} label={showToast.label} errorId={null} onClose={() => setShowToast(null)} duration={5000} />}
    </div>
  );
};

export default PasswordSettings;
