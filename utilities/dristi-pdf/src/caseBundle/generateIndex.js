const { search_pdf, create_file } = require("../api"); // Removed create_pdf import
const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");
const axios = require("axios");

const TEMP_FILES_DIR = path.join(__dirname, "../temp");

if (!fs.existsSync(TEMP_FILES_DIR)) {
  fs.mkdirSync(TEMP_FILES_DIR);
}

// Master Data
const MASTER_DATA = [
  { name: "Cheque", section: "filings", docType: "case.cheque", active: true, order: 1 },
  { name: "Cheque Deposit Slip", section: "filings", docType: "case.cheque.depositslip", active: true, order: 2 },
  { name: "Cheque Return Memo", section: "filings", docType: "case.cheque.returnmemo", active: true, order: 3 },
  { name: "Demand Notice", section: "filings", docType: "case.demandnotice", active: true, order: 4 },
  { name: "Proof of Dispatch of Demand Notice", section: "filings", docType: "case.demandnotice.proof", active: true, order: 5 },
  { name: "Proof of Service of Demand Notice", section: "filings", docType: "case.demandnotice.serviceproof", active: true, order: 6 },
  { name: "Reply Notice", section: "filings", docType: "case.replynotice", active: true, order: 7 },
  { name: "Proof of Liability", section: "filings", docType: "case.liabilityproof", active: true, order: 8 },
  { name: "Proof of Authorization", section: "filings", docType: "case.authorizationproof", active: true, order: 9 },
  { name: "Affidavit under Section 223 BNSS", section: "affidavit", docType: "case.affidavit.223bnss", active: true, order: 1 },
  { name: "Affidavit of Proof under Section 225 BNSS", section: "affidavit", docType: "case.affidavit.225bnss", active: true, order: 2 },
  { name: "Vakalatnama", section: "vakalat", docType: null, active: true },
];

// Function to retrieve documents from the master data
function getDocumentsForSection(sectionName) {
  return MASTER_DATA.filter((doc) => doc.section === sectionName && doc.active);
}

// Function to process documents for a section
async function processSectionDocuments(tenantId, section, requestInfo) {
  const fileStoreIds = [];

  console.log(`Processing section: ${section.name}`);

  const documents = getDocumentsForSection(section.name);
  if (documents.length === 0) {
    console.log(`No active documents found for section: ${section.name}`);
    return fileStoreIds;
  }

  for (const doc of documents) {
    // Simulate retrieving the fileStoreId (in a real scenario, fetch from the database or service)
    const fileStoreId = `fileStore-${doc.docType}-${Date.now()}`;
    console.log(`Validating fileStoreId: ${fileStoreId} for document: ${doc.name}`);

    // Validate the fileStoreId
    const pdfResponse = await search_pdf(tenantId, fileStoreId);
    if (pdfResponse.status !== 200) {
      console.error(`Invalid fileStoreId: ${fileStoreId} for document: ${doc.name}`);
      continue;
    }

    fileStoreIds.push(fileStoreId);
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

// Main Function
async function processCaseBundle(tenantId, caseId, index, state, requestInfo) {
  console.log(`Processing caseId: ${caseId}, state: ${state}`);

  let fileStoreIds = [];

  switch (state.toUpperCase()) {
    case "PENDING_ADMISSION_HEARING":
      for (const section of index.sections) {
        if (["filings", "affidavit", "vakalat"].includes(section.name)) {
          const sectionFileStoreIds = await processSectionDocuments(tenantId, section, requestInfo);
          fileStoreIds.push(...sectionFileStoreIds);
        }
      }
      break;

    case "CASE_ADMITTED":
      for (const section of index.sections) {
        if (["filings", "affidavit"].includes(section.name)) {
          const sectionFileStoreIds = await processSectionDocuments(tenantId, section, requestInfo);
          fileStoreIds.push(...sectionFileStoreIds);
        }
      }
      break;

    case "CASE_REASSIGNED":
      for (const section of index.sections) {
        if (["vakalat"].includes(section.name)) {
          const sectionFileStoreIds = await processSectionDocuments(tenantId, section, requestInfo);
          fileStoreIds.push(...sectionFileStoreIds);
        }
      }
      break;

    default:
      console.error(`Unknown state: ${state}`);
      throw new Error(`Unknown state: ${state}`);
  }

  console.log("Merging PDFs...");
  const mergedPdf = await mergePdfs(fileStoreIds, tenantId);

  console.log("Uploading merged PDF...");
  const mergedPdfBytes = await mergedPdf.save();
  const mergedFilePath = path.join(TEMP_FILES_DIR, `merged-bundle-${Date.now()}.pdf`);
  fs.writeFileSync(mergedFilePath, mergedPdfBytes);

  const finalFileUpload = await create_file(mergedFilePath, tenantId, "case-bundle", "application/pdf");
  fs.unlinkSync(mergedFilePath);

  index.fileStoreId = finalFileUpload.data.files[0].fileStoreId;
  index.contentLastModified = Math.floor(Date.now() / 1000);

  return index;
}

module.exports = processCaseBundle;
