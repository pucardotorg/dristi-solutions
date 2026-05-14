const { PDFDocument } = require("pdf-lib");
const { create_pdf_v2 } = require("../../api");
const { persistPDF } = require("../utils/persistPDF");
const { logger } = require("../../logger");
const {
  filterCaseBundleBySection,
} = require("../utils/filterCaseBundleBySection");

async function processTitlePageSection(
  courtCase,
  caseBundleMaster,
  tenantId,
  requestInfo,
  TEMP_FILES_DIR,
  indexCopy
) {
  const titlepageSection = filterCaseBundleBySection(
    caseBundleMaster,
    "titlepage"
  );

  if (titlepageSection.length !== 0) {
    const coverCaseName = courtCase.caseTitle;
    const coverCaseType = courtCase.caseType;
    const coverCaseNumber =
      (courtCase?.isLPRCase
        ? courtCase?.lprNumber
        : courtCase.courtCaseNumber) ||
      courtCase.cmpNumber ||
      courtCase.filingNumber;
    const coverYear = (
      courtCase?.filingDate ? new Date(courtCase?.filingDate) : new Date()
    )?.getFullYear();
    const data = {
      Data: [{ coverCaseName, coverCaseType, coverCaseNumber, coverYear }],
    };
    const caseCoverPdfResponse = await create_pdf_v2(
      tenantId,
      "cover-page-pdf",
      data,
      { RequestInfo: requestInfo }
    );
    const caseCoverDoc = await PDFDocument.load(caseCoverPdfResponse.data, {
      ignoreEncryption: true,
    }).catch((e) => {
      logger.error(JSON.stringify(e));
      throw e;
    });

    const titlepageFileStoreId = await persistPDF(
      caseCoverDoc,
      tenantId,
      requestInfo,
      TEMP_FILES_DIR
    ).catch((e) => {
      logger.error(JSON.stringify(e));
      throw e;
    });

    // update index
    const titlepageIndexSection = indexCopy.sections?.find(
      (section) => section.name === "titlepage"
    );

    titlepageIndexSection.lineItems = [
      {
        content: "cover",
        createPDF: false,
        sourceId: titlepageFileStoreId,
        fileStoreId: titlepageFileStoreId,
        sortParam: null,
      },
    ];
  }
}

module.exports = {
  processTitlePageSection,
};
