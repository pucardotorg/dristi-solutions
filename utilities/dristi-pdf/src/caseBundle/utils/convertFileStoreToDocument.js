const { PDFDocument } = require("pdf-lib");
const { fixJpg } = require("./fixJpg");
const { A4_WIDTH, A4_HEIGHT } = require("./size");
const { search_pdf_v2 } = require("../../api");

async function convertFileStoreToDocument(
  tenantId,
  documentFileStoreId,
  requestInfo
) {
  const { data: stream, headers } = await search_pdf_v2(
    tenantId,
    documentFileStoreId,
    requestInfo
  );
  const mimeType = headers["content-type"];
  let filingPDFDocument;
  if (mimeType === "application/pdf") {
    filingPDFDocument = await PDFDocument.load(stream, {
      ignoreEncryption: true,
    });
  } else if (["image/jpeg", "image/png", "image/jpg"].includes(mimeType)) {
    filingPDFDocument = await PDFDocument.create();
    let img;
    if (mimeType === "image/png") {
      img = await filingPDFDocument.embedPng(stream);
    } else {
      const repairedImage = await fixJpg(stream);
      img = await filingPDFDocument.embedJpg(repairedImage);
    }

    const { width, height } = img.scale(1);
    const scale = Math.min(A4_WIDTH / width, A4_HEIGHT / height);
    const xOffset = (A4_WIDTH - width * scale) / 2;
    const yOffset = (A4_HEIGHT - height * scale) / 2;
    const page = filingPDFDocument.addPage([A4_WIDTH, A4_HEIGHT]);
    page.drawImage(img, {
      x: xOffset,
      y: yOffset,
      width: width * scale,
      height: height * scale,
    });
  }
  return filingPDFDocument;
}

module.exports = {
  convertFileStoreToDocument,
};
