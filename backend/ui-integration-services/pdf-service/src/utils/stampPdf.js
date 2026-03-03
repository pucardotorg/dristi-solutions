import axios from "axios";
import { PDFDocument } from "pdf-lib";
import envVariables from "../EnvironmentVariables";
import { fileStoreAPICall } from "./fileStoreAPICall";
import logger from "../config/logger";

const egovFileHost = envVariables.EGOV_FILESTORE_SERVICE_HOST;

// ─────────────────────────────────────────────────────────────────────────────
// Seal configuration (from EnvironmentVariables.js)
// ─────────────────────────────────────────────────────────────────────────────
const SEAL_URL     = envVariables.SEAL_URL;
const SEAL_WIDTH   = envVariables.SEAL_WIDTH   || 100;
const SEAL_HEIGHT  = envVariables.SEAL_HEIGHT  || 100;
const SEAL_MARGIN  = envVariables.SEAL_MARGIN  || 20;
const SEAL_OPACITY = envVariables.SEAL_OPACITY || 1.0;

// ─────────────────────────────────────────────────────────────────────────────
// Download the raw PDF bytes from eGov Filestore using the fileStoreId
// ─────────────────────────────────────────────────────────────────────────────
async function downloadPdfFromFilestore(fileStoreId, tenantId, authToken) {
  const downloadUrl = `${egovFileHost}/filestore/v1/files/id?tenantId=${tenantId}&fileStoreId=${fileStoreId}`;

  const headers = {};
  if (authToken) {
    headers["auth-token"] = authToken;
  }

  const response = await axios.get(downloadUrl, {
    responseType: "arraybuffer",
    headers,
  });

  if (!response.data || response.data.byteLength === 0) {
    throw new Error(`Filestore returned empty content for fileStoreId: ${fileStoreId}`);
  }

  return Buffer.from(response.data);
}

// ─────────────────────────────────────────────────────────────────────────────
// Download the seal image bytes from the configured seal URL
// ─────────────────────────────────────────────────────────────────────────────
async function downloadSealImage() {
  const response = await axios.get(SEAL_URL, {
    responseType: "arraybuffer",
  });
  return {
    bytes: Buffer.from(response.data),
    contentType: response.headers["content-type"] || "image/png",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Load PDF, embed seal on the last page at bottom-right, return new bytes
// ─────────────────────────────────────────────────────────────────────────────
async function embedSealOnPdf(pdfBytes, sealBytes, sealContentType) {
  const pdfDoc = await PDFDocument.load(pdfBytes);

  // Embed seal image — pdf-lib supports PNG and JPEG natively
  let sealImage;
  const type = sealContentType.toLowerCase();

  if (type.includes("png")) {
    sealImage = await pdfDoc.embedPng(sealBytes);
  } else if (type.includes("jpeg") || type.includes("jpg")) {
    sealImage = await pdfDoc.embedJpg(sealBytes);
  } else {
    logger.warn("Unknown seal content-type, attempting PNG embed", { sealContentType });
    sealImage = await pdfDoc.embedPng(sealBytes);
  }

  const pages = pdfDoc.getPages();
  const lastPage = pages[pages.length - 1];

  const { width, height } = lastPage.getSize();
  const scaledDims = sealImage.scaleToFit(SEAL_WIDTH, SEAL_HEIGHT);

  // Position: bottom-right corner with margin
  const x = width  - scaledDims.width  - SEAL_MARGIN;
  const y = SEAL_MARGIN;

  lastPage.drawImage(sealImage, {
    x,
    y,
    width:   scaledDims.width,
    height:  scaledDims.height,
    opacity: SEAL_OPACITY,
  });

  const stampedBytes = await pdfDoc.save();
  return Buffer.from(stampedBytes);
}

// ─────────────────────────────────────────────────────────────────────────────
// Upload stamped PDF to filestore — returns new fileStoreId
// ─────────────────────────────────────────────────────────────────────────────
async function uploadStampedPdf(pdfBuffer, originalFileStoreId, tenantId, header) {
  const filename = `stamped-${originalFileStoreId}-${Date.now()}.pdf`;

  const newFileStoreId = await fileStoreAPICall(filename, tenantId, pdfBuffer, header);

  if (!newFileStoreId) {
    throw new Error("Filestore upload succeeded but returned no fileStoreId");
  }

  return newFileStoreId;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main exported function — orchestrates the full stamp flow
// ─────────────────────────────────────────────────────────────────────────────
export const stampPdf = async function (fileStoreId, tenantId, header, authToken) {
  // 1. Download the original PDF
  const pdfBytes = await downloadPdfFromFilestore(fileStoreId, tenantId, authToken);
  logger.info("PDF downloaded from filestore", { fileStoreId, sizeBytes: pdfBytes.length });

  // 2. Download the seal image
  const { bytes: sealBytes, contentType: sealContentType } = await downloadSealImage();

  // 3. Embed the seal on the last page
  const stampedPdfBytes = await embedSealOnPdf(pdfBytes, sealBytes, sealContentType);

  // 4. Upload the stamped PDF to filestore
  const newFileStoreId = await uploadStampedPdf(stampedPdfBytes, fileStoreId, tenantId, header);
  logger.info("Stamped PDF uploaded", { originalFileStoreId: fileStoreId, newFileStoreId });

  return newFileStoreId;
};
