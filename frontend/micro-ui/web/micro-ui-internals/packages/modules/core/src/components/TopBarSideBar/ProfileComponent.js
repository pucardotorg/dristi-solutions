import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import ChangeLanguage from "@egovernments/digit-ui-module-core/src/components/ChangeLanguage";
import { useHistory } from "react-router-dom/cjs/react-router-dom";

const ProfileComponent = ({ userDetails, userOptions, handleUserDropdownSelection, profilePic, TextToImg, onLogout }) => {
  const EditProfileIcon = window?.Digit?.ComponentRegistryService?.getComponent("EditProfileIcon");
  const SelectLanguage = window?.Digit?.ComponentRegistryService?.getComponent("SelectLanguage");
  const LogoutIcon = window?.Digit?.ComponentRegistryService?.getComponent("LogoutIcon");
  const TriangleIcon = window?.Digit?.ComponentRegistryService?.getComponent("TriangleIcon");
  const { t } = useTranslation();
  const history = useHistory();
  const [showModal, setShowModal] = useState(false);
  const isEmployee = window.location.href.includes("/employee");
  const showProfilePage = () => {
    const redirectUrl = isEmployee
      ? `/${window?.contextPath}/employee/dristi/home/edit-profile`
      : `/${window?.contextPath}/citizen/dristi/home/edit-profile`;
    history.push(redirectUrl);
    setShowModal(false);
  };

  const toggleModal = () => {
    setShowModal(!showModal);
  };

  const handleClickOutside = (event) => {
    if (event.target.closest(".profile-component") === null) {
      setShowModal(false);
    }
  };

  useEffect(() => {
    if (showModal) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showModal]);

  const handleSelection = (option) => {
    if (option.name === "Logout") {
      onLogout();
    } else {
      showProfilePage();
    }
    setShowModal(false);
  };

  const getUserRole = () => {
    const roles = userDetails?.info?.roles || [];
    if (roles.some((role) => role.code === "ADVOCATE_ROLE")) {
      return t("ADVOCATE");
    }
    if (roles.some((role) => role.code === "ADVOCATE_CLERK_ROLE")) {
      return t("ADVOCATE_CLERK");
    }
    return t("LITIGANT");
  };
  const userRole = getUserRole();
  const showDefaultRole = userDetails?.info?.roles.length !== 1 && userRole;
  return (
    <div className="profile-component">
      <div onClick={toggleModal}>
        {profilePic == null ? (
          <TextToImg name={userDetails?.info?.name || userDetails?.info?.userInfo?.name || "Citizen"} />
        ) : (
          <img src={profilePic} alt="profile" />
        )}
      </div>
      {showModal && (
        <div className="profile-modal">
          <div className="triangle-icon">
            <TriangleIcon />
          </div>
          <div className="profile-header">
            <div className="profile-name">{userDetails?.info?.name}</div>
            <div className="user-type">{showDefaultRole ? `${userRole} | ${userDetails?.info?.mobileNumber}` : userDetails?.info?.mobileNumber}</div>
          </div>
          <div className="profile-options">
            <div className="edit-profile" onClick={() => handleSelection({ name: "Edit Profile" })}>
              <span role="img" aria-label="edit" s className="edit-profile-icon">
                <EditProfileIcon />
              </span>
              {t("EDIT_PROFILE")}
            </div>
            <div className="language-selection">
              <div className="language-select-icon">
                <span role="img" aria-label="language" className="language-icon">
                  <SelectLanguage />
                </span>
                {t("CS_COMMON_LANGUAGE")}
              </div>
              {<ChangeLanguage isProfileComponent={true} dropdown={true} dropdownClassName="cp-class" />}
            </div>
          </div>
          <div className="logout-options">
            <div className="logout" onClick={() => handleSelection({ name: "Logout" })}>
              <div className="logout-icon-text">
                <span className="logout-icon" role="img" aria-label="language">
                  <LogoutIcon />
                </span>
                {t("CORE_COMMON_LOGOUT")}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

ProfileComponent.propTypes = {
  userDetails: PropTypes.object.isRequired,
  userOptions: PropTypes.array.isRequired,
  handleUserDropdownSelection: PropTypes.func.isRequired,
  profilePic: PropTypes.string,
  TextToImg: PropTypes.func.isRequired,
};

ProfileComponent.defaultProps = {
  profilePic: null,
};

export default ProfileComponent;
