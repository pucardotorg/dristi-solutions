import React, { useState } from "react";
import { EditPencilIcon, LogoutIcon } from "@egovernments/digit-ui-react-components";
import TopBar from "./TopBar";
import { useHistory } from "react-router-dom";
import SideBar from "./SideBar";
import LogoutDialog from "../Dialog/LogoutDialog";

const LogoutSvg = () => (
  <svg width="18" height="21" viewBox="0 0 18 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M9 0.769043C9.5523 0.769043 10 1.21676 10 1.76904V11.769C10 12.3213 9.5523 12.769 9 12.769C8.4477 12.769 8 12.3213 8 11.769V1.76904C8 1.21676 8.4477 0.769043 9 0.769043ZM5.86561 4.33857C6.14215 4.81663 5.97879 5.42836 5.50073 5.7049C3.40581 6.91675 2 9.17934 2 11.769C2 15.635 5.13401 18.769 9 18.769C12.866 18.769 16 15.635 16 11.769C16 9.17934 14.5942 6.91675 12.4993 5.7049C12.0212 5.42836 11.8579 4.81663 12.1344 4.33857C12.4109 3.86051 13.0227 3.69715 13.5007 3.97369C16.1882 5.52832 18 8.43651 18 11.769C18 16.7396 13.9706 20.769 9 20.769C4.02944 20.769 0 16.7396 0 11.769C0 8.43651 1.81178 5.52832 4.49927 3.97369C4.97733 3.69715 5.58906 3.86051 5.86561 4.33857Z"
      fill="black"
    />
  </svg>
);

const TopBarSideBar = ({
  t,
  stateInfo,
  userDetails,
  CITIZEN,
  cityDetails,
  mobileView,
  handleUserDropdownSelection,
  logoUrl,
  showSidebar = true,
  showLanguageChange,
  linkData,
  islinkDataLoading,
}) => {
  const [isSidebarOpen, toggleSidebar] = useState(false);
  const history = useHistory();
  const [showDialog, setShowDialog] = useState(false);
  const handleLogout = () => {
    toggleSidebar(false);
    setShowDialog(true);
  };
  const handleOnSubmit = async () => {
    try {
      await Digit.UserService.logoutUser(); // ✅ added await
      window.localStorage.clear();
      window.sessionStorage.clear();

      if (CITIZEN) {
        window.location.replace(`/${window?.contextPath}/citizen`);
      } else {
        window.location.replace(`/${window?.contextPath}/employee/user/language-selection`);
      }

      setShowDialog(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  const handleOnCancel = () => {
    setShowDialog(false);
  };
  const userProfile = () => {
    history.push(`/${window?.contextPath}/citizen/dristi/home/edit-profile`);
  };
  const employeeProfile = () => {
    history.push(`/${window?.contextPath}/employee/dristi/home/edit-profile`);
  };
  const userOptions = CITIZEN
    ? [
        { name: t("EDIT_PROFILE"), icon: <EditPencilIcon className="icon" />, func: userProfile },
        { name: t("CORE_COMMON_LOGOUT"), icon: <LogoutSvg className="icon" />, func: handleLogout },
      ]
    : [
        { name: t("EDIT_PROFILE"), icon: <EditPencilIcon className="icon" />, func: employeeProfile },
        { name: t("CORE_COMMON_LOGOUT"), icon: <LogoutSvg className="icon" />, func: handleLogout },
      ];
  return (
    <React.Fragment>
      <TopBar
        t={t}
        stateInfo={stateInfo}
        toggleSidebar={toggleSidebar}
        isSidebarOpen={isSidebarOpen}
        handleLogout={handleLogout}
        userDetails={userDetails}
        CITIZEN={CITIZEN}
        cityDetails={cityDetails}
        mobileView={mobileView}
        userOptions={userOptions}
        handleUserDropdownSelection={handleUserDropdownSelection}
        logoUrl={logoUrl}
        showLanguageChange={showLanguageChange}
      />
      {showDialog && <LogoutDialog onSelect={handleOnSubmit} onCancel={handleOnCancel} onDismiss={handleOnCancel}></LogoutDialog>}
      {/* {showSidebar && (
        <SideBar
          t={t}
          CITIZEN={CITIZEN}
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          handleLogout={handleLogout}
          mobileView={mobileView}
          userDetails={userDetails}
          linkData={linkData}
          islinkDataLoading={islinkDataLoading}
        />
      )} */}
    </React.Fragment>
  );
};
export default TopBarSideBar;
