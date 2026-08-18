const fs = require("fs");
const path = require("path");
const { create_file_v2 } = require("../../api");
const { logger } = require("../../logger");

/**
 *
 * @param {PDFDocument} pdfDoc
 * @param {string} tenantId
 * @param {*}
 * @returns {Promise<string>}
 */
async function persistPDF(pdfDoc, tenantId, requestInfo, TEMP_FILES_DIR) {
  const mergedFilePath = path.join(
    TEMP_FILES_DIR,
    `merged-bundle-${Date.now()}.pdf`
  );
  try {
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(mergedFilePath, pdfBytes);
    logger.info(`[persistPDF] Uploading to FileStore | tenantId: ${tenantId}, tempFile: ${path.basename(mergedFilePath)}`);

    const fileStoreResponse = await create_file_v2({
      filePath: mergedFilePath,
      tenantId,
      requestInfo,
      module: "case-bundle-case-index",
    });

    const fileStoreId = fileStoreResponse?.data?.files?.[0].fileStoreId;
    if (!fileStoreId) {
      throw new Error("FileStore upload returned no fileStoreId");
    }
    logger.info(`[persistPDF] Upload succeeded | fileStoreId: ${fileStoreId}`);
    return fileStoreId;
  } catch (err) {
    logger.error(`[persistPDF] Failed | tenantId: ${tenantId}, tempFile: ${path.basename(mergedFilePath)} | error: ${err.message}`);
    throw err;
  } finally {
    if (fs.existsSync(mergedFilePath)) {
      fs.unlinkSync(mergedFilePath);
    }
  }
}

module.exports = {
  persistPDF,
};
