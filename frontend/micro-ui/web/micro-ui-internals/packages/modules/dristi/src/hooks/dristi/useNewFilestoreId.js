import { useCallback, useState } from "react";
import { Urls } from "..";
import axiosInstance from "@egovernments/digit-ui-module-core/src/Utils/axiosInstance";

const useNewFileStoreId = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const newFilestore = useCallback(async (tenantId, fileStoreId, filename) => {
    if (!tenantId || !fileStoreId) {
      setError("Tenant ID and File Store ID are required");
      return null;
    }

    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const url = `${window.location.origin}${Urls.FileFetchById}?tenantId=${tenantId}&fileStoreId=${fileStoreId}`;

      const response = await axiosInstance.get(url, {
        responseType: "blob",
        headers: {
          "auth-token": `${token}`,
        },
      });
      const blob = new File([response.data], filename, {
        type: response.data.type,
      });
      const newFileStoreId = await window?.Digit.UploadServices.Filestorage("DRISTI", blob, tenantId);
      setLoading(false);

      return { file: newFileStoreId?.data, fileType: blob.type, filename, fileStoreId: newFileStoreId?.data?.files?.[0]?.fileStoreId };
    } catch (error) {
      setLoading(false);
      setError(error.message);
      return null;
    }
  }, []);

  return { newFilestore, loading, error };
};

export default useNewFileStoreId;
