const {
  filterCaseBundleBySection,
} = require("../utils/filterCaseBundleBySection");
const { applyDocketToDocument } = require("../utils/applyDocketToDocument");

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

  if (paymentReceiptSection?.length !== 0) {
    const section = paymentReceiptSection[0];
    const paymentReceiptFileStoreId = courtCase.documents.find(
      (doc) => doc.documentType === "PAYMENT_RECEIPT"
    )?.fileStore;

    if (paymentReceiptFileStoreId) {
      let newFileStoreId = paymentReceiptFileStoreId;

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

        newFileStoreId = await applyDocketToDocument(
          paymentReceiptFileStoreId,
          {
            docketApplicationType: section.section.toUpperCase(),
            docketCounselFor: "COMPLAINANT",
            docketNameOfFiling: docketComplainantName,
            docketNameOfAdvocate: docketNameOfAdvocate || docketComplainantName,
            docketDateOfSubmission: new Date(
              courtCase.registrationDate
            ).toLocaleDateString("en-IN"),
          },
          courtCase,
          tenantId,
          requestInfo,
          TEMP_FILES_DIR
        );
      }

      // update index
      const paymentReceiptIndexSection = indexCopy.sections.find(
        (section) => section.name === "paymentreceipts"
      );
      paymentReceiptIndexSection.lineItems = [
        {
          createPDF: false,
          sourceId: paymentReceiptFileStoreId,
          fileStoreId: newFileStoreId,
          content: "paymentreceipts",
          sortParam: null,
        },
      ];
    }
  }
}

module.exports = {
  processPaymentReceipts,
};
