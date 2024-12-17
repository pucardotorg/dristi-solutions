# Code Documentation

This document explains the functionality, purpose, and usage of the provided code. It manages submissions and pending tasks in a legal case management system.

---

### `showSubmit`

#### Purpose:

Evidence Modal is used to show documents (artifacts) preview and submission preview

User Type Employee:

- In case of Documents -> employee should always see the "Mark As Evidence/ Unmark As Evidnece" button
- In case of submission -> only employee with judgeRole should see the button (to approve or reject the submission -> based on status of application)

User Type Citizen

- In case of Documents -> no button should be visible to citizen
- In case of submission
  - If litiant/advocate is in responding party, then respond button should be visible it will call [`handleRespondApplication`](./HandleRespondApplication.md)
  - if it's submission by that citizen, then it should have cancel submission button which will call [`handleDeleteApplication`](./HandleDeleteApplication.md) function, based on the staus of application

#### Code:

```javascript
const showSubmit = useMemo(() => {
  if (userType === "employee") {
    if (!isJudge) {
      return false;
    }
    if (modalType === "Documents") {
      return true;
    }
    return (
      userRoles.includes("SUBMISSION_APPROVER") &&
      [SubmissionWorkflowState.PENDINGAPPROVAL, SubmissionWorkflowState.PENDINGREVIEW].includes(applicationStatus)
    );
  } else {
    if (modalType === "Documents") {
      return false;
    }
    if (userInfo?.uuid === createdBy) {
      return [SubmissionWorkflowState.DELETED].includes(applicationStatus) ? false : true;
    }
    if (isLitigent && [...allAdvocates?.[userInfo?.uuid], userInfo?.uuid]?.includes(createdBy)) {
      return [SubmissionWorkflowState.DELETED].includes(applicationStatus) ? false : true;
    }
    if (!isLitigent && allAdvocates?.[createdBy]?.includes(userInfo?.uuid)) {
      return true;
    }
    if (!isLitigent || (isLitigent && allAdvocates?.[userInfo?.uuid]?.includes(userInfo?.uuid))) {
      return [SubmissionWorkflowState?.PENDINGREVIEW, SubmissionWorkflowState.PENDINGRESPONSE].includes(applicationStatus);
    }
    return false;
  }
}, [userType, modalType, userRoles, applicationStatus, userInfo?.uuid, createdBy, isLitigent, allAdvocates]);
```
