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

async function runSection(name, caseId, fn) {
  try {
    return await fn();
  } catch (err) {
    logger.error(`Section failed: ${name}`, {
      sectionName: name,
      caseId,
      error: err.message,
      status: err.status,
      downstreamUrl: err.downstreamUrl,
      requestParams: err.requestParams,
      responseBody: err.responseBody,
      stack: err.stack,
    });
    throw err;
  }
}

async function runParallel(label, caseId, promises) {
  const results = await Promise.allSettled(promises);
  const failures = results.filter((r) => r.status === "rejected");
  failures.forEach((r) => {
    logger.error(`Parallel batch failed: ${label}`, { caseId, reason: r.reason?.message || r.reason });
  });
  if (failures.length > 0) {
    throw failures[0].reason;
  }
}

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

  await runParallel("batch-1: titlepage/complaint/pendingApplications", caseId, [
    runSection("titlepage", caseId, () => processTitlePageSection(courtCase, caseBundleMaster, tenantId, requestInfo, TEMP_FILES_DIR, indexCopy)),
    runSection("complaint", caseId, () => processComplaintSection(courtCase, caseBundleMaster, tenantId, requestInfo, TEMP_FILES_DIR, indexCopy)),
    runSection("pendingApplications", caseId, () => processPendingApplicationsSection(courtCase, caseBundleMaster, tenantId, requestInfo, TEMP_FILES_DIR, indexCopy, messagesMap)),
  ]);

  await runParallel("batch-2: filings/affidavit/vakalat/additionalFilings", caseId, [
    runSection("filings", caseId, () => processFilingsSection(courtCase, caseBundleMaster, tenantId, requestInfo, TEMP_FILES_DIR, indexCopy)),
    runSection("affidavit", caseId, () => processAffidavitSection(courtCase, caseBundleMaster, tenantId, requestInfo, TEMP_FILES_DIR, indexCopy)),
    runSection("vakalat", caseId, () => processVakalatSection(courtCase, caseBundleMaster, tenantId, requestInfo, TEMP_FILES_DIR, indexCopy, messagesMap)),
    runSection("additionalFilings", caseId, () => processAdditionalFilings(courtCase, caseBundleMaster, tenantId, requestInfo, TEMP_FILES_DIR, indexCopy, messagesMap)),
  ]);

  await runParallel("batch-3: mandatory/complainantEvidence/accusedEvidence/courtEvidence/disposedApplications", caseId, [
    runSection("mandatorySubmissions", caseId, () => processMandatorySubmissions(courtCase, caseBundleMaster, tenantId, requestInfo, TEMP_FILES_DIR, indexCopy, messagesMap)),
    runSection("complainantEvidence", caseId, () => processComplainantEvidence(courtCase, caseBundleMaster, tenantId, requestInfo, TEMP_FILES_DIR, indexCopy, messagesMap)),
    runSection("accusedEvidence", caseId, () => processAccusedEvidence(courtCase, caseBundleMaster, tenantId, requestInfo, TEMP_FILES_DIR, indexCopy, messagesMap)),
    runSection("courtEvidence", caseId, () => processCourtEvidence(courtCase, caseBundleMaster, tenantId, requestInfo, TEMP_FILES_DIR, indexCopy)),
    runSection("disposedApplications", caseId, () => processDisposedApplications(courtCase, caseBundleMaster, tenantId, requestInfo, TEMP_FILES_DIR, indexCopy, messagesMap)),
  ]);

  await runParallel("batch-4: bail/taskProcesses", caseId, [
    runSection("bailDocuments", caseId, () => processBailDocuments(courtCase, caseBundleMaster, tenantId, requestInfo, TEMP_FILES_DIR, indexCopy, messagesMap)),
    runSection("taskProcesses", caseId, () => processTaskProcesses(courtCase, caseBundleMaster, tenantId, requestInfo, TEMP_FILES_DIR, indexCopy)),
  ]);

  await runParallel("batch-5: paymentReceipts/examination/orders", caseId, [
    runSection("paymentReceipts", caseId, () => processPaymentReceipts(courtCase, caseBundleMaster, tenantId, requestInfo, TEMP_FILES_DIR, indexCopy)),
    runSection("examination", caseId, () => processExamination(courtCase, caseBundleMaster, tenantId, requestInfo, TEMP_FILES_DIR, indexCopy)),
    runSection("orders", caseId, () => processOrders(courtCase, caseBundleMaster, tenantId, requestInfo, TEMP_FILES_DIR, indexCopy)),
  ]);

  await runParallel("batch-6: others", caseId, [
    runSection("others", caseId, () => processOthersSection(courtCase, caseBundleMaster, tenantId, requestInfo, TEMP_FILES_DIR, indexCopy)),
  ]);

  indexCopy.isRegistered = true;
  indexCopy.contentLastModified = Date.now();

  return indexCopy;
}

module.exports = { processPendingAdmissionCase };
