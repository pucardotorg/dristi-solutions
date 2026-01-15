const { logger } = require("../../logger");
const { applyDocketToDocument } = require("../utils/applyDocketToDocument");
const {
  filterCaseBundleBySection,
} = require("../utils/filterCaseBundleBySection");
const { getDynamicSectionNumber } = require("../utils/getDynamicSectionNumber");

async function processFilingsSection(
  courtCase,
  caseBundleMaster,
  tenantId,
  requestInfo,
  TEMP_FILES_DIR,
  indexCopy
) {
  // move to filings section of case complaint
  logger.info(caseBundleMaster);
  const sectionPosition = indexCopy.sections?.findIndex(
    (s) => s.name === "filings"
  );

  const dynamicSectionNumber = getDynamicSectionNumber(
    indexCopy,
    sectionPosition
  );

  const filingsSection = filterCaseBundleBySection(caseBundleMaster, "filings");
  const sortedFilingSection = [...filingsSection].sort(
    (secA, secB) => secA.sorton - secB.sorton
  );
  let validIndex = 1;
  const filingsLineItems = [];

  for (const section of sortedFilingSection) {
    const documentFileStoreId = courtCase.documents?.find(
      (doc) => doc.documentType === section.doctype
    )?.fileStore;

    if (!documentFileStoreId) continue;

    let newFileStoreId = documentFileStoreId;

    if (section.docketpagerequired === "yes") {
      const complainant = courtCase.litigants?.find((litigant) =>
        litigant.partyType.includes("complainant.primary")
      );
      const docketComplainantName =
        complainant?.additionalDetails?.fullName || "";
      const docketNameOfAdvocate = courtCase.representatives?.find((adv) =>
        adv.representing?.find(
          (party) => party.individualId === complainant.individualId
        )
      )?.additionalDetails?.advocateName;

      const docketCounselFor = docketNameOfAdvocate
        ? `COUNSEL FOR THE COMPLAINANT - ${docketComplainantName}`
        : "";
      const documentPath = `${dynamicSectionNumber}.${validIndex} ${section.Items} in ${dynamicSectionNumber} ${section.section}`;

      newFileStoreId = await applyDocketToDocument(
        documentFileStoreId,
        {
          docketApplicationType: `${section.section.toUpperCase()} - ${
            section.Items
          }`,
          docketCounselFor: docketCounselFor,
          docketNameOfFiling: docketNameOfAdvocate || docketComplainantName,
          docketDateOfSubmission: new Date(
            courtCase.registrationDate
          ).toLocaleDateString("en-IN"),
          documentPath,
        },
        courtCase,
        tenantId,
        requestInfo,
        TEMP_FILES_DIR
      );
    }

    filingsLineItems.push({
      sourceId: documentFileStoreId,
      fileStoreId: newFileStoreId,
      sortParam: validIndex,
      createPDF: false,
      content: "initialFiling",
    });

    validIndex++;
  }

  // update index

  const filingsIndexSection = indexCopy.sections?.find(
    (section) => section.name === "filings"
  );
  filingsIndexSection.lineItems = filingsLineItems?.filter(Boolean);
}

module.exports = {
  processFilingsSection,
};
