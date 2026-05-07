const { convertFileStoreToDocument } = require("./convertFileStoreToDocument");
const { persistPDF } = require("./persistPDF");
const { logger } = require("../../logger");

async function duplicateExistingFileStore(
  tenantId,
  documentFileStoreId,
  requestInfo,
  TEMP_FILES_DIR
) {
  logger.info("duplicateExistingFileStore start", { tenantId, fileStoreId: documentFileStoreId });
  const document = await convertFileStoreToDocument(
    tenantId,
    documentFileStoreId,
    requestInfo
  );

  return await persistPDF(document, tenantId, requestInfo, TEMP_FILES_DIR);
}

module.exports = {
  duplicateExistingFileStore,
};
