const {
  filterCaseBundleBySection,
} = require("../utils/filterCaseBundleBySection");
const { search_digitalizedDocuments } = require("../../api");
const { applyDocketToDocument } = require("../utils/applyDocketToDocument");
const { getDynamicSectionNumber } = require("../utils/getDynamicSectionNumber");

async function processExamination(
  courtCase,
  caseBundleMaster,
  tenantId,
  requestInfo,
  TEMP_FILES_DIR,
  indexCopy
) {
  const section = filterCaseBundleBySection(
    caseBundleMaster,
    "digitalizedDocuments"
  );
  const sortedSection = [...section].sort(
    (secA, secB) => secA.sorton - secB.sorton
  );

  const sectionPosition = indexCopy.sections?.findIndex(
    (s) => s.name === "digitalizedDocuments"
  );
  const dynamicSectionNumber = getDynamicSectionNumber(
    indexCopy,
    sectionPosition
  );

  if (!sortedSection || sortedSection.length === 0) return;

  const resDigitizedDocuments = await search_digitalizedDocuments(
    tenantId,
    requestInfo,
    {
      caseFilingNumber: courtCase.filingNumber,
      courtId: courtCase.courtId,
      tenantId,
      status: "COMPLETED",
    }
  );

  const filteredDocuments = (type) => {
    return resDigitizedDocuments?.data?.documents
      ?.filter((doc) => doc?.type === type)
      ?.sort((a, b) => {
        const aTime = a?.auditDetails?.createdTime;
        const bTime = b?.auditDetails?.createdTime;
        if (!aTime || !bTime) return 0;
        return aTime - bTime;
      });
  };

  if (
    !resDigitizedDocuments?.data?.documents ||
    resDigitizedDocuments?.data?.documents.length === 0
  )
    return;

  const allDocumentsLineItems = [];
  let docketIndex = 0;
  for (let i = 0; i < sortedSection?.length; i++) {
    const section = sortedSection[i];
    const documents = filteredDocuments(section.doctype);
    if (!documents || documents?.length === 0) {
      continue;
    }
    docketIndex++;
    const digitizedDocumentsLineItems = await Promise.all(
      documents.map(async (data, index) => {
        if (!data?.documents || data.documents.length === 0) return null;

        const documentFileStoreId = data.documents[0]?.fileStore;
        if (!documentFileStoreId) return null;

        let newFileStoreId = documentFileStoreId;

        if (section.docketpagerequired === "yes" && index === 0) {
          const complainant = courtCase.litigants?.find((litigant) =>
            litigant.partyType?.includes("complainant.primary")
          );

          const docketComplainantName =
            complainant?.additionalDetails?.fullName || "";

          const docketAdvocate = courtCase.representatives?.find((adv) =>
            adv.representing?.some(
              (party) => party.individualId === complainant?.individualId
            )
          );

          const docketNameOfAdvocate =
            docketAdvocate?.additionalDetails?.advocateName || "";

          const docketCounselFor = docketNameOfAdvocate
            ? `COUNSEL FOR THE COMPLAINANT - ${docketComplainantName}`
            : "";

          const documentPath = `${dynamicSectionNumber}.${docketIndex} ${section.Items} in ${dynamicSectionNumber} ${section.section}`;

          newFileStoreId = await applyDocketToDocument(
            documentFileStoreId,
            {
              docketApplicationType: `${section.section.toUpperCase()} - ${
                section.Items
              }`,
              docketCounselFor,
              docketNameOfFiling: docketNameOfAdvocate || docketComplainantName,
              docketDateOfSubmission: new Date(
                courtCase.registrationDate
              ).toLocaleDateString("en-IN"),
              documentPath,
            },
            courtCase,
            tenantId,
            requestInfo,
            TEMP_FILES_DIR
          );
        }

        return {
          sourceId: documentFileStoreId,
          fileStoreId: newFileStoreId, // appending docket only once per docType.
          sortParam: index + 1,
          createPDF: false,
          content: "digitalizedDocuments",
        };
      })
    );
    allDocumentsLineItems.push(...digitizedDocumentsLineItems);
  }

  const digitalizedDocumentsIndexSection = indexCopy.sections?.find(
    (section) => section.name === "digitalizedDocuments"
  );

  if (digitalizedDocumentsIndexSection) {
    digitalizedDocumentsIndexSection.lineItems =
      allDocumentsLineItems.filter(Boolean);
  }
}

module.exports = {
  processExamination,
};
