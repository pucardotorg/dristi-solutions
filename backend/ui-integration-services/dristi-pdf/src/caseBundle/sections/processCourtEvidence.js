const { search_evidence_v2 } = require("../../api");
const {
  combineMultipleFilestores,
} = require("../utils/combineMultipleFilestores");
const {
  duplicateExistingFileStore,
} = require("../utils/duplicateExistingFileStore");
const {
  filterCaseBundleBySection,
} = require("../utils/filterCaseBundleBySection");
const { logger } = require("../../logger");

async function processCourtEvidence(
  courtCase,
  caseBundleMaster,
  tenantId,
  requestInfo,
  TEMP_FILES_DIR,
  indexCopy
) {
  logger.info(`[processCourtEvidence] Started | filingNumber: ${courtCase?.filingNumber}`);
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
    logger.info(`[processCourtEvidence] search_evidence_v2 | depositions`);
    const courtDocs = await search_evidence_v2(
      tenantId,
      requestInfo,
      {
        courtId: courtCase.courtId,
        filingNumber: courtCase.filingNumber,
        artifactType: "WITNESS_DEPOSITION",
        status: ["COMPLETED"],
        isVoid: false,
        tenantId,
      },
      {
        sortBy: courtEvidenceDepositionSection[0].sorton,
        order: "asc",
        limit: 100,
      }
    );

    const courtDepositions = courtDocs?.data?.artifacts?.filter(
      (artifact) =>
        artifact?.additionalDetails?.witnessDetails?.ownerType === "-"
    );
    const noOwnerType = courtDocs?.data?.artifacts?.filter(
      (artifact) => !artifact?.additionalDetails?.witnessDetails?.ownerType
    );

    const courtList = [...new Set([...courtDepositions, ...noOwnerType])];

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
    logger.info(`[processCourtEvidence] search_evidence_v2 | exhibits`);
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
        isHideBailCaseBundle: true,
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
          let evidenceFileStoreId = evidence?.file?.fileStore;
          if (!evidenceFileStoreId) {
            return null;
          }

          const sealFileStore = evidence?.seal?.fileStore;
          if (sealFileStore) {
            evidenceFileStoreId = await combineMultipleFilestores(
              [evidenceFileStoreId, sealFileStore],
              tenantId,
              requestInfo,
              TEMP_FILES_DIR
            );
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

  const courtEvidenceIndexSection = indexCopy.sections?.find(
    (section) => section.name === "courtevidence"
  );
  courtEvidenceIndexSection.lineItems = courtEvidenceLineItems?.filter(Boolean);
  logger.info(`[processCourtEvidence] Completed | lineItems: ${courtEvidenceIndexSection.lineItems?.length || 0}`);
}

module.exports = {
  processCourtEvidence,
};
