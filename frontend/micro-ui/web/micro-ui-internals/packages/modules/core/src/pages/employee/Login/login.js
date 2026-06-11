import { BackButton, Dropdown, Loader, Toast } from "@egovernments/digit-ui-react-components";
import { FormComposer, FormComposerV2 } from "../../../components/FormComposer";
import PropTypes from "prop-types";
import React, { useEffect, useState, useMemo } from "react";
import { useHistory } from "react-router-dom";
import Background from "../../../components/Background";
import Header from "../../../components/Header";
import { Urls } from "@egovernments/digit-ui-module-dristi/src/hooks";
import axiosInstance from "../../../Utils/axiosInstance";

/* set employee details to enable backward compatiable */
const setEmployeeDetail = (userObject, token) => {
  const locale = JSON.parse(sessionStorage.getItem("Digit.locale"))?.value || Digit.Utils.getDefaultLanguage();
  localStorage.setItem("Employee.tenant-id", userObject?.tenantId);
  localStorage.setItem("tenant-id", userObject?.tenantId);
  localStorage.setItem("citizen.userRequestObject", JSON.stringify(userObject));
  localStorage.setItem("locale", locale);
  localStorage.setItem("Employee.locale", locale);
  localStorage.setItem("token", token);
  localStorage.setItem("Employee.token", token);
  localStorage.setItem("user-info", JSON.stringify(userObject));
  localStorage.setItem("Employee.user-info", JSON.stringify(userObject));
};

const getRedirectPath = (user) => {
  let redirectPath = `/${window?.contextPath}/employee`;

  if (window?.location?.href?.includes("from=")) {
    redirectPath = decodeURIComponent(window?.location?.href?.split("from=")?.[1]) || `/${window?.contextPath}/employee`;
  }

  if (user?.info?.roles?.length > 0 && user?.info?.roles?.every((e) => e.code === "NATADMIN")) {
    redirectPath = `/${window?.contextPath}/employee/dss/landing/NURT_DASHBOARD`;
  }
  if (user?.info?.roles?.length > 0 && user?.info?.roles?.every((e) => e.code === "STADMIN")) {
    redirectPath = `/${window?.contextPath}/employee/dss/landing/home`;
  }
  return redirectPath;
};

const Login = ({ config: propsConfig, t, isDisabled, tenantsData }) => {
  const { isLoading } = Digit.Hooks.useTenants();
  const { isLoading: isStoreLoading } = Digit.Hooks.useStore.getInitData();
  const [user, setUser] = useState(null);
  const [showToast, setShowToast] = useState(null);
  const [disable, setDisable] = useState(false);
  const [prevDistrict, setPrevDistrict] = useState(null);

  const history = useHistory();

  useEffect(() => {
    if (!user) {
      return;
    }
    localStorage.setItem("citizen.userRequestObject", user);
    const filteredRoles = user?.info?.roles?.filter((role) => role.tenantId === Digit.SessionStorage.get("Employee.tenantId"));
    if (user?.info?.roles?.length > 0) user.info.roles = filteredRoles;
    Digit.UserService.setUser(user);
    setEmployeeDetail(user?.info, user?.access_token);
    history.replace(getRedirectPath(user));
  }, [user]);

  const closeToast = () => {
    setShowToast(null);
  };

  const onLogin = async (data) => {
    setDisable(true);

    const requestData = {
      ...data,
      courtroom: data?.courtroom?.code,
      district: data?.district?.code,
      userType: "EMPLOYEE",
    };

    requestData.tenantId = data?.city?.code || Digit.ULBService.getStateId();
    delete requestData.city;
    try {
      const { UserRequest: info, ...tokens } = await Digit.UserService.authenticate(requestData);
      Digit.SessionStorage.set("Employee.tenantId", info?.tenantId);
      const employee = await axiosInstance.post(
        Urls.dristi.searchEmployee,
        {
          RequestInfo: {
            authToken: tokens?.access_token,
            userInfo: info,
            msgId: `${Date.now()}|${Digit.StoreData.getCurrentLanguage()}`,
            apiId: "Dristi",
          },
        },
        {
          params: {
            tenantId: info?.tenantId,
            uuids: info?.uuid,
          },
        }
      );

      const employeeData = employee?.data?.Employees;
      if (!employeeData || employeeData?.length === 0) {
        throw new Error(t("ES_ERROR_EMPLOYEE_NOT_FOUND"));
      }
      if (employeeData?.length > 0) {
        const userAccountExpiryDate = employeeData?.[0]?.assignments?.[0]?.toDate;
        if (userAccountExpiryDate) {
          const date = new Date(userAccountExpiryDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (date < today) {
            throw new Error("USER_ACCOUNT_VALIDITY_EXPIRED");
          }
        }
      }
      const assignments = employeeData?.[0]?.assignments?.find((assignment) => assignment?.courtroom === data?.courtroom?.code);
      if (!assignments) {
        throw new Error(t("ES_ERROR_COURTROOM_NOT_ASSIGNED"));
      }
      localStorage.setItem("courtId", assignments?.courtroom);
      localStorage.setItem("judgeId", employee?.data?.Employees?.[0]?.code);
      localStorage.setItem("judgeName", employee?.data?.Employees?.[0]?.user?.name);
      setUser({ info, ...tokens });
    } catch (err) {
      setShowToast(
        err?.response?.data?.error_description ||
          (err?.message === "ES_ERROR_USER_NOT_PERMITTED" && t("ES_ERROR_USER_NOT_PERMITTED")) ||
          (err?.message === "USER_ACCOUNT_VALIDITY_EXPIRED" && t("USER_ACCOUNT_VALIDITY_EXPIRED")) ||
          err?.response?.data?.Errors[0]?.message ||
          t("INVALID_LOGIN_CREDENTIALS")
      );
      setTimeout(closeToast, 5000);
    }
    setDisable(false);
  };

  const onForgotPassword = () => {
    history.push(`/${window?.contextPath}/employee/user/forgot-password`);
  };

  const [config, setConfig] = useState([{ body: propsConfig?.inputs }]);

  const { data: commonMasterData, isLoading: isCommonMasterDataLoading } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getStateId(),
    "common-masters",
    [{ name: "CourtEstablishment" }, { name: "Court_Rooms" }, { name: "District" }],
    {
      select: (data) => data,
    }
  );

  const defaultValue = useMemo(() => {
    const district = commonMasterData?.["common-masters"]?.District?.find((d) => d?.code === "KOLLAM");
    const courtRoom = commonMasterData?.["common-masters"]?.Court_Rooms?.find((room) => room?.code === "KLKM52");
    setPrevDistrict(district);
    return {
      district,
      courtroom: courtRoom,
    };
  }, [commonMasterData]);

  const getFilteredCourtRoom = (district) => {
    const courtEstablishmnets = commonMasterData?.["common-masters"]?.CourtEstablishment;
    const courtRoom = commonMasterData?.["common-masters"]?.Court_Rooms;
    if (!district) return courtRoom;
    const filteredCourtEstablishmnets = courtEstablishmnets.filter((ce) => ce.district === district);
    return courtRoom.filter((court) => filteredCourtEstablishmnets.some((ce) => ce.code === court.establishment));
  };
  const getModifiedConfig = (district) => {
    const newPopulators = {
      name: "courtroom",
      optionsKey: "name",
      options: getFilteredCourtRoom(district?.code),
    };
    const modifiedConfig = config;
    modifiedConfig[0].body[3].populators = newPopulators;
    return modifiedConfig;
  };

  const onFormValueChange = (setValue, formData) => {
    if (formData?.district !== prevDistrict) {
      setConfig(getModifiedConfig(formData?.district));
      setValue("courtroom", "");
    }
    setPrevDistrict(() => formData?.district);
  };

  if (isLoading || isStoreLoading || isCommonMasterDataLoading) {
    return <Loader />;
  }

  return (
    <Background>
      <div className="employeeBackbuttonAlign">
        <BackButton variant="white" style={{ borderBottom: "none" }} />
      </div>

      <FormComposerV2
        onSubmit={onLogin}
        isDisabled={isDisabled || disable}
        onFormValueChange={onFormValueChange}
        noBoxShadow
        inline
        submitInForm
        config={config}
        defaultValues={defaultValue}
        label={propsConfig.texts.submitButtonLabel}
        onSecondayActionClick={onForgotPassword}
        heading={propsConfig.texts.header}
        className="loginFormStyleEmployee"
        cardSubHeaderClassName="loginCardSubHeaderClassName"
        cardClassName="loginCardClassName"
        buttonClassName="buttonClassName"
      >
        <Header tenantsData={tenantsData} />
      </FormComposerV2>
      {showToast && <Toast error={true} label={t(showToast)} onClose={closeToast} />}
    </Background>
  );
};

Login.propTypes = {
  config: PropTypes.shape({
    inputs: PropTypes.array,
    texts: PropTypes.shape({
      submitButtonLabel: PropTypes.string,
      header: PropTypes.string,
    }),
  }),
  t: PropTypes.func.isRequired,
  isDisabled: PropTypes.bool,
  tenantsData: PropTypes.array,
};

export default Login;
