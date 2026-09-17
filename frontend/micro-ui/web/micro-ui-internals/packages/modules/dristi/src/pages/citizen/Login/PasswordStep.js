import React from "react";
import { Card, CardHeader, CardText, CardLabelError, SubmitBar, BackButton } from "@egovernments/digit-ui-react-components";
import PasswordInput from "../../../components/PasswordInput";

const PasswordStep = ({ t, mobileNumber, password, onPasswordChange, onSelect, canSubmit, error, onBack, onSwitchToOtp }) => {
  const isValid = password?.length >= 8;

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && isValid && canSubmit) {
      onSelect();
    }
  };

  return (
    <div className="login-form" onKeyDown={handleKeyDown}>
      <BackButton onClick={onBack} />
      <Card>
        <CardHeader>{t("CS_ENTER_PASSWORD_HEADING")}</CardHeader>
        <CardText>{t("CS_ENTER_PASSWORD_SUBTEXT")}</CardText>
        <CardText style={{ paddingBottom: "25px", textAlign: "left" }}>
          <b>{`+91 ${mobileNumber}`}</b>{" "}
          <span className="link" style={{ cursor: "pointer", marginLeft: "8px" }} onClick={onBack}>
            {t("CS_COMMON_CHANGE")}
          </span>
        </CardText>
        <PasswordInput
          t={t}
          label="CS_PASSWORD"
          placeholder="CS_ENTER_PASSWORD"
          value={password}
          onChange={onPasswordChange}
          autoComplete="current-password"
        />
        {error && <CardLabelError>{error}</CardLabelError>}
        <SubmitBar label={t("CS_COMMON_SIGN_IN")} onSubmit={onSelect} disabled={!isValid || !canSubmit} />
        <div style={{ marginTop: "12px", textAlign: "center" }}>
          <span className="link" style={{ cursor: "pointer", textDecoration: "underline" }} onClick={onSwitchToOtp}>
            {t("CS_FORGOT_PASSWORD_LOGIN_WITH_OTP")}
          </span>
        </div>
      </Card>
    </div>
  );
};

export default PasswordStep;
