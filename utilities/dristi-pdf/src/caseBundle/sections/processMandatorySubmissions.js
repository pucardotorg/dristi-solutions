const { search_application_v2, search_order_v2 } = require("../../api");
const {
  filterCaseBundleBySection,
} = require("../utils/filterCaseBundleBySection");
const { applyDocketToDocument } = require("../utils/applyDocketToDocument");
const {
  combineMultipleFilestores,
} = require("../utils/combineMultipleFilestores");

async function processMandatorySubmissions(
  courtCase,
  caseBundleMaster,
  tenantId,
  requestInfo,
  TEMP_FILES_DIR,
  indexCopy
) {
  const mandatorySubmissionsSection = filterCaseBundleBySection(
    caseBundleMaster,
    "mandatorysubmissions"
  );

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
      }
    );

    const orderList = resOrder?.data?.list;

    if (orderList?.length !== 0) {
      const mandatorySubmissionsLineItems = [];
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
            }
          );

          const applicationList =
            productionOfDocumentApplications?.data?.applicationList;

          if (applicationList?.length !== 0) {
            const innerLineItems = await Promise.all(
              applicationList.map(async (application, ind) => {
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
                    const sourceUuid = application.createdBy;

                    const sourceLitigant = courtCase.litigants?.find(
                      (litigant) =>
                        litigant.additionalDetails.uuid === sourceUuid
                    );
                    const sourceRepresentative =
                      courtCase.representatives?.find(
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
                        sourceRepresentative.additionalDetails?.advocateName ||
                        "";
                      docketNameOfFiling =
                        sourceRepresentative.additionalDetails?.advocateName ||
                        "";
                      docketCounselFor =
                        sourceRepresentative.representing[0].partyType.includes(
                          "complainant"
                        )
                          ? "COMPLAINANT"
                          : "ACCUSED";
                    }

                    const mandatorySubmissionsFileStoreId =
                      await applyDocketToDocument(
                        newApplicationFileStoreId,
                        {
                          docketApplicationType: section.section.toUpperCase(),
                          docketCounselFor: docketCounselFor,
                          docketNameOfFiling: docketNameOfFiling,
                          docketNameOfAdvocate: docketNameOfAdvocate,
                          docketDateOfSubmission: new Date(
                            application.createdDate
                          ).toLocaleDateString("en-IN"),
                        },
                        courtCase,
                        tenantId,
                        requestInfo,
                        TEMP_FILES_DIR
                      );

                    return {
                      sourceId: newApplicationFileStoreId,
                      fileStoreId: mandatorySubmissionsFileStoreId,
                      sortParam: ind + 1,
                      createPDF: false,
                      content: "mandatorysubmissions",
                    };
                  } else {
                    return {
                      sourceId: newApplicationFileStoreId,
                      fileStoreId: newApplicationFileStoreId,
                      sortParam: ind + 1,
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
              ...innerLineItems.filter(Boolean)
            );
          }
        })
      );

      const mandatorySubmissionsIndexSection = indexCopy.sections.find(
        (section) => section.name === "mandatorysubmissions"
      );
      mandatorySubmissionsIndexSection.lineItems =
        mandatorySubmissionsLineItems.filter(Boolean);
    }
  }
}

module.exports = {
  processMandatorySubmissions,
};
