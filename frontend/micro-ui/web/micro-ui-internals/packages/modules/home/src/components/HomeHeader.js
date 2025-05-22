import React, { useMemo } from "react";
import { Link } from "react-router-dom";

const linkStyle = {
  fontFamily: "Roboto",
  fontSize: 16,
  fontWeight: 400,
  textDecoration: "none",
  color: "#505A5F",
  padding: 10,
  borderRadius: 8,
  display: "inline-block",
  lineHeight: "24px",
  border: "1px solid #D6D5D4",
};

const HomeHeader = ({ t }) => {
  const userName = Digit.SessionStorage.get("User");
  const userInfo = userName?.info;
  const name = userInfo?.name;
  const roles = useMemo(() => userInfo?.roles, [userInfo]);

  const isJudge = useMemo(() => roles?.some((role) => role?.code === "JUDGE_ROLE"), [roles]);

  return (
    <div style={{ borderTop: "1px #e8e8e8 solid", width: "100vw", padding: "24px 40px" }}>
      <div className="header" style={{ fontFamily: "Roboto", fontWeight: 700, fontSize: "40px", lineHeight: "100%", letterSpacing: "0%" }}>
        {t("CS_HOME_HELLO")}, <span style={{ color: "#77787B" }}>{name}</span>
        {isJudge && (
          <div className="hearingCard" style={{ backgroundColor: "white", justifyContent: "flex-start" }}>
            <Link to={`/${window.contextPath}/employee/home/dashboard`} style={linkStyle}>
              {t("OPEN_DASHBOARD")}
            </Link>
            <Link to={`/${window.contextPath}/employee/home/dashboard?select=2`} style={linkStyle}>
              {t("OPEN_REGISTERS")}
            </Link>
            <Link to={`/${window.contextPath}/employee/home/dashboard/adiary`} style={linkStyle}>
              {t("OPEN_ALL_CASES")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeHeader;
