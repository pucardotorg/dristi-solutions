export const SubmissionWorkflowAction = {
  CREATE: "CREATE",
  ESIGN: "ESIGN",
  RESPOND: "RESPOND",
  REJECT: "REJECT",
  ABANDON: "ABANDON",
  APPROVE: "APPROVE",
  DELETE: "DELETE",
  PAY: "PAY",
};
export const SubmissionWorkflowState = {
  PENDINGSUBMISSION: "PENDINGSUBMISSION",
  PENDINGPAYMENT: "PENDINGPAYMENT",
  PENDINGESIGN: "PENDINGESIGN",
  PENDINGREVIEW: "PENDINGREVIEW",
  PENDINGAPPROVAL: "PENDINGAPPROVAL",
  PENDINGRESPONSE: "PENDINGRESPONSE",
  COMPLETED: "COMPLETED",
  DELETED: "DELETED",
  ABATED: "ABATED",
  REJECTED: "REJECTED",
};

export const SubmissionDocumentsWorkflowState = {
  PENDING_ESIGN: "PENDING_E-SIGN",
  SUBMITTED: "SUBMITTED",
};

const applicationType = {
  BAIL: "bail",
};
