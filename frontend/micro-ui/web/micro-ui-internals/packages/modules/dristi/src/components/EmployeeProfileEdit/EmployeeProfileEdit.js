import { CardLabel, LabelFieldPair, MobileNumber, TextInput, CardLabelError, Loader, SubmitBar } from "@egovernments/digit-ui-react-components";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import UploadDrawer from "../ImageUpload/UploadDrawer";
import CustomToast from "@egovernments/digit-ui-module-dristi/src/components/CustomToast";

const EmployeeProfileEdit = ({ stateCode, userType, cityDetails }) => {
  const { t } = useTranslation();
  const stateId = Digit.ULBService.getStateId();
  const tenant = Digit.ULBService.getCurrentTenantId();
  const userInfo = Digit.UserService.getUser()?.info || {};
  const [userDetails, setUserDetails] = useState(null);
  const [name, setName] = useState(userInfo?.name ? userInfo.name : "");
  const [mobileNumber, setMobileNo] = useState(userInfo?.mobileNumber ? userInfo.mobileNumber : "");
  const [profilePic, setProfilePic] = useState(null);
  const [openUploadSlide, setOpenUploadSide] = useState(false);
  const [changepassword, setChangepassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showToast, setShowToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [windowWidth, setWindowWidth] = React.useState(window.innerWidth);
  const [errors, setErrors] = React.useState({});
  const isMobile = window.Digit.Utils.browser.isMobile();

  const getUserInfo = async () => {
    const uuid = userInfo?.uuid;
    if (uuid) {
      const usersResponse = await Digit.UserService.userSearch(tenant, { uuid: [uuid] }, {});
      usersResponse && usersResponse.user && usersResponse.user.length && setUserDetails(usersResponse.user[0]);
    }
  };

  React.useEffect(() => {
    window.addEventListener("resize", () => setWindowWidth(window.innerWidth));
    return () => {
      window.removeEventListener("resize", () => setWindowWidth(window.innerWidth));
    };
  });

  useEffect(() => {
    setLoading(true);

    getUserInfo();

    setLoading(false);
  }, [userDetails !== null]);

  let validation = {};
  const editScreen = false; // To-do: Deubug and make me dynamic or remove if not needed
  const TogleforPassword = () => setChangepassword(!changepassword);
  const closeFileUploadDrawer = () => setOpenUploadSide(false);

  const setUserName = (value) => {
    setName(value);

    if (!new RegExp(/^[a-zA-Z ]+$/i).test(value) || value.length === 0 || value.length > 50) {
      setErrors({ ...errors, userName: { type: "pattern", message: "CORE_COMMON_PROFILE_NAME_INVALID" } });
    } else {
      setErrors({ ...errors, userName: null });
    }
  };

  const setUserMobileNumber = (value) => {
    setMobileNo(value);

    if (userType === "employee" && !new RegExp(/^[6-9]{1}[0-9]{9}$/).test(value)) {
      setErrors({ ...errors, mobileNumber: { type: "pattern", message: "CORE_COMMON_PROFILE_MOBILE_NUMBER_INVALID" } });
    } else {
      setErrors({ ...errors, mobileNumber: null });
    }
  };

  const setUserCurrentPassword = (value) => {
    setCurrentPassword(value);

    if (!new RegExp(/^([a-zA-Z0-9@#$%]{8,15})$/i).test(value)) {
      setErrors({ ...errors, currentPassword: { type: "pattern", message: "CORE_COMMON_PROFILE_PASSWORD_INVALID" } });
    } else {
      setErrors({ ...errors, currentPassword: null });
    }
  };

  const setUserNewPassword = (value) => {
    setNewPassword(value);

    if (!new RegExp(/^([a-zA-Z0-9@#$%]{8,15})$/i).test(value)) {
      setErrors({ ...errors, newPassword: { type: "pattern", message: "CORE_COMMON_PROFILE_PASSWORD_INVALID" } });
    } else {
      setErrors({ ...errors, newPassword: null });
    }
  };

  const setUserConfirmPassword = (value) => {
    setConfirmPassword(value);

    if (!new RegExp(/^([a-zA-Z0-9@#$%]{8,15})$/i).test(value)) {
      setErrors({ ...errors, confirmPassword: { type: "pattern", message: "CORE_COMMON_PROFILE_PASSWORD_INVALID" } });
    } else {
      setErrors({ ...errors, confirmPassword: null });
    }
  };

  const removeProfilePic = () => {
    setProfilePic(null);
  };

  const updateProfile = async () => {
    setLoading(true);
    try {
      const requestData = {
        ...userInfo,
        name,
        photo: profilePic,
      };

      if (!new RegExp(/^([a-zA-Z ])*$/).test(name) || name === "" || name.length > 50 || name.length < 1) {
        throw JSON.stringify({ type: "error", message: t("CORE_COMMON_PROFILE_NAME_INVALID") });
      }

      if (userType === "employee" && !new RegExp(/^[6-9]{1}[0-9]{9}$/).test(mobileNumber)) {
        throw JSON.stringify({ type: "error", message: t("CORE_COMMON_PROFILE_MOBILE_NUMBER_INVALID") });
      }

      if (changepassword && (currentPassword.length || newPassword.length || confirmPassword.length)) {
        if (newPassword !== confirmPassword) {
          throw JSON.stringify({ type: "error", message: t("CORE_COMMON_PROFILE_PASSWORD_MISMATCH") });
        }

        if (!(currentPassword.length && newPassword.length && confirmPassword.length)) {
          throw JSON.stringify({ type: "error", message: t("CORE_COMMON_PROFILE_PASSWORD_INVALID") });
        }

        if (!new RegExp(/^([a-zA-Z0-9@#$%]{8,15})$/i).test(newPassword) && !new RegExp(/^([a-zA-Z0-9@#$%]{8,15})$/i).test(confirmPassword)) {
          throw JSON.stringify({ type: "error", message: t("CORE_COMMON_PROFILE_PASSWORD_INVALID") });
        }
      }

      const { responseInfo, user } = await Digit.UserService.updateUser(requestData, stateCode);

      if (responseInfo && responseInfo.status === "200") {
        const user = Digit.UserService.getUser();

        if (user) {
          Digit.UserService.setUser({
            ...user,
            info: {
              ...user.info,
              name,
              mobileNumber,
            },
          });
        }
      }

      if (currentPassword.length && newPassword.length && confirmPassword.length) {
        const requestData = {
          existingPassword: currentPassword,
          newPassword: newPassword,
          tenantId: tenant,
          type: "EMPLOYEE",
          username: userInfo?.userName,
          confirmPassword: confirmPassword,
        };

        if (newPassword === confirmPassword) {
          try {
            const res = await Digit.UserService.changePassword(requestData, tenant);

            const { responseInfo: changePasswordResponseInfo } = res;
            if (changePasswordResponseInfo?.status && changePasswordResponseInfo.status === "200") {
              setShowToast({ label: t("CORE_COMMON_PROFILE_UPDATE_SUCCESS_WITH_PASSWORD"), error: false });
              setTimeout(() => Digit.UserService.logout(), 2000);
            } else {
              throw "";
            }
          } catch (error) {
            throw JSON.stringify({
              type: "error",
              message: error.Errors?.at(0)?.description ? error.Errors.at(0).description : "CORE_COMMON_PROFILE_UPDATE_ERROR_WITH_PASSWORD",
            });
          }
        } else {
          throw JSON.stringify({ type: "error", message: "CORE_COMMON_PROFILE_ERROR_PASSWORD_NOT_MATCH" });
        }
      } else if (responseInfo?.status && responseInfo.status === "200") {
        setShowToast({ label: t("CORE_COMMON_PROFILE_UPDATE_SUCCESS"), error: false });
      }
    } catch (error) {
      const errorObj = JSON.parse(error);
      const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
      setShowToast({ label: t(errorObj.message), error: true, errorId });
    }

    setLoading(false);
  };

  let menu = [];
  const { data: Menu } = Digit.Hooks.useGenderMDMS(stateId, "common-masters", "GenderType");
  Menu &&
    Menu.map((genderDetails) => {
      menu.push({ i18nKey: `PT_COMMON_GENDER_${genderDetails.code}`, code: `${genderDetails.code}`, value: `${genderDetails.code}` });
    });

  const setFileStoreId = async (fileStoreId) => {
    setProfilePic(fileStoreId);
    closeFileUploadDrawer();
  };

  if (loading) return <Loader></Loader>;

  return (
    <div className="user-profile">
      <div
        style={{
          display: "flex",
          flex: 1,
          flexDirection: windowWidth < 768 || userType === "citizen" ? "column" : "row",
          margin: userType === "citizen" ? "8px" : "16px",
          gap: userType === "citizen" ? "" : "0 24px",
          boxShadow: userType === "citizen" ? "1px 1px 4px 0px rgba(0,0,0,0.2)" : "",
          background: userType === "citizen" ? "white" : "",
          borderRadius: userType === "citizen" ? "4px" : "",
          maxWidth: userType === "citizen" ? "960px" : "",
        }}
      >
        {/* <section
          style={{
            position: "relative",
            display: "flex",
            flex: userType === "citizen" ? 1 : 2.5,
            justifyContent: "center",
            alignItems: "center",
            maxWidth: "100%",
            height: "376px",
            borderRadius: "4px",
            boxShadow: userType === "citizen" ? "" : "1px 1px 4px 0px rgba(0,0,0,0.2)",
            border: `${userType === "citizen" ? "8px" : "24px"} solid #fff`,
            background: "#EEEEEE",
            padding: userType === "citizen" ? "8px" : "16px",
          }}
        >
          <div
            style={{
              position: "relative",
              height: userType === "citizen" ? "114px" : "150px",
              width: userType === "citizen" ? "114px" : "150px",
              margin: "16px",
            }}
          >
            <img
              style={{
                margin: "auto",
                borderRadius: "300px",
                justifyContent: "center",
                height: "100%",
                width: "100%",
              }}
              src={!profileImg || profileImg === "" ? defaultImage : profileImg}
            />
            <button style={{ position: "absolute", left: "50%", bottom: "-24px", transform: "translateX(-50%)" }} onClick={onClickAddPic}>
              <CameraIcon />
            </button>
          </div>
        </section> */}
        <section
          style={{
            display: "flex",
            flexDirection: "column",
            flex: userType === "citizen" ? 1 : 7.5,
            width: "100%",
            borderRadius: "4px",
            height: "fit-content",
            boxShadow: userType === "citizen" ? "" : "1px 1px 4px 0px rgba(0,0,0,0.2)",
            background: "white",
            padding: userType === "citizen" ? "8px" : "24px",
            paddingBottom: "20px",
          }}
        >
          {userType === "citizen" ? (
            <React.Fragment>
              <LabelFieldPair>
                <CardLabel
                  style={
                    editScreen
                      ? { color: "#B1B4B6", width: "300px", fontSize: "16px", fontWeight: "700" }
                      : { width: "300px", fontSize: "16px", fontWeight: "700" }
                  }
                >
                  {`${t("CORE_COMMON_PROFILE_NAME")}`}*
                </CardLabel>
                <div style={{ width: "100%", maxWidth: "960px" }}>
                  <TextInput
                    t={t}
                    style={{ width: "100%" }}
                    type={"text"}
                    isMandatory={false}
                    name="name"
                    value={name}
                    onChange={(e) => setUserName(e.target.value)}
                    {...(validation = {
                      isRequired: true,
                      pattern: "^[a-zA-Z-.`' ]*$",
                      type: "tel",
                      title: t("CORE_COMMON_PROFILE_NAME_ERROR_MESSAGE"),
                    })}
                    disable={editScreen || true}
                  />
                  {errors?.userName && <CardLabelError> {t(errors?.userName?.message)} </CardLabelError>}
                </div>
              </LabelFieldPair>

              <button
                onClick={updateProfile}
                style={{
                  marginTop: "24px",
                  backgroundColor: "#F47738",
                  width: "100%",
                  height: "40px",
                  color: "white",

                  maxWidth: isMobile ? "100%" : "240px",
                  borderBottom: "1px solid black",
                }}
              >
                {t("CORE_COMMON_SAVE")}
              </button>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <LabelFieldPair style={{ display: "flex" }}>
                <CardLabel
                  className="profile-label-margin"
                  style={
                    editScreen
                      ? { color: "#B1B4B6", width: "300px", fontSize: "16px", fontWeight: "700" }
                      : { width: "300px", fontSize: "16px", fontWeight: "700" }
                  }
                >
                  {`${t("CORE_COMMON_PROFILE_NAME")}`}*
                </CardLabel>
                <div style={{ width: "100%" }}>
                  <TextInput
                    t={t}
                    type={"text"}
                    isMandatory={false}
                    name="name"
                    value={name}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Enter Your Name"
                    {...(validation = {
                      isRequired: true,
                      pattern: "^[a-zA-Z-.`' ]*$",
                      type: "text",
                      title: t("CORE_COMMON_PROFILE_NAME_ERROR_MESSAGE"),
                    })}
                    disable={editScreen || true}
                  />
                  {errors?.userName && <CardLabelError style={{ margin: 0, padding: 0 }}> {t(errors?.userName?.message)} </CardLabelError>}
                </div>
              </LabelFieldPair>

              <LabelFieldPair style={{ display: "flex" }}>
                <CardLabel
                  className="profile-label-margin"
                  style={
                    editScreen
                      ? { color: "#B1B4B6", width: "300px", fontSize: "16px", fontWeight: "700" }
                      : { width: "300px", fontSize: "16px", fontWeight: "700" }
                  }
                >{`${t("CORE_COMMON_PROFILE_MOBILE_NUMBER")}*`}</CardLabel>
                <div style={{ width: "100%" }}>
                  <MobileNumber
                    value={mobileNumber}
                    style={{ width: "100%" }}
                    name="mobileNumber"
                    placeholder="Enter a valid Mobile No."
                    onChange={(value) => setUserMobileNumber(value)}
                    disable={true}
                    {...{ required: true, pattern: "[6-9]{1}[0-9]{9}", type: "tel", title: t("CORE_COMMON_PROFILE_MOBILE_NUMBER_INVALID") }}
                  />
                  {errors?.mobileNumber && <CardLabelError style={{ margin: 0, padding: 0 }}> {t(errors?.mobileNumber?.message)} </CardLabelError>}
                </div>
              </LabelFieldPair>

              <LabelFieldPair>
                <div>
                  <a style={{ color: "orange", cursor: "default", marginBottom: "5", cursor: "pointer" }} onClick={TogleforPassword}>
                    {t("CORE_COMMON_CHANGE_PASSWORD")}
                  </a>
                  {changepassword ? (
                    <div style={{ marginTop: "10px" }}>
                      <LabelFieldPair style={{ display: "flex" }}>
                        <CardLabel
                          className="profile-label-margin"
                          style={
                            editScreen
                              ? { color: "#B1B4B6", width: "300px", fontSize: "16px", fontWeight: "700" }
                              : { width: "300px", fontSize: "16px", fontWeight: "700" }
                          }
                        >{`${t("CORE_COMMON_PROFILE_CURRENT_PASSWORD")}`}</CardLabel>
                        <div style={{ width: "100%" }}>
                          <TextInput
                            t={t}
                            type={"password"}
                            isMandatory={false}
                            name="name"
                            pattern="^([a-zA-Z0-9@#$%])+$"
                            onChange={(e) => setUserCurrentPassword(e.target.value)}
                            disable={editScreen}
                          />
                          {errors?.currentPassword && <CardLabelError>{t(errors?.currentPassword?.message)}</CardLabelError>}
                        </div>
                      </LabelFieldPair>

                      <LabelFieldPair style={{ display: "flex" }}>
                        <CardLabel
                          className="profile-label-margin"
                          style={
                            editScreen
                              ? { color: "#B1B4B6", width: "300px", fontSize: "16px", fontWeight: "700" }
                              : { width: "300px", fontSize: "16px", fontWeight: "700" }
                          }
                        >{`${t("CORE_COMMON_PROFILE_NEW_PASSWORD")}`}</CardLabel>
                        <div style={{ width: "100%" }}>
                          <TextInput
                            t={t}
                            type={"password"}
                            isMandatory={false}
                            name="name"
                            pattern="^([a-zA-Z0-9@#$%])+$"
                            onChange={(e) => setUserNewPassword(e.target.value)}
                            disable={editScreen}
                          />
                          {errors?.newPassword && <CardLabelError>{t(errors?.newPassword?.message)}</CardLabelError>}
                        </div>
                      </LabelFieldPair>

                      <LabelFieldPair style={{ display: "flex" }}>
                        <CardLabel
                          className="profile-label-margin"
                          style={
                            editScreen
                              ? { color: "#B1B4B6", width: "300px", fontSize: "16px", fontWeight: "700" }
                              : { width: "300px", fontSize: "16px", fontWeight: "700" }
                          }
                        >{`${t("CORE_COMMON_PROFILE_CONFIRM_PASSWORD")}`}</CardLabel>
                        <div style={{ width: "100%" }}>
                          <TextInput
                            t={t}
                            type={"password"}
                            isMandatory={false}
                            name="name"
                            pattern="^([a-zA-Z0-9@#$%])+$"
                            onChange={(e) => setUserConfirmPassword(e.target.value)}
                            disable={editScreen}
                          />
                          {errors?.confirmPassword && <CardLabelError>{t(errors?.confirmPassword?.message)}</CardLabelError>}
                        </div>
                      </LabelFieldPair>
                    </div>
                  ) : (
                    ""
                  )}
                </div>
              </LabelFieldPair>
            </React.Fragment>
          )}
        </section>
      </div>

      <div className="action-bar-wrap">
        <SubmitBar t={t} label={t("CORE_COMMON_SAVE")} onSubmit={updateProfile} />
        {/* <button
              onClick={updateProfile}
              style={{
                marginTop: "24px",
                backgroundColor: "#F47738",
                width: windowWidth < 768 ? "100%" : "248px",
                height: "40px",
                float: "right",
                margin: windowWidth < 768 ? "0 16px" : "",
                marginRight: windowWidth < 768 ? "16px" : "31px",
                color: "white",
                borderBottom: "1px solid black",
              }}
            >
              {t("CORE_COMMON_SAVE")}
            </button> */}
      </div>
      {showToast && (
        <CustomToast
          error={showToast?.error}
          label={showToast?.label}
          errorId={showToast?.errorId}
          onClose={() => setShowToast(null)}
          duration={showToast?.errorId ? 7000 : 5000}
        />
      )}

      {openUploadSlide === true ? (
        <UploadDrawer
          setProfilePic={setFileStoreId}
          closeDrawer={closeFileUploadDrawer}
          userType={userType}
          removeProfilePic={removeProfilePic}
          setShowToast={setShowToast}
        />
      ) : (
        ""
      )}
    </div>
  );
};

export default EmployeeProfileEdit;
