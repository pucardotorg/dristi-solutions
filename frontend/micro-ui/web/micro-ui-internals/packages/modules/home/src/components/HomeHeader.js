import React, { useMemo } from "react";
import { AllCasesIcon, DashboarGraphIcon, OpenInNewTabIcon } from "@egovernments/digit-ui-module-dristi/src/icons/svgIndex";

const HomeHeader = ({ t, userInfo, roles }) => {
  const name = userInfo?.name;
  const hasViewDashboardsAccess = useMemo(() => roles?.some((role) => role?.code === "VIEW_DASHBOARDS"), [roles]);
  const hasViewAllCasesAccess = useMemo(() => roles?.some((role) => role?.code === "VIEW_ALL_CASES"), [roles]);
  const today = new Date();
  const curHr = today.getHours();

  return (
    <div
      className="home-header"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div style={{ fontSize: "20px", fontWeight: "700", paddingBottom: "16px", borderBottom: "1px solid #E6E6E6" }}>
        {curHr < 12 ? t("GOOD_MORNING") : curHr < 18 ? t("GOOD_AFTERNOON") : t("GOOD_EVENING")}, <span className="userName">{name}</span>
      </div>
      {(hasViewDashboardsAccess || hasViewAllCasesAccess) && (
        <div className="home-top-left-bar">
          {hasViewDashboardsAccess && (
            <a href={`/${window.contextPath}/employee/home/dashboard`} className="home-btn" target="_self" rel="noopener noreferrer">
              <div style={{ display: "flex", alignItems: "center" }}>
                <DashboarGraphIcon />
                <span style={{ paddingLeft: "8px" }}>{t("OPEN_DASHBOARD")}</span>
              </div>
              <OpenInNewTabIcon />
            </a>
          )}
          {hasViewAllCasesAccess && (
            <a href={`/${window.contextPath}/employee/home/home-pending-task`} className="home-btn" target="_self" rel="noopener noreferrer">
              <div style={{ display: "flex", alignItems: "center" }}>
                <AllCasesIcon />
                <span style={{ paddingLeft: "8px" }}>{t("OPEN_ALL_CASES")}</span>
              </div>
              <OpenInNewTabIcon />
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default HomeHeader;
