# Code Documentation

This document explains the functionality, purpose, and usage of the provided code. It manages submissions and pending tasks in a legal case management system.

---

### `handleOpenReview`

#### Purpose:

This function is onClick function for createSubmission button
- This buttons first creates submission using [`createSubmission`](./CreateSubmission.md) function
- Once we get newly created applicationNumber, a pending task to esign this submisison is created using [`createPendingTask`](./CreatePendingTask.md) function


#### Code:

```javascript
const handleOpenReview = async () => {
    setLoader(true);
    const res = await createSubmission();
    const newapplicationNumber = res?.application?.applicationNumber;
    if (newapplicationNumber) {
      if (isCitizen) {
        await createPendingTask({
          name: t("ESIGN_THE_SUBMISSION"),
          status: "ESIGN_THE_SUBMISSION",
          refId: newapplicationNumber,
          stateSla: todayDate + stateSla.ESIGN_THE_SUBMISSION,
        });
      } else if (hasSubmissionRole) {
        await createPendingTask({
          name: t("ESIGN_THE_SUBMISSION"),
          status: "ESIGN_THE_SUBMISSION",
          refId: newapplicationNumber,
          stateSla: todayDate + stateSla.ESIGN_THE_SUBMISSION,
          isAssignedRole: true,
          assignedRole: ["SUBMISSION_CREATOR", "SUBMISSION_RESPONDER"],
        });
      }
      applicationType === "PRODUCTION_DOCUMENTS" &&
        (orderNumber || orderRefNumber) &&
        createPendingTask({
          refId: `${userInfo?.uuid}_${orderNumber || orderRefNumber}`,
          isCompleted: true,
          status: "Completed",
        });
      history.push(
        orderNumber
          ? `?filingNumber=${filingNumber}&applicationNumber=${newapplicationNumber}&orderNumber=${orderNumber}`
          : `?filingNumber=${filingNumber}&applicationNumber=${newapplicationNumber}`
      );
    }
  };
```
