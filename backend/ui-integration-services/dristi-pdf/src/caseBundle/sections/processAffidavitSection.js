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

  const sectionPosition = indexCopy.sections?.findIndex(
    (s) => s.name === "affidavit"
  );

  const dynamicSectionNumber = getDynamicSectionNumber(
    indexCopy,
    sectionPosition
  );

  const sortedAffidavitsSection = [...affidavitsSection].sort(
    (secA, secB) => secA.sorton - secB.sorton
  );

  const affidavitsLineItems = (
    await Promise.all(
      sortedAffidavitsSection?.map(async (section, ind) => {
        const matchingDocs = courtCase.documents
          ?.filter((doc) => doc.documentType === section.doctype)
          ?.map((doc) => doc.fileStore);

        if (!matchingDocs.length) return null;

        const innerItems = await Promise.all(
          matchingDocs?.map(async (documentFileStoreId, i) => {
            const index = ind + i;
            if (section.docketpagerequired === "yes") {
              const complainant = courtCase.litigants?.find((litigant) =>
                litigant.partyType.includes("complainant.primary")
              );
              const docketComplainantName =
                complainant.additionalDetails.fullName;
              const docketNameOfAdvocate = courtCase.representatives?.find(
                (adv) =>
                  adv.representing?.find(
                    (party) => party.individualId === complainant.individualId
                  )
              )?.additionalDetails?.advocateName;

              const docketCounselFor = docketNameOfAdvocate
                ? `COUNSEL FOR THE COMPLAINANT - ${docketComplainantName}`
                : "";

              const isComplaintAffidavit =
                matchingDocs.length === 1 ? true : false;

              const documentPath = `${
                isComplaintAffidavit
                  ? ""
                  : `${dynamicSectionNumber}.${ind + 1}.${i + 1} in `
              }${dynamicSectionNumber}.${ind + 1} ${
                section.Items
              } in ${dynamicSectionNumber} ${section.section}`;

              const mergedFilingDocumentFileStoreId =
                await applyDocketToDocument(
                  documentFileStoreId,
                  {
                    docketApplicationType: `${section.section.toUpperCase()} - ${
                      section.Items
                    }`,
                    docketCounselFor: docketCounselFor,
                    docketNameOfFiling:
                      docketNameOfAdvocate || docketComplainantName,
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
        return innerItems;
      })
    )
  ).flat();

  // update index

  const affidavitsIndexSection = indexCopy.sections?.find(
    (section) => section.name === "affidavit"
  );
  affidavitsIndexSection.lineItems = affidavitsLineItems?.filter(Boolean);
}

module.exports = {
  processAffidavitSection,
};
