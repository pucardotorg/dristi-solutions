const { create_file, search_mdms } = require("../api");
const { PDFDocument, rgb } = require("pdf-lib");
const fs = require("fs");
const path = require("path");
const {
  convertFileStoreToDocument,
} = require("./utils/convertFileStoreToDocument");
const { logger } = require("../logger");

/**
 * @typedef CaseBundleMaster
 * @type {object}
 * @property {string} Items
 * @property {string} docketpagerequired
 * @property {string} doctype
 * @property {string} id
 * @property {string} isactive
 * @property {string} name
 * @property {string} section
 * @property {string} sorton
 */

async function buildCasePdf(caseNumber, index, requestInfo, tenantId) {
  logger.info(`[buildCasePdf] Started | caseNumber: ${caseNumber}, tenantId: ${tenantId}`);
  try {
    /**
     * @type {CaseBundleMaster[]}
     */
    logger.info(`[buildCasePdf] Fetching MDMS case_bundle_master | tenantId: ${tenantId}`);
    const caseBundleDesign = await search_mdms(
      null,
      "CaseManagement.case_bundle_master",
      tenantId,
      requestInfo
    ).then((mdmsRes) => {
      return mdmsRes.data.mdms?.filter((x) => x.isActive)?.map((x) => x.data);
    });

    if (!caseBundleDesign || caseBundleDesign.length === 0) {
      throw new Error("No case bundle design found in MDMS.");
    }
    logger.info(`[buildCasePdf] MDMS design fetched | sections: ${caseBundleDesign.length}`);

    // Create a new PDF document to merge all sections
    const mergedPdf = await PDFDocument.create();
    let totalPagesAdded = 0;

    // Iterate through sections in the index
    for (const section of index.sections) {
      if (!section || !section.name) {
        logger.warn(`[buildCasePdf] Skipping section with no name`);
        continue;
      }

      const sectionConfig = caseBundleDesign?.find(
        (design) => design.name === section.name && design.isactive
      );

      if (!sectionConfig) {
        logger.warn(`[buildCasePdf] Section '${section.name}' is not enabled in the design, skipping`);
        continue;
      }

      if (!section.lineItems || section.lineItems.length === 0) {
        logger.info(`[buildCasePdf] Section '${section.name}' has no line items, skipping`);
        continue;
      }

      logger.info(`[buildCasePdf] Processing section: '${section.name}' | lineItems: ${section.lineItems.length}`);

      // Process each line item
      for (let itemIdx = 0; itemIdx < section.lineItems.length; itemIdx++) {
        const item = section.lineItems[itemIdx];
        if (!item || !item.fileStoreId || !item.content) {
          logger.warn(`[buildCasePdf] Skipping invalid line item at index ${itemIdx} in section '${section.name}'`);
          continue;
        }

        try {
          logger.info(`[buildCasePdf] Fetching document | section: '${section.name}', item: ${itemIdx + 1}/${section.lineItems.length}, fileStoreId: ${item.fileStoreId}`);
          // Fetch PDF from fileStoreId
          const itemPdf = await convertFileStoreToDocument(
            tenantId,
            item.fileStoreId,
            requestInfo
          );

          // Add case number to each page
          const pages = itemPdf.getPages();
          for (const page of pages) {
            const { width, height } = page.getSize();
            page.drawText(`Case Number: ${caseNumber}`, {
              x: width / 2 - 50,
              y: height - 30,
              size: 12,
              color: rgb(0, 0, 0),
            });
          }

          // Merge the fetched PDF pages
          const copiedPages = await mergedPdf.copyPages(
            itemPdf,
            itemPdf.getPageIndices()
          );
          copiedPages.forEach((page) => mergedPdf.addPage(page));
          totalPagesAdded += pages.length;
          logger.info(`[buildCasePdf] Merged ${pages.length} page(s) | section: '${section.name}', fileStoreId: ${item.fileStoreId}, totalPages: ${totalPagesAdded}`);
        } catch (error) {
          logger.error(
            `[buildCasePdf] Failed to process item | section: '${section.name}', item: ${itemIdx + 1}/${section.lineItems.length}, fileStoreId: '${item.fileStoreId}' | error: ${error.message}`
          );
        }
      }
    }

    // Add page numbers to the final merged PDF
    const mergedPages = mergedPdf.getPages();
    mergedPages.forEach((page, index) => {
      const { width } = page.getSize();
      const pageNumber = index + 1;
      page.drawText(`Page ${pageNumber}`, {
        x: width - 100,
        y: 30,
        size: 10,
        color: rgb(0, 0, 0),
      });
    });

    // Create a temporary directory and unique file name
    const directoryPath =
      process.env.TEMP_FILES_DIR || path.join(__dirname, "../case-bundles");
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }

    const tempFileName = `bundle-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.pdf`;
    const filePath = path.join(directoryPath, tempFileName);

    try {
      logger.info(`[buildCasePdf] Saving merged PDF | totalPages: ${mergedPages.length}, tempFile: ${tempFileName}`);
      // Save the merged PDF
      const pdfBytes = await mergedPdf.save();
      fs.writeFileSync(filePath, pdfBytes);

      logger.info(`[buildCasePdf] Uploading merged PDF to FileStore | tenantId: ${tenantId}`);
      // Upload the merged PDF and update the index
      const fileStoreResponse = await create_file(
        filePath,
        tenantId,
        "case-bundle",
        "application/pdf"
      );
      const fileStoreId = fileStoreResponse?.data?.files?.[0].fileStoreId;

      if (!fileStoreId) {
        throw new Error("FileStore upload returned no fileStoreId");
      }

      index.fileStoreId = fileStoreId;
      index.pdfCreatedDate = Date.now();

      logger.info(`[buildCasePdf] Completed | caseNumber: ${caseNumber}, fileStoreId: ${fileStoreId}, totalPages: ${mergedPages.length}`);
      return { ...index, pageCount: mergedPages.length };
    } finally {
      // Ensure cleanup of the temporary file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  } catch (error) {
    logger.error(`[buildCasePdf] Failed | caseNumber: ${caseNumber}, tenantId: ${tenantId} | error: ${error.message}`);
    throw error;
  }
}

module.exports = buildCasePdf;
