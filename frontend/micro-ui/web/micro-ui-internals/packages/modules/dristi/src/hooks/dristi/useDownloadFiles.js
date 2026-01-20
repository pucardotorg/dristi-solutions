import { useCallback } from "react";
import { Urls } from "../index";
import axiosInstance from "@egovernments/digit-ui-module-core/src/Utils/axiosInstance";
import JSZip from "jszip";

const useDownloadFiles = () => {
  const downloadFilesAsZip = useCallback(async (tenantId, files, zipFileName = "downloaded_files") => {
    if (!files || !files.length) {
      console.warn("No files provided for download");
      return;
    }

    try {
      const zip = new JSZip();
      const token = localStorage.getItem("token");

      const fetchFile = async (fileInfo) => {
        const { fileStoreId, fileName = `file_${fileInfo.fileStoreId}` } = fileInfo;
        const url = `${window.location.origin}${Urls.FileFetchById}?tenantId=${tenantId}&fileStoreId=${fileStoreId}`;

        try {
          const response = await axiosInstance.get(url, {
            responseType: "blob",
            headers: {
              "auth-token": `${token}`,
            },
          });

          const mimeType = response.data.type;
          const extension = mimeType.split("/")[1] || "bin";
          const safeFileName = fileName.replace(/[^a-zA-Z0-9-_.]/g, "_");

          zip.file(`${safeFileName}.${extension}`, response.data);

          return { fileStoreId, success: true };
        } catch (error) {
          console.error(`Error downloading file ${fileStoreId}:`, error);
          return { fileStoreId, success: false, error };
        }
      };

      const loadingElement = document.createElement("div");
      loadingElement.style.position = "fixed";
      loadingElement.style.top = "50%";
      loadingElement.style.left = "50%";
      loadingElement.style.transform = "translate(-50%, -50%)";
      loadingElement.style.background = "rgba(0,0,0,0.7)";
      loadingElement.style.color = "white";
      loadingElement.style.padding = "20px";
      loadingElement.style.borderRadius = "5px";
      loadingElement.style.zIndex = "9999";
      loadingElement.textContent = "Preparing ZIP file...";
      document.body.appendChild(loadingElement);

      const results = await Promise.all(files.map(fetchFile));

      const failedFiles = results.filter((r) => !r.success);
      if (failedFiles.length) {
        console.warn(`${failedFiles.length} files failed to download`);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });

      const blobUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${zipFileName}.zip`;
      document.body.appendChild(link);

      document.body.removeChild(loadingElement);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      return { success: true, failedFiles };
    } catch (error) {
      console.error("Error creating ZIP file:", error);

      const loadingElement = document.querySelector('[style*="Preparing ZIP file"]');
      if (loadingElement) {
        document.body.removeChild(loadingElement);
      }

      return { success: false, error };
    }
  }, []);

  return {
    downloadFilesAsZip,
  };
};

export default useDownloadFiles;
