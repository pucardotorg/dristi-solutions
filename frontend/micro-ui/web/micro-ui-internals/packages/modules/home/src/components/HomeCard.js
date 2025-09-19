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
  const propsForModuleCard = {
    Icon: <PropertyHouse />,
    moduleName: t("Hearings"),
    kpis: [],
    links: [
      {
        label: t("Home"),
        link: homePath,
      },
      {
        label: t("Inside Hearing"),
        link: `/${window?.contextPath}/employee/home/inside-hearing`,
      },
      {
        label: t("ADMISSION HEARING"),
        link: `/${window?.contextPath}/employee/home/view-hearing`,
      },
    ],
  };

  return <div />;
  // return <EmployeeModuleCard {...propsForModuleCard} />;
};

export default HomeCard;
