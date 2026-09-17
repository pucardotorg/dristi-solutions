const axios = require("axios");
const fs = require("fs");
const path = require("path");

const access_token = "5e720c77-183d-4cda-a985-03fc17db4e78";

// Get environment from command line arguments
const args = process.argv.slice(2);
const envFlag = args.findIndex((arg) => arg === "--env" || arg === "-e");
const env =
  envFlag !== -1 && args.length > envFlag + 1
    ? args[envFlag + 1].toLowerCase()
    : "demo";

// Configure base URL based on environment
const ENV_URLS = {
  dev: "https://dristi-kerala-dev.pucar.org",
  qa: "https://dristi-kerala-qa.pucar.org",
  demo: "https://demo.pucar.org",
  prd: "https://oncourts.kerala.gov.in",
  localhost: "http://192.168.5.139:8080",
};

const BASE_URL = ENV_URLS[env] || ENV_URLS.demo;

const transformChequeDetails = (scrutiny) => {
  if (!scrutiny) return scrutiny;

  let new_scrutiny = JSON.parse(JSON.stringify(scrutiny));

  if (!new_scrutiny.data) new_scrutiny.data = {};
  if (!new_scrutiny.data.caseSpecificDetails)
    new_scrutiny.data.caseSpecificDetails = {};
  if (!new_scrutiny.data.caseSpecificDetails.chequeDetails) {
    new_scrutiny.data.caseSpecificDetails.chequeDetails = {
      scrutinyMessage: "",
      form: [],
    };
  }

  let formArray = new_scrutiny.data.caseSpecificDetails.chequeDetails.form;
  if (!formArray || !Array.isArray(formArray) || formArray.length === 0) {
    formArray = [{}];
  }

  new_scrutiny.data.caseSpecificDetails.chequeDetails.form = formArray.map(
    (formElement) => {
      let newFormElement = { ...formElement };
      // If payerIfscField.payerIfsc is not present at all, add it with a default FSOError
      if (!("payerIfscField.payerIfsc" in newFormElement)) {
        newFormElement = {
          "payerIfscField.payerIfsc": {
            FSOError: "Please enter required field",
            isWarning: false,
          },
          ...newFormElement,
        };
      }
      return newFormElement;
    },
  );

  return new_scrutiny;
};

const transformPrayerSwornStatement = (scrutiny) => {
  if (!scrutiny) return scrutiny;

  let new_scrutiny = JSON.parse(JSON.stringify(scrutiny));

  if (!new_scrutiny.data) new_scrutiny.data = {};
  if (!new_scrutiny.data.additionalDetails)
    new_scrutiny.data.additionalDetails = {};
  if (!new_scrutiny.data.additionalDetails.prayerSwornStatement) {
    new_scrutiny.data.additionalDetails.prayerSwornStatement = {
      scrutinyMessage: "",
      form: [],
    };
  }

  let formArray = new_scrutiny.data.additionalDetails.prayerSwornStatement.form;
  if (!formArray || !Array.isArray(formArray) || formArray.length === 0) {
    formArray = [{}];
  }

  new_scrutiny.data.additionalDetails.prayerSwornStatement.form = formArray.map(
    (formElement) => {
      let newFormElement = { ...formElement };
      // If synopsis.text is not present at all, add it with a default FSOError
      if (!("synopsis.text" in newFormElement)) {
        newFormElement = {
          "synopsis.text": {
            FSOError: "Please enter required field",
            isWarning: false,
          },
          ...newFormElement,
        };
      }
      return newFormElement;
    },
  );

  return new_scrutiny;
};

const fetchCaseDetails = async (caseId) => {
  const time = new Date().getTime();
  const data = {
    criteria: [{ caseId: caseId }],
    tenantId: "kl",
    RequestInfo: {
      apiId: "Rainmaker",
      authToken: access_token,
      msgId: `${time}|en_IN`,
      plainAccessRequest: {},
      userInfo: {
        id: 107,
        uuid: "62eaf044-03f3-4320-895d-5f79430e9d16",
        userName: "gCmo",
        name: "gCmo",
        mobileNumber: "9999999999",
        emailId: "gCmo@test.com",
        locale: null,
        type: "EMPLOYEE",
        roles: [
          {
            name: "MEDIATION_VIEWER",
            code: "MEDIATION_VIEWER",
            tenantId: "kl",
          },
          {
            name: "VIEW_SCHEDULE_HEARING",
            code: "VIEW_SCHEDULE_HEARING",
            tenantId: "kl",
          },
          {
            name: "SIGN_PROCESS_NOTICE",
            code: "SIGN_PROCESS_NOTICE",
            tenantId: "kl",
          },
          {
            name: "EVIDENCE_SIGNER",
            code: "EVIDENCE_SIGNER",
            tenantId: "kl",
          },
          {
            name: "APPLICATION_CREATOR",
            code: "APPLICATION_CREATOR",
            tenantId: "kl",
          },
          {
            name: "VIEW_PROCESS_NOTICE",
            code: "VIEW_PROCESS_NOTICE",
            tenantId: "kl",
          },
          {
            name: "VIEW_MISCELLANEOUS_TEMPLATE_CONFIGURATION",
            code: "VIEW_MISCELLANEOUS_TEMPLATE_CONFIGURATION",
            tenantId: "kl",
          },
          {
            name: "PLEA_CREATOR",
            code: "PLEA_CREATOR",
            tenantId: "kl",
          },
          {
            name: "EXAMINATION_CREATOR",
            code: "EXAMINATION_CREATOR",
            tenantId: "kl",
          },
          {
            name: "HEARING_APPROVER",
            code: "HEARING_APPROVER",
            tenantId: "kl",
          },
          {
            name: "EXAMINATION_VIEWER",
            code: "EXAMINATION_VIEWER",
            tenantId: "kl",
          },
          {
            name: "APPLICATION_RESPONDER",
            code: "APPLICATION_RESPONDER",
            tenantId: "kl",
          },
          {
            name: "ORDER_VIEWER",
            code: "ORDER_VIEWER",
            tenantId: "kl",
          },
          {
            name: "HEARING_PRIORITY_VIEW",
            code: "HEARING_PRIORITY_VIEW",
            tenantId: "kl",
          },
          {
            name: "VIEW_REVIEW_BAIL_BOND",
            code: "VIEW_REVIEW_BAIL_BOND",
            tenantId: "kl",
          },
          {
            name: "VIEW_BULK_RESCHEDULE_HEARINGS",
            code: "VIEW_BULK_RESCHEDULE_HEARINGS",
            tenantId: "kl",
          },
          {
            name: "APPLICATION_APPROVER",
            code: "APPLICATION_APPROVER",
            tenantId: "kl",
          },
          {
            name: "TASK_CREATOR",
            code: "TASK_CREATOR",
            tenantId: "kl",
          },
          {
            name: "ADVOCATE_APPROVER",
            code: "ADVOCATE_APPROVER",
            tenantId: "kl",
          },
          {
            name: "VIEW_PROCESS_ATTACHMENT",
            code: "VIEW_PROCESS_ATTACHMENT",
            tenantId: "kl",
          },
          {
            name: "VIEW_PROCESS_SUMMONS",
            code: "VIEW_PROCESS_SUMMONS",
            tenantId: "kl",
          },
          {
            name: "VIEW_PROCESS_PROCLAMATION",
            code: "VIEW_PROCESS_PROCLAMATION",
            tenantId: "kl",
          },
          {
            name: "ADVOCATE_CLERK_APPROVER",
            code: "ADVOCATE_CLERK_APPROVER",
            tenantId: "kl",
          },
          {
            name: "PDF_CREATOR",
            code: "PDF_CREATOR",
            tenantId: "kl",
          },
          {
            name: "ALLOW_ADD_WITNESS",
            code: "ALLOW_ADD_WITNESS",
            tenantId: "kl",
          },
          {
            name: "VIEW_SCHEDULE_HEARING_HOME",
            code: "VIEW_SCHEDULE_HEARING_HOME",
            tenantId: "kl",
          },
          {
            name: "APPLICATION_REJECTOR",
            code: "APPLICATION_REJECTOR",
            tenantId: "kl",
          },
          {
            name: "HEARING_EDITOR",
            code: "HEARING_EDITOR",
            tenantId: "kl",
          },
          {
            name: "VIEW_PROCESS_WARRANT",
            code: "VIEW_PROCESS_WARRANT",
            tenantId: "kl",
          },
          {
            name: "ORDER_APPROVER",
            code: "ORDER_APPROVER",
            tenantId: "kl",
          },
          {
            name: "EVIDENCE_CREATOR",
            code: "EVIDENCE_CREATOR",
            tenantId: "kl",
          },
          {
            name: "SIGN_PROCESS_SUMMONS",
            code: "SIGN_PROCESS_SUMMONS",
            tenantId: "kl",
          },
          {
            name: "VIEW_SIGN_FORMS",
            code: "VIEW_SIGN_FORMS",
            tenantId: "kl",
          },
          {
            name: "EVIDENCE_EDITOR",
            code: "EVIDENCE_EDITOR",
            tenantId: "kl",
          },
          {
            name: "VIEW_PROCESS_MISCELLANEOUS",
            code: "VIEW_PROCESS_MISCELLANEOUS",
            tenantId: "kl",
          },
          {
            name: "CTC_DOCUMENT_APPROVER",
            code: "CTC_DOCUMENT_APPROVER",
            tenantId: "kl",
          },
          {
            name: "DECRYPT_DATA_ROLE",
            code: "DECRYPT_DATA_ROLE",
            tenantId: "kl",
          },
          {
            name: "MEDIATION_CREATOR",
            code: "MEDIATION_CREATOR",
            tenantId: "kl",
          },
          {
            name: "VIEW_ALL_CASES",
            code: "VIEW_ALL_CASES",
            tenantId: "kl",
          },
          {
            name: "VIEW_PROCESS_MANAGEMENT",
            code: "VIEW_PROCESS_MANAGEMENT",
            tenantId: "kl",
          },
          {
            name: "HEARING_SCHEDULER",
            code: "HEARING_SCHEDULER",
            tenantId: "kl",
          },
          {
            name: "PLEA_EDITOR",
            code: "PLEA_EDITOR",
            tenantId: "kl",
          },
          {
            name: "VIEW_TODAYS_HEARINGS",
            code: "VIEW_TODAYS_HEARINGS",
            tenantId: "kl",
          },
          {
            name: "HEARING_VIEWER",
            code: "HEARING_VIEWER",
            tenantId: "kl",
          },
          {
            name: "Workflow Admin",
            code: "WORKFLOW_ADMIN",
            tenantId: "kl",
          },
          {
            name: "PROCESS_MANAGEMENT_CREATOR",
            code: "PROCESS_MANAGEMENT_CREATOR",
            tenantId: "kl",
          },
          {
            name: "DEPOSITION_PUBLISHER",
            code: "DEPOSITION_PUBLISHER",
            tenantId: "kl",
          },
          {
            name: "BULK_RESCHEDULE_UPDATE_ACCESS",
            code: "BULK_RESCHEDULE_UPDATE_ACCESS",
            tenantId: "kl",
          },
          {
            name: "CASE_REVIEWER",
            code: "CASE_REVIEWER",
            tenantId: "kl",
          },
          {
            name: "ORDER_REASSIGN",
            code: "ORDER_REASSIGN",
            tenantId: "kl",
          },
          {
            name: "CASE_EDITOR",
            code: "CASE_EDITOR",
            tenantId: "kl",
          },
          {
            name: "PENDING_TASK_ORDER",
            code: "PENDING_TASK_ORDER",
            tenantId: "kl",
          },
          {
            name: "DIARY_VIEWER",
            code: "DIARY_VIEWER",
            tenantId: "kl",
          },
          {
            name: "Employee",
            code: "EMPLOYEE",
            tenantId: "kl",
          },
          {
            name: "SUBMISSION_CREATOR",
            code: "SUBMISSION_CREATOR",
            tenantId: "kl",
          },
          {
            name: "VIEW_SCRUTINY_CASES",
            code: "VIEW_SCRUTINY_CASES",
            tenantId: "kl",
          },
          {
            name: "NOTIFICATION_APPROVER",
            code: "NOTIFICATION_APPROVER",
            tenantId: "kl",
          },
          {
            name: "CASE_VIEWER",
            code: "CASE_VIEWER",
            tenantId: "kl",
          },
          {
            name: "PAYMENT_COLLECTOR",
            code: "PAYMENT_COLLECTOR",
            tenantId: "kl",
          },
          {
            name: "VIEW_DASHBOARDS",
            code: "VIEW_DASHBOARDS",
            tenantId: "kl",
          },
          {
            name: "TASK_EDITOR",
            code: "TASK_EDITOR",
            tenantId: "kl",
          },
          {
            name: "PROCESS_MANAGEMENT_EDITOR",
            code: "PROCESS_MANAGEMENT_EDITOR",
            tenantId: "kl",
          },
          {
            name: "BAIL_BOND_VIEWER",
            code: "BAIL_BOND_VIEWER",
            tenantId: "kl",
          },
          {
            name: "ALLOW_SEND_FOR_SIGN_LATER",
            code: "ALLOW_SEND_FOR_SIGN_LATER",
            tenantId: "kl",
          },
          {
            name: "DIARY_EDITOR",
            code: "DIARY_EDITOR",
            tenantId: "kl",
          },
          {
            name: "PLEA_VIEWER",
            code: "PLEA_VIEWER",
            tenantId: "kl",
          },
          {
            name: "NOTIFICATION_CREATOR",
            code: "NOTIFICATION_CREATOR",
            tenantId: "kl",
          },
          {
            name: "HEARING_CREATOR",
            code: "HEARING_CREATOR",
            tenantId: "kl",
          },
          {
            name: "ORDER_CREATOR",
            code: "ORDER_CREATOR",
            tenantId: "kl",
          },
          {
            name: "MEDIATION_EDITOR",
            code: "MEDIATION_EDITOR",
            tenantId: "kl",
          },
          {
            name: "PROCESS_MANAGEMENT_VIEWER",
            code: "PROCESS_MANAGEMENT_VIEWER",
            tenantId: "kl",
          },
          {
            name: "PENDING_TASK_CONFIRM_BOND_SUBMISSION",
            code: "PENDING_TASK_CONFIRM_BOND_SUBMISSION",
            tenantId: "kl",
          },
          {
            name: "EXAMINATION_EDITOR",
            code: "EXAMINATION_EDITOR",
            tenantId: "kl",
          },
          {
            name: "TASK_VIEWER",
            code: "TASK_VIEWER",
            tenantId: "kl",
          },
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
    url: `${BASE_URL}/case/v1/_search?_=${time}`,
    headers: {
      accept: "application/json, text/plain, */*",
      "content-type": "application/json;charset=UTF-8",
    },
    data: JSON.stringify(data),
  };

  try {
    const { data: responseData } = await axios.request(config);
    return responseData?.criteria?.[0]?.responseList?.[0] || null;
  } catch (e) {
    console.log(`Failed to fetch case details for id ${caseId}`);
    return null;
  }
};

const updateCase = async (caseId, caseData) => {
  const time = new Date().getTime();

  const RequestInfo = {
    apiId: "Rainmaker",
    authToken: access_token,
    msgId: `${time}|en_IN`,
    plainAccessRequest: {},
    userInfo: {
      id: 107,
      uuid: "62eaf044-03f3-4320-895d-5f79430e9d16",
      userName: "gCmo",
      name: "gCmo",
      mobileNumber: "9999999999",
      emailId: "gCmo@test.com",
      locale: null,
      type: "EMPLOYEE",
      roles: [
        {
          name: "MEDIATION_VIEWER",
          code: "MEDIATION_VIEWER",
          tenantId: "kl",
        },
        {
          name: "VIEW_SCHEDULE_HEARING",
          code: "VIEW_SCHEDULE_HEARING",
          tenantId: "kl",
        },
        {
          name: "SIGN_PROCESS_NOTICE",
          code: "SIGN_PROCESS_NOTICE",
          tenantId: "kl",
        },
        {
          name: "EVIDENCE_SIGNER",
          code: "EVIDENCE_SIGNER",
          tenantId: "kl",
        },
        {
          name: "APPLICATION_CREATOR",
          code: "APPLICATION_CREATOR",
          tenantId: "kl",
        },
        {
          name: "VIEW_PROCESS_NOTICE",
          code: "VIEW_PROCESS_NOTICE",
          tenantId: "kl",
        },
        {
          name: "VIEW_MISCELLANEOUS_TEMPLATE_CONFIGURATION",
          code: "VIEW_MISCELLANEOUS_TEMPLATE_CONFIGURATION",
          tenantId: "kl",
        },
        {
          name: "PLEA_CREATOR",
          code: "PLEA_CREATOR",
          tenantId: "kl",
        },
        {
          name: "EXAMINATION_CREATOR",
          code: "EXAMINATION_CREATOR",
          tenantId: "kl",
        },
        {
          name: "HEARING_APPROVER",
          code: "HEARING_APPROVER",
          tenantId: "kl",
        },
        {
          name: "EXAMINATION_VIEWER",
          code: "EXAMINATION_VIEWER",
          tenantId: "kl",
        },
        {
          name: "APPLICATION_RESPONDER",
          code: "APPLICATION_RESPONDER",
          tenantId: "kl",
        },
        {
          name: "ORDER_VIEWER",
          code: "ORDER_VIEWER",
          tenantId: "kl",
        },
        {
          name: "HEARING_PRIORITY_VIEW",
          code: "HEARING_PRIORITY_VIEW",
          tenantId: "kl",
        },
        {
          name: "VIEW_REVIEW_BAIL_BOND",
          code: "VIEW_REVIEW_BAIL_BOND",
          tenantId: "kl",
        },
        {
          name: "VIEW_BULK_RESCHEDULE_HEARINGS",
          code: "VIEW_BULK_RESCHEDULE_HEARINGS",
          tenantId: "kl",
        },
        {
          name: "APPLICATION_APPROVER",
          code: "APPLICATION_APPROVER",
          tenantId: "kl",
        },
        {
          name: "TASK_CREATOR",
          code: "TASK_CREATOR",
          tenantId: "kl",
        },
        {
          name: "ADVOCATE_APPROVER",
          code: "ADVOCATE_APPROVER",
          tenantId: "kl",
        },
        {
          name: "VIEW_PROCESS_ATTACHMENT",
          code: "VIEW_PROCESS_ATTACHMENT",
          tenantId: "kl",
        },
        {
          name: "VIEW_PROCESS_SUMMONS",
          code: "VIEW_PROCESS_SUMMONS",
          tenantId: "kl",
        },
        {
          name: "VIEW_PROCESS_PROCLAMATION",
          code: "VIEW_PROCESS_PROCLAMATION",
          tenantId: "kl",
        },
        {
          name: "ADVOCATE_CLERK_APPROVER",
          code: "ADVOCATE_CLERK_APPROVER",
          tenantId: "kl",
        },
        {
          name: "PDF_CREATOR",
          code: "PDF_CREATOR",
          tenantId: "kl",
        },
        {
          name: "ALLOW_ADD_WITNESS",
          code: "ALLOW_ADD_WITNESS",
          tenantId: "kl",
        },
        {
          name: "VIEW_SCHEDULE_HEARING_HOME",
          code: "VIEW_SCHEDULE_HEARING_HOME",
          tenantId: "kl",
        },
        {
          name: "APPLICATION_REJECTOR",
          code: "APPLICATION_REJECTOR",
          tenantId: "kl",
        },
        {
          name: "HEARING_EDITOR",
          code: "HEARING_EDITOR",
          tenantId: "kl",
        },
        {
          name: "VIEW_PROCESS_WARRANT",
          code: "VIEW_PROCESS_WARRANT",
          tenantId: "kl",
        },
        {
          name: "ORDER_APPROVER",
          code: "ORDER_APPROVER",
          tenantId: "kl",
        },
        {
          name: "EVIDENCE_CREATOR",
          code: "EVIDENCE_CREATOR",
          tenantId: "kl",
        },
        {
          name: "SIGN_PROCESS_SUMMONS",
          code: "SIGN_PROCESS_SUMMONS",
          tenantId: "kl",
        },
        {
          name: "VIEW_SIGN_FORMS",
          code: "VIEW_SIGN_FORMS",
          tenantId: "kl",
        },
        {
          name: "EVIDENCE_EDITOR",
          code: "EVIDENCE_EDITOR",
          tenantId: "kl",
        },
        {
          name: "VIEW_PROCESS_MISCELLANEOUS",
          code: "VIEW_PROCESS_MISCELLANEOUS",
          tenantId: "kl",
        },
        {
          name: "CTC_DOCUMENT_APPROVER",
          code: "CTC_DOCUMENT_APPROVER",
          tenantId: "kl",
        },
        {
          name: "DECRYPT_DATA_ROLE",
          code: "DECRYPT_DATA_ROLE",
          tenantId: "kl",
        },
        {
          name: "MEDIATION_CREATOR",
          code: "MEDIATION_CREATOR",
          tenantId: "kl",
        },
        {
          name: "VIEW_ALL_CASES",
          code: "VIEW_ALL_CASES",
          tenantId: "kl",
        },
        {
          name: "VIEW_PROCESS_MANAGEMENT",
          code: "VIEW_PROCESS_MANAGEMENT",
          tenantId: "kl",
        },
        {
          name: "HEARING_SCHEDULER",
          code: "HEARING_SCHEDULER",
          tenantId: "kl",
        },
        {
          name: "PLEA_EDITOR",
          code: "PLEA_EDITOR",
          tenantId: "kl",
        },
        {
          name: "VIEW_TODAYS_HEARINGS",
          code: "VIEW_TODAYS_HEARINGS",
          tenantId: "kl",
        },
        {
          name: "HEARING_VIEWER",
          code: "HEARING_VIEWER",
          tenantId: "kl",
        },
        {
          name: "Workflow Admin",
          code: "WORKFLOW_ADMIN",
          tenantId: "kl",
        },
        {
          name: "PROCESS_MANAGEMENT_CREATOR",
          code: "PROCESS_MANAGEMENT_CREATOR",
          tenantId: "kl",
        },
        {
          name: "DEPOSITION_PUBLISHER",
          code: "DEPOSITION_PUBLISHER",
          tenantId: "kl",
        },
        {
          name: "BULK_RESCHEDULE_UPDATE_ACCESS",
          code: "BULK_RESCHEDULE_UPDATE_ACCESS",
          tenantId: "kl",
        },
        {
          name: "CASE_REVIEWER",
          code: "CASE_REVIEWER",
          tenantId: "kl",
        },
        {
          name: "ORDER_REASSIGN",
          code: "ORDER_REASSIGN",
          tenantId: "kl",
        },
        {
          name: "CASE_EDITOR",
          code: "CASE_EDITOR",
          tenantId: "kl",
        },
        {
          name: "PENDING_TASK_ORDER",
          code: "PENDING_TASK_ORDER",
          tenantId: "kl",
        },
        {
          name: "DIARY_VIEWER",
          code: "DIARY_VIEWER",
          tenantId: "kl",
        },
        {
          name: "Employee",
          code: "EMPLOYEE",
          tenantId: "kl",
        },
        {
          name: "SUBMISSION_CREATOR",
          code: "SUBMISSION_CREATOR",
          tenantId: "kl",
        },
        {
          name: "VIEW_SCRUTINY_CASES",
          code: "VIEW_SCRUTINY_CASES",
          tenantId: "kl",
        },
        {
          name: "NOTIFICATION_APPROVER",
          code: "NOTIFICATION_APPROVER",
          tenantId: "kl",
        },
        {
          name: "CASE_VIEWER",
          code: "CASE_VIEWER",
          tenantId: "kl",
        },
        {
          name: "PAYMENT_COLLECTOR",
          code: "PAYMENT_COLLECTOR",
          tenantId: "kl",
        },
        {
          name: "VIEW_DASHBOARDS",
          code: "VIEW_DASHBOARDS",
          tenantId: "kl",
        },
        {
          name: "TASK_EDITOR",
          code: "TASK_EDITOR",
          tenantId: "kl",
        },
        {
          name: "PROCESS_MANAGEMENT_EDITOR",
          code: "PROCESS_MANAGEMENT_EDITOR",
          tenantId: "kl",
        },
        {
          name: "BAIL_BOND_VIEWER",
          code: "BAIL_BOND_VIEWER",
          tenantId: "kl",
        },
        {
          name: "ALLOW_SEND_FOR_SIGN_LATER",
          code: "ALLOW_SEND_FOR_SIGN_LATER",
          tenantId: "kl",
        },
        {
          name: "DIARY_EDITOR",
          code: "DIARY_EDITOR",
          tenantId: "kl",
        },
        {
          name: "PLEA_VIEWER",
          code: "PLEA_VIEWER",
          tenantId: "kl",
        },
        {
          name: "NOTIFICATION_CREATOR",
          code: "NOTIFICATION_CREATOR",
          tenantId: "kl",
        },
        {
          name: "HEARING_CREATOR",
          code: "HEARING_CREATOR",
          tenantId: "kl",
        },
        {
          name: "ORDER_CREATOR",
          code: "ORDER_CREATOR",
          tenantId: "kl",
        },
        {
          name: "MEDIATION_EDITOR",
          code: "MEDIATION_EDITOR",
          tenantId: "kl",
        },
        {
          name: "PROCESS_MANAGEMENT_VIEWER",
          code: "PROCESS_MANAGEMENT_VIEWER",
          tenantId: "kl",
        },
        {
          name: "PENDING_TASK_CONFIRM_BOND_SUBMISSION",
          code: "PENDING_TASK_CONFIRM_BOND_SUBMISSION",
          tenantId: "kl",
        },
        {
          name: "EXAMINATION_EDITOR",
          code: "EXAMINATION_EDITOR",
          tenantId: "kl",
        },
        {
          name: "TASK_VIEWER",
          code: "TASK_VIEWER",
          tenantId: "kl",
        },
      ],
      active: true,
      tenantId: "kl",
      permanentCity: null,
    },
  };

  let additionalDetails = caseData.additionalDetails || {};
  if (additionalDetails.scrutiny) {
    additionalDetails = {
      ...additionalDetails,
      scrutiny: transformChequeDetails(additionalDetails.scrutiny),
    };
  }

  const cases = {
    ...caseData,
    additionalDetails,
  };

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: `${BASE_URL}/case/v1/admin/edit_case?tenantId=kl&_=${time}`,
    headers: {
      accept: "application/json, text/plain, */*",
      "content-type": "application/json;charset=UTF-8",
    },
    data: JSON.stringify({ RequestInfo, cases, tenantId: "kl" }),
  };

  try {
    await axios.request(config);
    console.log(`Update case successful for id ${caseId}`);
    return true;
  } catch (e) {
    const errorMsg = e?.response?.data?.Errors
      ? JSON.stringify(e?.response?.data?.Errors)
      : e.message;
    console.log(
      `Update case failed for id ${caseId} with following errors: ${errorMsg}`,
    );
    throw e;
  }
};

const execute = async () => {
  let ids = [];
  try {
    const filePath = path.join(__dirname, `case_ids_${env}.txt`);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8").trim();
      if (content) {
        ids = Array.from(
          new Set(
            content
              .split(/\r?\n/)
              .map((s) => s.trim())
              .filter(Boolean),
          ),
        );
        console.log(`Loaded ${ids.length} case IDs from case_ids_${env}.txt`);
      }
    } else {
      console.warn(
        `case_ids_${env}.txt not found. Please run fetch_case_ids.js first.`,
      );
      return;
    }
  } catch (e) {
    console.warn(`Failed to read case_ids_${env}.txt:`, e.message);
    return;
  }

  const successIds = [];
  const failedIds = [];

  for (let i = 0; i < ids.length; i++) {
    const caseId = ids[i];
    try {
      console.log(`Processing case ${caseId} (${i + 1}/${ids.length})`);
      const caseData = await fetchCaseDetails(caseId);
      if (caseData) {
        await updateCase(caseId, caseData);
        successIds.push(caseId);
      } else {
        console.log(`No case data found for id ${caseId}`);
        failedIds.push(caseId);
      }
    } catch (e) {
      console.log(`Processing for case ${caseId} failed`);
      failedIds.push(caseId);
    }
  }

  // Summary logs
  console.log("Total processed:", ids.length);
  console.log("Total success:", successIds.length);
  console.log("Total failed:", failedIds.length);

  try {
    const outSuccess = path.join(__dirname, `update_success_${env}.txt`);
    const outFailed = path.join(__dirname, `update_failed_${env}.txt`);
    fs.writeFileSync(outSuccess, successIds.join("\n"));
    fs.writeFileSync(outFailed, failedIds.join("\n"));
    console.log("Wrote success IDs to", outSuccess);
    console.log("Wrote failed IDs to", outFailed);
  } catch (e) {
    console.warn("Failed writing summary files:", e.message);
  }
};

execute()
  .then(() => console.log("Script execution completed"))
  .catch((e) => console.log("Script execution failed", e));
