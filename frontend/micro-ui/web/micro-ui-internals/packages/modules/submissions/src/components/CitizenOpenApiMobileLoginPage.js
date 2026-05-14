import React, { useMemo } from "react";
import { Card, CardLabel, SubmitBar } from "@egovernments/digit-ui-react-components";
import CustomToast from "@egovernments/digit-ui-module-dristi/src/components/CustomToast";
import { CitizenDigitIndiaPhoneRow, INDIA_MOBILE_PREFIX } from "./IndiaPhoneInputRow";

export const OPEN_API_MOBILE_FIELD_CONFIG = {
  name: "mobileNumber",
  key: "mobileNumber",
  type: "text",
  error: "ERR_HRMS_INVALID_MOB_NO",
  label: "Phone Number",
  placeholder: "Ex: 1234567890",
  validation: {
    pattern: "^[0-9]{0,10}$",
    isNumber: true,
    isRequired: true,
    maxLength: 10,
    minLength: 10,
  },
  isMandatory: true,
  componentInFront: INDIA_MOBILE_PREFIX,
};

const CitizenOpenApiMobileLoginPage = ({
  t,
  cardHeader,
  mobileNumber,
  setMobileNumber,
  error,
  setError,
  errorMessageTranslationKey,
  submitLabel,
  onSubmit,
  showToast,
  setShowToast,
}) => {
  const config = OPEN_API_MOBILE_FIELD_CONFIG;

  const isDisabled = useMemo(() => {
    return (mobileNumber || "").length !== 10;
  }, [mobileNumber]);

  return (
    <React.Fragment>
      <div className="user-registration bail-bond-login-page">
        <div className="citizen-form-wrapper">
          <div className="login-form responsive-container">
            <Card>
              {cardHeader}
              <div className="form-section">
                <CardLabel>{t(config.label)}</CardLabel>
                <CitizenDigitIndiaPhoneRow
                  t={t}
                  config={config}
                  mobileNumber={mobileNumber}
                  setMobileNumber={setMobileNumber}
                  setError={setError}
                  error={error}
                />

                {error ? (
                  <div className="error-message">
                    <div>
                      <svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g clipPath="url(#clip0_7308_19146)">
                          <path
                            d="M7.54131 1.33301C4.41728 1.33301 1.88184 4.31967 1.88184 7.99967C1.88184 11.6797 4.41728 14.6663 7.54131 14.6663C10.6653 14.6663 13.2008 11.6797 13.2008 7.99967C13.2008 4.31967 10.6653 1.33301 7.54131 1.33301ZM8.10726 11.333H6.97536V7.33301H8.10726V11.333ZM8.10726 5.99967H6.97536V4.66634H8.10726V5.99967Z"
                            fill="#BB2C2F"
                          />
                        </g>
                        <defs>
                          <clipPath id="clip0_7308_19146">
                            <rect width="13.5827" height="16" fill="white" transform="translate(0.75)" />
                          </clipPath>
                        </defs>
                      </svg>
                    </div>
                    {t(errorMessageTranslationKey)}
                  </div>
                ) : null}

                <SubmitBar label={submitLabel} onSubmit={onSubmit} disabled={isDisabled} />
              </div>
            </Card>
          </div>
        </div>
      </div>
      {showToast && (
        <CustomToast
          error={showToast?.error}
          label={showToast?.label}
          errorId={showToast?.errorId}
          onClose={() => {
            setShowToast(null);
          }}
          duration={showToast?.errorId ? 7000 : 5000}
        />
      )}
    </React.Fragment>
  );
};

export default CitizenOpenApiMobileLoginPage;
