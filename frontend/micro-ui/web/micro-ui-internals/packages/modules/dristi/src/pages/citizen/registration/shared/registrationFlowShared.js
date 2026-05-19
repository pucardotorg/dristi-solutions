import { useEffect } from "react";
import isEqual from "lodash/isEqual";
import { getFileByFileStore } from "../../../../Utils";

export const USER_REGISTRATION_PARAMS_SESSION_KEY = "userRegistrationParams";

const getFileStoreFetchUri = (fileStoreId) =>
  `${window.location.origin}/filestore/v1/files/id?tenantId=${Digit.ULBService.getCurrentTenantId()}&fileStoreId=${fileStoreId}`;

/**
 * Re-hydrates uploaded ID / bar-council files on params after e-sign or full-page redirect.
 * Same sequence as the inline blocks in registration steps (extract-only).
 */
export const hydrateUserRegistrationParams = async (newParams, { transformParams } = {}) => {
  let params = transformParams ? transformParams(newParams) : newParams;

  const fileStoreId = params?.uploadedDocument?.filedata?.files?.[0]?.fileStoreId;
  const filename = params?.uploadedDocument?.filename;

  const barCouncilFileStoreId = params?.formData?.clientDetails?.barCouncilId?.[1]?.fileStoreId;
  const barCouncilFilename = params?.formData?.clientDetails?.barCouncilId?.[0];

  if (barCouncilFileStoreId && barCouncilFilename) {
    const barCouncilFile = await getFileByFileStore(getFileStoreFetchUri(barCouncilFileStoreId), barCouncilFilename);
    params = {
      ...params,
      formData: {
        ...params.formData,
        clientDetails: {
          ...params.formData?.clientDetails,
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
    const file = await getFileByFileStore(getFileStoreFetchUri(fileStoreId), filename);
    params = {
      ...params,
      uploadedDocument: {
        ...params.uploadedDocument,
        file,
      },
    };
  }

  return params;
};

export const restoreUserRegistrationFromSession = async ({ params, history, pathOnRefresh, shouldRestore, transformParams }) => {
  if (!shouldRestore(params)) {
    return;
  }

  const storedParams = sessionStorage.getItem(USER_REGISTRATION_PARAMS_SESSION_KEY);
  let newParams = storedParams ? JSON.parse(storedParams) : params;
  newParams = await hydrateUserRegistrationParams(newParams, { transformParams });

  sessionStorage.removeItem(USER_REGISTRATION_PARAMS_SESSION_KEY);
  history.push(pathOnRefresh, { newParams });
};

/**
 * Restores registration wizard state from sessionStorage when returning from e-sign / external flow.
 */
export const useUserRegistrationSessionRestore = ({ params, history, pathOnRefresh, shouldRestore, transformParams, effectDeps = [] }) => {
  useEffect(() => {
    const handleRedirect = async () => {
      await restoreUserRegistrationFromSession({ params, history, pathOnRefresh, shouldRestore, transformParams });
    };
    handleRedirect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, history, pathOnRefresh, ...effectDeps]);
};

/** Advocate clerk step maps state registration number before file hydration. */
export const mapStateRegnToBarRegistration = (newParams) => {
  if (newParams?.formData?.clientDetails?.stateRegnNumber && !newParams?.formData?.clientDetails?.barRegistrationNumber) {
    return {
      ...newParams,
      formData: {
        ...newParams.formData,
        clientDetails: {
          ...newParams.formData.clientDetails,
          barRegistrationNumber: newParams.formData.clientDetails.stateRegnNumber,
        },
      },
    };
  }
  return newParams;
};

/**
 * Returns true when continue/submit should stay disabled (pattern / empty array checks).
 */
export const isRegistrationFormPatternInvalid = (config, formData) => {
  let invalid = false;
  config.forEach((curr) => {
    if (invalid) return;
    if (!(curr.body[0].key in formData) || !formData[curr.body[0].key]) {
      return;
    }
    curr.body[0].populators.inputs.forEach((input) => {
      if (invalid) return;
      if (Array.isArray(input.name)) return;
      if (
        formData[curr.body[0].key][input.name] &&
        formData[curr.body[0].key][input.name].length > 0 &&
        !["documentUpload", "radioButton"].includes(input.type) &&
        input.validation &&
        !formData[curr.body[0].key][input.name].match(Digit.Utils.getPattern(input.validation.patternType) || input.validation.pattern)
      ) {
        invalid = true;
      }
      if (Array.isArray(formData[curr.body[0].key][input.name]) && formData[curr.body[0].key][input.name].length === 0) {
        invalid = true;
      }
    });
  });
  return invalid;
};

export const createRegistrationPatternValidationOnChange = (config, setIsDisabled, { onAfterValidate } = {}) => {
  return (setValue, formData, formState) => {
    setIsDisabled(isRegistrationFormPatternInvalid(config, formData));
    onAfterValidate?.(setValue, formData, formState);
  };
};

/** Mandatory-field validation for registration FormComposer steps (user type, upload id, etc.). */
export const validateRegistrationMandatoryFormData = (config, data) => {
  let isValid = true;
  config.forEach((curr) => {
    if (!isValid) return;
    if (!(curr.body[0].key in data) || !data[curr.body[0].key]) {
      isValid = false;
    }
    curr.body[0].populators.inputs.forEach((input) => {
      if (!isValid) return;
      if (Array.isArray(input.name)) return;
      if (input.disableMandatoryFieldFor) {
        if (input.disableMandatoryFieldFor.some((field) => !data[curr.body[0].key][field]) && data[curr.body[0].key][input.name]) {
          if (Array.isArray(data[curr.body[0].key][input.name]) && data[curr.body[0].key][input.name].length === 0) {
            isValid = false;
          }
          if ((input?.isMandatory && !(input.name in data[curr.body[0].key])) || !data[curr.body[0].key][input.name]) {
            isValid = false;
          }
          return;
        }
        if (
          (input?.isMandatory && !(input.name in data[curr.body[0].key])) ||
          (!data[curr.body[0].key][input.name] && !input.disableMandatoryFieldFor.some((field) => data[curr.body[0].key][field]))
        ) {
          isValid = false;
        }
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

/** Name step: strip non-letters and preserve caret while typing. */
export const sanitizeRegistrationNameFieldsOnChange = (setValue, formData) => {
  const formDataCopy = structuredClone(formData);
  for (const key in formDataCopy) {
    if (!Object.hasOwnProperty.call(formDataCopy, key)) continue;
    const oldValue = formDataCopy[key];
    if (typeof oldValue !== "string") continue;
    const updatedValue = oldValue
      .replace(/[^a-zA-Z\s]/g, "")
      .trimStart()
      .replace(/ +/g, " ");
    if (updatedValue === oldValue) continue;
    const element = document.querySelector(`[name="${key}"]`);
    const start = element?.selectionStart;
    const end = element?.selectionEnd;
    setValue(key, updatedValue);
    setTimeout(() => {
      element?.setSelectionRange(start, end);
    }, 0);
  }
};

export const syncAddressFormDataIfChanged = (formdata, formData, setformData) => {
  if (!isEqual(formdata, formData)) {
    setformData(formData);
  }
};
