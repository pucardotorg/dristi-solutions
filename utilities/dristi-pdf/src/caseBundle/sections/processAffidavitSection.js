const { applyDocketToDocument } = require("../utils/applyDocketToDocument");
const {
  filterCaseBundleBySection,
} = require("../utils/filterCaseBundleBySection");
const { getDynamicSectionNumber } = require("../utils/getDynamicSectionNumber");

async function processAffidavitSection(
  courtCase,
  caseBundleMaster,
  tenantId,
  requestInfo,
  TEMP_FILES_DIR,
  indexCopy
) {
  // update affidavits
  const affidavitsSection = filterCaseBundleBySection(
    caseBundleMaster,
    "affidavit"
  );

  const sectionPosition = indexCopy.sections.findIndex(
    (s) => s.name === "affidavit"
  );

  const dynamicSectionNumber = getDynamicSectionNumber(
    indexCopy,
    sectionPosition
  );

  const sortedAffidavitsSection = [...affidavitsSection].sort(
    (secA, secB) => secA.sorton - secB.sorton
  );

  const affidavitsLineItems = await Promise.all(
    sortedAffidavitsSection.map(async (section, index) => {
      const documentFileStoreId = courtCase.documents.find(
        (doc) => doc.documentType === section.doctype
      )?.fileStore;
      if (!documentFileStoreId) {
        return null;
      }
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

        const documentPath = `${dynamicSectionNumber}.${index + 1} ${
          section.Items
        } in ${dynamicSectionNumber} ${section.section}`;

        const mergedFilingDocumentFileStoreId = await applyDocketToDocument(
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
            documentPath: documentPath,
          },
          courtCase,
          tenantId,
          requestInfo,
          TEMP_FILES_DIR
        );

        return {
          sourceId: documentFileStoreId,
          fileStoreId: mergedFilingDocumentFileStoreId,
          sortParam: index + 1,
          createPDF: false,
          content: "affidavit",
        };
      } else {
        return {
          sourceId: documentFileStoreId,
          fileStoreId: documentFileStoreId,
          sortParam: index + 1,
          createPDF: false,
          content: "affidavit",
        };
      }
    })
  );

  // update index

  const affidavitsIndexSection = indexCopy.sections.find(
    (section) => section.name === "affidavit"
  );
  affidavitsIndexSection.lineItems = affidavitsLineItems.filter(Boolean);
}

module.exports = {
  processAffidavitSection,
};
