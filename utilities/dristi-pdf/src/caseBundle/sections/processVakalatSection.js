const { applyDocketToDocument } = require("../utils/applyDocketToDocument");
const {
  duplicateExistingFileStore,
} = require("../utils/duplicateExistingFileStore");
const {
  filterCaseBundleBySection,
} = require("../utils/filterCaseBundleBySection");
const { getDynamicSectionNumber } = require("../utils/getDynamicSectionNumber");

async function processVakalatSection(
  courtCase,
  caseBundleMaster,
  tenantId,
  requestInfo,
  TEMP_FILES_DIR,
  indexCopy
) {
  // update vakalatnamas
  const vakalatnamaSection = filterCaseBundleBySection(
    caseBundleMaster,
    "vakalat"
  );

  const section = vakalatnamaSection[0];

  const sectionPosition = indexCopy.sections.findIndex(
    (s) => s.name === "vakalat"
  );

  const dynamicSectionNumber = getDynamicSectionNumber(
    indexCopy,
    sectionPosition
  );

  const litigants = courtCase?.litigants?.map((litigant) => ({
    ...litigant,
    representatives:
      courtCase?.representatives?.filter((rep) =>
        rep?.representing?.some(
          (complainant) => complainant?.individualId === litigant?.individualId
        )
      ) || [],
  }));

  const vakalatMap = new Map();

  if (vakalatnamaSection && Array.isArray(litigants)) {
    litigants
      .map((litigant) => {
        // const representation = representative.representing[0];
        if (litigant.representatives.length === 0) {
          const fileStoreId = litigant?.documents?.[0]?.fileStore;

          vakalatMap.set(fileStoreId, {
            isActive: litigant.isActive,
            partyType: litigant.partyType,
            fileStoreId: fileStoreId,
            docketApplicationType: "PIP AFFIDAVIT",
            representingFullName: litigant.additionalDetails.fullName,
            advocateFullName: litigant.additionalDetails.fullName,
            dateOfAddition: litigant.auditDetails.createdTime,
          });
        }
        for (const representative of litigant.representatives) {
          const updatedLitigant = representative?.representing?.find(
            (lit) => lit?.individualId === litigant?.individualId
          );
          const fileStoreId = updatedLitigant?.documents?.[0]?.fileStore;
          if (!fileStoreId) continue;

          if (!vakalatMap.has(fileStoreId)) {
            vakalatMap.set(fileStoreId, {
              isActive: litigant.isActive,
              partyType: litigant.partyType,
              fileStoreId,
              docketApplicationType: `${section.section.toUpperCase()} - ${
                section.Items
              }`,
              representingFullName: litigant.additionalDetails.fullName,
              advocateFullName: representative.additionalDetails.advocateName,
              dateOfAddition: representative.auditDetails.createdTime,
            });
          } else {
            // If already exists, append advocateFullName (avoid duplicates)
            const existing = vakalatMap.get(fileStoreId);
            const newName = representative.additionalDetails.advocateName;
            if (!existing.advocateFullName.includes(newName)) {
              existing.advocateFullName += `, ${newName}`;
            }
          }
        }
      })
      .filter(Boolean);

    const vakalats = Array.from(vakalatMap.values());

    vakalats.sort((a, b) => b.dateOfAddition - a.dateOfAddition);

    const vakalatLineItems = await Promise.all(
      vakalats.map(async (vakalat, index) => {
        if (section.docketpagerequired === "yes") {
          const documentPath = `${dynamicSectionNumber}.${index + 1} ${
            section.Items
          } in ${dynamicSectionNumber} ${section.section}`;
          const mergedVakalatDocumentFileStoreId = await applyDocketToDocument(
            vakalat.fileStoreId,
            {
              docketApplicationType: vakalat.docketApplicationType,
              docketCounselFor: vakalat.partyType.includes("complainant")
                ? "COMPLAINANT"
                : "ACCUSED",
              docketNameOfFiling: vakalat.representingFullName,
              docketNameOfAdvocate: vakalat.advocateFullName,
              docketDateOfSubmission: new Date(
                vakalat.dateOfAddition
              ).toLocaleDateString("en-IN"),
              documentPath: documentPath,
            },
            courtCase,
            tenantId,
            requestInfo,
            TEMP_FILES_DIR
          );
          return {
            sourceId: vakalat.fileStoreId,
            fileStoreId: mergedVakalatDocumentFileStoreId,
            createPDF: false,
            sortParam: null,
            content: "vakalat",
          };
        } else {
          const duplicatedFileStoreId = await duplicateExistingFileStore(
            tenantId,
            vakalat.fileStoreId,
            requestInfo,
            TEMP_FILES_DIR
          );
          return {
            sourceId: vakalat.fileStoreId,
            fileStoreId: duplicatedFileStoreId,
            createPDF: false,
            sortParam: null,
            content: "vakalat",
          };
        }
      })
    );

    // update index

    const vakalatsIndexSection = indexCopy.sections.find(
      (section) => section.name === "vakalat"
    );
    vakalatsIndexSection.lineItems = vakalatLineItems.filter(Boolean);
  }
}

module.exports = {
  processVakalatSection,
};
