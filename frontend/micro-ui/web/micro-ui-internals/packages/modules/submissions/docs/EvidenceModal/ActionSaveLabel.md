# Code Documentation

This document explains the functionality, purpose, and usage of the provided code. It manages submissions and pending tasks in a legal case management system.

---

### `actionSaveLabel`

#### Purpose:

Action Button Name for primary action on evidence modal

For submissions:

- If employee user is there, the button will be Approve
- If Citizen User is there, The button will be either Download Submission or Add comment (Or Respond) based on whether it's the party which has made the submission or it's responding party

For Documents:

- The button will be "Mark As Evidence" or "Unmark As Document" Based on the status of the artifact

#### Code:

```javascript
const actionSaveLabel = useMemo(() => {
  let label = "";
  if (modalType === "Submissions") {
    if (userType === "employee") {
      label = t("Approve");
    } else {
      if (userInfo?.uuid === createdBy) {
        label = t("DOWNLOAD_SUBMISSION");
      } else if (isLitigent && [...allAdvocates?.[userInfo?.uuid], userInfo?.uuid]?.includes(createdBy)) {
        label = t("DOWNLOAD_SUBMISSION");
      } else if (
        (respondingUuids?.includes(userInfo?.uuid) || !documentSubmission?.[0]?.details?.referenceId) &&
        [SubmissionWorkflowState.PENDINGRESPONSE, SubmissionWorkflowState.PENDINGREVIEW].includes(applicationStatus)
      ) {
        label = t("ADD_COMMENT");
      }
    }
  } else {
    label = !documentSubmission?.[0]?.artifactList?.isEvidence ? t("MARK_AS_EVIDENCE") : t("UNMARK_AS_EVIDENCE");
  }
  return label;
}, [allAdvocates, applicationStatus, createdBy, documentSubmission, isLitigent, modalType, respondingUuids, t, userInfo?.uuid, userType]);
```
