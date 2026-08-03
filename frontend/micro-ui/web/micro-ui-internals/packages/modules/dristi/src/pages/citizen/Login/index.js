import CustomToast from "@egovernments/digit-ui-module-dristi/src/components/CustomToast";
import axiosInstance from "@egovernments/digit-ui-module-core/src/Utils/axiosInstance";
import { Loader } from "@egovernments/digit-ui-react-components";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Route, Switch, useHistory, useLocation, useRouteMatch } from "react-router-dom";
import InfoModal from "../../../components/InfoModal";
import { loginSteps } from "./config";
import SelectMobileNumber from "./SelectMobileNumber";
import MobileNumberStep from "./MobileNumberStep";
import PasswordStep from "./PasswordStep";
import OtpStep from "./OtpStep";
import SelectOtp from "./SelectOtp";
import SetPassword from "./SetPassword";
import SetPasswordPromptModal from "./SetPasswordPromptModal";

const TYPE_REGISTER = { type: "REGISTER" };
const TYPE_LOGIN = { type: "LOGIN" };
const DEFAULT_USER = "digit-user";

/* set citizen details to enable backward compatiable */
const setCitizenDetail = (userObject, token, tenantId) => {
  let locale = JSON.parse(sessionStorage.getItem("Digit.initData"))?.value?.selectedLanguage;
  localStorage.setItem("Citizen.tenant-id", tenantId);
  localStorage.setItem("tenant-id", tenantId);
  localStorage.setItem("citizen.userRequestObject", JSON.stringify(userObject));
  localStorage.setItem("locale", locale);
  localStorage.setItem("Citizen.locale", locale);
  localStorage.setItem("token", token);
  localStorage.setItem("Citizen.token", token);
  localStorage.setItem("user-info", JSON.stringify(userObject));
  localStorage.setItem("Citizen.user-info", JSON.stringify(userObject));
};

function getRedirectionUrl(status) {
  switch (status) {
    case "isNotRegistered":
      return `/${window?.contextPath}/citizen/dristi/home/registration/user-name`;
    case "isNotApproved":
      return `/${window?.contextPath}/citizen/dristi/home/isNotApproved`;
    case "isApproved":
      return `/${window?.contextPath}/citizen/dristi/home`;
    case "isNotLoggedIn":
      return `/${window?.contextPath}/citizen/dristi/home/login`;
    case "isRegistered":
      return `/${window?.contextPath}/citizen/dristi/home/login`;
    default:
      return `/${window?.contextPath}/citizen/dristi/home/registration/user-name`;
  }
}

const DEFAULT_REDIRECT_URL = getRedirectionUrl("isNotRegistered");

const Login = ({ stateCode }) => {
  const Digit = window.Digit || {};
  const { t } = useTranslation();
  const location = useLocation();
  const { path, url } = useRouteMatch();
  const history = useHistory();
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const token = window.localStorage.getItem("token");
  const isUserLoggedIn = Boolean(token);
  const [otpError, setOtpError] = useState(false);
  const [tokens, setTokens] = useState(null);
  const [params, setParmas] = useState({});
  const [errorTO, setErrorTO] = useState(null);
  const [canSubmitOtp, setCanSubmitOtp] = useState(true);
  const [canSubmitNo, setCanSubmitNo] = useState(true);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpCooldownTimer, setOtpCooldownTimer] = useState(null);
  const [isUserRegistered, setIsUserRegistered] = useState(true);
  const [showUnregisteredModal, setShowUnregisteredModal] = useState(false);
  const [{ showOtpModal }, setState] = useState({ showOtpModal: false });
  const [loginMode, setLoginMode] = useState("PASSWORD"); // "PASSWORD" | "OTP"
  const [loginStep, setLoginStep] = useState("MOBILE"); // "MOBILE" | "PASSWORD" | "OTP" (only relevant when loginMode === "PASSWORD")
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(null);
  const [canSubmitPassword, setCanSubmitPassword] = useState(true);
  const [showSetPasswordScreen, setShowSetPasswordScreen] = useState(false);
  const [setPwSubStep, setSetPwSubStep] = useState("FORM"); // "FORM" | "OTP" (within the set-password prompt)
  const [newPasswordValue, setNewPasswordValue] = useState("");
  const [loader, setLoader] = useState(false); // full-screen overlay shown while a login/password API call is in flight

  useEffect(() => {
    let errorTimeout;
    if (error) {
      if (errorTO) {
        clearTimeout(errorTO);
        setErrorTO(null);
      }
      errorTimeout = setTimeout(() => {
        setError("");
      }, 5000);
      setErrorTO(errorTimeout);
    }
    return () => {
      errorTimeout && clearTimeout(errorTimeout);
    };
  }, [error]);

  const finishLogin = () => {
    localStorage.setItem("citizen.userRequestObject", user);
    Digit.UserService.setUser(user);
    if (params.isRememberMe) {
      localStorage.setItem("refresh-token", user?.refresh_token);
    }
    localStorage.setItem("citizen.refresh-token", user?.refresh_token);
    setCitizenDetail(user?.info, user?.access_token, stateCode);
    const redirectPath = location.state?.from || DEFAULT_REDIRECT_URL;
    if (!Digit.ULBService.getCitizenCurrentTenant(true)) {
      const homeUrl = `/${window?.contextPath}/citizen/dristi/home`;
      const idVerificationUrl = `/${window?.contextPath}/citizen/dristi/home/registration/user-name`;
      history.push(isUserRegistered ? homeUrl : idVerificationUrl, {
        redirectBackTo: redirectPath,
      });
    } else {
      history.push(redirectPath);
    }
  };

  useEffect(() => {
    if (!user) {
      return;
    }

    // Persist whether this user still needs to set a password. The home screen reads this flag and
    // surfaces the "set a password" prompt on top of itself; Password Settings uses it for wording.
    localStorage.setItem("showPasswordSetupPrompt", user?.info?.showPasswordSetupPrompt ? "true" : "false");

    // Always continue to the home screen after a successful login; the set-password prompt (when
    // applicable) is now shown over the home screen rather than blocking the login flow here.
    finishLogin();
  }, [user]);

  const stepItems = useMemo(() =>
    loginSteps.map(
      (step) => {
        const texts = {};
        for (const key in step.texts) {
          texts[key] = t(step.texts[key]);
        }
        return { ...step, texts };
      },
      [loginSteps]
    )
  );

  const getUserType = () => Digit.UserService.getType();

  const handleOtpChange = (otp) => {
    setParmas({ ...params, otp });
  };

  const handleMobileChange = (event) => {
    const { value } = event.target;
    setParmas({ ...params, mobileNumber: value?.replace(/[^0-9]/g, ""), name: "" });
    setIsUserRegistered(true);
  };

  // Function to start the OTP cooldown timer
  const startOtpCooldown = () => {
    // Set initial cooldown to 60 seconds (1 minute)
    setOtpCooldown(60);

    // Clear any existing timer
    if (otpCooldownTimer) {
      clearInterval(otpCooldownTimer);
    }

    // Create a new timer that decrements the cooldown every second
    const timer = setInterval(() => {
      setOtpCooldown((prevCooldown) => {
        if (prevCooldown <= 1) {
          clearInterval(timer);
          setCanSubmitNo(true);
          return 0;
        }
        return prevCooldown - 1;
      });
    }, 1000);

    // Save the timer ID for cleanup
    setOtpCooldownTimer(timer);
  };

  // Cleanup timer on component unmount
  useEffect(() => {
    return () => {
      if (otpCooldownTimer) {
        clearInterval(otpCooldownTimer);
      }
    };
  }, [otpCooldownTimer]);

  const handlePasswordMobileChange = (event) => {
    const { value } = event.target;
    setParmas({ ...params, mobileNumber: value?.replace(/[^0-9]/g, "") });
  };

  const submitMobileNumber = () => {
    setPasswordError(null);
    setPassword("");
    setLoginStep("PASSWORD");
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    setPasswordError(null);
  };

  const selectPassword = async () => {
    setPasswordError(null);
    setCanSubmitPassword(false);
    setLoader(true);
    try {
      const requestData = {
        username: params.mobileNumber,
        password,
        tenantId: stateCode,
        userType: getUserType(),
        authType: "PASSWORD",
      };
      const { ResponseInfo, UserRequest: info, ...tokens } = await Digit.UserService.authenticate(requestData);

      if (window?.globalConfigs?.getConfig("ENABLE_SINGLEINSTANCE")) {
        info.tenantId = Digit.ULBService.getStateId();
      }

      setUser({ info, ...tokens });
    } catch (err) {
      setPasswordError(err?.response?.data?.error_description === "Account locked" ? t("MAX_RETRIES_EXCEEDED") : t("CS_INVALID_MOBILE_OR_PASSWORD"));
    } finally {
      setCanSubmitPassword(true);
      setLoader(false);
    }
  };

  const backToMobileStep = () => {
    setPasswordError(null);
    setPassword("");
    setLoginStep("MOBILE");
  };

  // Sends the login OTP to the mobile number already captured on the password screen and moves to
  // the inline OTP verification screen. The mobile number is reused, so the user is never taken
  // back to the mobile-number entry screen.
  const requestLoginOtp = async () => {
    setOtpError(false);
    setCanSubmitNo(false);
    setCanSubmitOtp(true);
    setLoader(true);
    setParmas((prev) => ({ ...prev, otp: "" }));
    const data = {
      mobileNumber: params.mobileNumber,
      tenantId: stateCode,
      userType: getUserType(),
    };
    const [, err] = await sendOtp({ otp: { ...data, ...TYPE_LOGIN } });
    setLoader(false);
    if (!err) {
      startOtpCooldown();
      setOtpError(false);
      setLoginStep("OTP");
    } else {
      setCanSubmitNo(true);
      setIsUserRegistered(false);
      setShowUnregisteredModal(true);
    }
  };

  const switchToOtpLogin = () => {
    setPasswordError(null);
    setPassword("");
    requestLoginOtp();
  };

  const backToPasswordStep = () => {
    setOtpError(false);
    setParmas((prev) => ({ ...prev, otp: "" }));
    setLoginStep("PASSWORD");
  };

  // Fires a password-reset OTP for the "set a password" prompt (a fresh OTP dedicated to the
  // password change, separate from the login OTP), then moves to the OTP entry sub-step.
  const startSetPasswordOtp = async (newPassword) => {
    setNewPasswordValue(newPassword);
    setOtpError(false);
    setCanSubmitOtp(true);
    setParmas((prev) => ({ ...prev, otp: "" }));
    setLoader(true);
    try {
      await Digit.UserService.sendOtp(
        { otp: { mobileNumber: params.mobileNumber, tenantId: stateCode, type: "passwordreset", userType: getUserType()?.toUpperCase() } },
        stateCode
      );
      setSetPwSubStep("OTP");
    } finally {
      setLoader(false);
    }
  };

  const resendSetPasswordOtp = async () => {
    setOtpError(false);
    setParmas((prev) => ({ ...prev, otp: "" }));
    setLoader(true);
    try {
      await Digit.UserService.sendOtp(
        { otp: { mobileNumber: params.mobileNumber, tenantId: stateCode, type: "passwordreset", userType: getUserType()?.toUpperCase() } },
        stateCode
      );
    } finally {
      setLoader(false);
    }
  };

  const buildRequestInfo = (withAuth = false) => ({
    apiId: "Rainmaker",
    msgId: `${Date.now()}|${Digit?.StoreData?.getCurrentLanguage?.() || "en_IN"}`,
    ts: 0,
    ...(withAuth ? { authToken: user?.access_token, userInfo: user?.info } : {}),
  });

  // Verifies the password-reset OTP and sets the new password via the no-login update endpoint.
  const submitNewPassword = async () => {
    setOtpError(false);
    setCanSubmitOtp(false);
    setLoader(true);
    try {
      await axiosInstance.post(
        "/user/password/nologin/_update",
        {
          // The API gateway still requires the session token from the just-completed OTP login,
          // even though this endpoint does not itself require a password login.
          RequestInfo: buildRequestInfo(true),
          otpReference: params.otp,
          userName: params.mobileNumber,
          newPassword: newPasswordValue,
          tenantId: stateCode,
          type: getUserType()?.toUpperCase(),
        },
        { params: { tenantId: stateCode } }
      );
      // Password now exists, so future screens should read "Change your password".
      localStorage.setItem("showPasswordSetupPrompt", "false");
      setShowSetPasswordScreen(false);
      finishLogin();
    } catch (err) {
      setCanSubmitOtp(true);
      setOtpError(err?.response?.data?.error_description === "Account locked" ? t("MAX_RETRIES_EXCEEDED") : t("CS_INVALID_OTP"));
      setParmas((prev) => ({ ...prev, otp: "" }));
    } finally {
      setLoader(false);
    }
  };

  // "Remind me later" - no server call; the prompt will appear again on the next login.
  const onRemindLater = () => {
    setShowSetPasswordScreen(false);
    finishLogin();
  };

  // "Don't remind me again" - suppress the prompt server-side so it never shows again for this user.
  const onDontRemindAgain = async () => {
    setLoader(true);
    try {
      await axiosInstance.post("/user/password/prompt/_suppress", { tenantId: stateCode, RequestInfo: buildRequestInfo(true) });
    } catch (err) {
      // Even if suppression fails we still let the user continue to the home screen.
    } finally {
      setLoader(false);
    }
    setShowSetPasswordScreen(false);
    finishLogin();
  };

  const selectMobileNumber = async (mobileNumber) => {
    setOtpError(false);
    setCanSubmitNo(false);
    setParmas({ ...params, ...mobileNumber });
    const data = {
      ...mobileNumber,
      tenantId: stateCode,
      userType: getUserType(),
    };
    const [res, err] = await sendOtp({ otp: { ...data, ...TYPE_LOGIN } });
    if (!err) {
      // Start the cooldown timer when OTP is successfully sent
      startOtpCooldown();

      // Keep the button disabled during cooldown
      // setCanSubmitNo will be set to true by the timer when cooldown ends

      setOtpError(false);
      setState((prev) => ({
        ...prev,
        showOtpModal: true,
      }));
      return;
    } else {
      setCanSubmitNo(true);
      setIsUserRegistered(false);
      setShowUnregisteredModal(true);
    }
  };

  const selectOtp = async () => {
    try {
      setParmas({ ...params, otp: "" });

      setOtpError(false);
      setCanSubmitOtp(false);
      setLoader(true);
      const { mobileNumber, otp, name } = params;
      if (isUserRegistered) {
        const requestData = {
          username: mobileNumber,
          password: otp,
          tenantId: stateCode,
          userType: getUserType(),
          authType: "OTP",
        };
        const { ResponseInfo, UserRequest: info, ...tokens } = await Digit.UserService.authenticate(requestData);

        if (location.state?.role) {
          const roleInfo = info.roles.find((userRole) => userRole.code === location.state.role);
          if (!roleInfo || !roleInfo.code) {
            setError(t("ES_ERROR_USER_NOT_PERMITTED"));
            setTimeout(() => history.replace(DEFAULT_REDIRECT_URL), 5000);
            return;
          }
        }
        if (window?.globalConfigs?.getConfig("ENABLE_SINGLEINSTANCE")) {
          info.tenantId = Digit.ULBService.getStateId();
        }

        setUser({ info, ...tokens });
        setState((prev) => ({
          ...prev,
          showOtpModal: false,
        }));
      } else if (!isUserRegistered) {
        const requestData = {
          name: name || DEFAULT_USER,
          username: mobileNumber,
          otpReference: otp,
          tenantId: stateCode,
        };

        const { ResponseInfo, UserRequest: info, ...tokens } = await Digit.UserService.registerUser(requestData, stateCode);

        if (window?.globalConfigs?.getConfig("ENABLE_SINGLEINSTANCE")) {
          info.tenantId = Digit.ULBService.getStateId();
        }

        setUser({ info, ...tokens });
        setState((prev) => ({
          ...prev,
          showOtpModal: false,
        }));
      }
    } catch (err) {
      setCanSubmitOtp(true);
      setOtpError(err?.response?.data?.error_description === "Account locked" ? t("MAX_RETRIES_EXCEEDED") : t("CS_INVALID_OTP"));
      setParmas((prev) => ({
        ...prev,
        otp: "",
      }));
    } finally {
      setLoader(false);
    }
  };

  const resendOtp = async () => {
    setOtpError(false);
    setParmas({ ...params, otp: "" });
    const { mobileNumber } = params;
    const data = {
      mobileNumber,
      tenantId: stateCode,
      userType: getUserType(),
    };
    setLoader(true);
    try {
      if (!isUserRegistered) {
        await sendOtp({ otp: { ...data, ...TYPE_REGISTER } });
      } else if (isUserRegistered) {
        await sendOtp({ otp: { ...data, ...TYPE_LOGIN } });
      }
    } finally {
      setLoader(false);
    }
  };

  const sendOtp = async (data) => {
    try {
      const res = await Digit.UserService.sendOtp(data, stateCode);
      return [res, null];
    } catch (err) {
      return [null, err];
    }
  };

  // Full-screen overlay loader shown while a login/password API call is in flight. Rendered as a
  // fixed, very-high-z-index element that sits on top of whatever screen is currently visible.
  const loaderOverlay = loader ? (
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
  ) : null;

  if (showSetPasswordScreen) {
    return (
      <div className="login-v2">
        {loaderOverlay}
        {setPwSubStep === "PROMPT" ? (
          <SetPasswordPromptModal
            t={t}
            onSetPassword={() => setSetPwSubStep("FORM")}
            onRemindLater={onRemindLater}
            onDontRemindAgain={onDontRemindAgain}
          />
        ) : setPwSubStep === "OTP" ? (
          <OtpStep
            mobileNumber={params.mobileNumber || ""}
            otp={params.otp || ""}
            onOtpChange={handleOtpChange}
            onSelect={submitNewPassword}
            onResend={resendSetPasswordOtp}
            onBack={() => {
              setOtpError(false);
              setParmas((prev) => ({ ...prev, otp: "" }));
              setSetPwSubStep("FORM");
            }}
            canSubmit={canSubmitOtp}
            error={otpError}
            t={t}
          />
        ) : (
          <SetPassword
            t={t}
            header="SET_PASSWORD"
            subText="SET_PASSWORD_PROMPT_MESSAGE"
            submitLabel="CS_COMMON_CONTINUE"
            onSubmit={startSetPasswordOtp}
            onSkip={onRemindLater}
            blocklistIdentifiers={[params.mobileNumber, user?.info?.emailId]}
          />
        )}
      </div>
    );
  }

  return (
    <div className={loginMode === "PASSWORD" ? "login-v2" : "citizen-form-wrapper"}>
      {loaderOverlay}
      <Switch>
        <React.Fragment>
          <Route path={`${path}`} exact>
            {loginMode === "PASSWORD" ? (
              loginStep === "MOBILE" ? (
                <MobileNumberStep
                  onSelect={submitMobileNumber}
                  mobileNumber={params.mobileNumber || ""}
                  onMobileChange={handlePasswordMobileChange}
                  canSubmit={true}
                  isUserLoggedIn={isUserLoggedIn}
                  t={t}
                />
              ) : loginStep === "OTP" ? (
                <OtpStep
                  mobileNumber={params.mobileNumber || ""}
                  otp={params.otp || ""}
                  onOtpChange={handleOtpChange}
                  onSelect={selectOtp}
                  onResend={resendOtp}
                  onBack={backToPasswordStep}
                  canSubmit={canSubmitOtp}
                  error={otpError}
                  t={t}
                />
              ) : (
                <PasswordStep
                  mobileNumber={params.mobileNumber || ""}
                  password={password}
                  onPasswordChange={handlePasswordChange}
                  onSelect={selectPassword}
                  canSubmit={canSubmitPassword}
                  error={passwordError}
                  onBack={backToMobileStep}
                  onSwitchToOtp={switchToOtpLogin}
                  t={t}
                />
              )
            ) : (
              <SelectMobileNumber
                onSelect={selectMobileNumber}
                config={stepItems[0]}
                mobileNumber={params.mobileNumber || ""}
                onMobileChange={handleMobileChange}
                canSubmit={canSubmitNo && otpCooldown === 0}
                isUserLoggedIn={isUserLoggedIn}
                showRegisterLink={isUserRegistered && !location.state?.role}
                cooldownTime={otpCooldown}
                t={t}
              />
            )}
          </Route>
          {showOtpModal && (
            <SelectOtp
              cardText={`${stepItems[2].texts.cardText}`}
              mobileNumber={params.mobileNumber || ""}
              onOtpChange={handleOtpChange}
              onResend={resendOtp}
              onSelect={selectOtp}
              otp={params.otp}
              error={otpError}
              canSubmit={canSubmitOtp}
              params={params}
              setParams={setParmas}
              t={t}
              path={`${path}`}
              setState={setState}
            />
          )}

          {error && <CustomToast error={true} label={error} errorId={null} onClose={() => setError(null)} duration={5000} />}
          {showUnregisteredModal && (
            <InfoModal
              t={t}
              heading={"UNREGISTERED_NUMBER"}
              message={"UNREGISTERED_NUMBER_MESSAGE"}
              primaryLabel={"CS_USER_REGISTER"}
              secondaryLabel={"CS_COMMON_CANCEL"}
              onPrimaryClick={() => {
                setShowUnregisteredModal(false);
                history.push(`/${window?.contextPath}/citizen/dristi/home/registration/mobile-number`, {
                  newParams: { mobileNumber: params.mobileNumber },
                });
              }}
              onSecondaryClick={() => {
                setShowUnregisteredModal(false);
                setIsUserRegistered(true);
              }}
              className={"unregistered-number-modal"}
            />
          )}
        </React.Fragment>
      </Switch>
    </div>
  );
};

export default Login;
