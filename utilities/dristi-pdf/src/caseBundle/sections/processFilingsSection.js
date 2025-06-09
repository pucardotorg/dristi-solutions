const { logger } = require("../../logger");
const { applyDocketToDocument } = require("../utils/applyDocketToDocument");
const {
  filterCaseBundleBySection,
} = require("../utils/filterCaseBundleBySection");

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
  const filingsSection = filterCaseBundleBySection(caseBundleMaster, "filings");
  const sortedFilingSection = [...filingsSection].sort(
    (secA, secB) => secA.sorton - secB.sorton
  );
  let validIndex = 0;
  const filingsLineItems = await Promise.all(
    sortedFilingSection.map(async (section, index) => {
      const documentFileStoreId = courtCase.documents.find(
        (doc) => doc.documentType === section.doctype
      )?.fileStore;
      if (!documentFileStoreId) {
        return null;
      }
      let newFileStoreId = documentFileStoreId;
      if (section.docketpagerequired === "yes") {
        const complainant = courtCase.litigants?.find((litigant) =>
          litigant.partyType.includes("complainant.primary")
        );
        const docketComplainantName = complainant.additionalDetails.fullName;
        const docketNameOfAdvocate = courtCase.representatives?.find((adv) =>
          adv.representing?.find(
            (party) => party.individualId === complainant.individualId
          )
        )?.additionalDetails?.advocateName;

        const documentPath = `3.${validIndex + 1} ${section.Items} in 3 ${
          section.section
        }`;
        newFileStoreId = await applyDocketToDocument(
          documentFileStoreId,
          {
            docketApplicationType: `${section.section.toUpperCase()} - ${
              section.Items
            }`,
            docketCounselFor: "COMPLAINANT",
            docketNameOfFiling: docketComplainantName,
            docketNameOfAdvocate: docketNameOfAdvocate || docketComplainantName,
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
      validIndex++;
      return {
        sourceId: documentFileStoreId,
        fileStoreId: newFileStoreId,
        sortParam: index + 1,
        createPDF: false,
        content: "initialFiling",
      };
    })
  );

  // update index

  const filingsIndexSection = indexCopy.sections.find(
    (section) => section.name === "filings"
  );
  filingsIndexSection.lineItems = filingsLineItems.filter(Boolean);
}

module.exports = {
  processFilingsSection,
};
