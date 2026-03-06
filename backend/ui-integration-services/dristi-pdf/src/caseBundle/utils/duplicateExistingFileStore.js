const { convertFileStoreToDocument } = require("./convertFileStoreToDocument");
const { persistPDF } = require("./persistPDF");

async function duplicateExistingFileStore(
  tenantId,
  documentFileStoreId,
  requestInfo,
  TEMP_FILES_DIR
) {
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
