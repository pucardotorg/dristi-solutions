/**
 * Shared workflow payload helpers for legacy inbox `updatePayload` branches in UICustomizations.
 * Extract-only — keeps the same document mapping and empty-key pruning behaviour.
 */

export const pruneEmptyWorkflowKeys = (workflow) => {
  Object.keys(workflow).forEach((key) => {
    if (!workflow[key] || workflow[key]?.length === 0) {
      delete workflow[key];
    }
  });
  return workflow;
};

export const buildStandardInboxWorkflow = (data, action) => {
  const workflow = {
    comment: data?.comments,
    documents: data?.documents?.map((document) => {
      return {
        documentType: action?.action + " DOC",
        fileName: document?.[1]?.file?.name,
        fileStoreId: document?.[1]?.fileStoreId?.fileStoreId,
        documentUid: document?.[1]?.fileStoreId?.fileStoreId,
        tenantId: document?.[1]?.fileStoreId?.tenantId,
      };
    }),
    assignees: data?.assignees?.uuid ? [data?.assignees?.uuid] : null,
    action: action?.action,
  };
  return pruneEmptyWorkflowKeys(workflow);
};
