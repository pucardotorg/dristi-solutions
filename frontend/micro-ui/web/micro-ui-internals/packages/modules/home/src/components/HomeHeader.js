import useGetHearingLink from "@egovernments/digit-ui-module-hearings/src/hooks/hearings/useGetHearingLink";
import React, { useMemo } from "react";
import { Button } from "@egovernments/digit-ui-components";

const HomeHeader = ({ t }) => {
  const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
  const name = userInfo?.name;
  const roles = useMemo(() => userInfo?.roles, [userInfo]);

  const isJudge = useMemo(() => roles?.some((role) => role?.code === "JUDGE_ROLE"), [roles]);
  const isBenchClerk = useMemo(() => roles?.some((role) => role?.code === "BENCH_CLERK"), [roles]);
  const isCourtRoomManager = useMemo(() => roles?.some((role) => role?.code === "COURT_ROOM_MANAGER"), [roles]);
  const isTypist = useMemo(() => roles?.some((role) => role.code === "TYPIST_ROLE"), [roles]);

  const { data: hearingLink } = useGetHearingLink();
  const today = new Date();
  const curHr = today.getHours();

  const ArrowIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clip-path="url(#clip0_36_6989)">
        <path d="M4 12L12 4" stroke="black" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M5.5 4H12V10.5" stroke="black" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" />
      </g>
      <defs>
        <clipPath id="clip0_36_6989">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );

  return (
    <div style={{ borderTop: "1px #e8e8e8 solid", width: "100vw", padding: "24px" }}>
      <style>{`
      .home-header{
height: 88;
border-top-width: 1px;
border-bottom-width: 1px;
border-left-width: 1px;
padding: 24px;
gap: 6px;
}
      .home-btn{
      background-color:rgb(255, 255, 255);
      color:rgb(0, 0, 0);
      border:1px solid #B5B5B5;
      height: 40px;
      gap: 4px;
      padding-top: 12px;
      padding-right: 16px;
      padding-bottom: 12px;
      padding-left: 16px;
      border-radius :0;
      text-decoration: none;
      font-size:14px;
      font-weight: 400;
      display: flex;
      }
      .home-top-left-bar{
       display:flex;
       gap: 18px;
       flex-direction:row;
      }
       .userName {
       color: #77787B;
       }
      `}</style>

      <div
        className="home-header{"
        style={{
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontSize: "28px", fontWeight: "700" }}>
          {curHr < 12 ? t("GOOD_MORNING") : curHr < 18 ? t("GOOD_AFTERNOON") : t("GOOD_EVENING")}, <span className="userName">{name}</span>
        </div>
        {(isJudge || isBenchClerk || isTypist || isCourtRoomManager) && (
          <div className="home-top-left-bar">
            <a href={`/${window.contextPath}/employee/home/dashboard`} className="home-btn" target="_self" rel="noopener noreferrer">
              {t("OPEN_DASHBOARD")} <ArrowIcon />
            </a>
            <a href={`/${window.contextPath}/employee/home/dashboard?select=2`} className="home-btn" target="_self" rel="noopener noreferrer">
              {t("OPEN_REGISTERS")} <ArrowIcon />
            </a>
            <a href={`/${window.contextPath}/employee/home/home-pending-task`} className="home-btn" target="_self" rel="noopener noreferrer">
              {t("OPEN_ALL_CASES")} <ArrowIcon />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeHeader;
