const { search_evidence_v2 } = require("../../api");
const {
  filterCaseBundleBySection,
} = require("../utils/filterCaseBundleBySection");
const { applyDocketToDocument } = require("../utils/applyDocketToDocument");
const {
  duplicateExistingFileStore,
} = require("../utils/duplicateExistingFileStore");
const { getDynamicSectionNumber } = require("../utils/getDynamicSectionNumber");

async function processComplainantEvidence(
  courtCase,
  caseBundleMaster,
  tenantId,
  requestInfo,
  TEMP_FILES_DIR,
  indexCopy,
  messagesMap
) {
  const complainantEvidenceSection = filterCaseBundleBySection(
    caseBundleMaster,
    "complainantevidence"
  );

  const sectionPosition = indexCopy.sections.findIndex(
    (s) => s.name === "complainantevidence"
  );

  const dynamicSectionNumber = getDynamicSectionNumber(
    indexCopy,
    sectionPosition
  );

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
      },
      {
        sortBy: section.sorton,
        order: "asc",
        limit: 100,
      }
    );

    const complainantList = complainantDocs?.data?.artifacts;

    if (complainantList?.length !== 0) {
      const complainantEvidenceLineItems = await Promise.all(
        complainantList?.map(async (evidence, index) => {
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
              messagesMap[evidence.artifactType]
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
            content: "complainantevidence",
          };
        })
      );
      const complainantEvidenceIndexSection = indexCopy.sections.find(
        (section) => section.name === "complainantevidence"
      );
      complainantEvidenceIndexSection.lineItems =
        complainantEvidenceLineItems.filter(Boolean);
    }
  }
}

module.exports = {
  processComplainantEvidence,
};
