const fs = require("fs");
const path = require("path");
const { logger } = require("../logger");
const {
  processPendingAdmissionCase,
} = require("./sections/processPendingAdmissionCase");

const TEMP_FILES_DIR = path.join(__dirname, "../temp");

if (!fs.existsSync(TEMP_FILES_DIR)) {
  fs.mkdirSync(TEMP_FILES_DIR);
}

async function processCaseBundle(tenantId, caseId, index, state, requestInfo) {
  logger.info(`[CaseBundle] processCaseBundle started | caseId: ${caseId}, tenantId: ${tenantId}, state: ${state}`);

  let updatedIndex;

  updatedIndex = await processPendingAdmissionCase({
    tenantId,
    caseId,
    index,
    requestInfo,
    TEMP_FILES_DIR,
  });

  logger.info(`[CaseBundle] processCaseBundle completed | caseId: ${caseId}, updatedIndex: ${JSON.stringify(updatedIndex)}`);
  return updatedIndex;
}

module.exports = processCaseBundle;
