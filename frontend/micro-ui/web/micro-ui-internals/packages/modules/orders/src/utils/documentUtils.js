/**
 * Utility functions for handling document operations
 */

/**
 * Uploads a document to the file storage
 * @param {Object} fileData - The file data to upload
 * @param {string} filename - The name of the file
 * @param {string} tenantId - The tenant ID
 * @returns {Promise<Object>} The uploaded file data
 */
export const uploadDocument = async (fileData, filename, tenantId) => {
  if (fileData?.fileStore) return fileData;
  const fileUploadRes = await window?.Digit.UploadServices.Filestorage("DRISTI", fileData, tenantId);
  return { file: fileUploadRes?.data, fileType: fileData.type, filename };
};

/**
 * Replaces uploaded documents with combined file in form data
 * @param {Object} formData - The form data containing documents
 * @param {string} tenantId - The tenant ID
 * @returns {Promise<Object>} Updated form data with combined files
 */
export const replaceUploadedDocsWithCombinedFile = async (formData, tenantId) => {
  try {
    const docsArray = formData?.lprDocuments?.documents;
    if (!Array.isArray(docsArray) || docsArray.length === 0) {
      return formData;
    }

    const uploadedDocs = await Promise.all(
      docsArray.map(async (fileData) => {
        if (fileData?.fileStore) {
          return fileData;
        }
        try {
          const docs = await uploadDocument(fileData, fileData?.name, tenantId);
          return {
            documentType: docs?.fileType || "application/pdf",
            fileStore: docs?.file?.files?.[0]?.fileStoreId || null,
            additionalDetails: { name: docs?.filename || fileData?.name || "lpr" },
          };
        } catch (err) {
          console.error("Error uploading document:", fileData, err);
          return null;
        }
      })
    );

    formData.lprDocuments.documents = uploadedDocs.filter(Boolean);
    return formData;
  } catch (err) {
    console.error("replaceUploadedDocsWithCombinedFile failed:", err);
    throw err;
  }
};
