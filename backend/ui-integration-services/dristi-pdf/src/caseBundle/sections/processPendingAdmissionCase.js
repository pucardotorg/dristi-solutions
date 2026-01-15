const cloneDeep = require("lodash.clonedeep");
const { search_mdms, search_case_v2, search_message } = require("../../api");
const { logger } = require("../../logger");
const { processTitlePageSection } = require("./processTitlePageSection");
const { processComplaintSection } = require("./processComplaintSection");
const { processFilingsSection } = require("./processFilingsSection");
const { processAffidavitSection } = require("./processAffidavitSection");
const { processVakalatSection } = require("./processVakalatSection");
const {
  processPendingApplicationsSection,
} = require("./processPendingApplicationsSection");
const {
  processMandatorySubmissions,
} = require("./processMandatorySubmissions");
const { processAdditionalFilings } = require("./processAdditionalFilings");
const { processComplainantEvidence } = require("./processComplainantEvidence");
const { processAccusedEvidence } = require("./processAccusedEvidence");
const { processCourtEvidence } = require("./processCourtEvidence");
const {
  processDisposedApplications,
} = require("./processDisposedApplications");
const { processBailDocuments } = require("./processBailDocuments");
const { processTaskProcesses } = require("./processTaskProcesses");
const { processPaymentReceipts } = require("./processPaymentReceipts");
const { processOrders } = require("./processOrders");
const { processExamination } = require("./processExamination");
const { processOthersSection } = require("./processOthersSection");

async function processPendingAdmissionCase({
  tenantId,
  caseId,
  index,
  requestInfo,
  TEMP_FILES_DIR,
}) {
  const indexCopy = cloneDeep(index);
  const caseBundleMaster = await search_mdms(
    null,
    "CaseManagement.case_bundle_master",
    tenantId,
    requestInfo
  ).then((mdmsRes) => {
    return mdmsRes.data.mdms.filter((x) => x.isActive).map((x) => x.data);
  });

  const caseResponse = await search_case_v2(
    [
      {
        caseId,
      },
    ],
    tenantId,
    requestInfo
  );
  logger.info("recd case response", JSON.stringify(caseResponse?.data));
  const courtCase = caseResponse?.data?.criteria[0]?.responseList[0];

  console.debug(caseBundleMaster);

  const resMessage = await search_message(
    tenantId,
    "rainmaker-case,rainmaker-orders,rainmaker-submissions,rainmaker-hearings,rainmaker-home,rainmaker-common",
    "en_IN",
    requestInfo
  );

  const messages = resMessage?.data?.messages || [];
  const messagesMap =
    messages?.length > 0
      ? Object.fromEntries(messages.map(({ code, message }) => [code, message]))
      : {};

  // Create an array of promises for all processing functions
  const complaintPromises = [
    processTitlePageSection(
      courtCase,
      caseBundleMaster,
      tenantId,
      requestInfo,
      TEMP_FILES_DIR,
      indexCopy
    ),
    processComplaintSection(
      courtCase,
      caseBundleMaster,
      tenantId,
      requestInfo,
      TEMP_FILES_DIR,
      indexCopy
    ),
    processPendingApplicationsSection(
      courtCase,
      caseBundleMaster,
      tenantId,
      requestInfo,
      TEMP_FILES_DIR,
      indexCopy,
      messagesMap
    ),
  ];

  await Promise.all(complaintPromises);

  const filingPromises = [
    processFilingsSection(
      courtCase,
      caseBundleMaster,
      tenantId,
      requestInfo,
      TEMP_FILES_DIR,
      indexCopy
    ),
    processAffidavitSection(
      courtCase,
      caseBundleMaster,
      tenantId,
      requestInfo,
      TEMP_FILES_DIR,
      indexCopy
    ),
    processVakalatSection(
      courtCase,
      caseBundleMaster,
      tenantId,
      requestInfo,
      TEMP_FILES_DIR,
      indexCopy,
      messagesMap
    ),
    processAdditionalFilings(
      courtCase,
      caseBundleMaster,
      tenantId,
      requestInfo,
      TEMP_FILES_DIR,
      indexCopy,
      messagesMap
    ),
  ];

  await Promise.all(filingPromises);

  const processingPromises = [
    processMandatorySubmissions(
      courtCase,
      caseBundleMaster,
      tenantId,
      requestInfo,
      TEMP_FILES_DIR,
      indexCopy,
      messagesMap
    ),
    processComplainantEvidence(
      courtCase,
      caseBundleMaster,
      tenantId,
      requestInfo,
      TEMP_FILES_DIR,
      indexCopy,
      messagesMap
    ),
    processAccusedEvidence(
      courtCase,
      caseBundleMaster,
      tenantId,
      requestInfo,
      TEMP_FILES_DIR,
      indexCopy,
      messagesMap
    ),
    processCourtEvidence(
      courtCase,
      caseBundleMaster,
      tenantId,
      requestInfo,
      TEMP_FILES_DIR,
      indexCopy
    ),
    processDisposedApplications(
      courtCase,
      caseBundleMaster,
      tenantId,
      requestInfo,
      TEMP_FILES_DIR,
      indexCopy,
      messagesMap
    ),
  ];

  await Promise.all(processingPromises);

  const finalPromises = [
    processBailDocuments(
      courtCase,
      caseBundleMaster,
      tenantId,
      requestInfo,
      TEMP_FILES_DIR,
      indexCopy,
      messagesMap
    ),
    processTaskProcesses(
      courtCase,
      caseBundleMaster,
      tenantId,
      requestInfo,
      TEMP_FILES_DIR,
      indexCopy
    ),
  ];

  await Promise.all(finalPromises);

  const orderPromises = [
    processPaymentReceipts(
      courtCase,
      caseBundleMaster,
      tenantId,
      requestInfo,
      TEMP_FILES_DIR,
      indexCopy
    ),
    processExamination(
      courtCase,
      caseBundleMaster,
      tenantId,
      requestInfo,
      TEMP_FILES_DIR,
      indexCopy
    ),
    processOrders(
      courtCase,
      caseBundleMaster,
      tenantId,
      requestInfo,
      TEMP_FILES_DIR,
      indexCopy
    ),
  ];

  await Promise.all(orderPromises);

  const othersPromises = [
    processOthersSection(
      courtCase,
      caseBundleMaster,
      tenantId,
      requestInfo,
      TEMP_FILES_DIR,
      indexCopy
    ),
  ];

  await Promise.all(othersPromises);

  indexCopy.isRegistered = true;
  indexCopy.contentLastModified = Date.now();

  return indexCopy;
}

module.exports = { processPendingAdmissionCase };
