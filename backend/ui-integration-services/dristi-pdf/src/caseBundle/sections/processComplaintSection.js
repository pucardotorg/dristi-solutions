const {
  filterCaseBundleBySection,
} = require("../utils/filterCaseBundleBySection");
const { applyDocketToDocument } = require("../utils/applyDocketToDocument");
const { getDynamicSectionNumber } = require("../utils/getDynamicSectionNumber");
const { logger } = require("../../logger");

async function processComplaintSection(
  courtCase,
  caseBundleMaster,
  tenantId,
  requestInfo,
  TEMP_FILES_DIR,
  indexCopy
) {
  logger.info(
    `[processComplaintSection] Started | filingNumber: ${courtCase?.filingNumber}`
  );
  const complaintSection = filterCaseBundleBySection(
    caseBundleMaster,
    "complaint"
  );

  const sectionPosition = indexCopy.sections?.findIndex(
    (s) => s.name === "complaint"
  );

  const dynamicSectionNumber = getDynamicSectionNumber(
    indexCopy,
    sectionPosition
  );

  if (complaintSection?.length !== 0) {
    const section = complaintSection[0];

    // Fallback chain mirroring Java ComplaintSection.java:
    // 1. case.complaint.signed (ideal — fully signed document)
    // 2. additionalDetails.signedCaseDocument (backup written by ComplainantSignature.js)
    // 3. case.complaint.unsigned (last resort — signing incomplete but doc exists)
    let complaintFileStoreId = courtCase.documents?.find(
      (doc) => doc.documentType === "case.complaint.signed"
    )?.fileStore;

    if (!complaintFileStoreId) {
      complaintFileStoreId =
        courtCase.additionalDetails?.signedCaseDocument || null;
      if (complaintFileStoreId) {
        logger.warn(
          `[processComplaintSection] case.complaint.signed not found, falling back to additionalDetails.signedCaseDocument | filingNumber: ${courtCase?.filingNumber}, fileStoreId: ${complaintFileStoreId}`
        );
      }
    }

    if (!complaintFileStoreId) {
      complaintFileStoreId = courtCase.documents?.find(
        (doc) => doc.documentType === "case.complaint.unsigned"
      )?.fileStore;
      if (complaintFileStoreId) {
        logger.warn(
          `[processComplaintSection] Falling back to case.complaint.unsigned | filingNumber: ${courtCase?.filingNumber}, fileStoreId: ${complaintFileStoreId}`
        );
      }
    }

    if (!complaintFileStoreId) {
      logger.error(
        `[processComplaintSection] No complaint document found in any fallback (signed, additionalDetails.signedCaseDocument, unsigned) | filingNumber: ${courtCase?.filingNumber}`
      );
      throw new Error("no case complaint");
    }

    let complaintNewFileStoreId = complaintFileStoreId;

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

      complaintNewFileStoreId = await applyDocketToDocument(
        complaintFileStoreId,
        {
          docketApplicationType: section.section.toUpperCase(),
          docketCounselFor: docketCounselFor,
          docketNameOfFiling: docketNameOfAdvocate || docketComplainantName,
          docketDateOfSubmission: new Date(
            courtCase.registrationDate
          ).toLocaleDateString("en-IN"),
          documentPath: `${dynamicSectionNumber} ${section.section}`,
        },
        courtCase,
        tenantId,
        requestInfo,
        TEMP_FILES_DIR
      );
    }

    // update index

    const complaintIndexSection = indexCopy.sections?.find(
      (section) => section.name === "complaint"
    );
    complaintIndexSection.lineItems = complaintIndexSection.lineItems || [];
    complaintIndexSection.lineItems[0] = {
      ...complaintIndexSection.lineItems[0],
      createPDF: false,
      sourceId: complaintFileStoreId,
      fileStoreId: complaintNewFileStoreId,
      content: "complaint",
      sortParam: null,
    };
  }
}

module.exports = {
  processComplaintSection,
};
