const { search_evidence_v2 } = require("../../api");
const {
  filterCaseBundleBySection,
} = require("../utils/filterCaseBundleBySection");
const { applyDocketToDocument } = require("../utils/applyDocketToDocument");
const {
  duplicateExistingFileStore,
} = require("../utils/duplicateExistingFileStore");
const { getDynamicSectionNumber } = require("../utils/getDynamicSectionNumber");
const {
  combineMultipleFilestores,
} = require("../utils/combineMultipleFilestores");

async function processComplainantEvidence(
  courtCase,
  caseBundleMaster,
  tenantId,
  requestInfo,
  TEMP_FILES_DIR,
  indexCopy,
  messagesMap
) {
  const complainantDepositionSection = filterCaseBundleBySection(
    caseBundleMaster,
    "complainantevidencedepositions"
  );

  const complainantEvidenceSection = filterCaseBundleBySection(
    caseBundleMaster,
    "complainantevidence"
  );

  const sectionPosition = indexCopy.sections?.findIndex(
    (s) => s.name === "complainantevidence"
  );

  const dynamicSectionNumber = getDynamicSectionNumber(
    indexCopy,
    sectionPosition
  );

  const complainantEvidenceLineItems = [];

  if (complainantDepositionSection?.length !== 0) {
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
        sortBy: complainantDepositionSection[0].sorton,
        order: "asc",
        limit: 100,
      }
    );

    const courtList = courtDocs?.data?.artifacts?.filter(
      (artifact) =>
        artifact?.additionalDetails?.witnessDetails?.ownerType === "COMPLAINANT"
    );

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
            content: "complainantevidencedepositions",
          };
        })
      );
      complainantEvidenceLineItems.push(...innerLineItems);
    }
  }

  if (complainantEvidenceSection?.length !== 0) {
    const section = complainantEvidenceSection[0];
    const complainantDocs = await search_evidence_v2(
      tenantId,
      requestInfo,
      {
        courtId: courtCase.courtId,
        filingNumber: courtCase.filingNumber,
        sourceType: "COMPLAINANT",
        evidenceStatus: true,
        isVoid: false,
        tenantId,
        isHideBailCaseBundle: true,
      },
      {
        sortBy: section.sorton,
        order: "asc",
        limit: 100,
      }
    );

    const complainantList = complainantDocs?.data?.artifacts;

    if (complainantList?.length !== 0) {
      const innerLineItems = await Promise.all(
        complainantList?.map(async (evidence, index) => {
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

          let newEvidenceFileStoreId = evidenceFileStoreId;

          if (section.docketpagerequired === "yes") {
            const sourceUuid = evidence?.auditdetails?.createdBy;

            const sourceLitigant = courtCase.litigants?.find(
              (litigant) => litigant.additionalDetails.uuid === sourceUuid
            );
            const sourceRepresentative = courtCase.representatives?.find(
              (rep) => rep.additionalDetails.uuid === sourceUuid
            );
            let docketNameOfFiling;
            let docketCounselFor;

            if (sourceLitigant) {
              docketNameOfFiling =
                sourceLitigant.additionalDetails?.fullName || "";
              docketCounselFor = "";
            } else if (sourceRepresentative) {
              const docketNameOfComplainants = sourceRepresentative.representing
                ?.map((lit) => lit.additionalDetails.fullName)
                ?.filter(Boolean)
                ?.join(", ");
              docketNameOfFiling =
                sourceRepresentative.additionalDetails?.advocateName || "";
              docketCounselFor = `COUNSEL FOR THE ${evidence.sourceType} - ${docketNameOfComplainants}`;
            } else {
              const complainant = courtCase.litigants?.find((litigant) =>
                litigant.partyType.includes("complainant.primary")
              );
              const docketNameOfComplainants =
                complainant.additionalDetails.fullName;
              docketNameOfFiling =
                courtCase.representatives?.find((adv) =>
                  adv.representing?.find(
                    (party) => party.individualId === complainant.individualId
                  )
                )?.additionalDetails?.advocateName || docketNameOfComplainants;
              docketCounselFor =
                docketNameOfFiling === docketNameOfComplainants
                  ? ""
                  : `COUNSEL FOR THE COMPLAINANT - ${docketNameOfComplainants}`;
            }

            const artifactName =
              evidence?.additionalDetails?.formdata?.documentTitle ||
              evidence?.file?.additionalDetails?.documentTitle ||
              messagesMap[
                evidence?.file?.additionalDetails?.documentType ||
                  evidence?.artifactType
              ];

            const evidencePosition = !complainantEvidenceLineItems?.filter(
              Boolean
            )?.length
              ? "1"
              : "2";

            const documentPath = `${dynamicSectionNumber}.${evidencePosition}.${
              index + 1
            } ${artifactName} in ${dynamicSectionNumber} ${section.section}`;

            newEvidenceFileStoreId = await applyDocketToDocument(
              evidenceFileStoreId,
              {
                docketApplicationType: `${section.section.toUpperCase()} - ${
                  section.Items
                }`,
                docketCounselFor: docketCounselFor,
                docketNameOfFiling: docketNameOfFiling,
                docketDateOfSubmission: new Date(
                  evidence.createdDate
                ).toLocaleDateString("en-IN"),
                documentPath: documentPath,
              },
              courtCase,
              tenantId,
              requestInfo,
              TEMP_FILES_DIR
            );
          } else {
            newEvidenceFileStoreId = await duplicateExistingFileStore(
              tenantId,
              evidenceFileStoreId,
              requestInfo,
              TEMP_FILES_DIR
            );
          }

          return {
            sourceId: evidenceFileStoreId,
            fileStoreId: newEvidenceFileStoreId,
            sortParam: index + 1,
            createPDF: false,
            content: "complainantevidence",
          };
        })
      );
      complainantEvidenceLineItems.push(...innerLineItems);
    }
  }

  const complainantEvidenceIndexSection = indexCopy.sections?.find(
    (section) => section.name === "complainantevidence"
  );
  complainantEvidenceIndexSection.lineItems =
    complainantEvidenceLineItems?.filter(Boolean);
}

module.exports = {
  processComplainantEvidence,
};
