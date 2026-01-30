import React, { useEffect, useState, useMemo } from "react";
import PropTypes from "prop-types";
import { useLocation, useHistory } from "react-router-dom";
// import BackButton from "./BackButton";
import { Dropdown, Hamburger, NotificationBell } from "@egovernments/digit-ui-react-components";
import ProfileComponent from "./ProfileComponent";

const ManageOfficeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="#007E7E"/>
    <path d="M19 8H21V10H19V8ZM19 12H21V18H19V12Z" fill="#007E7E"/>
  </svg>
);

const TopBarComponent = ({
  img,
  isMobile,
  logoUrl,
  onLogout,
  toggleSidebar,
  ulb,
  userDetails,
  notificationCount,
  notificationCountLoaded,
  cityOfCitizenShownBesideLogo,
  onNotificationIconClick,
  hideNotificationIconOnSomeUrlsWhenNotLoggedIn,
  changeLanguage,
  hideChangeLangOnSomeUrlsWhenNotLoggedIn = false,
  userOptions,
  handleUserDropdownSelection,
  mobileView,
  profilePic,
  TextToImg,
  t,
}) => {
  const { pathname } = useLocation();
  const history = useHistory();
  const token = window.localStorage.getItem("token");
  const isUserLoggedIn = Boolean(token);
  
  // Check if user is an advocate (has ADVOCATE_ROLE)
  const isAdvocate = useMemo(() => {
    return userDetails?.info?.roles?.some((role) => role?.code === "ADVOCATE_ROLE");
  }, [userDetails?.info?.roles]);
  
  const handleManageOfficeClick = () => {
    history.push(`/${window?.contextPath}/citizen/dristi/home/manage-office`);
  };
  // const showHaburgerorBackButton = () => {
  //   if (pathname === `/${window?.contextPath}citizen` || pathname === `/${window?.contextPath}/citizen/` || pathname === `/${window?.contextPath}/citizen/select-language`) {
  //     return <Hamburger handleClick={toggleSidebar} />;
  //   } else {
  //     return <BackButton className="top-back-btn" />;
  //   }
  // };
  const emblemBigImageLink = window?.globalConfigs?.getConfig("EMBLEM_BIG");
  const onCourtsImageLink = window?.globalConfigs?.getConfig("ON_COURTS_LOGO");

  return (
    <div className="navbar" style={{ zIndex: "999" }}>
      <div className="center-container back-wrapper">
        <div className="hambuger-back-wrapper">
          {isMobile && <Hamburger handleClick={toggleSidebar} />}

          <div
            style={{ display: "flex", gap: "16px", cursor: "pointer" }}
            onClick={() => {
              const pathUnwind = pathname.split("/").slice(0, 3).join("/") + (isUserLoggedIn ? "/home/home-pending-task" : "/dristi");
              history.push(pathUnwind);
            }}
          >
            <img
              className="city"
              id="topbar-logo"
              style={{ display: "flex", alignItems: "center", height: "40px", minWidth: "20px" }}
              src={emblemBigImageLink || "https://cdn.jsdelivr.net/npm/@egovernments/digit-ui-css@1.0.7/img/m_seva_white_logo.png"}
              alt="mSeva"
            />
            <img
              className="city"
              id="topbar-logo"
              style={{ display: "flex", alignItems: "center", height: "40px" }}
              src={onCourtsImageLink || "https://cdn.jsdelivr.net/npm/@egovernments/digit-ui-css@1.0.7/img/m_seva_white_logo.png"}
              alt="mSeva"
            />
          </div>
          <h3>{cityOfCitizenShownBesideLogo}</h3>
        </div>

        <div className="RightMostTopBarOptions">
          {/* Manage Office button - only visible for advocates */}
          {isUserLoggedIn && isAdvocate && (
            <button
              className="manage-office-btn"
              onClick={handleManageOfficeClick}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                backgroundColor: "white",
                border: "1px solid #007E7E",
                borderRadius: "4px",
                color: "#007E7E",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                marginRight: "16px",
              }}
            >
              <ManageOfficeIcon />
              <span>{t ? t("MANAGE_OFFICE") : "Manage Office"}</span>
            </button>
          )}
          {!hideChangeLangOnSomeUrlsWhenNotLoggedIn && !isUserLoggedIn ? changeLanguage : null}
          {!hideNotificationIconOnSomeUrlsWhenNotLoggedIn ? (
            <div className="EventNotificationWrapper" onClick={onNotificationIconClick}>
              {notificationCountLoaded && notificationCount ? (
                <span>
                  <p>{notificationCount}</p>
                </span>
              ) : null}
              <NotificationBell />
            </div>
          ) : null}
          {userDetails?.access_token && (
            <div className="left" style={{ paddingTop: "10px" }}>
              <ProfileComponent
                userDetails={userDetails}
                userOptions={userOptions}
                handleUserDropdownSelection={handleUserDropdownSelection}
                profilePic={profilePic}
                TextToImg={TextToImg}
                onLogout={onLogout}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

TopBarComponent.propTypes = {
  img: PropTypes.string,
};

TopBarComponent.defaultProps = {
  img: undefined,
};

export default TopBarComponent;
