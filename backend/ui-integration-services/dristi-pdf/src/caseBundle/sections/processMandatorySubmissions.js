const { search_application_v2, search_order_v2 } = require("../../api");
const {
  filterCaseBundleBySection,
} = require("../utils/filterCaseBundleBySection");
const { applyDocketToDocument } = require("../utils/applyDocketToDocument");
const {
  combineMultipleFilestores,
} = require("../utils/combineMultipleFilestores");
const { getDynamicSectionNumber } = require("../utils/getDynamicSectionNumber");

async function processMandatorySubmissions(
  courtCase,
  caseBundleMaster,
  tenantId,
  requestInfo,
  TEMP_FILES_DIR,
  indexCopy,
  messagesMap
) {
  const mandatorySubmissionsSection = filterCaseBundleBySection(
    caseBundleMaster,
    "mandatorysubmissions"
  );

  const sectionPosition = indexCopy.sections?.findIndex(
    (s) => s.name === "mandatorysubmissions"
  );

  const dynamicSectionNumber = getDynamicSectionNumber(
    indexCopy,
    sectionPosition
  );

  const mandatorySubmissionsLineItems = [];

  if (mandatorySubmissionsSection?.length !== 0) {
    const section = mandatorySubmissionsSection[0];

    const resOrder = await search_order_v2(
      tenantId,
      requestInfo,
      {
        filingNumber: courtCase.filingNumber,
        courtId: courtCase.courtId,
        orderType: "MANDATORY_SUBMISSIONS_RESPONSES",
        status: "PUBLISHED",
        tenantId,
      },
      {
        sortBy: "createdDate",
        order: "asc",
        limit: 100,
      }
    );

    const orderList = resOrder?.data?.list;

    if (orderList?.length !== 0) {
      await Promise.all(
        orderList?.map(async (order) => {
          const productionOfDocumentApplications = await search_application_v2(
            tenantId,
            requestInfo,
            {
              status: "COMPLETED",
              courtId: courtCase.courtId,
              filingNumber: courtCase.filingNumber,
              referenceId: order.id,
              applicationType: "PRODUCTION_DOCUMENTS",
              tenantId,
            },
            {
              sortBy: section.sorton,
              order: "asc",
              limit: 100,
            }
          );

          const applicationList =
            productionOfDocumentApplications?.data?.applicationList;

          if (applicationList?.length !== 0) {
            const innerLineItems = await Promise.all(
              applicationList?.map(async (application, index) => {
                if (application?.documents?.length !== 0) {
                  let newApplicationFileStoreId;
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
                  newApplicationFileStoreId = await combineMultipleFilestores(
                    fileStores,
                    tenantId,
                    requestInfo,
                    TEMP_FILES_DIR
                  );
                  if (section.docketpagerequired === "yes") {
                    const sourceUuid = application.auditDetails.createdBy;

                    const sourceLitigant = courtCase.litigants?.find(
                      (litigant) =>
                        litigant.additionalDetails.uuid === sourceUuid
                    );
                    const sourceRepresentative =
                      courtCase.representatives?.find(
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
                          ?.filter(Boolean)
                          ?.join(", ");
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
                      const complainant = courtCase.litigants?.find(
                        (litigant) =>
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
                    } ${messagesMap[application.applicationType]} ${
                      index + 1
                    } in ${dynamicSectionNumber} ${section.section}`;

                    const mandatorySubmissionsFileStoreId =
                      await applyDocketToDocument(
                        newApplicationFileStoreId,
                        {
                          docketApplicationType: section.section.toUpperCase(),
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

                    return {
                      sourceId: newApplicationFileStoreId,
                      fileStoreId: mandatorySubmissionsFileStoreId,
                      sortParam: index + 1,
                      createPDF: false,
                      content: "mandatorysubmissions",
                    };
                  } else {
                    return {
                      sourceId: newApplicationFileStoreId,
                      fileStoreId: newApplicationFileStoreId,
                      sortParam: index + 1,
                      createPDF: false,
                      content: "mandatorysubmissions",
                    };
                  }
                } else {
                  return null;
                }
              })
            );
            mandatorySubmissionsLineItems.push(
              ...innerLineItems?.filter(Boolean)
            );
          }
        })
      );
    }
  }

  const mandatorySubmissionsIndexSection = indexCopy.sections?.find(
    (section) => section.name === "mandatorysubmissions"
  );
  mandatorySubmissionsIndexSection.lineItems =
    mandatorySubmissionsLineItems?.filter(Boolean);
}

module.exports = {
  processMandatorySubmissions,
};
