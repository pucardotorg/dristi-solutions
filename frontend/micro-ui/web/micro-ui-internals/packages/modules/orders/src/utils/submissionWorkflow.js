export const SubmissionWorkflowAction = {
  CREATE: "CREATE",
  ESIGN: "E-SIGN",
  REJECT: "REJECT",
  ABANDON: "ABANDON",
  APPROVE: "APPROVE",
  SET_TERM_BAIL: "SEND_BACK",
};
export const SubmissionWorkflowState = {
  PENDINGSUBMISSION: "PENDING_E-SIGN",
  PENDINGPAYMENT: "PENDING_PAYMENT",
  PENDINGESIGN: "PENDING_E-SIGN",
  PENDINGAPPROVAL: "PENDING_APPROVAL",
  PENDINGREVIEW: "PENDING_REVIEW",
  PENDINGRESPONSE: "PENDINGRESPONSE",
  COMPLETED: "COMPLETED",
  DELETED: "DELETED",
  ABATED: "ABATED",
  REJECTED: "REJECTED",
};
