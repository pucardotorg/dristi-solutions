const { convertFileStoreToDocument } = require("./convertFileStoreToDocument");
const { persistPDF } = require("./persistPDF");
const { logger } = require("../../logger");

async function duplicateExistingFileStore(
  tenantId,
  documentFileStoreId,
  requestInfo,
  TEMP_FILES_DIR
) {
  logger.info(`[duplicateExistingFileStore] Duplicating | fileStoreId: ${documentFileStoreId}`);
  try {
    const document = await convertFileStoreToDocument(
      tenantId,
      documentFileStoreId,
      requestInfo
    );
    const newId = await persistPDF(document, tenantId, requestInfo, TEMP_FILES_DIR);
    logger.info(`[duplicateExistingFileStore] Duplicated | sourceFileStoreId: ${documentFileStoreId}, newFileStoreId: ${newId}`);
    return newId;
  } catch (err) {
    logger.error(`[duplicateExistingFileStore] Failed | fileStoreId: ${documentFileStoreId} | error: ${err.message}`);
    throw err;
  }
}

module.exports = {
  duplicateExistingFileStore,
};
