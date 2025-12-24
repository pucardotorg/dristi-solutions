const { search_application_v2, search_order_v2 } = require("../../api");
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

async function processDisposedApplications(
  courtCase,
  caseBundleMaster,
  tenantId,
  requestInfo,
  TEMP_FILES_DIR,
  indexCopy,
  messagesMap
) {
  const applicationSection = filterCaseBundleBySection(
    caseBundleMaster,
    "applications"
  );

  const applicationObjectionSection = filterCaseBundleBySection(
    caseBundleMaster,
    "applicationobjections"
  );

  const applicationOrderSection = filterCaseBundleBySection(
    caseBundleMaster,
    "applicationsorders"
  );

  const sectionPosition = indexCopy.sections?.findIndex(
    (s) => s.name === "applications"
  );

  const dynamicSectionNumber = getDynamicSectionNumber(
    indexCopy,
    sectionPosition
  );

  const applicationsIndexSection = indexCopy.sections?.find(
    (section) => section.name === "applications"
  );

  if (applicationSection?.length !== 0) {
    const section = applicationSection[0];
    const completedApplications = await search_application_v2(
      tenantId,
      requestInfo,
      {
        status: "COMPLETED",
        courtId: courtCase.courtId,
        filingNumber: courtCase.filingNumber,
        tenantId,
        isHideBailCaseBundle: true,
      },
      {
        sortBy: section.sorton,
        order: "asc",
        limit: 100,
      }
    );

    const rejectedApplications = await search_application_v2(
      tenantId,
      requestInfo,
      {
        status: "REJECTED",
        courtId: courtCase.courtId,
        filingNumber: courtCase.filingNumber,
        tenantId,
        isHideBailCaseBundle: true,
      },
      {
        sortBy: section.sorton,
        order: "asc",
        limit: 100,
      }
    );

    const completedList = completedApplications?.data?.applicationList || [];
    const rejectedList = rejectedApplications?.data?.applicationList || [];
    const combinedApplicationList = [...completedList, ...rejectedList];

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
      const applicationLineItems = await Promise.all(
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
            const sourceUuid = application.auditDetails.createdBy;

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
              const partyType =
                sourceRepresentative.representing[0].partyType.includes(
                  "complainant"
                )
                  ? "COMPLAINANT"
                  : "ACCUSED";
              docketNameOfFiling =
                sourceRepresentative.additionalDetails?.advocateName || "";
              docketCounselFor = `COUNSEL FOR THE ${partyType} - ${docketNameOfComplainants}`;
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

            const documentPath = `${dynamicSectionNumber}.${index + 1}.1 ${
              section.Items
            } in ${dynamicSectionNumber}.${index + 1} ${
              messagesMap[application.applicationType]
            } in ${dynamicSectionNumber} ${section.section}`;

            newApplicationFileStoreId = await applyDocketToDocument(
              applicationFileStoreId,
              {
                docketApplicationType: `${section.section.toUpperCase()} - ${
                  section.Items
                }`,
                docketCounselFor: docketCounselFor,
                docketNameOfFiling: docketNameOfFiling,
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

          if (applicationObjectionSection?.length !== 0) {
            const objectionSection = applicationObjectionSection[0];
            const objectionDocuments = application.comment;
            if (objectionDocuments?.length !== 0) {
              // Process all objection documents sequentially
              const objectionFileStoreIds = [];
              for (let i = 0; i < (objectionDocuments || []).length; i++) {
                const doc = objectionDocuments[i];
                if (!doc.additionalDetails.commentDocumentId) {
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
                  let docketCounselFor;

                  if (sourceLitigant) {
                    docketCounselFor = "";
                  } else if (sourceRepresentative) {
                    const partyType =
                      sourceRepresentative.representing[0].partyType.includes(
                        "complainant"
                      )
                        ? "COMPLAINANT"
                        : "ACCUSED";
                    const docketNameOfComplainants =
                      sourceRepresentative.representing
                        ?.map((lit) => lit.additionalDetails.fullName)
                        ?.filter(Boolean)
                        ?.join(", ");
                    docketCounselFor = `COUNSEL FOR THE ${partyType} - ${docketNameOfComplainants}`;
                  } else {
                    docketCounselFor = "";
                  }

                  const documentPath = `${dynamicSectionNumber}.${
                    index + 1
                  }.2.${i + 1} Objection ${i + 1} in ${dynamicSectionNumber}.${
                    index + 1
                  }.2 ${objectionSection.Items} in ${dynamicSectionNumber}.${
                    index + 1
                  } ${
                    messagesMap[application.applicationType]
                  } in ${dynamicSectionNumber} ${section.section}`;

                  newObjectionDocumentFileStoreId = await applyDocketToDocument(
                    objectionDocumentFileStoreId,
                    {
                      docketApplicationType: `${objectionSection.section.toUpperCase()} - ${
                        objectionSection.Items
                      }`,
                      docketCounselFor: docketCounselFor,
                      docketNameOfFiling: docketNameOfFiling,
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

          if (applicationOrderSection?.length !== 0) {
            let resOrderList = [];
            if (application.referenceId) {
              const resOrder = await search_order_v2(tenantId, requestInfo, {
                courtId: courtCase.courtId,
                filingNumber: courtCase.filingNumber,
                id: application.referenceId,
                status: "PUBLISHED",
                tenantId,
              });
              resOrderList = resOrder?.data?.list;
            }

            let responseOrderList = [];
            if (application.applicationNumber) {
              const responseOrder = await search_order_v2(
                tenantId,
                requestInfo,
                {
                  courtId: courtCase.courtId,
                  filingNumber: courtCase.filingNumber,
                  applicationNumber: application.applicationNumber,
                  status: "PUBLISHED",
                  tenantId,
                }
              );
              responseOrderList = responseOrder?.data?.list;
            }

            const orderList = [...resOrderList, ...responseOrderList];

            if (orderList?.length !== 0) {
              const fileStoreIds = [];

              orderList?.map((order) => {
                if (order?.documents?.length !== 0) {
                  const document = order?.documents?.find(
                    (doc) => doc?.documentType === "SIGNED"
                  );
                  if (document?.fileStore) {
                    fileStoreIds.push(document?.fileStore);
                  }
                }
              });

              newApplicationFileStoreId = await combineMultipleFilestores(
                [newApplicationFileStoreId, ...fileStoreIds],
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
            content: "applications",
          };
        })
      );
      applicationsIndexSection.lineItems =
        applicationLineItems?.filter(Boolean);
    } else {
      applicationsIndexSection.lineItems = [];
    }
  } else {
    applicationsIndexSection.lineItems = [];
  }
}

module.exports = {
  processDisposedApplications,
};
