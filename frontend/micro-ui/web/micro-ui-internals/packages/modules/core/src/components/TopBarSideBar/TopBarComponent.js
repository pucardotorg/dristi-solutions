import React, { useEffect, useState, useMemo, useContext, useRef } from "react";
import PropTypes from "prop-types";
import { useLocation, useHistory } from "react-router-dom";
// import BackButton from "./BackButton";
import { Dropdown, Hamburger, NotificationBell } from "@egovernments/digit-ui-react-components";
import ProfileComponent from "./ProfileComponent";
import { AdvocateDataContext } from "../../Module";
import { userTypeOptions } from "@egovernments/digit-ui-module-home/src/configs/BenchHomeConfig";
import { extractedSeniorAdvocates } from "@egovernments/digit-ui-module-home/src/utils";
import { AdvocateProfileUserIcon, AdvocateProfileChevronIcon } from "@egovernments/digit-ui-module-dristi/src/icons/svgIndex";

const ManageOfficeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
      fill="#007E7E"
    />
    <path d="M19 8H21V10H19V8ZM19 12H21V18H19V12Z" fill="#007E7E" />
  </svg>
);

const AdvocateProfileDropdown = ({ t, options, selected, onSelect, disabled }) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const hasSelected = selected && selected.advocateName;
  const baseLabel = hasSelected ? `Adv. ${t(selected.advocateName)}` : t("SELECT_ADVOCATE");
  const buttonLabel = hasSelected ? `${baseLabel}'s Profile` : baseLabel;

  const handleToggle = () => {
    if (disabled) return;
    setOpen(!open);
  };

  const handleSelect = (option) => {
    if (!option) return;
    onSelect(option);
    setOpen(false);
  };

  return (
    <div className="advocate-profile-dropdown" ref={wrapperRef}>
      <button
        type="button"
        className={`advocate-profile-dropdown__button${open ? " advocate-profile-dropdown__button--open" : ""}`}
        onClick={handleToggle}
        disabled={disabled}
      >
        <span className="advocate-profile-dropdown__button-label">{buttonLabel}</span>
        <span className="advocate-profile-dropdown__button-chevron">
          <AdvocateProfileChevronIcon />
        </span>
      </button>
      {open && options && options.length > 0 && (
        <div className="advocate-profile-dropdown__menu">
          {options.map((option) => (
            <button
              type="button"
              key={option.id || option.value || option.uuid}
              className="advocate-profile-dropdown__item"
              onClick={() => handleSelect(option)}
            >
              <span className="advocate-profile-dropdown__item-icon">
                <AdvocateProfileUserIcon />
              </span>
              <span className="advocate-profile-dropdown__item-label">{t(option.advocateName)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

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
    Boolean((advocateId || advClerkId) && tenantId)
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
    return pathname !== "/ui/citizen/home/home-pending-task";
  }, [pathname]);

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
          {isUserLoggedIn && (isAdvocate || isAdvocateClerk) && (
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
