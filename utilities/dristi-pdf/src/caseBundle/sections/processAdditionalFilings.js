const { search_evidence_v2 } = require("../../api");
const {
  filterCaseBundleBySection,
} = require("../utils/filterCaseBundleBySection");
const { applyDocketToDocument } = require("../utils/applyDocketToDocument");
const {
  duplicateExistingFileStore,
} = require("../utils/duplicateExistingFileStore");
const { getDynamicSectionNumber } = require("../utils/getDynamicSectionNumber");

async function processAdditionalFilings(
  courtCase,
  caseBundleMaster,
  tenantId,
  requestInfo,
  TEMP_FILES_DIR,
  indexCopy,
  messagesMap
) {
  const additionalFilingsSection = filterCaseBundleBySection(
    caseBundleMaster,
    "additionalfilings"
  );

  const sectionPosition = indexCopy.sections?.findIndex(
    (s) => s.name === "additionalfilings"
  );

  const additionalFilingsIndexSection = indexCopy.sections?.find(
    (section) => section.name === "additionalfilings"
  );

  const dynamicSectionNumber = getDynamicSectionNumber(
    indexCopy,
    sectionPosition
  );

  if (additionalFilingsSection?.length !== 0) {
    const section = additionalFilingsSection[0];
    const directDocs = await search_evidence_v2(
      tenantId,
      requestInfo,
      {
        courtId: courtCase.courtId,
        filingNumber: courtCase.filingNumber,
        filingType: "DIRECT",
        evidenceStatus: false,
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

    const directList = directDocs?.data?.artifacts;

    const applicationDocs = await search_evidence_v2(
      tenantId,
      requestInfo,
      {
        courtId: courtCase.courtId,
        filingNumber: courtCase.filingNumber,
        filingType: "APPLICATION",
        evidenceStatus: false,
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

    const applicationList = applicationDocs?.data?.artifacts;

    const newList = [...(directList || []), ...(applicationList || [])];

    const combinedList = newList.sort(
      (a, b) => a.auditdetails.createdTime - b.auditdetails.createdTime
    );

    if (combinedList?.length !== 0) {
      const additionalFilingsLineItems = await Promise.all(
        combinedList?.map(async (evidence, index) => {
          const evidenceFileStoreId = evidence?.file?.fileStore;
          if (!evidenceFileStoreId) {
            return null;
          }

          let newEvidenceFileStoreId;

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

            const documentPath = `${dynamicSectionNumber}.${
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
            content: "additionalfilings",
          };
        })
      );
      additionalFilingsIndexSection.lineItems =
        additionalFilingsLineItems?.filter(Boolean);
    } else {
      additionalFilingsIndexSection.lineItems = [];
    }
  } else {
    additionalFilingsIndexSection.lineItems = [];
  }
}

module.exports = {
  processAdditionalFilings,
};
