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

async function processAccusedEvidence(
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
    "accusedevidencedepositions"
  );

  const accusedEvidenceSection = filterCaseBundleBySection(
    caseBundleMaster,
    "accusedevidence"
  );

  const sectionPosition = indexCopy.sections?.findIndex(
    (s) => s.name === "accusedevidence"
  );

  const dynamicSectionNumber = getDynamicSectionNumber(
    indexCopy,
    sectionPosition
  );

  const accusedEvidenceLineItems = [];

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
        artifact?.additionalDetails?.witnessDetails?.ownerType === "ACCUSED"
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
            content: "accusedevidencedepositions",
          };
        })
      );
      accusedEvidenceLineItems.push(...innerLineItems);
    }
  }

  if (accusedEvidenceSection?.length !== 0) {
    const section = accusedEvidenceSection[0];
    const accusedDocs = await search_evidence_v2(
      tenantId,
      requestInfo,
      {
        courtId: courtCase.courtId,
        filingNumber: courtCase.filingNumber,
        sourceType: "ACCUSED",
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

    const accusedList = accusedDocs?.data?.artifacts;

    if (accusedList?.length !== 0) {
      const innerLineItems = await Promise.all(
        accusedList?.map(async (evidence, index) => {
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
                .join(", ");
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

            const evidencePosition = !accusedEvidenceLineItems?.filter(Boolean)
              ?.length
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
            content: "accusedevidence",
          };
        })
      );
      accusedEvidenceLineItems.push(...innerLineItems);
    }
  }

  const accusedEvidenceIndexSection = indexCopy.sections?.find(
    (section) => section.name === "accusedevidence"
  );
  accusedEvidenceIndexSection.lineItems =
    accusedEvidenceLineItems?.filter(Boolean);
}

module.exports = {
  processAccusedEvidence,
};
