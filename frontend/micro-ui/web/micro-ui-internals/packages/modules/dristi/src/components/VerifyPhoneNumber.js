import { CardLabelError, CardText } from "@egovernments/digit-ui-components";
import { CardLabel, CloseSvg, LabelFieldPair, TextInput } from "@egovernments/digit-ui-react-components";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { verifyMobileNoConfig } from "../configs/component";
import useInterval from "../hooks/useInterval";
import { InfoIconRed } from "../icons/svgIndex";
import { DRISTIService } from "../services";
import Button from "./Button";
import Modal from "./Modal";
import OTPInput from "./OTPInput";
import { maskEmail } from "../Utils";
const TYPE_REGISTER = { type: "register" };
const TYPE_LOGIN = { type: "login" };
const DEFAULT_USER = "digit-user";

const RoundedCheck = ({ className, height = "24", width = "24", style = {}, fill = "green", onClick = null }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" height={height} width={width} viewBox="0 0 24 24" fill={fill} className={className}>
      <path d="M0 0h24v24H0V0z" fill="none" />
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM9.29 16.29L5.7 12.7c-.39-.39-.39-1.02 0-1.41.39-.39 1.02-.39 1.41 0L10 14.17l6.88-6.88c.39-.39 1.02-.39 1.41 0 .39.39.39 1.02 0 1.41l-7.59 7.59c-.38.39-1.02.39-1.41 0z" />
    </svg>
  );
};

const CloseBtn = (props) => {
  return (
    <div onClick={props?.onClick} style={{ height: "100%", display: "flex", alignItems: "center", paddingRight: "20px", cursor: "pointer" }}>
      <CloseSvg />
    </div>
  );
};

const Heading = (props) => {
  return <h1 className="heading-m">{props.label}</h1>;
};

function VerifyPhoneNumber({ t, config, onSelect, formData = {}, errors, setError }) {
  const [{ showModal, mobileNumber, isUserVerified, errorMsg }, setState] = useState({
    showModal: false,
    mobileNumber: null,
    isUserVerified: false,
    errorMsg: "",
  });
  const isUserVerifiedRef = useRef(isUserVerified);

  useEffect(() => {
    isUserVerifiedRef.current = isUserVerified;
  }, [isUserVerified]);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isUserRegistered, setIsUserRegistered] = useState(true);
  const [timeLeft, setTimeLeft] = useState(10);
  const getUserType = () => window?.Digit.UserService.getType();
  const stateCode = window?.Digit.ULBService.getStateId();
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const [user, setUser] = useState(null);

  useInterval(
    () => {
      if (showModal) setTimeLeft(timeLeft - 1);
    },
    timeLeft > 0 ? 1000 : null
  );

  const input = useMemo(() => verifyMobileNoConfig?.[0]?.body?.[0]?.populators?.inputs?.[0], []);

  const setUserDetails = async () => {
    const number = formData[config.key]?.[input?.mobileNoKey] || mobileNumber;
    if (number) {
      const {
        user: [user],
      } = await Digit.UserService.userSearch(tenantId, { mobileNumber: number }, {});
      setUser(user);
    }
  };

  const otp = useMemo(() => formData[config.key]?.[input?.name], [formData[config.key]?.[input?.name]]);

  const sendOtp = async (data) => {
    try {
      const res = await window?.Digit.UserService.sendOtp(data, stateCode);
      return [res, null];
    } catch (err) {
      return [null, err];
    }
  };

  const modalOnSubmit = () => {
    if (!otp)
      setState((prev) => ({
        ...prev,
        isUserVerified: false,
        showModal: true,
        errorMsg: "CS_INVALID_OTP",
      }));
    else selectOtp(input);
  };

  const onConfirmClick = async () => {
    const data = {
      mobileNumber: formData?.[config.key]?.[config.name],
      tenantId: stateCode,
      userType: getUserType(),
    };
    const [res, err] = await sendOtp({ otp: { ...data, name: DEFAULT_USER, ...TYPE_REGISTER } });

    setShowConfirmModal(false);
    setState((prev) => ({
      ...prev,
      showModal: true,
      mobileNumber: null,
    }));
    setTimeLeft(10);
  };

  const handleKeyDown = useCallback(
    (e) => {
      e.stopPropagation();
      if (e.key === "Enter" && otp?.length === 6 && showModal) {
        modalOnSubmit();
      } else if (e.key === "Enter" && showConfirmModal) {
        onConfirmClick();
      }
    },
    [otp?.length, showConfirmModal, showModal]
  );

  useEffect(() => {
    setUserDetails();
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown, otp]);

  const selectMobileNumber = async () => {
    const data = {
      mobileNumber: formData?.[config.key]?.[config.name],
      tenantId: stateCode,
      userType: getUserType(),
    };
    const [res, err] = await sendOtp({ otp: { ...data, ...TYPE_LOGIN } });
    if (!err) {
      setState((prev) => ({
        ...prev,
        showModal: true,
        mobileNumber: null,
      }));
      setTimeLeft(10);
      return;
    } else {
      setIsUserRegistered(false);
      if (config?.confirmModal) {
        if (config?.requiredFields) {
          let requiredFieldsValidation = false;
          for (const field of config.requiredFields) {
            if (!Boolean(formData?.[field])) {
              setError(field, { message: "FIRST_LAST_NAME_MANDATORY_MESSAGE" });
              requiredFieldsValidation = true;
            }
          }
          if (requiredFieldsValidation) return;
          else setShowConfirmModal(true);
        } else {
          setShowConfirmModal(true);
        }
      } else {
        const [res, err] = await sendOtp({ otp: { ...data, name: DEFAULT_USER, ...TYPE_REGISTER } });

        setState((prev) => ({
          ...prev,
          showModal: true,
          mobileNumber: null,
        }));
        setTimeLeft(10);
      }
    }
  };

  const handleCloseModal = () => {
    setState((prev) => ({
      ...prev,
      showModal: false,
      errorMsg: "",
    }));
    onSelect(config?.key, { ...formData?.[config.key], otpNumber: "" });
  };

  const resendOtp = async (input) => {
    const data = {
      mobileNumber: formData[config.key]?.[input?.mobileNoKey],
      tenantId: stateCode,
      userType: getUserType(),
    };
    setState((prev) => ({
      ...prev,
      errorMsg: "",
    }));
    const [res, err] = await sendOtp({ otp: { ...data, ...TYPE_LOGIN } });
    setTimeLeft(10);
    if (!err) {
      return;
    } else {
      const [res, err] = await sendOtp({ otp: { ...data, name: DEFAULT_USER, ...TYPE_REGISTER } });
      setTimeLeft(10);
      return;
    }
  };

  const searchIndividualUser = (info, tokens) => {
    DRISTIService.searchIndividualUser(
      {
        Individual: {
          userUuid: [info?.uuid],
        },
      },
      { tenantId: stateCode, limit: 10, offset: 0 }
    )
      .then((individualData) => {
        if (Array.isArray(individualData?.Individual) && individualData?.Individual?.length > 0) {
          let permanentAddress;
          const addressArray = individualData?.Individual?.[0]?.address;
          if(addressArray?.length > 1) {
            permanentAddress = addressArray?.find((address) => address?.type === "PERMANENT");
          }else{
            permanentAddress = addressArray?.[0];
          }

          const addressLine1 = permanentAddress?.addressLine1 || "Telangana";
          const addressLine2 = permanentAddress?.addressLine2 || "Rangareddy";
          const buildingName = permanentAddress?.buildingName || "";
          const street = permanentAddress?.street || "";
          const city = permanentAddress?.city || "";
          const pincode = permanentAddress?.pincode || "";
          const latitude = permanentAddress?.latitude || "";
          const longitude = permanentAddress?.longitude || "";
          const doorNo = permanentAddress?.doorNo || "";
          const idType = individualData?.Individual?.[0]?.identifiers[0]?.identifierType || "";
          const identifierIdDetails = JSON.parse(
            individualData?.Individual?.[0]?.additionalFields?.fields?.find((obj) => obj.key === "identifierIdDetails")?.value || "{}"
          );
          const address = `${doorNo ? doorNo + "," : ""} ${buildingName ? buildingName + "," : ""} ${street}`.trim();

          const givenName = individualData?.Individual?.[0]?.name?.givenName || "";
          const otherNames = individualData?.Individual?.[0]?.name?.otherNames || "";
          const familyName = individualData?.Individual?.[0]?.name?.familyName || "";

          const data = {
            "addressDetails-select": {
              pincode: pincode,
              district: addressLine2,
              city: city,
              state: addressLine1,
              coordinates: {
                longitude: longitude,
                latitude: latitude,
              },
              locality: address,
            },
            firstName: givenName,
            lastName: familyName,
            middleName: otherNames,
            complainantId: config?.key === "complainantVerification" ? { complainantId: true } : { poaComplainantId: true },
          };

          if (config?.key === "complainantVerification") {
            ["addressDetails-select", "complainantId", "firstName", "lastName", "middleName"].forEach((key) => {
              onSelect(
                `${key}`,
                typeof formData?.[key] === "object" && typeof key?.[key] === "object" ? { ...formData?.[key], ...data[key] } : data[key],
                { shouldValidate: true }
              );
            });
          } else if (config?.key === "poaVerification") {
            ["addressDetails-select", "complainantId", "firstName", "lastName", "middleName"].forEach((key) => {
              onSelect(
                `poa${key?.charAt(0)?.toUpperCase()}${key?.slice(1)}`,
                typeof formData?.[key] === "object" && typeof key?.[key] === "object" ? { ...formData?.[key], ...data[key] } : data[key],
                { shouldValidate: true }
              );
            });
          }
          onSelect(
            config?.key,
            {
              ...formData?.[config.key],
              individualDetails: {
                individualId: individualData?.Individual?.[0]?.individualId,
                userUuid: individualData?.Individual?.[0]?.userUuid,
                document: identifierIdDetails?.fileStoreId
                  ? [{ fileName: idType, fileStore: identifierIdDetails?.fileStoreId, documentName: identifierIdDetails?.filename }]
                  : null,
                ...(config?.key === "poaVerification"
                  ? {
                      "poaAddressDetails-select": data["addressDetails-select"],
                      poaAddressDetails: data["addressDetails-select"],
                    }
                  : {
                      "addressDetails-select": data["addressDetails-select"],
                      addressDetails: data["addressDetails-select"],
                    }),
              },
              isUserVerified: true,
            },
            { shouldValidate: true }
          );
        } else {
          onSelect(
            config?.key,
            { ...formData?.[config.key], individualDetails: null, userDetails: info, isUserVerified: true },
            { shouldValidate: true }
          );
        }
      })
      .catch(() => {
        onSelect(
          config?.key,
          { ...formData?.[config.key], individualDetails: null, userDetails: info, isUserVerified: true },
          { shouldValidate: true }
        );
      });
  };

  const selectOtp = async (input) => {
    try {
      if (isUserRegistered) {
        const requestData = {
          username: formData[config.key]?.[input?.mobileNoKey],
          password: formData[config.key]?.[input?.name],
          tenantId: stateCode,
          userType: getUserType(),
        };
        const { ResponseInfo, UserRequest: info, ...tokens } = await window?.Digit.UserService.authenticate(requestData);
        if (window?.globalConfigs?.getConfig("ENABLE_SINGLEINSTANCE")) {
          info.tenantId = window?.Digit.ULBService.getStateId();
        }
        searchIndividualUser(info, tokens);
        localStorage.setItem(`temp-refresh-token-${formData[config.key]?.[input?.mobileNoKey]}`, tokens?.refresh_token);
        setState((prev) => ({
          ...prev,
          isUserVerified: true,
          showModal: false,
        }));
      } else if (!isUserRegistered && !isUserVerifiedRef?.current) {
        const requestData = {
          name: DEFAULT_USER,
          username: formData[config.key]?.[input?.mobileNoKey],
          otpReference: formData[config.key]?.[input?.name],
          tenantId: stateCode,
        };

        const { ResponseInfo, UserRequest: info, ...tokens } = await window?.Digit.UserService.registerUser(requestData, stateCode);

        if (window?.globalConfigs?.getConfig("ENABLE_SINGLEINSTANCE")) {
          info.tenantId = window?.Digit.ULBService.getStateId();
        }
        searchIndividualUser(info, tokens);
        localStorage.setItem(`temp-refresh-token-${formData[config.key]?.[input?.mobileNoKey]}`, tokens?.refresh_token);
        setState((prev) => ({
          ...prev,
          isUserVerified: true,
          showModal: false,
          errorMsg: "",
        }));
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isUserVerified: false,
        showModal: true,
        errorMsg: err?.response?.data?.error_description === "Account locked" ? t("MAX_RETRIES_EXCEEDED") : t("CS_INVALID_OTP"),
      }));
    }
  };

  return (
    <div className="phone-number-verification">
      <LabelFieldPair>
        <CardLabel className="card-label-smaller" style={{ fontWeight: "700" }}>
          {t(config.label)}
        </CardLabel>
      </LabelFieldPair>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 24 }}>
        <div className="field user-details-form-style" style={{ display: "flex", width: "100%" }}>
          {config?.componentInFront ? (
            <span className={`citizen-card-input citizen-card-input--front${errors[config.key] ? " alert-error-border" : ""}`}>
              {config?.componentInFront}
            </span>
          ) : null}
          <TextInput
            errorStyle={errors[config.key]}
            value={formData?.[config.key]?.[config.name]}
            name={config.name}
            minlength={config?.validation?.minLength}
            maxlength={config?.validation?.maxLength}
            title={config?.validation?.title}
            disable={isUserVerified || formData?.[config.key]?.isUserVerified || config.disable}
            isMandatory={errors[config?.name]}
            onChange={(e) => {
              const { value } = e.target;
              let updatedValue = value;
              if (value.length === 1) {
                updatedValue = value?.replace(/[^6-9]/g, "");
              } else {
                updatedValue = value?.replace(/[^0-9]/g, "");
              }
              onSelect(config?.key, { ...formData?.[config.key], [config?.name]: updatedValue });
            }}
          />
        </div>
        {isUserVerified || formData?.[config.key]?.isUserVerified ? (
          <div
            style={{
              display: "flex",
              gap: "8px",
              height: "40px",
              alignItems: "center",
            }}
          >
            <RoundedCheck />
            <span style={{ color: "green" }}>{t("CS_VERIFIED")}</span>
          </div>
        ) : (
          <Button
            label={t("VERIFY_MOBILE_NUMBER")}
            style={{ alignItems: "center", minWidth: "210px" }}
            className={"secondary-button-selector"}
            labelClassName={"secondary-label-selector"}
            isDisabled={
              !formData?.[config.key]?.[config.name] ||
              errors?.[config?.key]?.[config?.isVerifiedOtpDisabledKey] ||
              formData?.[config.key]?.[config.name]?.length < config?.validation?.minLength ||
              formData?.[config.key]?.[config.name]?.length > config?.validation?.maxLength
            }
            onButtonClick={() => {
              selectMobileNumber(mobileNumber);
            }}
          />
        )}
      </div>
      {errors[config.key]?.type === "required" && <CardLabelError className="error-text">{t("CORE_REQUIRED_FIELD_ERROR")}</CardLabelError>}
      {errors?.[config?.key]?.[config.name] && (!formData?.complainantVerification?.isUserVerified || !formData?.poaVerification?.isUserVerified) && (
        <CardLabelError className={errors?.[config?.key]?.[config.name] ? "error-text" : "default-text"}>
          {t(errors?.[config?.key]?.[config.name] ? errors?.[config?.key]?.[config.name] || "VERIFY_PHONE_ERROR_TEXT" : "VERIFY_PHONE_DEFAULT_TEXT")}
        </CardLabelError>
      )}
      {showModal && (
        <Modal
          headerBarEnd={<CloseBtn onClick={handleCloseModal} isMobileView={true} />}
          actionCancelOnSubmit={() => {}}
          actionSaveLabel={t("VERIFY")}
          actionSaveOnSubmit={() => modalOnSubmit()}
          formId="modal-action"
          isDisabled={formData?.[config.key]?.[input.name]?.length !== 6 || errorMsg}
          headerBarMain={<Heading label={t("VERIFY_MOBILE_NUMBER")} />}
          submitTextClassName={"verification-button-text-modal"}
          className={"verify-mobile-modal"}
        >
          <div className="verify-mobile-modal-main">
            <LabelFieldPair>
              <CardLabel className="card-label-smaller" style={{ display: "flex", width: "100%" }}>
                {t(input.label) +
                  `${
                    input?.hasMobileNo
                      ? formData[config.key]?.[input?.mobileNoKey]
                        ? input?.isMobileSecret
                          ? input?.mobileCode
                            ? ` ${input?.mobileCode}-******${formData[config.key]?.[input?.mobileNoKey]?.substring(6)}`
                            : ` ${formData[config.key]?.[input?.mobileNoKey]?.substring(6)}`
                          : ` ${formData[config.key]?.[input?.mobileNoKey]}`
                        : ""
                      : ""
                  }` +
                  `${user?.emailId ? ` and ${maskEmail(user?.emailId)}` : ""}`}
              </CardLabel>
              <div className="otp-component" style={{ width: "100%", padding: 0, gridGap: "20px" }}>
                {input?.type === "text" && (
                  <OTPInput
                    otpInputStyles={{ gap: "10px" }}
                    length={6}
                    onChange={(otp) => {
                      const updatedValue = otp?.replace(/[^0-9]/g, "");
                      if (errorMsg) {
                        setState((prev) => {
                          return {
                            ...prev,
                            errorMsg: "",
                          };
                        });
                      }
                      onSelect(config?.key, { ...formData?.[config.key], [input?.name]: updatedValue });
                    }}
                    value={formData && formData[config.key] ? formData[config.key][input.name] : undefined}
                  />
                )}
                {formData?.[config.key][input.name] &&
                  formData?.[config.key][input.name].length > 0 &&
                  !["documentUpload", "radioButton"].includes(input.type) &&
                  input.validation &&
                  !formData?.[config.key][input.name].match(
                    window?.Digit.Utils.getPattern(input.validation.patternType) || input.validation.pattern
                  ) && (
                    <CardLabelError style={{ width: "100%", fontSize: "16px", paddingTop: "4px" }}>
                      <InfoIconRed />
                      <span style={{ color: "#BB2C2F" }}> {t(input.validation?.errMsg || "CORE_COMMON_INVALID")}</span>
                    </CardLabelError>
                  )}
              </div>
            </LabelFieldPair>
            {input?.hasResendOTP && (
              <React.Fragment>
                {timeLeft && !errorMsg > 0 ? (
                  <CardText>{`${t("CS_RESEND_ANOTHER_OTP")} ${timeLeft} ${t("CS_RESEND_SECONDS")}`}</CardText>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <CardText style={{ margin: 0 }}>{errorMsg ? `${t(errorMsg)}` : `${t("CS_HAVE_NOT_RECEIVED_OTP")}`}</CardText>

                    <p
                      className="card-text"
                      onClick={() => resendOtp(input)}
                      style={{ backgroundColor: "#fff", color: "#007E7E", cursor: "pointer", margin: 0, textDecoration: "underline", fontSize: 16 }}
                    >
                      {t("CS_RESEND_OTP")}
                    </p>
                  </div>
                )}
              </React.Fragment>
            )}
          </div>
        </Modal>
      )}
      {showConfirmModal && (
        <Modal
          headerBarEnd={
            <CloseBtn
              onClick={() => {
                setIsUserRegistered(true);
                setShowConfirmModal(false);
              }}
              isMobileView={true}
            />
          }
          actionCancelOnSubmit={() => {
            setIsUserRegistered(true);
            setShowConfirmModal(false);
          }}
          actionSaveLabel={t("CS_COMMON_CONFIRM")}
          actionCancelLabel={t("BACK")}
          actionSaveOnSubmit={async () => await onConfirmClick()}
          formId="modal-action"
          headerBarMain={<Heading label={t("ARE_YOU_SURE")} />}
          submitTextClassName={"verification-button-text-modal"}
          className={"verify-mobile-modal"}
        >
          <div className="verify-mobile-modal-main">{t("PLEASE_ENSURE_DETAILS_CORRECT_ACCOUNT_CREATE")}</div>
        </Modal>
      )}
    </div>
  );
}

export default VerifyPhoneNumber;
