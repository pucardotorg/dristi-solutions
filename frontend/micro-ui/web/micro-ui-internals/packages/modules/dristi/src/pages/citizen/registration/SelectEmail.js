import { BreadCrumb, FormComposerV2, Loader } from "@egovernments/digit-ui-react-components";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "../../../components/Toast/useToast";

const bredCrumbStyle = { maxWidth: "min-content" };

const ProjectBreadCrumb = ({ location }) => {
  const { t } = useTranslation();
  const userInfo = window?.Digit?.UserService?.getUser?.()?.info;
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo?.type]);

  const roles = useMemo(() => userInfo?.roles, [userInfo]);
  const isEpostUser = useMemo(() => roles?.some((role) => role?.code === "POST_MANAGER"), [roles]);

  let homePath = `/${window?.contextPath}/${userType}/home/home-pending-task`;
  if (!isEpostUser && userType === "employee") homePath = `/${window?.contextPath}/${userType}/home/home-screen`;
  const crumbs = [
    {
      path: homePath,
      content: t("ES_COMMON_HOME"),
      show: true,
    },
    {
      path: `/${window?.contextPath}/${userType}`,
      content: t("PROFILE_EDIT"),
      show: true,
    },
  ];
  return <BreadCrumb crumbs={crumbs} spanStyle={bredCrumbStyle} style={{ color: "rgb(0, 126, 126)" }} />;
};

const SelectEmail = ({
  config,
  t,
  onSubmit,
  history,
  params,
  setNewParams,
  isUserLoggedIn,
  setShowSkipEmailModal,
  stateCode,
  path,
  isProfile = false,
  setHideBack,
}) => {
  const userInfo = Digit.UserService.getUser()?.info;
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const toast = useToast();
  const setFormErrors = useRef(null);

  useEffect(() => {
    if (isProfile) {
      setHideBack(true);
    }
  });

  const defaultValues = useMemo(() => {
    return {
      email: {
        emailId: userInfo?.emailId,
      },
    };
  });
  const onProfileUpdate = async (email) => {
    try {
      const { user: userList } = await Digit.UserService.userSearch(tenantId, { emailId: email }, {});
      if (userList?.length > 0 && userInfo?.emailId !== email) {
        setFormErrors.current("emailId", {
          type: "required",
          message: t("DUPLICATE_EMAIL_VALIDATION"),
        });
        return;
      }
      if (!isProfile) {
        setNewParams({ ...params, email: email });
      }
      setIsLoading(true);
      const requestData = {
        ...userInfo,
        emailId: email,
      };
      const {
        user: [info],
      } = await Digit.UserService.updateUser(requestData, stateCode);
      if (window?.globalConfigs?.getConfig("ENABLE_SINGLEINSTANCE")) {
        info.tenantId = Digit.ULBService.getStateId();
      }
      const localUserInfo = JSON.parse(localStorage.getItem("user-info"));
      const localCitizenUserInfo = JSON.parse(localStorage.getItem("Citizen.user-info"));
      localStorage.setItem("user-info", JSON.stringify({ ...localUserInfo, emailId: info?.emailId }));
      localStorage.setItem("Citizen.user-info", JSON.stringify({ ...localCitizenUserInfo, emailId: info?.emailId }));
      if (!isProfile) {
        history.push(`${path}/user-name`, { newParams: params });
      } else {
        history.replace(`/${window?.contextPath}/citizen/dristi/home`);
      }
    } catch (error) {
      console.error("error: ", error);
      toast.error(t("SOMETHING_WENT_WRONG"));
    } finally {
      setIsLoading(false);
    }
  };

  if (!params?.mobileNumber && !isUserLoggedIn) {
    history.push(`/${window?.contextPath}/citizen/dristi/home/login`);
  }

  const onFormValueChange = (setValue, formData, formState, reset, setError, clearErrors, trigger, getValues, index, currentDisplayIndex) => {
    setFormErrors.current = setError;
    if (Object.keys(formState?.errors).length) {
      setIsSubmitDisabled(true);
    } else {
      setIsSubmitDisabled(false);
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div style={{ ...(!isProfile && { width: "35%" }) }}>
      <div style={{ background: "#eee" }}>{isProfile && <ProjectBreadCrumb location={window.location} />}</div>
      <div
        className={isProfile ? "user-registration citizen-form-wrapper" : ""}
        style={isProfile ? { marginTop: 0, width: "100%", minHeight: "calc(100vh - 130px)" } : {}}
      >
        <div style={{ display: "flex", flexDirection: "column", ...(isProfile && { width: "30%" }) }}>
          <FormComposerV2
            key={params?.email}
            config={config}
            t={t}
            noBoxShadow
            inline={false}
            label={t("CORE_COMMON_CONTINUE")}
            onSecondayActionClick={() => {}}
            onFormValueChange={onFormValueChange}
            onSubmit={(props) => onProfileUpdate(props?.email?.emailId)}
            defaultValues={defaultValues}
            isDisabled={isSubmitDisabled}
            submitInForm
            className={"registration-email"}
          ></FormComposerV2>
          <div style={{ padding: "0px 40px 40px", background: "white" }}>
            {!isProfile && (
              <span
                onClick={() => {
                  setShowSkipEmailModal(true);
                }}
                style={{
                  fontFamily: "Roboto",
                  fontWeight: 500,
                  fontSize: "14px",
                  lineHeight: "24px",
                  letterSpacing: "0px",
                  textAlign: "center",
                  color: "#BBBBBD",
                  cursor: "pointer",
                }}
              >
                {t("SKIP_THIS_STEP")}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectEmail;
