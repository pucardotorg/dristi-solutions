import { Urls } from "../../hooks";
const axios = require("axios");

const getFileByFileStoreId = async (uri) => {
  try {
    const response = await axios.get(uri, {
      responseType: "blob", // Important: Treat the response as a binary Blob
    });
    // Create a file object from the response Blob
    const file = new File([response.data], "downloaded-file.pdf", {
      type: response.data.type,
    });
    return file;
  } catch (error) {
    console.error("Error fetching file:", error);
    throw error;
  }
};

const useCombineMultipleFiles = async (pdfFilesArray, finalFinalName = "combined-document.pdf") => {
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const formData = new FormData();

  for (const file of pdfFilesArray) {
    const { fileStore } = file;
    if (fileStore) {
      const uri = `${window.location.origin}${Urls.FileFetchById}?tenantId=${tenantId}&fileStoreId=${fileStore}`;
      debugger;
      const draftFile = await getFileByFileStoreId(uri);
      debugger;
      formData.append("documents", draftFile);
    } else formData.append("documents", file);
  }

  try {
    const response = await axios.post("https://dristi-kerala-dev.pucar.org/egov-pdf/dristi-pdf/combine-documents", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      responseType: "blob", // Important to handle the response as a Blob
    });
    const file = new File([response.data], finalFinalName, { type: response.data.type });
    return [file];
  } catch (error) {
    console.error("Error:", error);
  }
};

export default useCombineMultipleFiles;
