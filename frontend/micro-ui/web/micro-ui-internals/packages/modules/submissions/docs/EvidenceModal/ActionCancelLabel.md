# Code Documentation

This document explains the functionality, purpose, and usage of the provided code. It manages submissions and pending tasks in a legal case management system.

---

### `actionCancelLabel`

#### Purpose:

Action Button Name for primary action on evidence modal

User Type Employee:

- If User has Submission Approver Role, it will be Reject button -> Reject voluntary submission by litigant

User Type Citizen:

- If user is from the party which has submitted the submission, it will show Cancel Submission button according to the status of the application

In every other scenario, the button will be hidden

#### Code:

```javascript
const actionCancelLabel = useMemo(() => {
  if (
    userRoles.includes("SUBMISSION_APPROVER") &&
    [SubmissionWorkflowState.PENDINGAPPROVAL, SubmissionWorkflowState.PENDINGREVIEW].includes(applicationStatus) &&
    modalType === "Submissions"
  ) {
    return t("REJECT");
  }
  if (userType === "citizen") {
    if (isLitigent && !allAdvocates?.[userInfo?.uuid]?.includes(userInfo?.uuid)) {
      return null;
    }
    if (
      userInfo?.uuid === createdBy &&
      userRoles?.includes("SUBMISSION_DELETE") &&
      !documentSubmission?.[0]?.details?.referenceId &&
      ![
        SubmissionWorkflowState.COMPLETED,
        SubmissionWorkflowState.DELETED,
        SubmissionWorkflowState.ABATED,
        SubmissionWorkflowState.REJECTED,
      ].includes(applicationStatus)
    ) {
      return t("CANCEL_SUBMISSION");
    }
  }
  return null;
}, [allAdvocates, applicationStatus, createdBy, documentSubmission, isLitigent, modalType, t, userInfo?.uuid, userRoles, userType]);
```
