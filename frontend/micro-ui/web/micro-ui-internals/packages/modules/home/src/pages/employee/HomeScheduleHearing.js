// This component is used to show user registration requests on home screen.

import { InboxSearchComposer } from "@egovernments/digit-ui-react-components";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { HomeScheduleHearingConfig } from "../../configs/ScheduleHearingHomeConfig";

const sectionsParentStyle = {
  height: "50%",
  display: "flex",
  flexDirection: "column",
  gridTemplateColumns: "20% 1fr",
  gap: "1rem",
};

const HomeScheduleHearing = ({ tenants }) => {
  const { t } = useTranslation();
  const userInfo = window?.Digit?.UserService?.getUser()?.info;
  const roles = useMemo(() => userInfo?.roles, [userInfo]);
  const history = useHistory();
  const hasViewScheduleHearingAccess = useMemo(() => roles?.some((role) => role?.code === "VIEW_SCHEDULE_HEARING_HOME"), [roles]);
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo]);
  const isEpostUser = useMemo(() => roles?.some((role) => role?.code === "POST_MANAGER"), [roles]);
  let homePath = `/${window?.contextPath}/${userType}/home/home-pending-task`;
  if (!isEpostUser && userType === "employee") homePath = `/${window?.contextPath}/${userType}/home/home-screen`;

  if (!hasViewScheduleHearingAccess) {
    history.push(homePath);
  }
  return (
    <div className={"bulk-esign-order-view schedule-hearing-home-tab"}>
      <div className="header">{t("SCHEDULE_HEARING_HOME")}</div>
      <InboxSearchComposer customStyle={sectionsParentStyle} configs={HomeScheduleHearingConfig}></InboxSearchComposer>
    </div>
  );
};

export default HomeScheduleHearing;
