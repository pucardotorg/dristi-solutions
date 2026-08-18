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

async function runSection(sectionName, fn, context = {}) {
  const ctxStr = Object.entries(context)
    .map(([k, v]) => `${k}=${v}`)
    .join(", ");
  logger.info(`[CaseBundle] Starting section: ${sectionName}${ctxStr ? ` | ${ctxStr}` : ""}`);
  try {
    await fn();
    logger.info(`[CaseBundle] Completed section: ${sectionName}`);
  } catch (err) {
    logger.error(
      `[CaseBundle] Failed section: ${sectionName}${ctxStr ? ` | ${ctxStr}` : ""} | error: ${err.message}`
    );
    throw new Error(`Section '${sectionName}' failed: ${err.message}`);
  }
}

async function processPendingAdmissionCase({
  tenantId,
  caseId,
  index,
  requestInfo,
  TEMP_FILES_DIR,
}) {
  logger.info(`[CaseBundle] processPendingAdmissionCase started | caseId: ${caseId}, tenantId: ${tenantId}`);
  const indexCopy = cloneDeep(index);

  logger.info(`[CaseBundle] Fetching MDMS case_bundle_master | tenantId: ${tenantId}`);
  let caseBundleMaster;
  try {
    caseBundleMaster = await search_mdms(
      null,
      "CaseManagement.case_bundle_master",
      tenantId,
      requestInfo
    ).then((mdmsRes) => {
      return mdmsRes.data.mdms.filter((x) => x.isActive).map((x) => x.data);
    });
    logger.info(`[CaseBundle] MDMS case_bundle_master fetched | sections: ${caseBundleMaster.length}`);
  } catch (err) {
    logger.error(`[CaseBundle] Failed to fetch MDMS case_bundle_master | caseId: ${caseId} | error: ${err.message}`);
    throw err;
  }

  logger.info(`[CaseBundle] Fetching case details | caseId: ${caseId}`);
  let courtCase;
  try {
    const caseResponse = await search_case_v2(
      [{ caseId }],
      tenantId,
      requestInfo
    );
    courtCase = caseResponse?.data?.criteria[0]?.responseList[0];
    if (!courtCase) {
      throw new Error(`No case found for caseId: ${caseId}`);
    }
    logger.info(`[CaseBundle] Case fetched | caseId: ${caseId}, filingNumber: ${courtCase.filingNumber}`);
  } catch (err) {
    logger.error(`[CaseBundle] Failed to fetch case | caseId: ${caseId} | error: ${err.message}`);
    throw err;
  }

  logger.info(`[CaseBundle] Fetching localization messages | tenantId: ${tenantId}`);
  let messagesMap = {};
  try {
    const resMessage = await search_message(
      tenantId,
      "rainmaker-case,rainmaker-orders,rainmaker-submissions,rainmaker-hearings,rainmaker-home,rainmaker-common",
      "en_IN",
      requestInfo
    );
    const messages = resMessage?.data?.messages || [];
    messagesMap =
      messages?.length > 0
        ? Object.fromEntries(messages.map(({ code, message }) => [code, message]))
        : {};
    logger.info(`[CaseBundle] Localization messages fetched | count: ${messages.length}`);
  } catch (err) {
    logger.error(`[CaseBundle] Failed to fetch localization messages | caseId: ${caseId} | error: ${err.message}`);
    throw err;
  }

  const ctx = { caseId, filingNumber: courtCase.filingNumber };

  logger.info(`[CaseBundle] Processing group 1: titlepage, complaint, pendingapplications`);
  await Promise.all([
    runSection("titlepage", () => processTitlePageSection(courtCase, caseBundleMaster, tenantId, requestInfo, TEMP_FILES_DIR, indexCopy), ctx),
    runSection("complaint", () => processComplaintSection(courtCase, caseBundleMaster, tenantId, requestInfo, TEMP_FILES_DIR, indexCopy), ctx),
    runSection("pendingapplications", () => processPendingApplicationsSection(courtCase, caseBundleMaster, tenantId, requestInfo, TEMP_FILES_DIR, indexCopy, messagesMap), ctx),
  ]);

  logger.info(`[CaseBundle] Processing group 2: filings, affidavit, vakalat, additionalfilings`);
  await Promise.all([
    runSection("filings", () => processFilingsSection(courtCase, caseBundleMaster, tenantId, requestInfo, TEMP_FILES_DIR, indexCopy), ctx),
    runSection("affidavit", () => processAffidavitSection(courtCase, caseBundleMaster, tenantId, requestInfo, TEMP_FILES_DIR, indexCopy), ctx),
    runSection("vakalat", () => processVakalatSection(courtCase, caseBundleMaster, tenantId, requestInfo, TEMP_FILES_DIR, indexCopy, messagesMap), ctx),
    runSection("additionalfilings", () => processAdditionalFilings(courtCase, caseBundleMaster, tenantId, requestInfo, TEMP_FILES_DIR, indexCopy, messagesMap), ctx),
  ]);

  logger.info(`[CaseBundle] Processing group 3: mandatorysubmissions, complainantevidence, accusedevidence, courtevidence, applications`);
  await Promise.all([
    runSection("mandatorysubmissions", () => processMandatorySubmissions(courtCase, caseBundleMaster, tenantId, requestInfo, TEMP_FILES_DIR, indexCopy, messagesMap), ctx),
    runSection("complainantevidence", () => processComplainantEvidence(courtCase, caseBundleMaster, tenantId, requestInfo, TEMP_FILES_DIR, indexCopy, messagesMap), ctx),
    runSection("accusedevidence", () => processAccusedEvidence(courtCase, caseBundleMaster, tenantId, requestInfo, TEMP_FILES_DIR, indexCopy, messagesMap), ctx),
    runSection("courtevidence", () => processCourtEvidence(courtCase, caseBundleMaster, tenantId, requestInfo, TEMP_FILES_DIR, indexCopy), ctx),
    runSection("applications", () => processDisposedApplications(courtCase, caseBundleMaster, tenantId, requestInfo, TEMP_FILES_DIR, indexCopy, messagesMap), ctx),
  ]);

  logger.info(`[CaseBundle] Processing group 4: baildocument, processes`);
  await Promise.all([
    runSection("baildocument", () => processBailDocuments(courtCase, caseBundleMaster, tenantId, requestInfo, TEMP_FILES_DIR, indexCopy, messagesMap), ctx),
    runSection("processes", () => processTaskProcesses(courtCase, caseBundleMaster, tenantId, requestInfo, TEMP_FILES_DIR, indexCopy), ctx),
  ]);

  logger.info(`[CaseBundle] Processing group 5: paymentreceipts, digitalizedDocuments, orders`);
  await Promise.all([
    runSection("paymentreceipts", () => processPaymentReceipts(courtCase, caseBundleMaster, tenantId, requestInfo, TEMP_FILES_DIR, indexCopy), ctx),
    runSection("digitalizedDocuments", () => processExamination(courtCase, caseBundleMaster, tenantId, requestInfo, TEMP_FILES_DIR, indexCopy), ctx),
    runSection("orders", () => processOrders(courtCase, caseBundleMaster, tenantId, requestInfo, TEMP_FILES_DIR, indexCopy), ctx),
  ]);

  logger.info(`[CaseBundle] Processing group 6: others`);
  await Promise.all([
    runSection("others", () => processOthersSection(courtCase, caseBundleMaster, tenantId, requestInfo, TEMP_FILES_DIR, indexCopy), ctx),
  ]);

  indexCopy.isRegistered = true;
  indexCopy.contentLastModified = Date.now();

  logger.info(`[CaseBundle] processPendingAdmissionCase completed | caseId: ${caseId}`);
  return indexCopy;
}

module.exports = { processPendingAdmissionCase };
