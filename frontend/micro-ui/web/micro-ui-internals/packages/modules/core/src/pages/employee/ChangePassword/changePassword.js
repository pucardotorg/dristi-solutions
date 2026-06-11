import { BackButton, CardSubHeader, CardText, Toast } from "@egovernments/digit-ui-react-components";
import { FormComposer } from "../../../components/FormComposer";
import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import Background from "../../../components/Background";
import Header from "../../../components/Header";
import SelectOtp from "../../citizen/Login/SelectOtp";


const ChangePasswordComponent = ({ config: propsConfig, t }) => {
  const [user] = useState(null);
  const { mobile_number: mobileNumber, tenantId } = Digit.Hooks.useQueryParams();
  const history = useHistory();
  const [otp, setOtp] = useState("");
  const [isOtpValid] = useState(true);
  const [showToast, setShowToast] = useState(null);
  const getUserType = () => Digit.UserService.getType();
  useEffect(() => {
    if (!user) {
      Digit.UserService.setType("employee");
      return;
    }
    Digit.UserService.setUser(user);
    const redirectPath = location.state?.from || `/${window?.contextPath}/employee`;
    history.replace(redirectPath);
  }, [user]);

  const closeToast = () => {
    setShowToast(null);
  };

  const onResendOTP = async () => {
    const requestData = {
      otp: {
        mobileNumber,
        userType: getUserType().toUpperCase(),
        type: "passwordreset",
        tenantId,
      },
    };

    try {
      await Digit.UserService.sendOtp(requestData, tenantId);
      setShowToast(t("ES_OTP_RESEND"));
    } catch (err) {
      setShowToast(err?.response?.data?.error_description || t("ES_INVALID_LOGIN_CREDENTIALS"));
    }
    setTimeout(closeToast, 5000);
  };

  const navigateToLogin = () => {
    history.replace(`/${window?.contextPath}/employee/user/login`);
  };

  const onChangePassword = async (data) => {
    try {
      if (data.newPassword !== data.confirmPassword) {
        return setShowToast(t("ERR_PASSWORD_DO_NOT_MATCH"));
      }
      const requestData = {
        ...data,
        otpReference: otp,
        tenantId,
        type: getUserType().toUpperCase(),
      };

      await Digit.UserService.changePassword(requestData, tenantId);
      navigateToLogin();
    } catch (err) {
      setShowToast(err?.response?.data?.error?.fields?.[0]?.message || t("ES_SOMETHING_WRONG"));
      setTimeout(closeToast, 5000);
    }
  };

  const [username, password, confirmPassword] = propsConfig.inputs;
  const config = [
    {
      body: [
        {
          label: t(username.label),
          type: username.type,
          populators: { name: username.name },
          isMandatory: true,
        },
        {
          label: t(password.label),
          type: password.type,
          populators: { name: password.name },
          isMandatory: true,
        },
        {
          label: t(confirmPassword.label),
          type: confirmPassword.type,
          populators: { name: confirmPassword.name },
          isMandatory: true,
        },
      ],
    },
  ];

  const otpLoginText = t("CS_LOGIN_OTP_TEXT");
  const phonePrefix = t("+ 91 - ");

  return (
    <Background>
      <div className="employeeBackbuttonAlign">
        <BackButton variant="white" style={{ borderBottom: "none" }} />
      </div>
      <FormComposer
        onSubmit={onChangePassword}
        noBoxShadow
        inline
        submitInForm
        config={config}
        label={propsConfig.texts.submitButtonLabel}
        cardStyle={{ maxWidth: "408px", margin: "auto" }}
        className="employeeChangePassword"
      >
        <Header />
        <CardSubHeader style={{ textAlign: "center" }}> {propsConfig.texts.header} </CardSubHeader>
        <CardText>
          {`${otpLoginText} `}
          <b>
            {" "}
            {phonePrefix} {mobileNumber}
          </b>
        </CardText>
        <SelectOtp t={t} userType="employee" otp={otp} onOtpChange={setOtp} error={isOtpValid} onResend={onResendOTP} />
      </FormComposer>
      {showToast && <Toast error={true} label={t(showToast)} onClose={closeToast} />}
    </Background>
  );
};

ChangePasswordComponent.propTypes = {
  config: PropTypes.shape({
    inputs: PropTypes.array,
    texts: PropTypes.shape({
      submitButtonLabel: PropTypes.string,
      header: PropTypes.string,
    }),
  }),
  t: PropTypes.func.isRequired,
};

export default ChangePasswordComponent;
