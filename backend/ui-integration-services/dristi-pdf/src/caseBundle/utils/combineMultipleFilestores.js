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

  logger.info(`[combineMultipleFilestores] Combining ${fileStoreIds.length} fileStore(s) | ids: [${fileStoreIds.join(", ")}]`);
  try {
    const pdfDocuments = await Promise.all(
      fileStoreIds.map((id) =>
        convertFileStoreToDocument(tenantId, id, requestInfo)
      )
    );

    const mergedDocumentWithDocket = await mergePDFDocuments(...pdfDocuments);

    const resultId = await persistPDF(
      mergedDocumentWithDocket,
      tenantId,
      requestInfo,
      TEMP_FILES_DIR
    );
    logger.info(`[combineMultipleFilestores] Combined successfully | resultFileStoreId: ${resultId}`);
    return resultId;
  } catch (err) {
    logger.error(`[combineMultipleFilestores] Failed | fileStoreIds: [${fileStoreIds.join(", ")}] | error: ${err.message}`);
    throw err;
  }
}

module.exports = { combineMultipleFilestores };
