import { useCallback } from "react";
import Axios from "axios";
import { Urls } from "../services/Urls";

export const useOpenApiDownloadFile = () => {

  const download = useCallback(async (fileStoreId, tenantId = "kl", moduleName = "DRISTI") => {
    if (!fileStoreId) return console.error("fileStoreId missing");

    try {
      const res = await Axios({
        method: "POST",
        url: `${Urls.openApi.FileFetchByFileStore}`,
        data: {
          tenantId,
          fileStoreId,
          moduleName,
        },
        responseType: "blob",
      });

      const fileName =
        res.headers["content-disposition"]?.split("filename=")[1] || "document.pdf";

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
