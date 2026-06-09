import { EmployeeModuleCard, PropertyHouse } from "@egovernments/digit-ui-react-components";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

const HomeCard = () => {
  const { t } = useTranslation();
  const userInfo = window?.Digit?.UserService?.getUser()?.info;

  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo]);

  const roles = useMemo(() => userInfo?.roles, [userInfo]);
  const isEpostUser = useMemo(() => roles?.some((role) => role?.code === "POST_MANAGER"), [roles]);

  let homePath = `/${window?.contextPath}/${userType}/home/home-pending-task`;
  if (!isEpostUser && userType === "employee") homePath = `/${window?.contextPath}/${userType}/home/home-screen`;

  return <div />;
};

export default HomeCard;
