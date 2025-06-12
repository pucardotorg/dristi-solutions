import useGetHearingLink from "@egovernments/digit-ui-module-hearings/src/hooks/hearings/useGetHearingLink";
import React, { useMemo } from "react";
import { Button } from "@egovernments/digit-ui-components";

const linkStyle = {
  fontFamily: "Roboto",
  fontSize: 16,
  fontWeight: 400,
  textDecoration: "none",
  color: "#505A5F",
  padding: 10,
  borderRadius: 8,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: "24px",
  border: "1px solid #D6D5D4",
  width: "200px",
};

const HomeHeader = ({ t }) => {
  const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
  const name = userInfo?.name;
  const roles = useMemo(() => userInfo?.roles, [userInfo]);

  const isJudge = useMemo(() => roles?.some((role) => role?.code === "JUDGE_ROLE"), [roles]);
  const isBenchClerk = useMemo(() => roles?.some((role) => role?.code === "BENCH_CLERK"), [roles]);
  const isTypist = useMemo(() => roles?.some((role) => role.code === "TYPIST_ROLE"), [roles]);

  const { data: hearingLink } = useGetHearingLink();

  return (
    <div style={{ borderTop: "1px #e8e8e8 solid", width: "100vw", padding: "24px 40px" }}>
      <div className="header" style={{ fontFamily: "Roboto", fontWeight: 700, fontSize: "40px", lineHeight: "100%", letterSpacing: "0%" }}>
        {t("CS_HOME_HELLO")}, <span style={{ color: "#77787B" }}>{name}</span>
        {(isJudge || isBenchClerk || isTypist) && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end" }}>
            <div className="hearingCard" style={{ backgroundColor: "white", justifyContent: "flex-start", padding: "32px 0px 0px" }}>
              <a href={`/${window.contextPath}/employee/home/dashboard`} style={linkStyle} target="_self" rel="noopener noreferrer">
                {t("OPEN_DASHBOARD")}
              </a>
              <a href={`/${window.contextPath}/employee/home/dashboard?select=2`} style={linkStyle} target="_self" rel="noopener noreferrer">
                {t("OPEN_REGISTERS")}
              </a>
              <a href={`/${window.contextPath}/employee/home/home-pending-task`} style={linkStyle} target="_self" rel="noopener noreferrer">
                {t("OPEN_ALL_CASES")}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeHeader;
