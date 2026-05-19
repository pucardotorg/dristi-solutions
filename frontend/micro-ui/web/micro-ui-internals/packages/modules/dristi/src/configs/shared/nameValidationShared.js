/** Shared name/age field sanitization for FileCase + edit profile flows. */

const setFormattedFieldValue = (setValue, key, updatedValue) => {
  const element = document.querySelector(`[name="${key}"]`);
  const start = element?.selectionStart;
  const end = element?.selectionEnd;
  setValue(key, updatedValue);
  setTimeout(() => {
    element?.setSelectionRange(start, end);
  }, 0);
};

export const sanitizeNameInputFields = (formData, setValue, nameKeys, formatName, { maxLength = 100 } = {}) => {
  const formDataCopy = structuredClone(formData);
  for (const key of nameKeys) {
    if (!Object.hasOwnProperty.call(formDataCopy, key)) {
      continue;
    }
    const oldValue = formDataCopy[key];
    let value = oldValue;
    if (typeof value !== "string") {
      continue;
    }
    if (value.length > maxLength) {
      value = value.slice(0, maxLength);
    }
    const updatedValue = formatName(value);
    if (updatedValue !== oldValue) {
      setFormattedFieldValue(setValue, key, updatedValue);
    }
  }
};

export const sanitizeAgeInputField = (formData, setValue, key, { maxAge = 150 } = {}) => {
  if (!Object.hasOwnProperty.call(formData, key)) {
    return;
  }
  const oldValue = formData[key];
  let updatedValue = oldValue?.replace(/\D/g, "");
  if (updatedValue && parseInt(updatedValue, 10) > maxAge) {
    updatedValue = updatedValue.substring(0, updatedValue.length - 1);
  }
  if (updatedValue !== oldValue) {
    const element = document?.querySelector(`[name="${key}"]`);
    const start = element?.selectionStart;
    const end = element?.selectionEnd;
    setValue(key, updatedValue);
    setTimeout(() => {
      element?.setSelectionRange(start, end);
    }, 0);
  }
};

export const sanitizePoaAgeInputField = (formData, setValue, key = "poaAge") => {
  if (!Object.hasOwnProperty.call(formData, key)) {
    return;
  }
  const oldValue = formData[key];
  let updatedValue = oldValue?.replace(/\D/g, "");
  if (updatedValue?.length > 3) {
    updatedValue = updatedValue.substring(0, 3);
  }
  if (updatedValue !== oldValue) {
    const element = document?.querySelector(`[name="${key}"]`);
    const start = element?.selectionStart;
    const end = element?.selectionEnd;
    setValue(key, updatedValue);
    setTimeout(() => {
      element?.setSelectionRange(start, end);
    }, 0);
  }
};

export const runRespondentNameAgeValidation = ({ formData, setValue, formatName }) => {
  if (
    !formData?.respondentFirstName &&
    !formData?.respondentMiddleName &&
    !formData?.respondentLastName &&
    !formData?.respondentAge
  ) {
    return;
  }
  sanitizeNameInputFields(formData, setValue, ["respondentFirstName", "respondentMiddleName", "respondentLastName"], formatName);
  sanitizeAgeInputField(formData, setValue, "respondentAge");
};

export const runEditComplainantNameAgeValidation = ({ formData, setValue, formatName }) => {
  if (!formData?.firstName && !formData?.middleName && !formData?.lastName && !formData?.complainantAge) {
    return;
  }
  sanitizeNameInputFields(formData, setValue, ["firstName", "middleName", "lastName"], formatName);
  sanitizeAgeInputField(formData, setValue, "complainantAge");
};

export const runFileCasePartyNameAgeValidation = ({
  formData,
  setValue,
  formatName,
  selected,
  formState,
  clearErrors,
}) => {
  if (
    !formData?.firstName &&
    !formData?.middleName &&
    !formData?.lastName &&
    !formData?.witnessDesignation &&
    !formData?.witnessAge &&
    !formData?.complainantAge &&
    !formData?.respondentAge &&
    !formData?.poaAge
  ) {
    return;
  }
  sanitizeNameInputFields(
    formData,
    setValue,
    ["firstName", "middleName", "lastName", "witnessDesignation"],
    formatName
  );
  if (selected === "witnessDetails") {
    const formDataCopy = structuredClone(formData);
    for (const key of ["firstName", "witnessDesignation"]) {
      if (!Object.hasOwnProperty.call(formDataCopy, key)) {
        continue;
      }
      const oldValue = formDataCopy[key];
      if (typeof oldValue === "string" && formatName(oldValue) !== "" && ["firstName", "witnessDesignation"].includes(key)) {
        if (formState?.errors?.firstName) {
          clearErrors("firstName");
        }
        if (formState?.errors?.witnessDesignation) {
          clearErrors("witnessDesignation");
        }
      }
    }
  }
  sanitizeAgeInputField(formData, setValue, "complainantAge");
  sanitizeAgeInputField(formData, setValue, "witnessAge");
  sanitizePoaAgeInputField(formData, setValue);
};

export const runDebtLiabilityNatureValidation = ({ formData, setValue, formatName }) => {
  if (!formData?.liabilityNature) {
    return;
  }
  sanitizeNameInputFields(formData, setValue, ["liabilityNature"], formatName);
};
