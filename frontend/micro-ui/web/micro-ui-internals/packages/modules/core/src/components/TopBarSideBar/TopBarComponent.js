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
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6.33464 2.66666C5.23007 2.66666 4.33464 3.56209 4.33464 4.66666C4.33464 5.77123 5.23007 6.66666 6.33464 6.66666C7.4392 6.66666 8.33464 5.77123 8.33464 4.66666C8.33464 3.56209 7.43921 2.66666 6.33464 2.66666ZM3.0013 4.66666C3.0013 2.82571 4.49369 1.33333 6.33464 1.33333C8.17558 1.33333 9.66797 2.82571 9.66797 4.66666C9.66797 6.50761 8.17559 7.99999 6.33464 7.99999C4.49369 7.99999 3.0013 6.50761 3.0013 4.66666ZM9.71668 1.94369C9.85483 1.6024 10.2435 1.43773 10.5848 1.57588C11.8051 2.06987 12.668 3.2667 12.668 4.66666C12.668 6.06662 11.8051 7.26346 10.5848 7.75745C10.2435 7.8956 9.85483 7.73092 9.71668 7.38963C9.57853 7.04834 9.7432 6.65968 10.0845 6.52153C10.8187 6.22434 11.3346 5.50496 11.3346 4.66666C11.3346 3.82837 10.8187 3.10898 10.0845 2.81179C9.7432 2.67364 9.57853 2.28498 9.71668 1.94369ZM5.31095 9.33333H7.35832C7.95949 9.33332 8.44443 9.33332 8.8391 9.36025C9.24493 9.38794 9.60378 9.44631 9.94358 9.58706C10.7603 9.92538 11.4093 10.5743 11.7476 11.391C11.8883 11.7308 11.9467 12.0897 11.9744 12.4955C12.0013 12.8902 12.0013 13.3751 12.0013 13.9763V14C12.0013 14.3682 11.7028 14.6667 11.3346 14.6667C10.9664 14.6667 10.668 14.3682 10.668 14C10.668 13.3696 10.6676 12.9302 10.6441 12.5863C10.6211 12.2484 10.578 12.0516 10.5157 11.9013C10.3127 11.4112 9.92339 11.0219 9.43334 10.8189C9.28308 10.7567 9.08628 10.7135 8.74834 10.6905C8.40441 10.667 7.96501 10.6667 7.33464 10.6667H5.33464C4.70426 10.6667 4.26486 10.667 3.92093 10.6905C3.58299 10.7135 3.38619 10.7567 3.23594 10.8189C2.74588 11.0219 2.35653 11.4112 2.15354 11.9013C2.09131 12.0516 2.04819 12.2484 2.02513 12.5863C2.00166 12.9302 2.0013 13.3696 2.0013 14C2.0013 14.3682 1.70283 14.6667 1.33464 14.6667C0.966446 14.6667 0.667969 14.3682 0.667969 14L0.667969 13.9763C0.667964 13.3751 0.667961 12.8902 0.694889 12.4955C0.722578 12.0897 0.780954 11.7308 0.921704 11.391C1.26002 10.5743 1.90893 9.92538 2.72569 9.58706C3.06549 9.44631 3.42434 9.38794 3.83017 9.36025C4.22484 9.33332 4.70978 9.33332 5.31095 9.33333ZM12.0223 9.91783C12.1141 9.56127 12.4776 9.34661 12.8341 9.43838C14.2717 9.80838 15.3346 11.1125 15.3346 12.6667V14C15.3346 14.3682 15.0362 14.6667 14.668 14.6667C14.2998 14.6667 14.0013 14.3682 14.0013 14V12.6667C14.0013 11.7357 13.3646 10.9517 12.5018 10.7296C12.1452 10.6379 11.9306 10.2744 12.0223 9.91783Z"
      fill="#007E7E"
    />
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
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
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
      sessionStorage.setItem("selectedAdvocate", JSON.stringify({ ...advocate }));
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
    const storedAdvocate = JSON.parse(sessionStorage.getItem("selectedAdvocate"));

    const resolvedAdvocate = resolveSelectedAdvocate({
      storedAdvocate,
      seniorAdvocates,
      advocateId,
    });

    if (!resolvedAdvocate?.id) return;
    if (resolvedAdvocate.id === selectedAdvocate?.id) return;

    setSelectedAdvocate(resolvedAdvocate);
    setAdvocateDataContext(resolvedAdvocate);
    sessionStorage.setItem("selectedAdvocate", JSON.stringify(resolvedAdvocate));
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
