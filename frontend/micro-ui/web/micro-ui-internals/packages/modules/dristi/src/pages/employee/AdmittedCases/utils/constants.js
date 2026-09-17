export const stateSla = {
  SCHEDULE_HEARING: 3 * 24 * 3600 * 1000,
  NOTICE: 3 * 24 * 3600 * 1000,
};

export const delayCondonationStylsMain = {
  padding: "6px 8px",
  borderRadius: "999px",
  backgroundColor: "#E9A7AA",
};

export const delayCondonationTextStyle = {
  margin: "0px",
  fontFamily: "Roboto",
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: "16.41px",
  color: "#231F20",
};

export const HearingWorkflowState = {
  OPTOUT: "OPT_OUT",
  INPROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  ABATED: "ABATED",
  SCHEDULED: "SCHEDULED",
};

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
