const { search_application_v2, search_order_v2 } = require("../../api");
const {
  filterCaseBundleBySection,
} = require("../utils/filterCaseBundleBySection");
const { applyDocketToDocument } = require("../utils/applyDocketToDocument");
const {
  combineMultipleFilestores,
} = require("../utils/combineMultipleFilestores");
const { getDynamicSectionNumber } = require("../utils/getDynamicSectionNumber");

async function processBailDocuments(
  courtCase,
  caseBundleMaster,
  tenantId,
  requestInfo,
  TEMP_FILES_DIR,
  indexCopy,
  messagesMap
) {
  const bailDocumentSection = filterCaseBundleBySection(
    caseBundleMaster,
    "baildocument"
  );

  const sectionPosition = indexCopy.sections.findIndex(
    (s) => s.name === "baildocument"
  );

  const dynamicSectionNumber = getDynamicSectionNumber(
    indexCopy,
    sectionPosition
  );

  if (bailDocumentSection?.length !== 0) {
    const section = bailDocumentSection[0];

    const bailApplicationsLineItems = [];
    const bailApplications = await search_application_v2(
      tenantId,
      requestInfo,
      {
        status: "COMPLETED",
        courtId: courtCase.courtId,
        filingNumber: courtCase.filingNumber,
        applicationType: "REQUEST_FOR_BAIL",
        tenantId,
      },
      {
        sortBy: section.sorton,
        order: "asc",
        limit: 100,
      }
    );

    const applicationList = bailApplications?.data?.applicationList;

    if (applicationList?.length !== 0) {
      const innerLineItems = await Promise.all(
        applicationList.map(async (application, index) => {
          if (application?.documents?.length !== 0) {
            const signed = [];
            const others = [];

            application.documents.forEach((document) => {
              if (document?.fileStore) {
                if (document.documentType === "SIGNED") {
                  signed.push(document.fileStore);
                } else {
                  others.push(document.fileStore);
                }
              }
            });

            const fileStores = [...signed, ...others];
            const combinedFileStore = await combineMultipleFilestores(
              fileStores,
              tenantId,
              requestInfo,
              TEMP_FILES_DIR
            );
            let newApplicationFileStoreId = combinedFileStore;

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
                const docketNameOfComplainants =
                  sourceRepresentative.representing
                    ?.map((lit) => lit.additionalDetails.fullName)
                    .filter(Boolean)
                    .join(", ");
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
                  )?.additionalDetails?.advocateName ||
                  docketNameOfComplainants;
                docketCounselFor =
                  docketNameOfFiling === docketNameOfComplainants
                    ? ""
                    : `COUNSEL FOR THE COMPLAINANT - ${docketNameOfComplainants}`;
              }

              const documentPath = `${dynamicSectionNumber}.${
                index + 1
              }.1 Application and Other Documents in ${dynamicSectionNumber}.${
                index + 1
              } ${messagesMap[application.applicationType]} ${
                index + 1
              } in ${dynamicSectionNumber} ${section.section}`;

              newApplicationFileStoreId = await applyDocketToDocument(
                newApplicationFileStoreId,
                {
                  docketApplicationType: section.Items,
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

            const resOrder = await search_order_v2(tenantId, requestInfo, {
              courtId: courtCase.courtId,
              filingNumber: courtCase.filingNumber,
              status: "PUBLISHED",
              orderType: "SET_BAIL_TERMS",
              applicationNumber: application.applicationNumber,
              tenantId,
            });

            const orderList = resOrder?.data?.list;

            if (orderList.length !== 0) {
              const resApplications = await search_application_v2(
                tenantId,
                requestInfo,
                {
                  courtId: courtCase.courtId,
                  filingNumber: courtCase.filingNumber,
                  referenceId: orderList[0]?.id,
                  applicationType: "SUBMIT_BAIL_DOCUMENTS",
                  status: "COMPLETED",
                  tenantId,
                }
              );
              const submitBailApplications =
                resApplications?.data?.applicationList;

              if (submitBailApplications?.length !== 0) {
                const submitBailApplication = submitBailApplications[0];
                const signed = [];
                const others = [];

                submitBailApplication.documents.forEach((document) => {
                  if (document?.fileStore) {
                    if (document.documentType === "SIGNED") {
                      signed.push(document.fileStore);
                    } else {
                      others.push(document.fileStore);
                    }
                  }
                });

                const fileStores = [...signed, ...others];
                const combinedFileStore = await combineMultipleFilestores(
                  fileStores,
                  tenantId,
                  requestInfo,
                  TEMP_FILES_DIR
                );
                let newFileStoreId = combinedFileStore;

                if (section.docketpagerequired === "yes") {
                  const sourceUuid =
                    submitBailApplication.auditDetails.createdBy;

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
                    const docketNameOfComplainants =
                      sourceRepresentative.representing
                        ?.map((lit) => lit.additionalDetails.fullName)
                        .filter(Boolean)
                        .join(", ");
                    const partyType =
                      sourceRepresentative.representing[0].partyType.includes(
                        "complainant"
                      )
                        ? "COMPLAINANT"
                        : "ACCUSED";
                    docketNameOfFiling =
                      sourceRepresentative.additionalDetails?.advocateName ||
                      "";
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
                          (party) =>
                            party.individualId === complainant.individualId
                        )
                      )?.additionalDetails?.advocateName ||
                      docketNameOfComplainants;
                    docketCounselFor =
                      docketNameOfFiling === docketNameOfComplainants
                        ? ""
                        : `COUNSEL FOR THE COMPLAINANT - ${docketNameOfComplainants}`;
                  }

                  const documentPath = `${dynamicSectionNumber}.${
                    index + 1
                  }.3 ${
                    messagesMap[submitBailApplication.applicationType]
                  } in ${dynamicSectionNumber}.${index + 1} ${
                    messagesMap[application.applicationType]
                  } ${index + 1} in ${dynamicSectionNumber} ${section.section}`;

                  newFileStoreId = await applyDocketToDocument(
                    newFileStoreId,
                    {
                      docketApplicationType: `${
                        section.Items
                      } - ${"Submit Bail Documents"}`,
                      docketCounselFor: docketCounselFor,
                      docketNameOfFiling: docketNameOfFiling,
                      docketDateOfSubmission: new Date(
                        submitBailApplication.createdDate
                      ).toLocaleDateString("en-IN"),
                      documentPath: documentPath,
                    },
                    courtCase,
                    tenantId,
                    requestInfo,
                    TEMP_FILES_DIR
                  );
                }
                newApplicationFileStoreId = await combineMultipleFilestores(
                  [newApplicationFileStoreId, newFileStoreId],
                  tenantId,
                  requestInfo,
                  TEMP_FILES_DIR
                );
              }
            }

            return {
              sourceId: combinedFileStore,
              fileStoreId: newApplicationFileStoreId,
              sortParam: index + 1,
              createPDF: false,
              content: "baildocument",
            };
          } else {
            return null;
          }
        })
      );
      bailApplicationsLineItems.push(...innerLineItems.filter(Boolean));
      const bailApplicationsIndexSection = indexCopy.sections.find(
        (section) => section.name === "baildocument"
      );
      bailApplicationsIndexSection.lineItems =
        bailApplicationsLineItems.filter(Boolean);
    }
  }
}

module.exports = {
  processBailDocuments,
};
