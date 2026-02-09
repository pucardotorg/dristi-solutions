import React, { useEffect, useState, useMemo, useContext, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import { useLocation, useHistory } from "react-router-dom";
// import BackButton from "./BackButton";
import { Hamburger, NotificationBell } from "@egovernments/digit-ui-react-components";
import ProfileComponent from "./ProfileComponent";
import { AdvocateDataContext } from "../../Module";
import { extractedSeniorAdvocates, userTypeOptions } from "../../Utils";

const AdvocateProfileUserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8.00006 2.66666C6.71139 2.66666 5.66672 3.71133 5.66672 4.99999C5.66672 6.28866 6.71139 7.33333 8.00006 7.33333C9.28872 7.33333 10.3334 6.28866 10.3334 4.99999C10.3334 3.71133 9.28872 2.66666 8.00006 2.66666ZM4.33339 4.99999C4.33339 2.97495 5.97501 1.33333 8.00006 1.33333C10.0251 1.33333 11.6667 2.97495 11.6667 4.99999C11.6667 7.02504 10.0251 8.66666 8.00006 8.66666C5.97501 8.66666 4.33339 7.02504 4.33339 4.99999ZM6.21757 9.66663C6.25561 9.66664 6.29421 9.66666 6.33339 9.66666H9.66672C9.7059 9.66666 9.7445 9.66664 9.78255 9.66663C10.6007 9.66633 11.1594 9.66612 11.6343 9.81019C12.6997 10.1334 13.5334 10.967 13.8565 12.0324C14.0006 12.5073 14.0004 13.066 14.0001 13.8842C14.0001 13.9222 14.0001 13.9608 14.0001 14C14.0001 14.3682 13.7016 14.6667 13.3334 14.6667C12.9652 14.6667 12.6667 14.3682 12.6667 14C12.6667 13.0211 12.6595 12.6795 12.5806 12.4194C12.3867 11.7802 11.8865 11.28 11.2473 11.0861C10.9872 11.0072 10.6456 11 9.66672 11H6.33339C5.35451 11 5.01286 11.0072 4.75282 11.0861C4.11362 11.28 3.61341 11.7802 3.41951 12.4194C3.34063 12.6795 3.33339 13.0211 3.33339 14C3.33339 14.3682 3.03491 14.6667 2.66672 14.6667C2.29853 14.6667 2.00006 14.3682 2.00006 14C2.00006 13.9608 2.00004 13.9222 2.00003 13.8842C1.99972 13.066 1.99952 12.5073 2.14359 12.0324C2.46676 10.967 3.30043 10.1334 4.36577 9.81019C4.84071 9.66612 5.39938 9.66633 6.21757 9.66663Z"
      fill="#334155"
    />
  </svg>
);

const AdvocateProfileChevronIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#clip0_13787_1210)">
      <path d="M16.59 8.59L12 13.17L7.41 8.59L6 10L12 16L18 10L16.59 8.59Z" fill="#007E7E" />
    </g>
    <defs>
      <clipPath id="clip0_13787_1210">
        <rect width="24" height="24" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

const ManageOfficeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
      fill="#007E7E"
    />
    <path d="M19 8H21V10H19V8ZM19 12H21V18H19V12Z" fill="#007E7E" />
  </svg>
);

const AdvocateProfileDropdown = React.memo(({ t, options = [], selected, onSelect, disabled }) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleToggle = useCallback(() => {
    if (!disabled) setOpen((prev) => !prev);
  }, [disabled]);

  const handleSelect = useCallback(
    (option) => {
      if (!option || option.id === selected?.id) {
        setOpen(false);
        return;
      }

      onSelect(option);
      setOpen(false);
    },
    [onSelect, selected?.id]
  );

  const buttonLabel = selected?.advocateName ? `Adv. ${t(selected.advocateName)}'s Profile` : t("SELECT_ADVOCATE");

  return (
    <div className="advocate-profile-dropdown" ref={wrapperRef}>
      <button type="button" className={`advocate-profile-dropdown__button${open ? " open" : ""}`} onClick={handleToggle} disabled={disabled}>
        <span>{buttonLabel}</span>
        <AdvocateProfileChevronIcon />
      </button>

      {open && options.length > 0 && (
        <div className="advocate-profile-dropdown__menu">
          {options.map((option) => (
            <button key={option.id} type="button" className="advocate-profile-dropdown__item" onClick={() => handleSelect(option)}>
              <AdvocateProfileUserIcon />
              <span>{t(option.advocateName)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

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
  const [selectedAdvocate, setSelectedAdvocate] = useState(null);
  const { AdvocateData, setAdvocateDataContext } = useContext(AdvocateDataContext);
  const tenantId = useMemo(() => window?.Digit.ULBService.getCurrentTenantId(), []);
  const userInfo = useMemo(() => JSON.parse(window.localStorage.getItem("user-info")), []);
  // Check if user is an advocate (has ADVOCATE_ROLE)
  const isAdvocate = useMemo(() => {
    return userDetails?.info?.roles?.some((role) => role?.code === "ADVOCATE_ROLE");
  }, [userDetails?.info?.roles]);

  const isAdvocateClerk = useMemo(() => {
    return userDetails?.info?.roles?.some((role) => role?.code === "ADVOCATE_CLERK_ROLE");
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

  const { data: individualData, isLoading, isFetching } = window?.Digit.Hooks.dristi.useGetIndividualUser(
    {
      Individual: {
        userUuid: [userInfo?.uuid],
      },
    },
    { tenantId, limit: 1000, offset: 0 },
    "Home",
    userInfo?.uuid || "",
    Boolean(userInfo?.uuid && isUserLoggedIn),
    6 * 1000
  );
  const individualId = useMemo(() => individualData?.Individual?.[0]?.individualId, [individualData]);

  const userType = useMemo(() => individualData?.Individual?.[0]?.additionalFields?.fields?.find((obj) => obj.key === "userType")?.value, [
    individualData?.Individual,
  ]);
  const { data: searchData, isLoading: isSearchLoading } = Digit?.Hooks?.dristi?.useGetAdvocateClerk(
    {
      criteria: [{ individualId }],
      tenantId,
    },
    { tenantId },
    individualId,
    Boolean(isUserLoggedIn && individualId && userType !== "LITIGANT"),
    userType === "ADVOCATE" ? "/advocate/v1/_search" : "/advocate/clerk/v1/_search"
  );

  const userTypeDetail = useMemo(() => {
    return userTypeOptions.find((item) => item.code === userType) || {};
  }, [userType]);

  const searchResult = useMemo(() => {
    return searchData?.[`${userTypeDetail?.apiDetails?.requestKey}s`]?.[0]?.responseList;
  }, [searchData, userTypeDetail?.apiDetails?.requestKey]);

  const isApprovalPending = useMemo(() => {
    if (!searchResult) return true;
    return (
      userType !== "LITIGANT" &&
      Array.isArray(searchResult) &&
      searchResult?.length > 0 &&
      searchResult?.[0]?.isActive === false &&
      searchResult?.[0]?.status !== "INACTIVE"
    );
  }, [searchResult, userType]);

  const advocateId = useMemo(() => {
    return userType === "ADVOCATE" ? searchResult?.[0]?.id : null;
  }, [searchResult, userType]);

  const advClerkId = useMemo(() => {
    return userType === "ADVOCATE_CLERK" ? searchResult?.[0]?.id : null;
  }, [searchResult, userType]);

  const searchCriteria = useMemo(() => {
    return userType === "ADVOCATE" ? { memberId: advocateId } : userType === "ADVOCATE_CLERK" ? { memberId: advClerkId } : {};
  }, [advocateId, advClerkId, userType]);

  const { data: officeMembersData, isLoading: isLoadingMembers, refetch: refetchMembers } = window?.Digit?.Hooks?.dristi?.useSearchOfficeMember(
    {
      searchCriteria: {
        ...searchCriteria,
        tenantId: tenantId,
      },
    },
    { tenantId },
    searchCriteria,
    Boolean((advocateId || advClerkId) && tenantId && !isApprovalPending)
  );

  const seniorAdvocates = useMemo(() => {
    if (isLoadingMembers) return [];
    if (userType === "ADVOCATE" && advocateId) {
      const selfDetails = [{ id: advocateId, value: advocateId, advocateName: userInfo?.name, uuid: userInfo?.uuid }];
      if (officeMembersData?.members?.length > 0) {
        const seniorAdvocatesList = Array.isArray(officeMembersData?.members) ? extractedSeniorAdvocates(officeMembersData) || [] : [];
        const totalList = [...selfDetails, ...seniorAdvocatesList];
        return [...(totalList || [])].sort((a, b) => a?.advocateName?.localeCompare(b?.advocateName));
      } else return selfDetails;
    } else if (userType === "ADVOCATE_CLERK" && advClerkId) {
      if (officeMembersData?.members?.length > 0) {
        const seniorAdvocatesList = Array.isArray(officeMembersData?.members) ? extractedSeniorAdvocates(officeMembersData) || [] : [];
        return [...(seniorAdvocatesList || [])].sort((a, b) => a?.advocateName?.localeCompare(b?.advocateName));
      } else return [];
    }
    return [];
  }, [advocateId, advClerkId, officeMembersData, isLoadingMembers, userType, userInfo?.name, userInfo?.uuid]);

  const changeAdvocateSelection = (advocate) => {
    if (advocate && advocate?.id !== AdvocateData?.id) {
      setSelectedAdvocate({ ...advocate });
      setAdvocateDataContext({ ...advocate });
      localStorage.setItem("selectedAdvocate", JSON.stringify({ ...advocate }));
    }
  };

  const resolveSelectedAdvocate = ({ storedAdvocate, seniorAdvocates, advocateId }) => {
    // If already selected and page refreshed -> keep the same
    if (storedAdvocate?.id) return storedAdvocate;

    // Do nothing till senior advocates list is not generated.
    if (!seniorAdvocates?.length) return null;

    // if an Advocate logs in -> select himself initially.
    if (advocateId) {
      return seniorAdvocates.find((o) => o?.id === advocateId) || null;
    }

    //if clerk is logged in -> select first senior Advocate initially.
    return seniorAdvocates[0];
  };

  useEffect(() => {
    const storedAdvocate = JSON.parse(localStorage.getItem("selectedAdvocate"));

    const resolvedAdvocate = resolveSelectedAdvocate({
      storedAdvocate,
      seniorAdvocates,
      advocateId,
    });

    if (!resolvedAdvocate?.id) return;
    if (resolvedAdvocate.id === selectedAdvocate?.id) return;

    setSelectedAdvocate(resolvedAdvocate);
    setAdvocateDataContext(resolvedAdvocate);
    localStorage.setItem("selectedAdvocate", JSON.stringify(resolvedAdvocate));
  }, [seniorAdvocates, advocateId, selectedAdvocate?.id, setAdvocateDataContext]);

  const disableAdvocateChange = useMemo(() => {
    // Allow changing advocate only on home screen.
    const homePath = `/${window?.contextPath}/citizen/home/home-pending-task`;
    return pathname !== homePath;
  }, [pathname]);

  const hasMembers = Array.isArray(seniorAdvocates) && seniorAdvocates?.length > 0;

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
          {/* Manage Office button & Advocate profile dropdown - only visible for advocates / clerks */}
          {isSearchLoading || isApprovalPending
            ? null
            : isUserLoggedIn &&
              !isSearchLoading &&
              !isApprovalPending &&
              hasMembers &&
              (isAdvocate || isAdvocateClerk) && (
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginRight: "16px" }}>
                  <AdvocateProfileDropdown
                    t={t}
                    options={seniorAdvocates}
                    selected={selectedAdvocate}
                    onSelect={changeAdvocateSelection}
                    disabled={disableAdvocateChange}
                  />
                  {isAdvocate && (
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
                      }}
                    >
                      <ManageOfficeIcon />
                      <span>{t ? t("MANAGE_OFFICE") : "Manage Office"}</span>
                    </button>
                  )}
                </div>
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
