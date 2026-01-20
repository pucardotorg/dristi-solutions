const {
  filterCaseBundleBySection,
} = require("../utils/filterCaseBundleBySection");
const { search_digitalizedDocuments } = require("../../api");
const { applyDocketToDocument } = require("../utils/applyDocketToDocument");
const { getDynamicSectionNumber } = require("../utils/getDynamicSectionNumber");

async function processOthersSection(
  courtCase,
  caseBundleMaster,
  tenantId,
  requestInfo,
  TEMP_FILES_DIR,
  indexCopy
) {
  const section = filterCaseBundleBySection(caseBundleMaster, "others");
  const sortedSection = [...section].sort(
    (secA, secB) => secA.sorton - secB.sorton
  );

  const sectionPosition = indexCopy.sections?.findIndex(
    (s) => s.name === "others"
  );
  const dynamicSectionNumber = getDynamicSectionNumber(
    indexCopy,
    sectionPosition
  );

  if (!sortedSection || sortedSection.length === 0) return;

  let cachedDigitizedDocs = null;

  // Define more fetch functions like fetchDigitizedDocuments if more documents sections are added in others as name from MDMS.
  const fetchDigitizedDocuments = async () => {
    // If cached already, return cached value, in this manner we will call search api's only for active sections instead of calling for all sections.
    if (cachedDigitizedDocs) return cachedDigitizedDocs;
    const res = await search_digitalizedDocuments(tenantId, requestInfo, {
      caseFilingNumber: courtCase.filingNumber,
      courtId: courtCase.courtId,
      tenantId,
      status: "COMPLETED",
    });
    cachedDigitizedDocs = res?.data?.documents || [];
    return cachedDigitizedDocs;
  };

  const filteredDigitalizedDocuments = async (docType) => {
    const docs = await fetchDigitizedDocuments();
    return (
      docs
        ?.filter((doc) => doc?.type === docType)
        ?.sort((a, b) => {
          const aTime = a?.auditDetails?.createdTime || 0;
          const bTime = b?.auditDetails?.createdTime || 0;
          return aTime - bTime;
        }) || []
    );
  };

  const docToSearchCallMapping = {
    Others: filteredDigitalizedDocuments,
    // Add more options here for other documents types which require different search calls.
    // Update mapping logic(if and as required) if more items type, docType or sections type needs to be added in Others as "name" in future.
  };

  const getDocumentsFromMapping = async (section, docType) => {
    const fn = docToSearchCallMapping[section];
    if (!fn) {
      throw new Error(
        `Mapping missing for section "${section}" with docType "${docType}". ` +
          "Please define a handler inside docToSearchCallMapping."
      );
    }
    return await fn(docType);
  };

  const allDocumentsLineItems = [];
  for (let i = 0; i < sortedSection?.length; i++) {
    const section = sortedSection[i];
    const documents = await getDocumentsFromMapping(
      section.section,
      section.doctype
    );

    if (!documents || documents.length === 0) continue;

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

          const docketIndex = i + 1;
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
          content: "others",
        };
      })
    );
    allDocumentsLineItems.push(...digitizedDocumentsLineItems);
  }

  const otherDocumentsIndexSection = indexCopy.sections?.find(
    (section) => section.name === "others"
  );

  if (otherDocumentsIndexSection) {
    otherDocumentsIndexSection.lineItems =
      allDocumentsLineItems.filter(Boolean);
  }
}

module.exports = {
  processOthersSection,
};
