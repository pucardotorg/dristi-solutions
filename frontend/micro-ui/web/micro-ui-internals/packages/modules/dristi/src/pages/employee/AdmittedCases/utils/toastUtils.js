// Factory function to create showToastMsg callback
export const createShowToastMsg = (setToast, setToastDetails, setToastStatus) => {
  return (type, message, duration = 5000) => {
    setToast(true);
    setToastDetails({ isError: type === "error", message: message });
    setTimeout(() => {
      setToast(false);
      setToastStatus({ alreadyShown: true });
    }, duration);
  };
};

// Factory function to create onSuccess callback for evidence marking
export const createEvidenceOnSuccess = (showToast, refetchCaseData, t) => {
  return async (response, data) => {
    showToast({
      isError: false,
      message: !data?.body?.artifact?.isEvidence ? t("SUCCESSFULLY_UNMARKED_MESSAGE") : t("SUCCESSFULLY_MARKED_MESSAGE"),
    });
    refetchCaseData();
  };
};

// Factory function to create onError callback for evidence marking
export const createEvidenceOnError = (showToast, t) => {
  return async (error, data) => {
    showToast({
      isError: true,
      message: !data?.body?.artifact?.isEvidence ? t("UNSUCCESSFULLY_UNMARKED_MESSAGE") : t("UNSUCCESSFULLY_MARKED_MESSAGE"),
    });
  };
};
