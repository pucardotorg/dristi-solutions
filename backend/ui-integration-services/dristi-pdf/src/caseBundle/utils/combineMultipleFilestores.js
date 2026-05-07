const { convertFileStoreToDocument } = require("./convertFileStoreToDocument");
const { mergePDFDocuments } = require("./mergePDFDocuments");
const { persistPDF } = require("./persistPDF");
const { logger } = require("../../logger");

async function combineMultipleFilestores(
  fileStoreIds,
  tenantId,
  requestInfo,
  TEMP_FILES_DIR
) {
  if (!Array.isArray(fileStoreIds) || fileStoreIds.length === 0) {
    throw new Error("fileStoreIds must be a non-empty array");
  }

  logger.info("combineMultipleFilestores start", { tenantId, fileStoreIds });
  const pdfDocuments = await Promise.all(
    fileStoreIds.map((id) =>
      convertFileStoreToDocument(tenantId, id, requestInfo)
    )
  );

  const mergedDocumentWithDocket = await mergePDFDocuments(...pdfDocuments);

  return await persistPDF(
    mergedDocumentWithDocket,
    tenantId,
    requestInfo,
    TEMP_FILES_DIR
  );
}

module.exports = { combineMultipleFilestores };
