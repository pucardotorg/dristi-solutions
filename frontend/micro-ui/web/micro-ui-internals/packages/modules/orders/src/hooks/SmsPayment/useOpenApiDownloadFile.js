import { useCallback } from "react";
import { Urls } from "../services/Urls";
import axiosInstance from "@egovernments/digit-ui-module-core/src/Utils/axiosInstance";

export const useOpenApiDownloadFile = () => {
  const download = useCallback(async (fileStoreId, tenantId = "kl", moduleName = "DRISTI", filename) => {
    if (!fileStoreId) return console.error("fileStoreId missing");

    try {
      const res = await axiosInstance.post(
        `${Urls.openApi.FileFetchByFileStore}`,
        {
          tenantId,
          fileStoreId,
          moduleName,
        },
        { responseType: "blob" }
      );

      let fileName = filename || "document.pdf";
      fileName = fileName.replace(/\.[^/.]+$/, "") + ".pdf";

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("useOpenApiDownloadFile error =>", err);
      throw err;
    }
  }, []);

  return { download };
};
