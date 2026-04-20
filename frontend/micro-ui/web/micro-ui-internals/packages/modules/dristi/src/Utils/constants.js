export const homeTabEnum = {
  RESCHEDULE_APPLICATIONS: "HOME_RESCHEDULE_APPLICATIONS",
  DELAY_CONDONATION: "HOME_DELAY_CONDONATION_APPLICATIONS",
  OTHERS: "HOME_OTHER_APPLICATIONS",
};

export const actionEnabledStatuses = ["CASE_ADMITTED", "PENDING_ADMISSION_HEARING", "PENDING_NOTICE", "PENDING_RESPONSE", "PENDING_ADMISSION"];
export const viewEnabledStatuses = [...actionEnabledStatuses, "CASE_DISMISSED"];
export const judgeReviewStages = [
  "CASE_ADMITTED",
  "PENDING_ADMISSION_HEARING",
  "PENDING_NOTICE",
  "PENDING_RESPONSE",
  "PENDING_ADMISSION",
  "CASE_DISMISSED",
];

export const userRolesEnum = {
  CITIZEN: "CITIZEN",
  JUDGE: "JUDGE",
  ADVOCATE_CLERK_ROLE: "ADVOCATE_CLERK_ROLE",
  ADVOCATE_ROLE: "ADVOCATE_ROLE",
  JUDGE_ROLE: "JUDGE_ROLE",
  HEARING_PRIORITY_VIEW: "HEARING_PRIORITY_VIEW",
  HEARING_APPROVER: "HEARING_APPROVER",
  ORDER_CREATOR: "ORDER_CREATOR",
  SUBMISSION_CREATOR: "SUBMISSION_CREATOR",
  POST_MANAGER: "POST_MANAGER",
  ORDER_ESIGN: "ORDER_ESIGN",
  ALLOW_SEND_FOR_SIGN_LATER: "ALLOW_SEND_FOR_SIGN_LATER",
  TYPIST_ROLE: "TYPIST_ROLE",
  ORDER_APPROVER: "ORDER_APPROVER",
};

export const pendingTaskEntityName = {
  BAIL_BONDS_REVIEW: "BAIL_BONDS_REVIEW",
};

export const applicationTypes = {
  EXTENSION_SUBMISSION_DEADLINE: "EXTENSION_SUBMISSION_DEADLINE",
  PRODUCTION_DOCUMENTS: "PRODUCTION_DOCUMENTS",
  SUBMIT_BAIL_DOCUMENTS: "SUBMIT_BAIL_DOCUMENTS",
  DELAY_CONDONATION: "DELAY_CONDONATION",
};

export const statusArray = ["CASE_ADMITTED", "PENDING_PAYMENT", "RE_PENDING_PAYMENT", "UNDER_SCRUTINY", "PENDING_ADMISSION"];

export const ORDER_TYPES = {
  NOTICE: "NOTICE",
  SUMMONS: "SUMMONS",
  WARRANT: "WARRANT",
  PROCLAMATION: "PROCLAMATION",
  ATTACHMENT: "ATTACHMENT",
  MISCELLANEOUS_PROCESS: "MISCELLANEOUS_PROCESS",
};

export const TASK_TYPES = {
  NOTICE: "NOTICE",
  SUMMONS: "SUMMONS",
  WARRANT: "WARRANT",
};

export const CHANNEL_IDS = {
  RPAD: "RPAD",
  POLICE: "POLICE",
};

export const ORDER_CATEGORIES = {
  COMPOSITE: "COMPOSITE",
  INTERMEDIATE: "INTERMEDIATE",
};

export const HEARING_TYPES = {
  ADMISSION: "ADMISSION",
  REGULAR: "REGULAR",
  MENTIONING: "MENTIONING",
};

export const STATUS_TYPES = {
  ACTIVE: "ACTIVE",
  PENDING: "PENDING",
  DRAFT: "DRAFT",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  COMPLETED: "COMPLETED",
  IN_PROGRESS: "IN_PROGRESS",
  ABATED: "ABATED",
  PENDING_PAYMENT: "PENDING_PAYMENT",
  UNDER_SCRUTINY: "UNDER_SCRUTINY",
  CASE_ADMITTED: "CASE_ADMITTED",
  CASE_DISMISSED: "CASE_DISMISSED",
  PENDING_ADMISSION: "PENDING_ADMISSION",
};

export const ARTIFACT_TYPES = {
  WITNESS_DEPOSITION: "WITNESS_DEPOSITION",
  DIGITALIZED_DOCUMENT: "DIGITALIZED_DOCUMENT",
  BAIL_BOND: "BAIL_BOND",
};

export const DELIVERY_CHANNELS = {
  POLICE: "Police",
  RPAD: "RPAD",
};

export const EXTENSION_TO_MIME = {
  jpg:  ["image/jpeg", "image/jpg"],
  jpeg: ["image/jpeg", "image/jpg"],
  png:  ["image/png"],
  pdf:  ["application/pdf"],
  doc:  ["application/msword"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  xls:  ["application/vnd.ms-excel"],
  xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  odt:  ["application/vnd.oasis.opendocument.text"],
  ods:  ["application/vnd.oasis.opendocument.spreadsheet"],
  csv:  ["text/csv", "text/plain"],
  txt:  ["text/plain"],
  dxf:  ["application/dxf", "image/vnd.dxf", "image/x-dxf"],
};
