export const validateSurities = (t, sureties, setFormState, setFormErrors, setFormDataValue) => {
  let error = false;
  if (!sureties && !Object.keys(setFormState?.current?.errors).includes("sureties")) {
    error = true;
    setFormDataValue.current("sureties", [{}, {}]);
    setFormErrors.current("sureties", { message: t("CORE_REQUIRED_FIELD_ERROR") });
  } else if (sureties?.length > 0 && !Object.keys(setFormState?.current?.errors).includes("sureties")) {
    sureties?.forEach((docs, index) => {
      if (!docs?.name && !Object.keys(setFormState?.current?.errors).includes(`name_${index}`)) {
        error = true;
        setFormErrors.current(`name_${index}`, { message: t("CORE_REQUIRED_FIELD_ERROR") });
      }

      if (!docs?.fatherName && !Object.keys(setFormState?.current?.errors).includes(`fatherName_${index}`)) {
        error = true;
        setFormErrors.current(`fatherName_${index}`, { message: t("CORE_REQUIRED_FIELD_ERROR") });
      }

      if (!docs?.mobileNumber && !Object.keys(setFormState?.current?.errors).includes(`mobileNumber_${index}`)) {
        error = true;
        setFormErrors.current(`mobileNumber_${index}`, { message: t("CORE_REQUIRED_FIELD_ERROR") });
      }

      if (!docs?.identityProof && !Object.keys(setFormState?.current?.errors).includes(`identityProof_${index}`)) {
        error = true;
        setFormErrors.current(`identityProof_${index}`, { message: t("CORE_REQUIRED_FIELD_ERROR") });
      }

      if (!docs?.proofOfSolvency && !Object.keys(setFormState?.current?.errors).includes(`proofOfSolvency_${index}`)) {
        error = true;
        setFormErrors.current(`proofOfSolvency_${index}`, { message: t("CORE_REQUIRED_FIELD_ERROR") });
      }
    });
  }
  return error;
};

export const bailBondAddressValidation = ({ formData, inputs }) => {
  if (
    inputs?.some((input) => {
      const isEmpty = /^\s*$/.test(formData?.[input?.name]);
      return isEmpty || !formData?.[input?.name]?.match(window?.Digit.Utils.getPattern(input?.validation?.patternType) || input?.validation?.pattern);
    })
  ) {
    return true;
  }
};

export const validateAdvocateSuretyContactNumber = (t, sureties, userInfo, setShowErrorToast) => {
  const advocateMobileNumber = userInfo?.mobileNumber;
  const mobileNumbers = new Set();

  for (let i = 0; i < sureties?.length; i++) {
    const currentMobile = sureties[i]?.mobileNumber;
    if (!currentMobile) continue;

    if (advocateMobileNumber && currentMobile === advocateMobileNumber) {
      setShowErrorToast({ label: t("SURETY_ADVOCATE_MOBILE_NUMBER_SAME"), error: true });
      return true;
    }

    if (mobileNumbers.has(currentMobile)) {
      setShowErrorToast({ label: t("SAME_MOBILE_NUMBER_SURETY"), error: true });
      return true;
    }

    mobileNumbers.add(currentMobile);
  }

  return false;
};

export const validateSuretyContactNumber = (individualData, formData, setShowErrorToast, t) => {
  const indivualMobileNumber = individualData?.Individual?.[0]?.mobileNumber;
  const hasDuplicate = formData?.sureties?.some((surety) => surety?.mobileNumber && surety?.mobileNumber === indivualMobileNumber);

  if (hasDuplicate) {
    setShowErrorToast({ label: t("SURETY_CONTACT_NUMBER_CANNOT_BE_SAME_AS_COMPLAINANT"), error: true });
    return false;
  }
  return true;
};
