const cloneDeep = require("lodash.clonedeep");
const { search_mdms, search_case_v2 } = require("../../api");
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

  await processTitlePageSection(
    courtCase,
    caseBundleMaster,
    tenantId,
    requestInfo,
    TEMP_FILES_DIR,
    indexCopy
  );
  await processPendingApplicationsSection(
    courtCase,
    caseBundleMaster,
    tenantId,
    requestInfo,
    TEMP_FILES_DIR,
    indexCopy
  );
  await processComplaintSection(
    courtCase,
    caseBundleMaster,
    tenantId,
    requestInfo,
    TEMP_FILES_DIR,
    indexCopy
  );
  await processFilingsSection(
    courtCase,
    caseBundleMaster,
    tenantId,
    requestInfo,
    TEMP_FILES_DIR,
    indexCopy
  );
  await processAffidavitSection(
    courtCase,
    caseBundleMaster,
    tenantId,
    requestInfo,
    TEMP_FILES_DIR,
    indexCopy
  );
  await processVakalatSection(
    courtCase,
    caseBundleMaster,
    tenantId,
    requestInfo,
    TEMP_FILES_DIR,
    indexCopy
  );
  await processAdditionalFilings(
    courtCase,
    caseBundleMaster,
    tenantId,
    requestInfo,
    TEMP_FILES_DIR,
    indexCopy
  );
  await processMandatorySubmissions(
    courtCase,
    caseBundleMaster,
    tenantId,
    requestInfo,
    TEMP_FILES_DIR,
    indexCopy
  );
  await processComplainantEvidence(
    courtCase,
    caseBundleMaster,
    tenantId,
    requestInfo,
    TEMP_FILES_DIR,
    indexCopy
  );
  await processAccusedEvidence(
    courtCase,
    caseBundleMaster,
    tenantId,
    requestInfo,
    TEMP_FILES_DIR,
    indexCopy
  );
  await processCourtEvidence(
    courtCase,
    caseBundleMaster,
    tenantId,
    requestInfo,
    TEMP_FILES_DIR,
    indexCopy
  );
  await processDisposedApplications(
    courtCase,
    caseBundleMaster,
    tenantId,
    requestInfo,
    TEMP_FILES_DIR,
    indexCopy
  );
  await processBailDocuments(
    courtCase,
    caseBundleMaster,
    tenantId,
    requestInfo,
    TEMP_FILES_DIR,
    indexCopy
  );
  await processTaskProcesses(
    courtCase,
    caseBundleMaster,
    tenantId,
    requestInfo,
    TEMP_FILES_DIR,
    indexCopy
  );
  await processPaymentReceipts(
    courtCase,
    caseBundleMaster,
    tenantId,
    requestInfo,
    TEMP_FILES_DIR,
    indexCopy
  );
  await processOrders(
    courtCase,
    caseBundleMaster,
    tenantId,
    requestInfo,
    TEMP_FILES_DIR,
    indexCopy
  );

  indexCopy.isRegistered = true;
  indexCopy.contentLastModified = Date.now();

  return indexCopy;
}

module.exports = { processPendingAdmissionCase };
