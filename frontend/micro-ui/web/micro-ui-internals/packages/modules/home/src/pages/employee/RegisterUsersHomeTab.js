// This component is used to show user registration requests on home screen.

import { InboxSearchComposer } from "@egovernments/digit-ui-react-components";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { registerUserConfig } from "../../configs/RegisterUserConfig";

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

  const hasApprovalRoles = ["ADVOCATE_APPROVER", "ADVOCATE_CLERK_APPROVER"].every((requiredRole) =>
    roles?.some((role) => role.code === requiredRole)
  );

  if (!hasApprovalRoles) {
    // history.push(homePath);
  }
  return (
    <div className={"bulk-esign-order-view"}>
      <div className="header">{t("REGISTER_USERS_HOME")}</div>
      <InboxSearchComposer customStyle={sectionsParentStyle} configs={registerUserConfig}></InboxSearchComposer>
    </div>
  );
};

export default RegisterUsersHomeTab;
