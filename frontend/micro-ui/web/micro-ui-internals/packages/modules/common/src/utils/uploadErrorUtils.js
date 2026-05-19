export const getUploadErrorToast = (error, t) => {
  const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
  const errorCode = error?.response?.data?.Errors?.[0]?.code || "CS_FILE_UPLOAD_ERROR";
  return {
    label: t(errorCode),
    error: true,
    errorId,
  };
};
