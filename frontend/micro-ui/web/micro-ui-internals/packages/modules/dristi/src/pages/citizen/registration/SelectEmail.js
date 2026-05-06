import { BreadCrumb, FormComposerV2, Loader } from "@egovernments/digit-ui-react-components";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "../../../components/Toast/useToast";
export const userTypeOptions = [
  {
    code: "LITIGANT",
    name: "LITIGANT_TEXT",
    showBarDetails: false,
    isVerified: false,
    role: [
      "CASE_CREATOR",
      "CASE_EDITOR",
      "CASE_VIEWER",
      "EVIDENCE_CREATOR",
      "EVIDENCE_VIEWER",
      "EVIDENCE_EDITOR",
      "APPLICATION_CREATOR",
      "APPLICATION_VIEWER",
      "HEARING_VIEWER",
      "ORDER_VIEWER",
      "SUBMISSION_CREATOR",
      "SUBMISSION_RESPONDER",
      "SUBMISSION_DELETE",
      "TASK_VIEWER",
      "ADVOCATE_VIEWER",
      "PENDING_TASK_CREATOR",
      "BAIL_BOND_CREATOR",
      "BAIL_BOND_VIEWER",
      "BAIL_BOND_EDITOR",
    ],
    subText: "LITIGANT_SUB_TEXT",
  },
  {
    code: "ADVOCATE",
    name: "ADVOCATE_TEXT",
    showBarDetails: true,
    isVerified: true,
    hasBarRegistrationNo: true,
    role: [
      "ADVOCATE_ROLE",
      "CASE_CREATOR",
      "CASE_EDITOR",
      "CASE_VIEWER",
      "EVIDENCE_CREATOR",
      "EVIDENCE_VIEWER",
      "EVIDENCE_EDITOR",
      "APPLICATION_CREATOR",
      "APPLICATION_VIEWER",
      "HEARING_VIEWER",
      "ORDER_VIEWER",
      "SUBMISSION_CREATOR",
      "SUBMISSION_RESPONDER",
      "SUBMISSION_DELETE",
      "TASK_VIEWER",
      "USER_REGISTER",
      "ADVOCATE_VIEWER",
      "ADVOCATE_APPLICATION_VIEWER",
      "PENDING_TASK_CREATOR",
      "BAIL_BOND_CREATOR",
      "BAIL_BOND_VIEWER",
      "BAIL_BOND_EDITOR",
    ],
    apiDetails: {
      serviceName: "/advocate/v1/_create",
      requestKey: "advocate",
      AdditionalFields: ["barRegistrationNumber"],
    },
    subText: "ADVOCATE_SUB_TEXT",
  },
  {
    code: "ADVOCATE_CLERK",
    name: "ADVOCATE_CLERK_TEXT",
    showBarDetails: true,
    hasStateRegistrationNo: true,
    isVerified: true,
    role: [
      "ADVOCATE_CLERK_ROLE",
      "CASE_CREATOR",
      "CASE_EDITOR",
      "CASE_VIEWER",
      "EVIDENCE_CREATOR",
      "EVIDENCE_VIEWER",
      "EVIDENCE_EDITOR",
      "APPLICATION_CREATOR",
      "APPLICATION_VIEWER",
      "HEARING_VIEWER",
      "ORDER_VIEWER",
      "SUBMISSION_CREATOR",
      "SUBMISSION_RESPONDER",
      "SUBMISSION_DELETE",
      "TASK_VIEWER",
      "USER_REGISTER",
      "ADVOCATE_VIEWER",
      "ADVOCATE_APPLICATION_VIEWER",
      "PENDING_TASK_CREATOR",
      "BAIL_BOND_CREATOR",
      "BAIL_BOND_VIEWER",
      "BAIL_BOND_EDITOR",
    ],
    apiDetails: {
      serviceName: "/advocate/clerk/v1/_create",
      requestKey: "clerk",
      AdditionalFields: ["stateRegnNumber"],
    },

    subText: "ADVOCATE_CLERK_SUB_TEXT",
  },
];

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
  const token = window.localStorage.getItem("token");
  const userInfoType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo]);

  const { data: individualData, isIndividualLoading } = window?.Digit.Hooks.dristi.useGetIndividualUser(
    {
      Individual: {
        userUuid: [userInfo?.uuid],
      },
    },
    { tenantId, limit: 500, offset: 0 },
    "Home",
    `${token}-${userInfo?.uuid}-${isUserLoggedIn}`,
    Boolean(userInfo?.uuid && isUserLoggedIn)
  );

  const individualId = individualData?.Individual?.[0]?.individualId;
  const userType = useMemo(
    () => individualData?.Individual?.[0]?.additionalFields?.fields?.find((obj) => obj.key === "userType")?.value || [individualData?.Individual],
    [individualData?.Individual]
  );

  const isLitigantPartialRegistered = useMemo(() => {
    if (userInfoType !== "citizen") return false;

    if (!individualData?.Individual || individualData.Individual.length === 0) return false;

    if (individualData?.Individual[0]?.userDetails?.roles?.some((role) => role?.code === "ADVOCATE_ROLE")) return false;

    const address = individualData.Individual[0]?.address;
    return !address || (Array.isArray(address) && address.length === 0);
  }, [individualData?.Individual, userInfoType]);

  const { data: searchData, isLoading: isSearchLoading, refetch: refetchAdvocateClerk } = Digit?.Hooks?.dristi?.useGetAdvocateClerk(
    {
      criteria: [{ individualId }],
      tenantId,
    },
    { tenantId, limit: 400 },
    `${individualId}-${isUserLoggedIn}-${userType}-${token}-${userInfo?.uuid}-${individualData?.Individual?.[0]?.individualId || ""}`,
    Boolean(isUserLoggedIn && individualId && userType !== "LITIGANT"),
    userType === "ADVOCATE" ? "/advocate/v1/_search" : "/advocate/clerk/v1/_search"
  );

  const userTypeDetail = useMemo(() => {
    return userTypeOptions.find((item) => item.code === userType) || {};
  }, [userType]);

  const searchResult = useMemo(() => {
    return searchData?.[`${userTypeDetail?.apiDetails?.requestKey}s`]?.[0]?.responseList;
  }, [searchData, userTypeDetail?.apiDetails?.requestKey]);

  const isApprovalPending = useMemo(() => {
    if (!searchResult) return true;
    return (
      userType !== "LITIGANT" &&
      Array.isArray(searchResult) &&
      searchResult?.length > 0 &&
      searchResult?.[0]?.isActive === false &&
      searchResult?.[0]?.status !== "INACTIVE"
    );
  }, [searchResult, userType]);

  const isRejected = useMemo(() => {
    return (
      userType !== "LITIGANT" &&
      Array.isArray(searchResult) &&
      searchResult?.length > 0 &&
      searchResult?.[0]?.isActive === false &&
      searchResult?.[0]?.status === "INACTIVE"
    );
  }, [searchResult, userType]);

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
        history.push(`${path}/user-name`, { newParams: { ...params, email: email } });
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

  if (isLoading || isIndividualLoading || isSearchLoading) {
    return <Loader />;
  }

  // return from here if individualId exists and we are not in profile mode
  if (
    individualId &&
    (userType === "LITIGANT" ? !isLitigantPartialRegistered : true) &&
    (userType !== "LITIGANT" ? !isApprovalPending && !isRejected : true) &&
    !isProfile
  ) {
    history.push(`/${window?.contextPath}/citizen/home/home-pending-task`);
    return null;
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
