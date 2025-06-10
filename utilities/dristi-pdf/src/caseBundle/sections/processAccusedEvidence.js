const { search_evidence_v2 } = require("../../api");
const {
  filterCaseBundleBySection,
} = require("../utils/filterCaseBundleBySection");
const { applyDocketToDocument } = require("../utils/applyDocketToDocument");
const {
  duplicateExistingFileStore,
} = require("../utils/duplicateExistingFileStore");
const { getDynamicSectionNumber } = require("../utils/getDynamicSectionNumber");

async function processAccusedEvidence(
  courtCase,
  caseBundleMaster,
  tenantId,
  requestInfo,
  TEMP_FILES_DIR,
  indexCopy
) {
  const accusedEvidenceSection = filterCaseBundleBySection(
    caseBundleMaster,
    "accusedevidence"
  );

  const sectionPosition = indexCopy.sections.findIndex(
    (s) => s.name === "accusedevidence"
  );

  const dynamicSectionNumber = getDynamicSectionNumber(
    indexCopy,
    sectionPosition
  );

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
      },
      {
        sortBy: section.sorton,
        order: "asc",
        limit: 100,
      }
    );

    const accusedList = accusedDocs?.data?.artifacts;

    if (accusedList?.length !== 0) {
      const accusedEvidenceLineItems = await Promise.all(
        accusedList?.map(async (evidence, index) => {
          const evidenceFileStoreId = evidence?.file?.fileStore;
          if (!evidenceFileStoreId) {
            return null;
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
            let docketNameOfAdvocate;

            if (sourceLitigant) {
              docketNameOfFiling =
                sourceLitigant.additionalDetails?.fullName || "";
              docketNameOfAdvocate = "";
            } else if (sourceRepresentative) {
              docketNameOfAdvocate =
                sourceRepresentative.additionalDetails?.advocateName || "";
              docketNameOfFiling =
                sourceRepresentative.additionalDetails?.advocateName || "";
            } else {
              const complainant = courtCase.litigants?.find((litigant) =>
                litigant.partyType.includes("complainant.primary")
              );
              docketNameOfFiling = complainant.additionalDetails.fullName;
              docketNameOfAdvocate =
                courtCase.representatives?.find((adv) =>
                  adv.representing?.find(
                    (party) => party.individualId === complainant.individualId
                  )
                )?.additionalDetails?.advocateName || docketNameOfFiling;
            }

            const documentPath = `${dynamicSectionNumber}.${index + 1} ${
              evidence.artifactType
            } in ${dynamicSectionNumber} ${section.section}`;

            newEvidenceFileStoreId = await applyDocketToDocument(
              evidenceFileStoreId,
              {
                docketApplicationType: `${section.section.toUpperCase()} - ${
                  section.Items
                }`,
                docketCounselFor: evidence.sourceType,
                docketNameOfFiling: docketNameOfFiling,
                docketNameOfAdvocate: docketNameOfAdvocate,
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
      const accusedEvidenceIndexSection = indexCopy.sections.find(
        (section) => section.name === "accusedevidence"
      );
      accusedEvidenceIndexSection.lineItems =
        accusedEvidenceLineItems.filter(Boolean);
    }
  }
}

module.exports = {
  processAccusedEvidence,
};
