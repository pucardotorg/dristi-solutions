import React, { useEffect, useMemo, useState } from "react";
import { TextInput } from "@egovernments/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import Button from "@egovernments/digit-ui-module-dristi/src/components/Button";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { submissionService } from "../../hooks/services";

const BailBondLoginPage = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const { bailbondId } = Digit.Hooks.useQueryParams();
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

    // if person is alredy registered then redirect to sign page and also set some data that again will not redirect again
    try {
      const res = await submissionService.searchOpenApiBailBond({
        tenantId,
        bailId: bailbondId,
        mobileNumber: mobileNumber,
      });
      if (!res || Object.keys(res).length === 0) {
        setError(true);
        return;
      }
      history.replace(`/${window?.contextPath}/citizen/dristi/home/bail-bond-sign?tenantId=${tenantId}&bailbondId=${bailbondId}`, {
        mobileNumber: mobileNumber,
        tenantId: tenantId,
        isAuthorised : true,
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
      <style>
        {`
      .text-Input .text-input-width {
      max-width : none
      }
      .citizen-card-input--front {
          background-color : #E0E0E0 !important;
          margin-bottom:5px;
      }
      `}
      </style>
      <div className="user-registration" style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: "40px", fontWeight: 700, height: "5vw" }}>Sign Bail Bond</div>
        <div style={{ width: "100%", height: "20vw" }}>
          <div className="citizen-form-wrapper" style={{ width: "100%" }}>
            <div className="login-form" style={{ width: "35vw" }}>
              <div>
                <div style={{ marginBottom: "8px" }}>{t(config.label)}</div>
                <div style={{ display: "flex" }}>
                  {config?.componentInFront ? (
                    <span className="citizen-card-input citizen-card-input--front" style={error ? { borderColor: "#BB2C2F" } : {}}>
                      {config?.componentInFront}
                    </span>
                  ) : null}
                  <TextInput
                    t={t}
                    className="field desktop-w-full"
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
                    textInputStyle={{ maxHeight: "max-content" }}
                    style={error ? { borderColor: "#BB2C2F" } : {}}
                  />
                </div>
                {error && (
                  <div style={{ color: "#BB2C2F", marginBottom: "8px", display: "flex", gap: "4px" }}>
                    <div>
                      <svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g clip-path="url(#clip0_7308_19146)">
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
                    {t("ERROR_BAIL_BOND_LOGIN_NUMBER")}
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "center", paddingTop: "20px" }}>
                  <Button
                    label={t("CONFIRM")}
                    style={{ boxShadow: "none", padding: "10px 24px", width: "30%", gap: "4px" }}
                    onButtonClick={handleSubmit}
                    isDisabled={isDisabled}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default BailBondLoginPage;
