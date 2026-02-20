// This component is used to show user registration requests on home screen.

import { InboxSearchComposer } from "@egovernments/digit-ui-react-components";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { registerUserConfig } from "../../configs/RegisterUserConfig";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";

const sectionsParentStyle = {
  height: "50%",
  display: "flex",
  flexDirection: "column",
  gridTemplateColumns: "20% 1fr",
  gap: "1rem",
};

const RegisterUsersHomeTab = ({ tenants }) => {
  const { t } = useTranslation();
  const userInfo = window?.Digit?.UserService?.getUser()?.info;
  const roles = useMemo(() => userInfo?.roles, [userInfo]);
  const history = useHistory();
  const hasViewRegisterUserAccess = useMemo(() => roles?.some((role) => role?.code === "ADVOCATE_APPROVER"), [roles]);
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo]);
  const isEpostUser = useMemo(() => roles?.some((role) => role?.code === "POST_MANAGER"), [roles]);
  let homePath = `/${window?.contextPath}/${userType}/home/home-pending-task`;
  if (!isEpostUser && userType === "employee") homePath = `/${window?.contextPath}/${userType}/home/home-screen`;

  if (!hasViewRegisterUserAccess) {
    history.push(homePath);
  }
  return (
    <div className={"bulk-esign-order-view register-user-home-tab"}>
      <div className="header">{t("REGISTER_USERS_HOME")}</div>
      <InboxSearchComposer customStyle={sectionsParentStyle} configs={registerUserConfig}></InboxSearchComposer>
    </div>
  );
};

export default RegisterUsersHomeTab;
