export const OrderWorkflowState = {
  ABATED: "ABATED",
  DRAFT_IN_PROGRESS: "DRAFT_IN_PROGRESS",
  PENDING_BULK_E_SIGN: "PENDING_BULK_E-SIGN",
  PUBLISHED: "PUBLISHED",
};

export const OrderWorkflowAction = {
  SAVE_DRAFT: "SAVE_DRAFT",
  SUBMIT_BULK_E_SIGN: "SUBMIT_BULK_E-SIGN",
  ESIGN: "E-SIGN",
  ABANDON: "ABANDON",
  DELETE: "DELETE",
};
