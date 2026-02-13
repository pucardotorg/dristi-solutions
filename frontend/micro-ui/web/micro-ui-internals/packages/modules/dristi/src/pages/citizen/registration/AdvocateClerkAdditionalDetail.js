import { FormComposerV2, Toast } from "@egovernments/digit-ui-react-components";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { advocateClerkConfig, advocateClerkVerificationConfig } from "./config";
import { getFileByFileStore } from "../../../Utils";

const headerStyle = {
  fontFamily: "Roboto",
  fontSize: "24px",
  fontWeight: 700,
  lineHeight: "30px",
  textAlign: "center",
  color: "#0b0c0c",
  margin: 0,
  width: "100%",
};

const subHeaderStyle = {
  margin: 0,
  fontFamily: "Roboto",
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: "21px",
  textAlign: "center",
  color: "#505a5f",
};

function AdvocateClerkAdditionalDetail({ params, setParams, path, config, pathOnRefresh }) {
  const { t } = useTranslation();
  const Digit = window.Digit || {};
  const history = useHistory();
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const setFormErrors = useRef(null);

  const tenantId = Digit.ULBService.getCurrentTenantId();
  
  // Determine if user is registering as advocate clerk
  const isAdvocateClerk = params?.userType?.clientDetails?.selectUserType?.code === "ADVOCATE_CLERK";
  
  // Use different config based on user type
  const currentConfig = useMemo(() => {
    return isAdvocateClerk ? advocateClerkVerificationConfig : advocateClerkConfig;
  }, [isAdvocateClerk]);
  const closeToast = () => {
    setShowErrorToast(false);
  };

  const getUserForAdvocateUUID = async (barRegistrationNumber) => {
    const advocateDetail = await window?.Digit.DRISTIService.searchAdvocateClerk("/advocate/v1/_search", {
      criteria: [
        {
          barRegistrationNumber: barRegistrationNumber,
        },
      ],
      tenantId,
    });
    return advocateDetail;
  };

  const validateFormData = (data) => {
    let isValid = true;
    currentConfig.forEach((curr) => {
      if (!isValid) return;
      if (!(curr.body[0].key in data) || !data[curr.body[0].key]) {
        isValid = false;
      }
      curr.body[0].populators.inputs.forEach((input) => {
        if (!isValid) return;
        if (Array.isArray(input.name)) return;
        if (
          input.isDependentOn &&
          data[curr.body[0].key][input.isDependentOn] &&
          !Boolean(
            input.dependentKey[input.isDependentOn].reduce((res, current) => {
              if (!res) return res;
              res = data[curr.body[0].key][input.isDependentOn][current];
              if (
                Array.isArray(data[curr.body[0].key][input.isDependentOn][current]) &&
                data[curr.body[0].key][input.isDependentOn][current].length === 0
              ) {
                res = false;
              }
              return res;
            }, true)
          )
        ) {
          return;
        }
        if (Array.isArray(data[curr.body[0].key][input.name]) && data[curr.body[0].key][input.name].length === 0) {
          isValid = false;
        }
        if (input?.isMandatory && !(input.name in data[curr.body[0].key])) {
          isValid = false;
        }
      });
    });
    return isValid;
  };
  const onFormValueChange = (setValue, formData, formState, reset, setError, clearErrors, trigger, getValues) => {
    setFormErrors.current = setError;
    const formDataCopy = structuredClone(formData);
    for (const key in formDataCopy) {
      if (Object.hasOwnProperty.call(formDataCopy, key) && key === "clientDetails") {
        if (typeof formDataCopy?.clientDetails?.barRegistrationNumber === "string") {
          const clientValue = formDataCopy.clientDetails;
          let oldValue = clientValue.barRegistrationNumber || "";
          let value = oldValue.toUpperCase();
          const updatedValue = value.replace(/[^A-Z0-9\/]/g, "");
          if (updatedValue !== oldValue) {
            clientValue.barRegistrationNumber = updatedValue;
            setValue(key, clientValue, { shouldValidate: true });
          }
        }
      }
    }

    let isDisabled = false;
    currentConfig.forEach((curr) => {
      if (isDisabled) return;
      if (!(curr.body[0].key in formData) || !formData[curr.body[0].key]) {
        return;
      }
      curr.body[0].populators.inputs.forEach((input) => {
        if (isDisabled) return;
        if (Array.isArray(input.name)) return;
        if (
          formData[curr.body[0].key][input.name] &&
          formData[curr.body[0].key][input.name].length > 0 &&
          !["documentUpload", "radioButton"].includes(input.type) &&
          input.validation &&
          !formData[curr.body[0].key][input.name].match(Digit.Utils.getPattern(input.validation.patternType) || input.validation.pattern)
        ) {
          isDisabled = true;
        }
        if (Array.isArray(formData[curr.body[0].key][input.name]) && formData[curr.body[0].key][input.name].length === 0) {
          isDisabled = true;
        }
        if (input?.name == "barRegistrationNumber" && formData?.clientDetails?.barRegistrationNumber?.length < input?.validation?.minlength) {
          isDisabled = true;
        }
      });
    });
    if (isDisabled) {
      setIsDisabled(isDisabled);
    } else {
      setIsDisabled(false);
    }
  };

  const onSubmit = async (formData) => {
    if (!validateFormData(formData)) {
      setShowErrorToast(!validateFormData(formData));
      return;
    }

    if (formData?.clientDetails?.barRegistrationNumber) {
      const advocateDetail = await getUserForAdvocateUUID(formData?.clientDetails?.barRegistrationNumber);
      if (advocateDetail?.advocates[0]?.responseList?.length !== 0 && advocateDetail?.advocates[0]?.responseList[0]?.isActive === true) {
        setFormErrors.current("barRegistrationNumber", { message: t("DUPLICATE_BAR_REGISTRATION") });
        return;
      }
    }
    setParams({
      ...params,
      formData: formData,
    });
    history.push(`/${window?.contextPath}/citizen/dristi/home/registration/terms-condition`, { newParams: { ...params, formData } });
  };

  // Map stateRegnNumber to barRegistrationNumber for form default values
  const mappedDefaultValues = useMemo(() => {
    const formData = params?.formData || {};
    if (formData?.clientDetails) {
      // If stateRegnNumber exists but barRegistrationNumber doesn't, map it
      if (formData.clientDetails.stateRegnNumber && !formData.clientDetails.barRegistrationNumber) {
        return {
          ...formData,
          clientDetails: {
            ...formData.clientDetails,
            barRegistrationNumber: formData.clientDetails.stateRegnNumber,
          },
        };
      }
      // Also check if stateRegnNumber is at the root level (from API response)
      if (!formData.clientDetails.barRegistrationNumber && !formData.clientDetails.stateRegnNumber) {
        // Check if stateRegnNumber exists in params directly (from API)
        const stateRegnNumber = params?.stateRegnNumber || params?.advocate?.stateRegnNumber;
        if (stateRegnNumber) {
          return {
            ...formData,
            clientDetails: {
              ...formData.clientDetails,
              barRegistrationNumber: stateRegnNumber,
            },
          };
        }
      }
    }
    return formData;
  }, [params?.formData, params?.stateRegnNumber, params?.advocate?.stateRegnNumber]);

  useEffect(() => {
    const handleRedirect = async () => {
      if (!params?.IndividualPayload) {
        const storedParams = sessionStorage.getItem("userRegistrationParams");
        let newParams = storedParams ? JSON.parse(storedParams) : params;

        const fileStoreId = newParams?.uploadedDocument?.filedata?.files?.[0]?.fileStoreId;
        const filename = newParams?.uploadedDocument?.filename;

        const barCouncilFileStoreId = newParams?.formData?.clientDetails?.barCouncilId?.[1]?.fileStoreId;
        const barCouncilFilename = newParams?.formData?.clientDetails?.barCouncilId?.[0];

        // Map stateRegnNumber to barRegistrationNumber if needed
        if (newParams?.formData?.clientDetails?.stateRegnNumber && !newParams?.formData?.clientDetails?.barRegistrationNumber) {
          newParams.formData.clientDetails.barRegistrationNumber = newParams.formData.clientDetails.stateRegnNumber;
        }

        if (barCouncilFileStoreId && barCouncilFilename) {
          const barCouncilUri = `${
            window.location.origin
          }/filestore/v1/files/id?tenantId=${Digit.ULBService.getCurrentTenantId()}&fileStoreId=${barCouncilFileStoreId}`;
          const barCouncilFile = await getFileByFileStore(barCouncilUri, barCouncilFilename);

          newParams = {
            ...newParams,
            formData: {
              ...newParams.formData,
              clientDetails: {
                ...newParams.formData.clientDetails,
                barCouncilId: [
                  [
                    barCouncilFilename,
                    {
                      file: barCouncilFile,
                      fileStoreId: barCouncilFileStoreId,
                    },
                  ],
                ],
              },
            },
          };
        }

        if (fileStoreId && filename) {
          const uri = `${window.location.origin}/filestore/v1/files/id?tenantId=${Digit.ULBService.getCurrentTenantId()}&fileStoreId=${fileStoreId}`;
          const file = await getFileByFileStore(uri, filename);

          newParams = {
            ...newParams,
            uploadedDocument: {
              ...newParams.uploadedDocument,
              file,
            },
          };
        }

        sessionStorage.removeItem("userRegistrationParams");
        history.push(pathOnRefresh, { newParams });
      }
    };

    handleRedirect();
  }, [params, history, pathOnRefresh, Digit.ULBService]);

  return (
    <div className="advocate-additional-details">
      <div className="id-verificatin-header">
        <p className="vefifcation-header" style={headerStyle}>
          {t(isAdvocateClerk ? "CORE_ADVOCATE_CLERK_VERFICATION" : "CORE_ADVOCATE_VERFICATION")}
        </p>
        <p className="vefifcation-sub-header" style={subHeaderStyle}>
          {t("CORE_ADVOCATE_AUTHENTICITY_TEXT")}
        </p>
        <p className="vefifcation-sub-header" style={{ ...subHeaderStyle, paddingBottom: "40px" }}>
          {t("CORE_ADVOCATE_DETAILS_TEXT")}
        </p>
      </div>
      <FormComposerV2
        config={currentConfig}
        t={t}
        onSubmit={(props) => {
          onSubmit(props);
        }}
        isDisabled={isDisabled}
        label={"CS_COMMON_CONTINUE"}
        defaultValues={mappedDefaultValues || {}}
        submitInForm
        onFormValueChange={onFormValueChange}
      ></FormComposerV2>

      {showErrorToast && <Toast error={true} label={t("ES_COMMON_PLEASE_ENTER_ALL_MANDATORY_FIELDS")} isDleteBtn={true} onClose={closeToast} />}
    </div>
  );
}

export default AdvocateClerkAdditionalDetail;
