import { CardLabel, CardLabelError, CardText, CloseSvg } from "@egovernments/digit-ui-react-components";
import React, { Fragment, useCallback, useEffect, useState } from "react";
import useInterval from "../../../hooks/useInterval";
import OTPInput from "../../../components/OTPInput";
import FormStep from "../../../components/FormStep";
import { useHistory, useLocation } from "react-router-dom/cjs/react-router-dom.min";
import { CloseIconWhite } from "../../../icons/svgIndex";
import Modal from "../../../components/Modal";
import { maskEmail } from "../../../Utils";

const SelectOtp = ({
  config,
  otp,
  onOtpChange,
  onResend,
  onSelect,
  t,
  error,
  userType = "citizen",
  canSubmit,
  params,
  setParams,
  path,
  isAdhaar,
  cardText,
  mobileNumber,
  setState,
}) => {
  const history = useHistory();
  const location = useLocation();
  const token = window.localStorage.getItem("token");
  const isUserLoggedIn = Boolean(token);
  const [timeLeft, setTimeLeft] = useState(25);
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const [user, setUser] = useState(null);

  const handleKeyDown = (e) => {
    e.stopPropagation();
    if (e.key === "Enter" && otp?.length === 6 && canSubmit) {
      onSelect();
    }
  };

  const setUserDetails = async () => {
    if (!user) {
      const {
        user: [user],
      } = await Digit.UserService.userSearch(tenantId, { mobileNumber: mobileNumber }, {});
      setUser(user);
    }
  };

  useEffect(() => {
    setUserDetails();
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [otp]);

  useInterval(
    () => {
      setTimeLeft(timeLeft - 1);
    },
    timeLeft > 0 ? 1000 : null
  );

  const handleResendOtp = () => {
    onResend();
    setTimeLeft(25);
  };
  const onCancel = () => {
    setState((prev) => ({
      ...prev,
      showOtpModal: false,
    }));
    setParams({
      ...params,
      otp: "",
      aadharOtp: "",
      adhaarNumber: "",
    });
  };
  const Heading = (props) => {
    return (
      <h1 style={{ display: "flex", alignItems: "center", justifyContent: "flex-start" }} className="heading-m">
        {props.label}
      </h1>
    );
  };
  const CloseBtn = (props) => {
    return (
      <div onClick={props?.onClick} style={props?.isMobileView ? { padding: 5 } : null}>
        {props?.isMobileView ? (
          <CloseSvg />
        ) : (
          <div className={"icon-bg-secondary"} style={{ backgroundColor: "#505A5F" }}>
            {" "}
            <CloseIconWhite />{" "}
          </div>
        )}
      </div>
    );
  };

  if (userType === "employee") {
    return (
      <Fragment>
        <div style={{ width: "200px" }}>
          <OTPInput length={6} onChange={onOtpChange} value={otp} />
        </div>
        {timeLeft > 0 ? (
          <CardText>
            <span style={{ backgroundColor: "#fff" }}>{`${t("CS_RESEND_ANOTHER_OTP")} ${timeLeft} ${t("CS_RESEND_SECONDS")}`}</span>
          </CardText>
        ) : (
          <p className="card-text-button resend-otp" onClick={handleResendOtp}>
            {t("CS_RESEND_OTP")}
          </p>
        )}
        {error && <CardLabelError>{error}</CardLabelError>}
      </Fragment>
    );
  }

  const onModalSubmit = () => {
    onSelect();
  };

  return (
    <Modal
      headerBarEnd={<CloseBtn onClick={onCancel} isMobileView={false} />}
      actionSaveLabel={t("VERIFY")}
      actionSaveOnSubmit={onModalSubmit}
      isDisabled={!(otp?.length === 6 && canSubmit)}
      formId="modal-action"
      headerBarMain={
        <React.Fragment>
          <Heading label={isAdhaar ? t("Verify_Otp_Aadhaar") : t("Verify_Otp_MOBILE")} />
          <CardText>
            {isAdhaar
              ? t("ENTER_OTP_TO_THE_REGISTERED_AADHAR_NO")
              : `${cardText}${mobileNumber ? " +91******" + mobileNumber.slice(-4) : ""}${user?.emailId ? ` and ${maskEmail(user?.emailId)}` : ""}`}
          </CardText>
        </React.Fragment>
      }
      className={"otp-modal-class"}
    >
      <FormStep
        onSelect={onSelect}
        config={config}
        t={t}
        isDisabled={!(otp?.length === 6 && canSubmit)}
        cardStyle={{ minWidth: "100%", alignItems: "center" }}
      >
        <OTPInput length={6} onChange={onOtpChange} value={otp} />
        <div className="message">
          <p>
            {timeLeft > 0 ? <span className="time-left">{`${t("CS_RESEND_ANOTHER_OTP")} ${timeLeft} ${t("CS_RESEND_SECONDS")}`} </span> : ""}
            <span className={`resend-link ${timeLeft > 0 ? "disabled" : ""}`} onClick={handleResendOtp}>
              {t("CS_RESEND_OTP")}
            </span>
          </p>
        </div>
        {error && <CardLabelError>{error}</CardLabelError>}
      </FormStep>
    </Modal>
  );
};

export default SelectOtp;
