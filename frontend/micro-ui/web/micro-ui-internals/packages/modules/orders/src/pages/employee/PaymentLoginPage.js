import React, { useMemo, useState } from "react";
import { Card, CardHeader, CardLabel, SubmitBar, TextInput } from "@egovernments/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { ordersService } from "../../hooks/services";

const PaymentLoginPage = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const { orderNumber } = Digit.Hooks.useQueryParams();
  const [mobileNumber, setMobileNumber] = useState("");
  const [error, setError] = useState(false);
  const config = {
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
    componentInFront: "+91",
  };

  const handleSubmit = async () => {
    // TODO: api call and set error if any
    // ref : bailbonfloginPage.js OR witnessDepositionLoginPage.js

    try {
      // TODO : make searchOpenApiSmsPayment in ordersService with proper api call
      // const res = await ordersService.searchOpenApiSmsPayment({
      //   tenantId,
      //   orderNumber: orderNumber,
      //   mobileNumber: mobileNumber,
      // });
      // if (!res || Object.keys(res).length === 0) {
      //   setError(true);
      //   return;
      // }
      history.replace(`/${window?.contextPath}/citizen/dristi/home/sms-payment?orderNumber=${orderNumber}`, {
        mobileNumber: mobileNumber,
        tenantId: tenantId,
        isAuthorised: true,
      });
    } catch (error) {
      setError(true);
      return;
    }
  };

  const isDisabled = useMemo(() => {
    return mobileNumber?.length !== 10;
  }, [mobileNumber]);

  return (
    <React.Fragment>
      <div className="user-registration bail-bond-login-page payment-login-page">
        <div className="citizen-form-wrapper">
          <div className="login-form responsive-container">
            <Card>
              <CardHeader>{t("COMPLETE_PAYMENTS")}</CardHeader>
              <div className="form-section">
                <CardLabel>{t(config.label)}</CardLabel>
                <div className="text-input-width-size field-container">
                  {config?.componentInFront ? (
                    <span className={`citizen-card-input citizen-card-input--front bailbondloginPage ${error ? "error-border" : ""}`}>
                      {config?.componentInFront}
                    </span>
                  ) : null}
                  <TextInput
                    t={t}
                    className={`field desktop-w-full ${error ? "error-border" : ""}`}
                    key={config?.key}
                    name={config.name}
                    value={mobileNumber}
                    onChange={(e) => {
                      setError(false);
                      const newValue = e.target.value;
                      const regex = config?.validation?.pattern;
                      if (!regex || newValue === "" || new RegExp(regex).test(newValue)) {
                        setMobileNumber(newValue);
                      }
                    }}
                    isRequired={config?.validation?.isRequired}
                    pattern={config?.validation?.pattern}
                    errMsg={config?.validation?.errMsg}
                    maxlength={config?.validation?.maxLength}
                    minlength={config?.validation?.minLength}
                    style={error ? { borderColor: "#BB2C2F" } : {}}
                  />
                </div>

                {error && (
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
                    {t("ERROR_SMS_PAYMENT_LOGIN_NUMBER")}
                  </div>
                )}

                <SubmitBar label={t("VERIFY_PAYMENTS")} onSubmit={handleSubmit} disabled={isDisabled} />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default PaymentLoginPage;
