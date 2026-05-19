/**
 * Shared document-upload helpers used by FileCase and edit-profile flows.
 *
 * Both flows repeatedly take an array of documents (e.g. `companyDetailsUpload.document`,
 * `supportingDocument.document`, `inquiryAffidavitFileUpload.document`), upload each via
 * `onDocumentUpload`, build a doc descriptor `{ documentType, fileStore, documentName, fileName }`,
 * push it onto a `docList` accumulator, and return the descriptor.
 *
 * `onDocumentUpload` is passed in as a parameter (rather than imported) to avoid a
 * circular dependency between this shared module and the pages that originally owned it.
 */

export const uploadProfileDocumentArray = async ({
  documentArray,
  documentType,
  fileName,
  tenantId,
  docList,
  onDocumentUpload,
  onUploaded,
}) => {
  if (!Array.isArray(documentArray) || documentArray.length === 0) {
    return undefined;
  }
  return Promise.all(
    documentArray.map(async (document) => {
      if (!document) {
        return undefined;
      }
      const uploadedData = await onDocumentUpload(documentType, document, document.name, tenantId);
      if (typeof onUploaded === "function") {
        onUploaded(uploadedData, document);
      }
      const doc = {
        documentType,
        fileStore: uploadedData.file?.files?.[0]?.fileStoreId || document?.fileStore,
        documentName: uploadedData.filename || document?.documentName,
        fileName,
      };
      docList.push(doc);
      return doc;
    })
  );
};
