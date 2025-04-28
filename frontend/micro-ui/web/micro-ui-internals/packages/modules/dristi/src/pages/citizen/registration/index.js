import React, { useEffect, useMemo, useState } from "react";
import { CloseSvg, Loader, Toast } from "@egovernments/digit-ui-react-components";
import { Route, Switch, useHistory, useRouteMatch } from "react-router-dom";
import AdvocateClerkAdditionalDetail from "./AdvocateClerkAdditionalDetail";
import SelectUserType from "./SelectUserType";
import { newConfig } from "./config";
import { useTranslation } from "react-i18next";
import SelectName from "./SelectName";
import SelectOtp from "../Login/SelectOtp";
import SelectUserAddress from "./SelectUserAddress";
import SelectMobileNumber from "../Login/SelectMobileNumber";
import SelectId from "../Login/SelectId";
import EnterAdhaar from "./EnterAdhaar";
import { useLocation } from "react-router-dom/cjs/react-router-dom.min";
import UploadIdType from "./UploadIdType";
import TermsCondition from "./TermsCondition";
import SelectEmail from "./SelectEmail";
import Modal from "../../../components/Modal";

const TYPE_REGISTER = { type: "REGISTER" };
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

const CloseBtn = (props) => {
  return (
    <div onClick={props?.onClick} style={{ height: "100%", display: "flex", alignItems: "center", paddingRight: "20px", cursor: "pointer" }}>
      <CloseSvg />
    </div>
  );
};

const Heading = (props) => {
  return <h1 className="heading-m">{props.label}</h1>;
};

const Registration = ({ stateCode }) => {
  const Digit = window.Digit || {};
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const history = useHistory();
  const { path } = useRouteMatch();
  const token = window.localStorage.getItem("token");
  const isUserLoggedIn = Boolean(token);
  const moduleCode = "DRISTI";
  const [newParams, setNewParams] = useState(history.location.state?.newParams || {});
  const [userTypeRegister] = useState(history.location.state?.userType || {});

  const [canSubmitNo, setCanSubmitNo] = useState(true);
  const [isUserRegistered, setIsUserRegistered] = useState(true);
  const [canSubmitOtp, setCanSubmitOtp] = useState(true);
  const [{ showOtpModal, isAdhaar }, setState] = useState({ showOtpModal: false, isAdhaar: false });
  const [showSkipEmailModal, setShowSkipEmailModal] = useState(false);
  const getUserType = () => Digit.UserService.getType();
  const userInfoType = getUserType();
  const { t } = useTranslation();
  const location = useLocation();
  const DEFAULT_USER = "digit-user";
  const [user, setUser] = useState(null);
  const [otpError, setOtpError] = useState(false);
  const [canSubmitAadharOtp, setCanSubmitAadharOtp] = useState(true);
  const [error, setError] = useState(null);
  const closeToast = () => {
    setError(null);
  };
  useEffect(() => {
    const timer = setTimeout(() => {
      closeToast();
    }, 2000);

    return () => clearTimeout(timer);
  }, [closeToast]);
  useEffect(() => {
    if (!user) {
      return;
    }
    localStorage.setItem("citizen.userRequestObject", user);
    Digit.UserService.setUser(user);
    localStorage.setItem("citizen.refresh-token", user?.refresh_token);
    setCitizenDetail(user?.info, user?.access_token, stateCode);
    const redirectPath = location.state?.from || `${path}/user-name`;
    // routeToAdditionalDetail(user?.info);
    if (!Digit.ULBService.getCitizenCurrentTenant(true)) {
      const idVerificationUrl = `${path}/user-name`;
      history.push(`${path}/user-name`, { ...(history.location.state || {}), newParams: newParams });
    } else {
      history.push(redirectPath);
    }
  }, [user]);
  const stepItems = useMemo(() =>
    newConfig.map(
      (step) => {
        const texts = {};
        for (const key in step.texts) {
          texts[key] = t(step.texts[key]);
        }
        return { ...step, texts };
      },
      [newConfig]
    )
  );
  const getFromLocation = (state, searchParams) => {
    return state?.from || searchParams?.from;
  };
  const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
  const { data, isLoading, refetch, isFetching } = Digit.Hooks.dristi.useGetIndividualUser(
    {
      Individual: {
        userUuid: [userInfo?.uuid],
      },
    },
    { tenantId, limit: 1000, offset: 0 },
    moduleCode,
    "",
    userInfo?.uuid && isUserLoggedIn
  );

  const isLitigantPartialRegistered = useMemo(() => {
    if (userInfoType !== "citizen") return false;

    if (!data?.Individual || data?.Individual.length === 0) return false;

    if (data?.Individual[0]?.userDetails?.roles?.some((role) => role?.code === "ADVOCATE_ROLE")) return false;

    const address = data?.Individual[0]?.address;
    return !address || (Array.isArray(address) && address.length === 0);
  }, [data?.Individual, userInfoType]);

  useEffect(() => {
    if (isLitigantPartialRegistered && data?.Individual) {
      setNewParams({
        name: {
          firstName: data?.Individual?.[0]?.name?.givenName,
          middleName: data?.Individual?.[0]?.name?.otherNames,
          lastName: data?.Individual?.[0]?.name?.familyName,
        },
      });
    }
  }, [data?.Individual, isLitigantPartialRegistered]);

  const handleAadharOtpChange = (aadharOtp) => {
    setNewParams({ ...newParams, aadharOtp });
  };

  const selectMobileNumber = async (mobileNumber) => {
    setCanSubmitNo(false);
    setNewParams({ ...newParams, ...mobileNumber });
    const data = {
      ...mobileNumber,
      tenantId: stateCode,
      userType: getUserType(),
    };
    const [res, err] = await sendOtp({ otp: { ...data, ...TYPE_REGISTER } });
    if (!err) {
      setCanSubmitNo(true);
      setOtpError(false);
      setState((prev) => ({
        ...prev,
        showOtpModal: true,
      }));
      return;
    } else {
      setError(t("ES_ERROR_USER_ALREADY_REGISTERED"));
      setCanSubmitNo(true);
    }
  };
  const selectOtp = async () => {
    try {
      setNewParams({ ...newParams, otp: "" });
      setOtpError(false);
      setCanSubmitOtp(false);
      const { mobileNumber, otp, name } = newParams;
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
      history.push(`${path}/email`);
    } catch (err) {
      setCanSubmitOtp(true);
      setOtpError(err?.response?.data?.error_description === "Account locked" ? t("MAX_RETRIES_EXCEEDED") : t("CS_INVALID_OTP"));
    }
  };
  const handleOtpChange = (otp) => {
    setNewParams({ ...newParams, otp });
  };
  const handleAdhaarChange = (adhaarNumber) => {
    setNewParams({ ...newParams, adhaarNumber });
    setOtpError(false);
    setState((prev) => ({
      ...prev,
      showOtpModal: true,
      isAdhaar: true,
    }));
  };
  const resendOtp = async () => {
    setNewParams({ ...newParams, otp: "", aadharOtp: "" });
    const { mobileNumber } = newParams;
    const data = {
      mobileNumber,
      tenantId: stateCode,
      userType: getUserType(),
    };
    if (!isUserRegistered) {
      const [res, err] = await sendOtp({ otp: { ...data, ...TYPE_REGISTER } });
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
  const handleMobileChange = (event) => {
    const { value } = event.target;
    setNewParams({ ...newParams, mobileNumber: value?.replace(/[^0-9]/g, "") });
    setIsUserRegistered(true);
  };
  const onSelectSkipEmail = async () => {
    setShowSkipEmailModal(false);
    setNewParams({ ...newParams, isSkip: true });
    history.push(`${path}/user-name`);
  };
  const selectName = async (name) => {
    setNewParams({ ...newParams, name });
    history.push(`${path}/user-address`);
  };

  const onAadharOtpSelect = () => {
    setCanSubmitAadharOtp(false);
    setNewParams({ ...newParams, aadharOtp: "" });
    setState((prev) => ({
      ...prev,
      showOtpModal: false,
      isAdhaar: false,
    }));
    history.replace(`${path}/user-type`);
    setCanSubmitAadharOtp(true);
  };
  const handleAddressSave = (address) => {
    setNewParams({ ...newParams, address });
    history.push(`${path}/id-verification`);
  };
  const handleIdentitySave = (indentity) => {
    setNewParams({ ...newParams, indentity, adhaarNumber: "" });
    indentity.IdVerification.selectIdType.code === "AADHAR"
      ? history.push(`${path}/enter-adhaar`, { comingFrom: "Aadhaar" })
      : history.push(`${path}/upload-id`, { comingFrom: "otherId" });
  };
  const handleUserTypeSave = (userType) => {
    setNewParams({ ...newParams, userType });
    history.push(`/${window?.contextPath}/citizen/dristi/home/response`);
  };
  const onDocumentUpload = async (filename, filedata, IdType) => {
    const fileUploadRes = await Digit.UploadServices.Filestorage("DRISTI", filedata, Digit.ULBService.getStateId());
    const identityObj = {
      IdVerification: {
        selectIdType: {
          code: "OTHER ID",
          name: "CS_OTHER",
          subText: "CS_OTHER_SUB_TEXT",
        },
      },
    };
    setNewParams({ ...newParams, indentity: identityObj });

    Digit.SessionStorage.set("UploadedDocument", { filedata: fileUploadRes?.data, IdType, filename });
    Digit.SessionStorage.del("aadharNumber");
    history.replace(`${path}/user-type`);
  };
  if (isLoading || isFetching) {
    return <Loader />;
  }
  const pathOnRefresh = `${path}/email`;
  return (
    <div className="citizen-form-wrapper">
      <Switch>
        <React.Fragment>
          <Route path={`${path}/additional-details`}>
            <AdvocateClerkAdditionalDetail
              setParams={setNewParams}
              params={newParams}
              path={path}
              config={stepItems[9]}
              pathOnRefresh={pathOnRefresh}
            />
          </Route>
          <Route path={`${path}/mobile-number`}>
            <SelectMobileNumber
              onSelect={selectMobileNumber}
              config={stepItems[5]}
              mobileNumber={newParams?.mobileNumber || ""}
              onMobileChange={handleMobileChange}
              canSubmit={canSubmitNo}
              isRegister={true}
              t={t}
              path={path}
              isUserLoggedIn={isUserLoggedIn}
              history={history}
              className={"register"}
            />
          </Route>
          <Route path={`${path}/email`}>
            <SelectEmail
              config={[stepItems[11]]}
              t={t}
              history={history}
              params={newParams}
              setNewParams={setNewParams}
              isUserLoggedIn={isUserLoggedIn}
              setShowSkipEmailModal={setShowSkipEmailModal}
              stateCode={stateCode}
              path={path}
            />
          </Route>
          <Route path={`${path}/user-name`}>
            <SelectName
              config={[stepItems[3]]}
              t={t}
              onSubmit={selectName}
              params={newParams}
              history={history}
              value={newParams?.name}
              isUserLoggedIn={isUserLoggedIn}
              pathOnRefresh={pathOnRefresh}
              isLitigantPartialRegistered={isLitigantPartialRegistered}
            />
          </Route>
          <Route path={`${path}/user-address`}>
            <SelectUserAddress config={[stepItems[1]]} t={t} params={newParams} pathOnRefresh={pathOnRefresh} onSelect={handleAddressSave} />
          </Route>
          <Route path={`${path}/id-verification`}>
            <SelectId
              t={t}
              config={[stepItems[6]]}
              params={newParams}
              history={history}
              pathOnRefresh={pathOnRefresh}
              onSelect={handleIdentitySave}
            />
          </Route>

          <Route path={`${path}/enter-adhaar`}>
            <EnterAdhaar
              t={t}
              config={[stepItems[7]]}
              onSelect={handleAdhaarChange}
              pathOnRefresh={pathOnRefresh}
              params={newParams}
              adhaarNumber={newParams?.adhaarNumber}
            />
          </Route>
          {showOtpModal && (
            <SelectOtp
              onOtpChange={!isAdhaar ? handleOtpChange : handleAadharOtpChange}
              onResend={resendOtp}
              onSelect={!isAdhaar ? selectOtp : onAadharOtpSelect}
              setParams={setNewParams}
              otp={!isAdhaar ? newParams?.otp : newParams?.aadharOtp}
              error={otpError}
              canSubmit={!isAdhaar ? canSubmitOtp : canSubmitAadharOtp}
              params={newParams}
              path={!isAdhaar ? `${path}/mobile-number` : pathOnRefresh}
              cardText={!isAdhaar ? `${stepItems[4].texts.cardText}` : `${stepItems[7].texts.cardText}`}
              mobileNumber={newParams.mobileNumber || ""}
              isAdhaar={!isAdhaar ? false : true}
              t={t}
              setState={setState}
            />
          )}
          {showSkipEmailModal && (
            <Modal
              headerBarEnd={
                <CloseBtn
                  onClick={() => {
                    setShowSkipEmailModal(false);
                  }}
                />
              }
              actionCancelOnSubmit={() => {
                setShowSkipEmailModal(false);
              }}
              actionSaveLabel={t("SKIP_ANYWAY")}
              actionCancelLabel={t("BACK")}
              actionSaveOnSubmit={async () => onSelectSkipEmail()}
              formId="modal-action"
              headerBarMain={<Heading label={t("CONFIRM_SKIP_EMAIL")} />}
              submitTextClassName={"verification-button-text-modal"}
              className={"verify-mobile-modal"}
            >
              <div className="verify-mobile-modal-main">{t("ADDING_EMAIL_WILL_HELP_TEXT")}</div>
            </Modal>
          )}
          <Route path={`${path}/user-type`}>
            <SelectUserType
              config={[stepItems[2]]}
              t={t}
              setParams={setNewParams}
              pathOnRefresh={pathOnRefresh}
              params={newParams}
              userTypeRegister={userTypeRegister}
              onSelect={handleUserTypeSave}
              path={path}
            />
          </Route>
          <Route path={`${path}/upload-id`}>
            <UploadIdType t={t} config={[stepItems[9]]} pathOnRefresh={pathOnRefresh} onDocumentUpload={onDocumentUpload} params={newParams} />
          </Route>
          <Route path={`${path}/terms-condition`}>
            <TermsCondition params={newParams} setParams={setNewParams} t={t} config={[stepItems[10]]} pathOnRefresh={pathOnRefresh} path={path} />
          </Route>
          {error && <Toast error={true} label={error} onClose={closeToast} />}
        </React.Fragment>
      </Switch>
    </div>
  );
};

export default Registration;
