const { PDFDocument } = require("pdf-lib");

/**
 *
 * @param  {...PDFDocument} pdfDocuments
 * @returns
 */
async function mergePDFDocuments(...pdfDocuments) {
  const pdfDocument = await PDFDocument.create();
  for (const pdfDoc of pdfDocuments) {
    const copiedPages = await pdfDocument.copyPages(
      pdfDoc,
      pdfDoc.getPageIndices()
    );
    copiedPages.forEach((page) => pdfDocument.addPage(page));
  }
  return pdfDocument;
}

module.exports = {
  mergePDFDocuments,
};
