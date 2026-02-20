import { useCallback } from "react";
import { Urls } from "../index";
import axiosInstance from "@egovernments/digit-ui-module-core/src/Utils/axiosInstance";

const useDownloadCasePdf = () => {
  const downloadPdf = useCallback(async (tenantId, fileStoreId, fileName = "downloadedFile") => {
    if (!fileStoreId) {
      return;
    }
    const token = localStorage.getItem("token");
    const url = `${window.location.origin}${Urls.FileFetchById}?tenantId=${tenantId}&fileStoreId=${fileStoreId}`;

    try {
      const response = await axiosInstance.get(url, {
        responseType: "blob",
        headers: {
          "auth-token": `${token}`,
        },
      });
      const mimeType = response.data.type;
      const extension = mimeType.split("/")[1];

      const blob = new Blob([response.data], { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${fileName}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error downloading the PDF:", error);
      throw error;
    }
  }, []);

  return { downloadPdf };
};

export default useDownloadCasePdf;
