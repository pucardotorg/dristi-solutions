import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axiosInstance from "@egovernments/digit-ui-module-core/src/Utils/axiosInstance";
import { Loader } from "@egovernments/digit-ui-react-components";
import SetPassword from "./SetPassword";
import CustomToast from "@egovernments/digit-ui-module-dristi/src/components/CustomToast";

/**
 * Set / Change Password screen backed by the no-login update endpoint. The new password is saved
 * directly using the signed-in user's auth token (verificationMode "TOKEN") - there is no OTP step.
 * Reached both from the profile menu and from the post-login "set a password" prompt; both behave
 * identically.
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

  const [showToast, setShowToast] = useState(null);
  const [loader, setLoader] = useState(false); // full-screen overlay shown while the update is in flight

  const userType = window.location.href.includes("/citizen") ? "citizen" : "employee";
  const goHome = () => history.push(`/${window?.contextPath}/citizen/dristi/home`);

  const buildRequestInfo = () => ({
    apiId: "Rainmaker",
    msgId: `${Date.now()}|${Digit?.StoreData?.getCurrentLanguage?.() || "en_IN"}`,
    ts: 0,
    authToken: window.localStorage.getItem("token"),
    userInfo,
  });

  // Save the new password directly. Errors propagate to the SetPassword form, which surfaces them.
  const onSubmit = async (password) => {
    setLoader(true);
    try {
      await axiosInstance.post(
        "/user/password/nologin/_update",
        {
          RequestInfo: buildRequestInfo(),
          userName: mobileNumber,
          newPassword: password,
          tenantId,
          type: userType?.toUpperCase(),
          verificationMode: "TOKEN",
        },
        { params: { tenantId } }
      );
      // Password now exists, so subsequent screens read "Change your password" and the set-password
      // prompt must never reappear.
      window.localStorage.setItem("hasPassword", "true");
      window.localStorage.setItem("showPasswordSetupPrompt", "false");
      setShowToast({ error: false, label: t("PASSWORD_UPDATED_SUCCESSFULLY") });
      setTimeout(goHome, 1500);
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
          onSubmit={onSubmit}
          blocklistIdentifiers={[mobileNumber, userInfo?.emailId, userInfo?.name]}
        />
        {showToast && (
          <CustomToast error={showToast.error} label={showToast.label} errorId={null} onClose={() => setShowToast(null)} duration={5000} />
        )}
      </div>
    </div>
  );
};

export default PasswordSettings;
