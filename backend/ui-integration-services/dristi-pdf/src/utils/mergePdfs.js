const { PDFDocument } = require("pdf-lib");

async function mergePdfs(pdfBuffers) {
  const mergedPdf = await PDFDocument.create();

  for (const pdfBuffer of pdfBuffers) {
    if (!Buffer.isBuffer(pdfBuffer)) {
      throw new Error("Invalid PDF Buffer");
    }
    const pdf = await PDFDocument.load(pdfBuffer); // Load PDF from Buffer
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  const pdfUint8Array = await mergedPdf.save();
  return Buffer.from(pdfUint8Array);
}

module.exports = { mergePdfs };
