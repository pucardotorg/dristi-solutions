const { search_evidence_v2 } = require("../../api");
const {
  duplicateExistingFileStore,
} = require("../utils/duplicateExistingFileStore");
const {
  filterCaseBundleBySection,
} = require("../utils/filterCaseBundleBySection");

async function processCourtEvidence(
  courtCase,
  caseBundleMaster,
  tenantId,
  requestInfo,
  TEMP_FILES_DIR,
  indexCopy
) {
  const courtEvidenceDepositionSection = filterCaseBundleBySection(
    caseBundleMaster,
    "courtevidencedepositions"
  );

  const courtEvidenceSection = filterCaseBundleBySection(
    caseBundleMaster,
    "courtevidence"
  );

  const courtEvidenceLineItems = [];

  if (courtEvidenceDepositionSection?.length !== 0) {
    const courtDocs = await search_evidence_v2(
      tenantId,
      requestInfo,
      {
        courtId: courtCase.courtId,
        filingNumber: courtCase.filingNumber,
        sourceType: "COURT",
        artifactType: "WITNESS_DEPOSITION",
        isVoid: false,
        tenantId,
      },
      {
        sortBy: courtEvidenceDepositionSection[0].sorton,
        order: "asc",
        limit: 100,
      }
    );

    const courtList = courtDocs?.data?.artifacts;

    if (courtList?.length !== 0) {
      const innerLineItems = await Promise.all(
        courtList?.map(async (evidence, index) => {
          const evidenceFileStoreId = evidence?.file?.fileStore;
          if (!evidenceFileStoreId) {
            return null;
          }

          const newEvidenceFileStoreId = await duplicateExistingFileStore(
            tenantId,
            evidenceFileStoreId,
            requestInfo,
            TEMP_FILES_DIR
          );
          return {
            sourceId: evidenceFileStoreId,
            fileStoreId: newEvidenceFileStoreId,
            sortParam: index + 1,
            createPDF: false,
            content: "courtevidencedepositions",
          };
        })
      );
      courtEvidenceLineItems.push(...innerLineItems);
    }
  }

  if (courtEvidenceSection?.length !== 0) {
    const courtDocs = await search_evidence_v2(
      tenantId,
      requestInfo,
      {
        courtId: courtCase.courtId,
        filingNumber: courtCase.filingNumber,
        sourceType: "COURT",
        evidenceStatus: true,
        isVoid: false,
        tenantId,
      },
      {
        sortBy: courtEvidenceSection[0].sorton,
        order: "asc",
        limit: 100,
      }
    );

    const courtList = courtDocs?.data?.artifacts;

    if (courtList?.length !== 0) {
      const innerLineItems = await Promise.all(
        courtList?.map(async (evidence, index) => {
          const evidenceFileStoreId = evidence?.file?.fileStore;
          if (!evidenceFileStoreId) {
            return null;
          }

          const newEvidenceFileStoreId = await duplicateExistingFileStore(
            tenantId,
            evidenceFileStoreId,
            requestInfo,
            TEMP_FILES_DIR
          );

          return {
            sourceId: evidenceFileStoreId,
            fileStoreId: newEvidenceFileStoreId,
            sortParam: index + 1,
            createPDF: false,
            content: "courtevidence",
          };
        })
      );
      courtEvidenceLineItems.push(...innerLineItems);
    }
  }

  if (courtEvidenceLineItems.length > 0) {
    {
      const courtEvidenceIndexSection = indexCopy.sections.find(
        (section) => section.name === "courtevidence"
      );
      courtEvidenceIndexSection.lineItems =
        courtEvidenceLineItems.filter(Boolean);
    }
  }
}

module.exports = {
  processCourtEvidence,
};
