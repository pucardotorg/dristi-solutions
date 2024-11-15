const { create_pdf, search_pdf, create_file } = require("../utils");
const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");
const axios = require("axios");

const TEMP_FILES_DIR = path.join(__dirname, "../temp");

if (!fs.existsSync(TEMP_FILES_DIR)) {
  fs.mkdirSync(TEMP_FILES_DIR);
}

// Function to process line items in a section
async function processSectionLineItems(tenantId, section, requestInfo) {
  const fileStoreIds = [];

  if (section.lineItems && section.lineItems.length > 0) {
    for (const item of section.lineItems) {
      if (item.createPDF) {
        // Generate a PDF for this line item
        const pdfResponse = await create_pdf(tenantId, item.content, {}, requestInfo);

        const tempFilePath = path.join(TEMP_FILES_DIR, `temp-${Date.now()}.pdf`);
        const fileStream = fs.createWriteStream(tempFilePath);

        pdfResponse.data.pipe(fileStream);
        await new Promise((resolve) => fileStream.on("finish", resolve));

        // Upload the created PDF
        const uploadedFile = await create_file(tempFilePath, tenantId, "case-bundle", "application/pdf");
        fs.unlinkSync(tempFilePath);

        item.fileStoreId = uploadedFile.data.files[0].fileStoreId;
        fileStoreIds.push(item.fileStoreId);
      } else if (item.fileStoreId) {
        // Validate existing fileStoreId
        const pdfResponse = await search_pdf(tenantId, item.fileStoreId);
        if (pdfResponse.status !== 200) {
          throw new Error(`Invalid fileStoreId: ${item.fileStoreId}`);
        }
        fileStoreIds.push(item.fileStoreId);
      }
    }
  }

  return fileStoreIds;
}

// Function to merge PDFs
async function mergePdfs(fileStoreIds, tenantId) {
  const mergedPdf = await PDFDocument.create();

  for (const fileStoreId of fileStoreIds) {
    const pdfResponse = await search_pdf(tenantId, fileStoreId);
    if (pdfResponse.status === 200) {
      const pdfUrl = pdfResponse.data[fileStoreId];
      const pdfFetchResponse = await axios.get(pdfUrl, { responseType: "arraybuffer" });
      const pdfData = pdfFetchResponse.data;

      const pdfDoc = await PDFDocument.load(pdfData);
      const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }
  }

  return mergedPdf;
}

// Function to process the case bundle based on state
async function processCaseBundle(tenantId, caseId, index, state, requestInfo) {
  console.log(`Processing caseId: ${caseId}, state: ${state}`);

  let fileStoreIds = [];

  switch (state.toUpperCase()) {
    case "PENDING_ADMISSION_HEARING":
      console.log("Processing 'PENDING_ADMISSION_HEARING' state...");
      for (const section of index.sections) {
        if (
          section.name === "titlepage" ||
          section.name === "adiary" ||
          section.name === "pendingapplications" ||
          section.name === "complaint"
        ) {
          const sectionFileStoreIds = await processSectionLineItems(tenantId, section, requestInfo);
          fileStoreIds.push(...sectionFileStoreIds);
        }
      }
      break;

    case "CASE_ADMITTED":
      console.log("Processing 'CASE_ADMITTED' state...");
      for (const section of index.sections) {
        if (section.name === "filings" || section.name === "affidavit") {
          const sectionFileStoreIds = await processSectionLineItems(tenantId, section, requestInfo);
          fileStoreIds.push(...sectionFileStoreIds);
        }
      }
      break;

    case "CASE_REASSIGNED":
      console.log("Processing 'CASE_REASSIGNED' state...");
      for (const section of index.sections) {
        if (section.name === "vakalat" || section.name === "additionalfilings") {
          const sectionFileStoreIds = await processSectionLineItems(tenantId, section, requestInfo);
          fileStoreIds.push(...sectionFileStoreIds);
        }
      }
      break;

    default:
      console.error(`Unknown state: ${state}`);
      throw new Error(`Unknown state: ${state}`);
  }

  // Merge PDFs
  const mergedPdf = await mergePdfs(fileStoreIds, tenantId);

  // Save and upload the final merged PDF
  const mergedPdfBytes = await mergedPdf.save();
  const mergedFilePath = path.join(TEMP_FILES_DIR, `merged-bundle-${Date.now()}.pdf`);
  fs.writeFileSync(mergedFilePath, mergedPdfBytes);

  const finalFileUpload = await create_file(mergedFilePath, tenantId, "case-bundle", "application/pdf");
  fs.unlinkSync(mergedFilePath);

  // Update index with final fileStoreId
  index.fileStoreId = finalFileUpload.data.files[0].fileStoreId;
  index.contentLastModified = Math.floor(Date.now() / 1000);

  return index;
}

module.exports = processCaseBundle;
