import axiosInstance from "@egovernments/digit-ui-module-core/src/Utils/axiosInstance";

/** Downloads a blob from an authenticated URL and triggers browser save dialog. */
export const downloadBlobFromAuthenticatedUrl = async (url, fileName, { pdf = false, headers = {} } = {}) => {
  if (!url) {
    return false;
  }
  try {
    const response = await axiosInstance.get(url, {
      headers,
      responseType: "blob",
    });
    if (response?.status && response.status !== 200) {
      console.error("Failed to fetch the file:", response.statusText);
      return false;
    }
    const mimeType = response?.data?.type || "application/octet-stream";
    const extension = mimeType.includes("/") ? mimeType.split("/")[1] : "bin";
    const blob = new Blob([response.data], { type: pdf ? "application/pdf" : mimeType });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `${fileName}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
    return true;
  } catch (error) {
    console.error("Error downloading the file:", error);
    return false;
  }
};

export default downloadBlobFromAuthenticatedUrl;
