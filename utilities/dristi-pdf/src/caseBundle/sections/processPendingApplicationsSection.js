const { search_application_v2 } = require("../../api");
const {
  filterCaseBundleBySection,
} = require("../utils/filterCaseBundleBySection");
const { applyDocketToDocument } = require("../utils/applyDocketToDocument");
const {
  combineMultipleFilestores,
} = require("../utils/combineMultipleFilestores");
const {
  duplicateExistingFileStore,
} = require("../utils/duplicateExistingFileStore");
const { getDynamicSectionNumber } = require("../utils/getDynamicSectionNumber");

const extractNumber = (cmpNumber) => {
  const parts = cmpNumber.split("/");
  return parts.length > 1 ? parseInt(parts[1], 10) : cmpNumber;
};

async function processPendingApplicationsSection(
  courtCase,
  caseBundleMaster,
  tenantId,
  requestInfo,
  TEMP_FILES_DIR,
  indexCopy
) {
  const pendingReviewApplicationSection = filterCaseBundleBySection(
    caseBundleMaster,
    "pendingapplications"
  );

  const pendingReviewApplicationObjectionSection = filterCaseBundleBySection(
    caseBundleMaster,
    "pendingapplicationobjections"
  );

  const sectionPosition = indexCopy.sections.findIndex(
    (s) => s.name === "pendingapplications"
  );

  const dynamicSectionNumber = getDynamicSectionNumber(
    indexCopy,
    sectionPosition
  );

  if (pendingReviewApplicationSection?.length !== 0) {
    const section = pendingReviewApplicationSection[0];
    const pendingReviewApplications = await search_application_v2(
      tenantId,
      requestInfo,
      {
        status: "PENDINGREVIEW",
        courtId: courtCase.courtId,
        filingNumber: courtCase.filingNumber,
        tenantId,
      },
      {
        sortBy: section.sorton,
        order: "asc",
      }
    );

    // Search for PENDINGAPPROVAL applications
    const pendingApprovalApplications = await search_application_v2(
      tenantId,
      requestInfo,
      {
        status: "PENDINGAPPROVAL",
        courtId: courtCase.courtId,
        filingNumber: courtCase.filingNumber,
        tenantId,
      },
      {
        sortBy: section.sorton,
        order: "asc",
      }
    );

    // Combine both application lists
    const pendingReviewList =
      pendingReviewApplications?.data?.applicationList || [];
    const pendingApprovalList =
      pendingApprovalApplications?.data?.applicationList || [];
    const combinedApplicationList = [
      ...pendingReviewList,
      ...pendingApprovalList,
    ];

    // Sort the combined list by applicationCMPNumber
    const applicationList = combinedApplicationList.sort((a, b) => {
      // Handle null values - null values come last
      if (!a.applicationCMPNumber && !b.applicationCMPNumber) return 0;
      if (!a.applicationCMPNumber) return 1;
      if (!b.applicationCMPNumber) return -1;

      const aNum = extractNumber(a.applicationCMPNumber);
      const bNum = extractNumber(b.applicationCMPNumber);

      return aNum - bNum;
    });

    if (applicationList?.length !== 0) {
      const pendingApplicationLineItems = await Promise.all(
        applicationList?.map(async (application, index) => {
          let applicationFileStoreId = application?.documents?.find(
            (doc) => doc?.documentType === "SIGNED"
          )?.fileStore;
          if (
            application.applicationType === "DELAY_CONDONATION" &&
            !applicationFileStoreId
          ) {
            applicationFileStoreId = application?.documents?.find(
              (doc) => doc?.documentType === "CONDONATION_DOC"
            )?.fileStore;
          }
          if (!applicationFileStoreId) {
            return null;
          }

          let newApplicationFileStoreId = applicationFileStoreId;

          if (section.docketpagerequired === "yes") {
            const sourceUuid = application.createdBy;

            const sourceLitigant = courtCase.litigants?.find(
              (litigant) => litigant.additionalDetails.uuid === sourceUuid
            );
            const sourceRepresentative = courtCase.representatives?.find(
              (rep) => rep.additionalDetails.uuid === sourceUuid
            );

            let docketNameOfFiling;
            let docketNameOfAdvocate;
            let docketCounselFor;

            if (sourceLitigant) {
              docketNameOfFiling =
                sourceLitigant.additionalDetails?.fullName || "";
              docketNameOfAdvocate = "";
              docketCounselFor = sourceLitigant.partyType.includes(
                "complainant"
              )
                ? "COMPLAINANT"
                : "ACCUSED";
            }

            if (sourceRepresentative) {
              docketNameOfAdvocate =
                sourceRepresentative.additionalDetails?.advocateName || "";
              docketNameOfFiling =
                sourceRepresentative.additionalDetails?.advocateName || "";
              docketCounselFor =
                sourceRepresentative.representing[0].partyType.includes(
                  "complainant"
                )
                  ? "COMPLAINANT"
                  : "ACCUSED";
            }

            const documentPath = `${dynamicSectionNumber}.${index + 1}.1 ${
              section.Items
            } in ${dynamicSectionNumber}.${index + 1} ${
              application.applicationType
            } in ${dynamicSectionNumber} ${section.section}`;

            newApplicationFileStoreId = await applyDocketToDocument(
              applicationFileStoreId,
              {
                docketApplicationType: `${section.section.toUpperCase()} - ${
                  section.Items
                }`,
                docketCounselFor: docketCounselFor,
                docketNameOfFiling: docketNameOfFiling,
                docketNameOfAdvocate: docketNameOfAdvocate,
                docketDateOfSubmission: new Date(
                  application.createdDate
                ).toLocaleDateString("en-IN"),
                documentPath: documentPath,
              },
              courtCase,
              tenantId,
              requestInfo,
              TEMP_FILES_DIR
            );
          }

          if (pendingReviewApplicationObjectionSection?.length !== 0) {
            const objectionSection =
              pendingReviewApplicationObjectionSection[0];
            const objectionDocuments = application.comment;
            if (objectionDocuments?.length !== 0) {
              // Process all objection documents sequentially
              const objectionFileStoreIds = [];
              for (let i = 0; i < (objectionDocuments || []).length; i++) {
                const doc = objectionDocuments[i];
                if (!doc?.additionalDetails?.commentDocumentId) {
                  continue;
                }
                const objectionDocumentFileStoreId =
                  doc.additionalDetails.commentDocumentId;

                let newObjectionDocumentFileStoreId =
                  objectionDocumentFileStoreId;
                if (objectionSection.docketpagerequired === "yes") {
                  const sourceUuid = doc.auditdetails.createdBy;

                  const litigants = courtCase?.litigants?.map((litigant) => ({
                    ...litigant,
                    representatives:
                      courtCase?.representatives?.filter((rep) =>
                        rep?.representing?.some(
                          (complainant) =>
                            complainant?.individualId === litigant?.individualId
                        )
                      ) || [],
                  }));

                  const sourceLitigant = litigants?.find(
                    (litigant) => litigant.additionalDetails.uuid === sourceUuid
                  );
                  const sourceRepresentative = courtCase.representatives?.find(
                    (rep) => rep.additionalDetails.uuid === sourceUuid
                  );

                  const docketNameOfFiling = doc.additionalDetails.author || "";
                  let docketNameOfAdvocate;
                  let docketCounselFor;

                  if (sourceLitigant) {
                    docketNameOfAdvocate =
                      courtCase.representatives?.find((adv) =>
                        adv.representing?.find(
                          (party) =>
                            party.individualId === sourceLitigant.individualId
                        )
                      )?.additionalDetails?.advocateName || "";
                    docketCounselFor = sourceLitigant.partyType.includes(
                      "complainant"
                    )
                      ? "COMPLAINANT"
                      : "ACCUSED";
                  } else if (sourceRepresentative) {
                    docketNameOfAdvocate =
                      sourceRepresentative.additionalDetails?.advocateName ||
                      "";
                    docketCounselFor =
                      sourceRepresentative.representing[0].partyType.includes(
                        "complainant"
                      )
                        ? "COMPLAINANT"
                        : "ACCUSED";
                  } else {
                    docketNameOfAdvocate = "";
                    docketCounselFor = "COMPLAINANT";
                  }

                  const documentPath = `1.${index + 1}.2.${i + 1} Objection ${
                    i + 1
                  } in 1.${index + 1}.2 ${objectionSection.Items} in 1.${
                    index + 1
                  } ${application.applicationType} in 1 ${section.section}`;

                  newObjectionDocumentFileStoreId = await applyDocketToDocument(
                    objectionDocumentFileStoreId,
                    {
                      docketApplicationType: `${objectionSection.section.toUpperCase()} - ${
                        objectionSection.Items
                      }`,
                      docketCounselFor: docketCounselFor,
                      docketNameOfFiling: docketNameOfFiling,
                      docketNameOfAdvocate: docketNameOfAdvocate,
                      docketDateOfSubmission: new Date(
                        doc.auditdetails.createdTime
                      ).toLocaleDateString("en-IN"),
                      documentPath: documentPath,
                    },
                    courtCase,
                    tenantId,
                    requestInfo,
                    TEMP_FILES_DIR
                  );
                }
                objectionFileStoreIds.push(newObjectionDocumentFileStoreId);
              }
              newApplicationFileStoreId = await combineMultipleFilestores(
                [newApplicationFileStoreId, ...objectionFileStoreIds],
                tenantId,
                requestInfo,
                TEMP_FILES_DIR
              );
            }
          }

          if (newApplicationFileStoreId === applicationFileStoreId) {
            newApplicationFileStoreId = await duplicateExistingFileStore(
              tenantId,
              applicationFileStoreId,
              requestInfo,
              TEMP_FILES_DIR
            );
          }
          return {
            sourceId: applicationFileStoreId,
            fileStoreId: newApplicationFileStoreId,
            sortParam: index + 1,
            createPDF: false,
            content: "pendingapplications",
          };
        })
      );
      const pendingApplicationsIndexSection = indexCopy.sections.find(
        (section) => section.name === "pendingapplications"
      );
      pendingApplicationsIndexSection.lineItems =
        pendingApplicationLineItems.filter(Boolean);
    }
  }
}

module.exports = {
  processPendingApplicationsSection,
};
