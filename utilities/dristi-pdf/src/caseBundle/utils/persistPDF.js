const fs = require("fs");
const path = require("path");
const { create_file_v2 } = require("../../api");

/**
 *
 * @param {PDFDocument} pdfDoc
 * @param {string} tenantId
 * @param {*}
 * @returns {Promise<string>}
 */
async function persistPDF(pdfDoc, tenantId, requestInfo, TEMP_FILES_DIR) {
  const pdfBytes = await pdfDoc.save();

  const mergedFilePath = path.join(
    TEMP_FILES_DIR,
    `merged-bundle-${Date.now()}.pdf`
  );
  fs.writeFileSync(mergedFilePath, pdfBytes);

  const fileStoreResponse = await create_file_v2({
    filePath: mergedFilePath,
    tenantId,
    requestInfo,
    module: "case-bundle-case-index",
  });
  fs.unlinkSync(mergedFilePath);

  return fileStoreResponse?.data?.files?.[0].fileStoreId;
}

module.exports = {
  persistPDF,
};
