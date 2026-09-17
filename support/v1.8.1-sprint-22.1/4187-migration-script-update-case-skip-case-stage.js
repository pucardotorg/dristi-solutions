const { readFile, writeFile, mkdir } = require("fs/promises");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { userInfo } = require("os");
const BATCH_SIZE = 10;
const access_token = "f6f5b37a-506c-4967-abd3-458c2180b7b5";

// ---- Begin transform, analysis, trimDocument, globalCounter ----

let globalCounter = 0;

const transform = (data) => {
    try {
        return {
            ...data,
            workflow: {
                ...(data?.workflow || {}),
                action: "ISSUE_ORDER"
            }
        };
    } catch (err) {
        console.log(err);
        return data;
    }
};

const analysis = (data) => {
    try {
        if (data.status !== 'PENDING_NOTICE' && data.status !== 'PENDING_ADMISSION_HEARING') return false;
        else return true;
    }
    catch (err) {
        return false;
    }
};

const trimDocument = (document) => {
    const { fileStore, documentType } = document;
    return { fileStore, documentType, fileName: 'UPLOAD_VAKALATNAMA', documentName: `vakalatnama_${globalCounter++}.png` };
};

// ---- End transform, analysis, trimDocument, globalCounter ----

const readIds = async () => {
  const data = await readFile("./ids.txt");
  const lines = data.toString().split("\n");
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const ids = lines
    .filter((line) => uuidRegex.test(line.trim()))
    .map((line) => line.trim());
  return ids;
};

const readFilingNumbers = async () => {
  const data = await readFile("./ids.txt");
  const lines = data.toString().split("\n");
  const ids = lines
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  return ids;
};

const getCase = async (caseId) => {
  const time = new Date().getTime();
  /* For filing number */
  const data = {
    criteria: [{ filingNumber: caseId }],
    tenantId: "kl",
    RequestInfo: {
      apiId: "Dristi",
      authToken: access_token,
      msgId: `${time}|en_IN`,
      plainAccessRequest: {},
      userInfo: {
        id: 2559,
        uuid: "03919712-b283-4430-a83b-50e9ed59529f",
        userName: "michaelGeorgeJudge",
        name: "Michael George Dev",
        mobileNumber: "6262626262",
        emailId: "gihiha1727@benznoi.com",
        locale: null,
        type: "EMPLOYEE",
        roles: [
          { name: "Super User", code: "SUPERUSER", tenantId: "kl" },
          { name: "DIARY_APPROVER", code: "DIARY_APPROVER", tenantId: "kl" },
          { name: "HEARING_VIEWER", code: "HEARING_VIEWER", tenantId: "kl" },
          { name: "WORKFLOW_ABANDON", code: "WORKFLOW_ABANDON", tenantId: "kl" },
          { name: "ORDER_ESIGN", code: "ORDER_ESIGN", tenantId: "kl" },
          { name: "Workflow Admin", code: "WORKFLOW_ADMIN", tenantId: "kl" },
          { name: "APPLICATION_CREATOR", code: "APPLICATION_CREATOR", tenantId: "kl" },
          { name: "DEPOSITION_PUBLISHER", code: "DEPOSITION_PUBLISHER", tenantId: "kl" },
          { name: "HEARING_APPROVER", code: "HEARING_APPROVER", tenantId: "kl" },
          { name: "SUBMISSION_RESPONDER", code: "SUBMISSION_RESPONDER", tenantId: "kl" },
          { name: "ORDER_VIEWER", code: "ORDER_VIEWER", tenantId: "kl" },
          { name: "ORDER_REASSIGN", code: "ORDER_REASSIGN", tenantId: "kl" },
          { name: "CASE_EDITOR", code: "CASE_EDITOR", tenantId: "kl" },
          { name: "TASK_CREATOR", code: "TASK_CREATOR", tenantId: "kl" },
          { name: "APPLICATION_APPROVER", code: "APPLICATION_APPROVER", tenantId: "kl" },
          { name: "DIARY_VIEWER", code: "DIARY_VIEWER", tenantId: "kl" },
          { name: "Employee", code: "EMPLOYEE", tenantId: "kl" },
          { name: "ORDER_DELETE", code: "ORDER_DELETE", tenantId: "kl" },
          { name: "SUPPORT_ADMIN", code: "SUPPORT_ADMIN", tenantId: "kl" },
          { name: "NOTIFICATION_APPROVER", code: "NOTIFICATION_APPROVER", tenantId: "kl" },
          { name: "CASE_VIEWER", code: "CASE_VIEWER", tenantId: "kl" },
          { name: "PDF_CREATOR", code: "PDF_CREATOR", tenantId: "kl" },
          { name: "TASK_EDITOR", code: "TASK_EDITOR", tenantId: "kl" },
          { name: "APPLICATION_REJECTOR", code: "APPLICATION_REJECTOR", tenantId: "kl" },
          { name: "HEARING_EDITOR", code: "HEARING_EDITOR", tenantId: "kl" },
          { name: "DIARY_EDITOR", code: "DIARY_EDITOR", tenantId: "kl" },
          { name: "ORDER_APPROVER", code: "ORDER_APPROVER", tenantId: "kl" },
          { name: "NOTIFICATION_CREATOR", code: "NOTIFICATION_CREATOR", tenantId: "kl" },
          { name: "HEARING_CREATOR", code: "HEARING_CREATOR", tenantId: "kl" },
          { name: "ORDER_CREATOR", code: "ORDER_CREATOR", tenantId: "kl" },
          { name: "EVIDENCE_CREATOR", code: "EVIDENCE_CREATOR", tenantId: "kl" },
          { name: "CALCULATION_VIEWER", code: "CALCULATION_VIEWER", tenantId: "kl" },
          { name: "JUDGE_ROLE", code: "JUDGE_ROLE", tenantId: "kl" },
          { name: "EVIDENCE_EDITOR", code: "EVIDENCE_EDITOR", tenantId: "kl" },
          { name: "CASE_APPROVER", code: "CASE_APPROVER", tenantId: "kl" },
          { name: "SYSTEM_ADMIN", code: "SYSTEM_ADMIN", tenantId: "kl" },
          { name: "SUBMISSION_APPROVER", code: "SUBMISSION_APPROVER", tenantId: "kl" },
          { name: "TASK_VIEWER", code: "TASK_VIEWER", tenantId: "kl" },
          { name: "HEARING_SCHEDULER", code: "HEARING_SCHEDULER", tenantId: "kl" },
        ],
        active: true,
        tenantId: "kl",
        permanentCity: null,
      },
    },
  };
  const config = {
    method: "post",
    maxBodyLength: Infinity,
    url: `http://localhost:8086/case/v1/_search?_=${time}`,
    headers: {
      accept: "application/json, text/plain, */*",
      "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
      "content-type": "application/json;charset=UTF-8",
      origin: "https://oncourts.kerala.gov.in",
      priority: "u=1, i",
      "sec-ch-ua":
        '"Not A(Brand";v="8", "Chromium";v="132", "Google Chrome";v="132"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
    },
    data: JSON.stringify(data),
  };

  try {
    const { data } = await axios.request(config);
    console.log(`Get case successful for id ${caseId}`);
    const { criteria } = data;
    const { responseList } = criteria[0];
    await writeFile(
      `./response/${caseId}.json`,
      JSON.stringify(responseList[0], null, 2)
    );
    return responseList[0];
  } catch (e) {
    console.log(
      e?.response?.data?.Errors
        ? `Get case failed for id ${caseId} with following errors ${JSON.stringify(
            e?.response?.data?.Errors
          )}`
        : `Get case failed for id ${caseId}`
    );
    throw e;
  }
};

const logToFile = (message) => {
  const logPath = path.resolve(__dirname, "update-log.txt");
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
};

const updateCase = async (caseId, data) => {
  const time = new Date().getTime();

  const RequestInfo = {
    apiId: "Dristi",
    authToken: access_token,
    msgId: `${time}|en_IN`,
    plainAccessRequest: {},
    userInfo: {
      id: 2559,
      uuid: "03919712-b283-4430-a83b-50e9ed59529f",
      userName: "michaelGeorgeJudge",
      name: "Michael George Dev",
      mobileNumber: "6262626262",
      emailId: "gihiha1727@benznoi.com",
      locale: null,
      type: "EMPLOYEE",
      roles: [
        { name: "Super User", code: "SUPERUSER", tenantId: "kl" },
        { name: "DIARY_APPROVER", code: "DIARY_APPROVER", tenantId: "kl" },
        { name: "HEARING_VIEWER", code: "HEARING_VIEWER", tenantId: "kl" },
        { name: "WORKFLOW_ABANDON", code: "WORKFLOW_ABANDON", tenantId: "kl" },
        { name: "ORDER_ESIGN", code: "ORDER_ESIGN", tenantId: "kl" },
        { name: "Workflow Admin", code: "WORKFLOW_ADMIN", tenantId: "kl" },
        { name: "APPLICATION_CREATOR", code: "APPLICATION_CREATOR", tenantId: "kl" },
        { name: "DEPOSITION_PUBLISHER", code: "DEPOSITION_PUBLISHER", tenantId: "kl" },
        { name: "HEARING_APPROVER", code: "HEARING_APPROVER", tenantId: "kl" },
        { name: "SUBMISSION_RESPONDER", code: "SUBMISSION_RESPONDER", tenantId: "kl" },
        { name: "ORDER_VIEWER", code: "ORDER_VIEWER", tenantId: "kl" },
        { name: "ORDER_REASSIGN", code: "ORDER_REASSIGN", tenantId: "kl" },
        { name: "CASE_EDITOR", code: "CASE_EDITOR", tenantId: "kl" },
        { name: "TASK_CREATOR", code: "TASK_CREATOR", tenantId: "kl" },
        { name: "APPLICATION_APPROVER", code: "APPLICATION_APPROVER", tenantId: "kl" },
        { name: "DIARY_VIEWER", code: "DIARY_VIEWER", tenantId: "kl" },
        { name: "Employee", code: "EMPLOYEE", tenantId: "kl" },
        { name: "ORDER_DELETE", code: "ORDER_DELETE", tenantId: "kl" },
        { name: "SUPPORT_ADMIN", code: "SUPPORT_ADMIN", tenantId: "kl" },
        { name: "NOTIFICATION_APPROVER", code: "NOTIFICATION_APPROVER", tenantId: "kl" },
        { name: "CASE_VIEWER", code: "CASE_VIEWER", tenantId: "kl" },
        { name: "PDF_CREATOR", code: "PDF_CREATOR", tenantId: "kl" },
        { name: "TASK_EDITOR", code: "TASK_EDITOR", tenantId: "kl" },
        { name: "APPLICATION_REJECTOR", code: "APPLICATION_REJECTOR", tenantId: "kl" },
        { name: "HEARING_EDITOR", code: "HEARING_EDITOR", tenantId: "kl" },
        { name: "DIARY_EDITOR", code: "DIARY_EDITOR", tenantId: "kl" },
        { name: "ORDER_APPROVER", code: "ORDER_APPROVER", tenantId: "kl" },
        { name: "NOTIFICATION_CREATOR", code: "NOTIFICATION_CREATOR", tenantId: "kl" },
        { name: "HEARING_CREATOR", code: "HEARING_CREATOR", tenantId: "kl" },
        { name: "ORDER_CREATOR", code: "ORDER_CREATOR", tenantId: "kl" },
        { name: "EVIDENCE_CREATOR", code: "EVIDENCE_CREATOR", tenantId: "kl" },
        { name: "CALCULATION_VIEWER", code: "CALCULATION_VIEWER", tenantId: "kl" },
        { name: "JUDGE_ROLE", code: "JUDGE_ROLE", tenantId: "kl" },
        { name: "EVIDENCE_EDITOR", code: "EVIDENCE_EDITOR", tenantId: "kl" },
        { name: "CASE_APPROVER", code: "CASE_APPROVER", tenantId: "kl" },
        { name: "SYSTEM_ADMIN", code: "SYSTEM_ADMIN", tenantId: "kl" },
        { name: "SUBMISSION_APPROVER", code: "SUBMISSION_APPROVER", tenantId: "kl" },
        { name: "TASK_VIEWER", code: "TASK_VIEWER", tenantId: "kl" },
        { name: "HEARING_SCHEDULER", code: "HEARING_SCHEDULER", tenantId: "kl" },
      ],
      active: true,
      tenantId: "kl",
      permanentCity: null,
    },
  };

  const flag = analysis(data);
  if (!flag) {
    logToFile(`Skipping case ${caseId}: analysis returned false.`);
    return;
  }

  const updatedData = transform(data);

  const cases = { ...updatedData };

  await writeFile(`./payload/${caseId}.json`, JSON.stringify(cases, null, 2));
  logToFile(`Payload written to ./payload/${caseId}.json`);

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "http://localhost:8086/case/v1/_update?tenantId=kl&_=1738492628739",
    headers: {
      accept: "application/json, text/plain, */*",
      "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
      "content-type": "application/json;charset=UTF-8",
      origin: "https://oncourts.kerala.gov.in",
      priority: "u=1, i",
      "sec-ch-ua":
        '"Not A(Brand";v="8", "Chromium";v="132", "Google Chrome";v="132"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
    },
    data: JSON.stringify({
      RequestInfo,
      cases,
      tenantId: "kl",
      flow: "flow_jac",
    }),
  };

  try {
    await axios.request(config);
    logToFile(`✅ Update case successful for id ${caseId}`);
  } catch (e) {
    if (e?.response?.data?.Errors) {
      logToFile(
        `❌ Update case failed for id ${caseId} with errors: ${JSON.stringify(
          e.response.data
        )}`
      );
    } else {
      logToFile(`❌ Update case failed for id ${caseId} (no detailed error)`);
    }
    throw e;
  }
};

const processCase = async (caseId) => {
  try {
    const data = await getCase(caseId);
    if (data) {
      await updateCase(caseId, data);
    }
    console.log(`Processing for case ${caseId} successful`);
  } catch (e) {
    console.log(`Processing for case ${caseId} failed due to ${e?.message}`);
    console.log(`Processing for case ${caseId} failed`);
  }
};

const runScript = async () => {
  const ids = await readFilingNumbers();

  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const promises = [];
    for (let j = i; j < i + BATCH_SIZE && j < ids.length; j++) {
      console.log(`Value of j is ${j}, case id ${ids[j]}`);
      promises.push(processCase(ids[j]));
    }
    await Promise.allSettled(promises);
  }
};

runScript()
  .then(() => {
    console.log("Script executed successfully");
  })
  .catch((e) => {
    console.log("Script execution failed");
  });
