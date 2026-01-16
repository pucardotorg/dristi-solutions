const {
  filterCaseBundleBySection,
} = require("../utils/filterCaseBundleBySection");
const { applyDocketToDocument } = require("../utils/applyDocketToDocument");
const { getDynamicSectionNumber } = require("../utils/getDynamicSectionNumber");
const { search_task_v2, search_task_mangement } = require("../../api");
const {
  duplicateExistingFileStore,
} = require("../utils/duplicateExistingFileStore");

async function processPaymentReceipts(
  courtCase,
  caseBundleMaster,
  tenantId,
  requestInfo,
  TEMP_FILES_DIR,
  indexCopy
) {
  const paymentReceiptSection = filterCaseBundleBySection(
    caseBundleMaster,
    "paymentreceipts"
  );

  const sectionPosition = indexCopy.sections?.findIndex(
    (s) => s.name === "paymentreceipts"
  );

  const paymentReceiptsIndexSection = indexCopy.sections?.find(
    (section) => section.name === "paymentreceipts"
  );

  const dynamicSectionNumber = getDynamicSectionNumber(
    indexCopy,
    sectionPosition
  );

  const casePaymentReceipt = courtCase.documents
    ?.filter((doc) => doc.documentType === "PAYMENT_RECEIPT")
    ?.sort((a, b) =>
      (a?.additionalDetails?.consumerCode || "").localeCompare(
        b?.additionalDetails?.consumerCode || ""
      )
    );
  const genericTaskDocument = await search_task_v2(
    tenantId,
    requestInfo,
    {
      tenantId: tenantId,
      filingNumber: courtCase.filingNumber,
      taskType: "GENERIC",
      courtId: courtCase.courtId,
      status: "COMPLETED",
    },
    {
      sortBy: "createdDate",
      order: "asc",
      limit: 100,
    }
  );

  const taskReceipts = genericTaskDocument.data.list
    ?.filter((task) => task?.documents && task?.documents?.length > 0)
    ?.map((task) => task?.documents?.[0]);

  const taskMangementData = await search_task_mangement(
    tenantId,
    requestInfo,
    {
      tenantId: tenantId,
      status: "COMPLETED",
      filingNumber: courtCase.filingNumber,
    },
    {
      sortBy: "last_modified_time",
      order: "asc",
      limit: 100,
    }
  );

  const taskMangementReceipts =
    taskMangementData?.data?.taskManagementRecords
      ?.map((task) =>
        task?.documents?.find?.((d) => d?.documentType === "PAYMENT_RECEIPT")
      )
      ?.filter(Boolean) || [];

  const documentList = [
    ...(casePaymentReceipt || []),
    ...(taskMangementReceipts || []),
    ...(taskReceipts || []),
  ];

  if (paymentReceiptSection?.length !== 0 && documentList?.length !== 0) {
    const section = paymentReceiptSection[0];
    const paymentReceiptLineItems = await Promise.all(
      documentList?.map(async (doc, index) => {
        const paymentReceiptFileStoreId = doc.fileStore;

        if (!paymentReceiptFileStoreId) {
          return null;
        }

        let newFileStoreId;

        if (section.docketpagerequired === "yes") {
          const complainant = courtCase.litigants?.find((litigant) =>
            litigant.partyType.includes("complainant.primary")
          );
          const docketComplainantName = complainant.additionalDetails.fullName;
          const docketNameOfAdvocate = courtCase.representatives?.find((adv) =>
            adv.representing?.find(
              (party) => party.individualId === complainant.individualId
            )
          )?.additionalDetails?.advocateName;

          const docketCounselFor = docketNameOfAdvocate
            ? `COUNSEL FOR THE COMPLAINANT - ${docketComplainantName}`
            : "";

          newFileStoreId = await applyDocketToDocument(
            paymentReceiptFileStoreId,
            {
              docketApplicationType: section.section.toUpperCase(),
              docketCounselFor: docketCounselFor,
              docketNameOfFiling: docketNameOfAdvocate || docketComplainantName,
              docketDateOfSubmission: new Date(
                courtCase.registrationDate
              ).toLocaleDateString("en-IN"),
              documentPath: `${dynamicSectionNumber}.${
                index + 1
              } Case Filing Payment in ${dynamicSectionNumber} ${
                section.section
              }`,
            },
            courtCase,
            tenantId,
            requestInfo,
            TEMP_FILES_DIR
          );
        } else {
          newFileStoreId = await duplicateExistingFileStore(
            tenantId,
            paymentReceiptFileStoreId,
            requestInfo,
            TEMP_FILES_DIR
          );
        }

        return {
          createPDF: false,
          sourceId: paymentReceiptFileStoreId,
          fileStoreId: newFileStoreId,
          content: "paymentreceipts",
          sortParam: index + 1,
        };
      })
    );
    paymentReceiptsIndexSection.lineItems =
      paymentReceiptLineItems?.filter(Boolean);
  } else {
    paymentReceiptsIndexSection.lineItems = [];
  }
}

module.exports = {
  processPaymentReceipts,
};
