import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axiosInstance from "@egovernments/digit-ui-module-core/src/Utils/axiosInstance";
import { Loader } from "@egovernments/digit-ui-react-components";
import SelectOtp from "./SelectOtp";
import SetPassword from "./SetPassword";
import CustomToast from "@egovernments/digit-ui-module-dristi/src/components/CustomToast";

/**
 * Password Settings screen, reached from the profile menu. Enter the new password, verify with a
 * password-reset OTP (shown as the old pop-up modal), then save it via the no-login update endpoint.
 */
const PasswordSettings = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const Digit = window.Digit || {};
  const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
  const tenantId = window.localStorage.getItem("tenant-id");
  const mobileNumber = userInfo?.mobileNumber;

  // Whether this user already has a real password (persisted from the user search at login). Drives
  // "Set a password" vs "Change your password" wording on this screen.
  const passwordExists = window.localStorage.getItem("hasPassword") === "true";

  const [newPassword, setNewPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [canSubmitOtp, setCanSubmitOtp] = useState(true);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showToast, setShowToast] = useState(null);
  const [loader, setLoader] = useState(false); // full-screen overlay shown while a password API call is in flight

  const userType = window.location.href.includes("/citizen") ? "citizen" : "employee";
  const goHome = () => history.push(`/${window?.contextPath}/citizen/dristi/home`);

  const buildRequestInfo = () => ({
    apiId: "Rainmaker",
    msgId: `${Date.now()}|${Digit?.StoreData?.getCurrentLanguage?.() || "en_IN"}`,
    ts: 0,
    authToken: window.localStorage.getItem("token"),
    userInfo,
  });

  const sendPasswordResetOtp = async () => {
    await Digit.UserService.sendOtp({ otp: { mobileNumber, tenantId, type: "passwordreset", userType: userType?.toUpperCase() } }, tenantId);
  };

  // Step 1: the user submitted a new password on the form - send the OTP and open the modal.
  const startOtp = async (password) => {
    setNewPassword(password);
    setOtpError(false);
    setCanSubmitOtp(true);
    setOtp("");
    setLoader(true);
    try {
      await sendPasswordResetOtp();
      setShowOtpModal(true);
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
          type: userType?.toUpperCase(),
        },
        { params: { tenantId } }
      );
      // Password now exists, so subsequent screens should read "Change your password".
      window.localStorage.setItem("hasPassword", "true");
      setShowOtpModal(false);
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
    <div className="user-registration">
      <div className="citizen-form-wrapper">
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
        <SetPassword
          t={t}
          header={passwordExists ? "CS_CHANGE_PASSWORD_HEADING" : "SET_PASSWORD"}
          subText={passwordExists ? "CS_CHANGE_PASSWORD_SUBTEXT" : "SET_PASSWORD_PROMPT_MESSAGE"}
          submitLabel="CS_COMMON_CONTINUE"
          onCancel={goHome}
          backLabel="RETURN_TO_HOME"
          onSubmit={startOtp}
          blocklistIdentifiers={[mobileNumber, userInfo?.emailId]}
        />
        {showOtpModal && (
          <SelectOtp
            cardText={t("CS_LOGIN_OTP_TEXT")}
            mobileNumber={mobileNumber || ""}
            onOtpChange={setOtp}
            onResend={resendOtp}
            onSelect={submitNewPassword}
            otp={otp}
            error={otpError}
            canSubmit={canSubmitOtp}
            params={{ otp }}
            setParams={(p) => setOtp((p && p.otp) || "")}
            setState={(updater) =>
              setShowOtpModal((prev) => (typeof updater === "function" ? updater({ showOtpModal: prev }).showOtpModal : updater.showOtpModal))
            }
            t={t}
            path=""
          />
        )}
        {showToast && (
          <CustomToast error={showToast.error} label={showToast.label} errorId={null} onClose={() => setShowToast(null)} duration={5000} />
        )}
      </div>
    </div>
  );
};

export default PasswordSettings;
