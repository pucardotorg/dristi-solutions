import { EmployeeModuleCard, PropertyHouse } from "@egovernments/digit-ui-react-components";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

const HomeCard = () => {
  const { t } = useTranslation();
  const userInfo = window?.Digit?.UserService?.getUser()?.info;

  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo]);

  const roles = useMemo(() => userInfo?.roles, [userInfo]);

  const isJudge = useMemo(() => roles?.some((role) => role.code === "CASE_APPROVER"), [roles]);
  const isBenchClerk = useMemo(() => roles?.some((role) => role.code === "BENCH_CLERK"), [roles]);
  const isTypist = useMemo(() => roles?.some((role) => role.code === "TYPIST_ROLE"), [roles]);
  let homePath = `/${window?.contextPath}/${userType}/home/home-pending-task`;
  if (isJudge || isTypist || isBenchClerk) homePath = `/${window?.contextPath}/${userType}/home/home-screen`;
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
