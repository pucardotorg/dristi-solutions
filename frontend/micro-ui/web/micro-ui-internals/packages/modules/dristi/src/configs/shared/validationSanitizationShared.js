/** Input sanitization shared by FileCase + edit profile validation utils. */

import { sanitizeNameInputFields } from "./nameValidationShared";

const setFormattedFieldValue = (setValue, key, updatedValue, fieldPath) => {
  const selector = fieldPath ? `[name="${fieldPath}"]` : `[name="${key}"]`;
  const element = document.querySelector(selector);
  const start = element?.selectionStart;
  const end = element?.selectionEnd;
  if (fieldPath) {
    setValue(fieldPath, updatedValue);
  } else {
    setValue(key, updatedValue);
  }
  setTimeout(() => {
    element?.setSelectionRange(start, end);
  }, 0);
};

export const sanitizeDigitsOnlyField = (formData, setValue, key, { maxLength } = {}) => {
  if (!Object.hasOwnProperty.call(formData, key)) {
    return;
  }
  const oldValue = formData[key];
  let updatedValue = oldValue?.replace(/\D/g, "");
  if (maxLength && updatedValue?.length > maxLength) {
    updatedValue = updatedValue.substring(0, maxLength);
  }
  if (updatedValue !== oldValue) {
    setFormattedFieldValue(setValue, key, updatedValue);
  }
};

export const sanitizeIfscFieldValue = (value) => {
  if (typeof value !== "string") {
    return value;
  }
  let updatedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (updatedValue?.length > 11) {
    updatedValue = updatedValue.substring(0, 11);
  }
  if (updatedValue?.length < 5) {
    updatedValue = value.toUpperCase().replace(/[^A-Z]/g, "");
  }
  if (updatedValue?.length >= 5) {
    updatedValue = updatedValue.slice(0, 4).replace(/[^A-Z]/g, "") + "0" + updatedValue.slice(5);
  }
  if (updatedValue?.length === 11) {
    updatedValue = updatedValue.slice(0, 4) + "0" + updatedValue.slice(5, 11).replace(/[^A-Z0-9]/g, "");
  }
  return updatedValue;
};

export const runChequeFieldsSanitization = ({ formData, setValue, formatName }) => {
  if (
    !formData?.chequeSignatoryName &&
    !formData?.payeeBankName &&
    !formData?.payeeBranchName &&
    !formData?.payerBankName &&
    !formData?.payerBranchName &&
    !formData?.name
  ) {
    return;
  }
  sanitizeNameInputFields(formData, setValue, ["chequeSignatoryName", "name"], formatName, { maxLength: 100 });
  sanitizeNameInputFields(
    formData,
    setValue,
    ["payeeBankName", "payeeBranchName", "payerBankName", "payerBranchName"],
    formatName,
    { maxLength: 200 }
  );
};

export const sanitizeMaxLengthField = (formData, setValue, key, maxLength) => {
  if (!Object.hasOwnProperty.call(formData, key)) {
    return;
  }
  const oldValue = formData[key];
  if (typeof oldValue !== "string" || oldValue.length <= maxLength) {
    return;
  }
  setFormattedFieldValue(setValue, key, oldValue.slice(0, maxLength));
};

export const runDebtLiabilityTotalAmountSanitization = ({ formData, setValue }) => {
  if (!formData?.totalAmount) {
    return;
  }
  sanitizeMaxLengthField(formData, setValue, "totalAmount", 12);
};

export const runChequeIfscAndNumericSanitization = ({ formData, setValue }) => {
  const chequeData = structuredClone(formData?.chequeDetails || {});
  for (const key of ["payeeIfsc", "payerIfsc"]) {
    if (!Object.hasOwnProperty.call(chequeData, key)) {
      continue;
    }
    const oldValue = chequeData[key];
    if (typeof oldValue !== "string") {
      continue;
    }
    const updatedValue = sanitizeIfscFieldValue(oldValue);
    if (updatedValue !== oldValue) {
      const element = document.querySelector(`[name="${key}"]`);
      const start = element?.selectionStart;
      const end = element?.selectionEnd;
      setValue(`chequeDetails.${key}`, updatedValue);
      setTimeout(() => {
        element?.setSelectionRange(start, end);
      }, 0);
    }
  }

  sanitizeDigitsOnlyField(formData, setValue, "chequeAmount", { maxLength: 12 });
  sanitizeDigitsOnlyField(formData, setValue, "chequeNumber", { maxLength: 6 });
};
