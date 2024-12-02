# Code Documentation

This document explains the functionality, purpose, and usage of the provided code. It manages submissions and pending tasks in a legal case management system.

---

### `createPendingTask`

#### Purpose:

Creates a pending task for a user or role with specific details.
This function is being called after every stage in the workflow, to create and close pendingPayment, pendingEsign tasks

- name : name of the pending task
- referenceId : referenceId of pending task - in this case, applicationNumber
- assignee : assignees of respective pendin task - in this case, uuid of the person creating the submission
- isCompleted : whether to create a new pending task or close exising one
- filingNumber : filingNumber of the case

#### Code:

```javascript
const createPendingTask = async ({
  name,
  status,
  isCompleted = false,
  refId = applicationNumber,
  stateSla = null,
  isAssignedRole = false,
  assignedRole = [],
}) => {
  const assignes = !isAssignedRole ? [userInfo?.uuid] || [] : [];
  await submissionService.customApiService(Urls.application.pendingTask, {
    pendingTask: {
      name,
      entityType,
      referenceId: `MANUAL_${refId}`,
      status,
      assignedTo: assignes?.map((uuid) => ({ uuid })),
      assignedRole: assignedRole,
      cnrNumber: caseDetails?.cnrNumber,
      filingNumber: filingNumber,
      isCompleted,
      stateSla,
      additionalDetails: {},
      tenantId,
    },
  });
};
```
