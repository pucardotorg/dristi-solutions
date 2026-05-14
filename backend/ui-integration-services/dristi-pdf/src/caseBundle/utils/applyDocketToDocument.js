const { PDFDocument } = require("pdf-lib");
const { mergePDFDocuments } = require("./mergePDFDocuments");
const { persistPDF } = require("./persistPDF");
const { convertFileStoreToDocument } = require("./convertFileStoreToDocument");
const { search_mdms, create_pdf_v2 } = require("../../api");

/**
 *
 * @param {string} documentFileStoreId
 * @param {string} docketApplicationType
 * @param {string} tenantId
 * @param {*} requestInfo
 * @returns {Promise<string>} document [with docket] filestore id
 */
async function applyDocketToDocument(
  documentFileStoreId,
  {
    docketApplicationType,
    docketCounselFor,
    docketNameOfFiling,
    docketNameOfAdvocate,
    docketDateOfSubmission,
    documentPath,
  },
  courtCase,
  tenantId,
  requestInfo,
  TEMP_FILES_DIR
) {
  if (!documentFileStoreId) {
    return null;
  }

  const filingPDFDocument = await convertFileStoreToDocument(
    tenantId,
    documentFileStoreId,
    requestInfo
  );

  // handling with multiple name and names are seperated by comma
  const complainants = courtCase.litigants.filter((litigant) =>
    litigant.partyType.includes("complainant")
  );

  const filteredRespondents =
    courtCase.litigants?.filter((litigant) =>
      litigant.partyType.includes("respondent")
    ) || [];

  const respondents =
    filteredRespondents.length > 0
      ? filteredRespondents
      : courtCase?.additionalDetails?.respondentDetails?.formdata?.map(
          (item) => item?.data
        ) || [];

  const docketComplainantName = complainants
    .map((lit) => lit.additionalDetails.fullName)
    .filter(Boolean)
    .join(", ");

  const docketAccusedName =
    respondents
      ?.map((lit) => lit?.additionalDetails?.fullName)
      ?.filter(Boolean)
      ?.join(", ") ||
    respondents
      ?.map(
        ({ respondentFirstName, respondentMiddleName, respondentLastName }) =>
          [respondentFirstName, respondentMiddleName, respondentLastName]
            ?.filter(Boolean)
            ?.join(" ")
      )
      ?.filter(Boolean)
      ?.join(", ");

  const response = await search_mdms(
    courtCase.courtId,
    "common-masters.Court_Rooms",
    tenantId,
    requestInfo
  ).then((mdmsRes) => {
    return mdmsRes.data.mdms.filter((x) => x.isActive).map((x) => x.data);
  });

  const data = {
    Data: [
      {
        docketDateOfSubmission: docketDateOfSubmission,
        docketCourtName: "Before The " + response[0].name,
        docketComplainantName,
        docketAccusedName,
        docketApplicationType,
        docketNameOfAdvocate,
        docketCounselFor,
        docketNameOfFiling,
        documentPath,
      },
    ],
  };
  const filingDocketPdfResponse = await create_pdf_v2(
    tenantId,
    "docket-page",
    data,
    { RequestInfo: requestInfo }
  );
  const filingDocketPDFDocument = await PDFDocument.load(
    filingDocketPdfResponse.data,
    { ignoreEncryption: true }
  );

  const mergedDocumentWithDocket = await mergePDFDocuments(
    filingDocketPDFDocument,
    filingPDFDocument
  );
  const mergedDocWithDocketFileStoreId = await persistPDF(
    mergedDocumentWithDocket,
    tenantId,
    requestInfo,
    TEMP_FILES_DIR
  );
  return mergedDocWithDocketFileStoreId;
}

module.exports = {
  applyDocketToDocument,
};
