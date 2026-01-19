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
  indexCopy,
  messagesMap
) {
  // update vakalatnamas
  const vakalatnamaSection = filterCaseBundleBySection(
    caseBundleMaster,
    "vakalat"
  );

  const sectionPosition = indexCopy.sections?.findIndex(
    (s) => s.name === "vakalat"
  );

  const dynamicSectionNumber = getDynamicSectionNumber(
    indexCopy,
    sectionPosition
  );

  const vakalatsIndexSection = indexCopy.sections?.find(
    (section) => section.name === "vakalat"
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

  if (vakalatnamaSection?.length !== 0 && Array.isArray(litigants)) {
    const section = vakalatnamaSection[0];

    litigants
      ?.map((litigant) => {
        // const representation = representative.representing[0];
        if (litigant.representatives.length === 0) {
          const fileStoreId = litigant?.documents?.[0]?.fileStore;

          vakalatMap.set(fileStoreId, {
            isActive: litigant.isActive,
            partyType: litigant.partyType,
            fileStoreId: fileStoreId,
            heading: messagesMap["PIP_AFFIDAVIT_HEADING"],
            docketApplicationType: "PIP AFFIDAVIT",
            representingFullName: litigant.additionalDetails.fullName,
            nameOfPartyFiling: litigant.additionalDetails.fullName,
            dateOfAddition: litigant.auditDetails.createdTime,
            docketCounselFor: "",
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
              heading: section.Items,
              docketApplicationType: `${section.section.toUpperCase()} - ${
                section.Items
              }`,
              representingFullName: litigant.additionalDetails.fullName,
              nameOfPartyFiling: representative.additionalDetails.advocateName,
              dateOfAddition: representative.auditDetails.createdTime,
              docketCounselFor: `COUNSEL FOR THE ${
                litigant.partyType.includes("complainant")
                  ? "COMPLAINANT"
                  : "ACCUSED"
              } - ${litigant.additionalDetails.fullName}`,
            });
          } else {
            // If already exists, append nameOfPartyFiling (avoid duplicates)
            const existing = vakalatMap.get(fileStoreId);
            const newName = representative.additionalDetails.advocateName;
            if (!existing.nameOfPartyFiling.includes(newName)) {
              existing.nameOfPartyFiling += `, ${newName}`;
            }
          }
        }
      })
      ?.filter(Boolean);

    const vakalats = Array.from(vakalatMap.values());

    vakalats.sort((a, b) => a.dateOfAddition - b.dateOfAddition);

    const vakalatLineItems = await Promise.all(
      vakalats?.map(async (vakalat, index) => {
        if (section.docketpagerequired === "yes") {
          const documentPath = `${dynamicSectionNumber}.${index + 1} ${
            vakalat.heading
          } in ${dynamicSectionNumber} ${section.section}`;
          const mergedVakalatDocumentFileStoreId = await applyDocketToDocument(
            vakalat.fileStoreId,
            {
              docketApplicationType: vakalat.docketApplicationType,
              docketCounselFor: vakalat.docketCounselFor,
              docketNameOfFiling: vakalat.nameOfPartyFiling,
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
    vakalatsIndexSection.lineItems = vakalatLineItems?.filter(Boolean);
  } else {
    vakalatsIndexSection.lineItems = [];
  }
}

module.exports = {
  processVakalatSection,
};
