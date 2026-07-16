export const ORDER_TYPES = {
  NOTICE: "NOTICE",
  SUMMONS: "SUMMONS",
  WARRANT: "WARRANT",
  PROCLAMATION: "PROCLAMATION",
  ATTACHMENT: "ATTACHMENT",
  MISCELLANEOUS_PROCESS: "MISCELLANEOUS_PROCESS",
  SCHEDULE_OF_HEARING_DATE: "SCHEDULE_OF_HEARING_DATE",
};

export const TASK_TYPES = {
  NOTICE: "NOTICE",
  SUMMONS: "SUMMONS",
  WARRANT: "WARRANT",
  PROCLAMATION: "PROCLAMATION",
  ATTACHMENT: "ATTACHMENT",
  MISCELLANEOUS_PROCESS: "MISCELLANEOUS_PROCESS",
};

export const CHANNEL_IDS = {
  RPAD: "RPAD",
  POLICE: "POLICE",
};

export const ORDER_CATEGORIES = {
  COMPOSITE: "COMPOSITE",
  INTERMEDIATE: "INTERMEDIATE",
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
};

export const DELIVERY_CHANNELS = {
  POLICE: "Police",
  RPAD: "RPAD",
};

// Reason-for-non-delivery options, keyed by task type. Shared between the
// "Update Delivery Status" dropdown and the read-only process info card so both
// stay in sync (single source of truth).
export const NON_DELIVERY_REASON_OPTIONS = {
  SUMMONS: [
    { key: "ADDRESS_NOT_FOUND", value: "Address not found" },
    { key: "DOOR_LOCKED", value: "Door locked" },
    { key: "PERSON_NOT_PRESENT", value: "Person not present" },
    { key: "DELIVERY_REFUSED", value: "Delivery Refused" },
    { key: "OTHER", value: "Other" },
  ],
  WARRANT: [
    { key: "ACCUSED_NOT_FOUND", value: "Accused not found" },
    { key: "SHO_SOUGHT_TIME", value: "SHO sought time" },
    { key: "ACCUSED_ABSCONDING", value: "Accused absconding" },
    { key: "OTHER", value: "Other" },
  ],
};

// Resolves a stored non-delivery reason key to its display label for a given task type.
// For the "OTHER" reason, appends the user-entered free text when present.
export const getNonDeliveryReasonLabel = (taskType, reasonKey, reasonText) => {
  if (!reasonKey) return "";
  const options = taskType === "WARRANT" ? NON_DELIVERY_REASON_OPTIONS.WARRANT : NON_DELIVERY_REASON_OPTIONS.SUMMONS;
  const matchedOption = options.find((option) => option.key === reasonKey);
  const label = matchedOption?.value || reasonKey;
  if (reasonKey === "OTHER" && reasonText) {
    return `${label} - ${reasonText}`;
  }
  return label;
};
