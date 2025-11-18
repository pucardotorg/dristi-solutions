# Code Documentation

This document explains the functionality, purpose, and usage of the provided code. It manages submissions and pending tasks in a legal case management system.

---

### `handleAddSignature`

#### Purpose:

Handles adding signature on submission
- Creates Demand (for payment)

#### Code:

```javascript
const handleAddSignature = async () => {
    setLoader(true);
    try {
      await createDemand();
      const response = await updateSubmission(SubmissionWorkflowAction.ESIGN);
      if (response && response?.application?.additionalDetails?.isResponseRequired) {
        await submissionService.customApiService(Urls.application.taskCreate, {
          task: {
            workflow: {
              action: "CREATE",
            },
            filingNumber: response?.application?.filingNumber,
            assignedTo: response?.application?.additionalDetails?.respondingParty
              ?.flatMap((item) => item?.uuid?.map((u) => ({ uuid: u })))
              ?.filter((item) => item?.uuid !== userInfo?.uuid),
            state: "PENDINGRESPONSE",
            referenceId: response?.application?.applicationNumber,
            taskType: "PENDING_TASK",
            tenantId,
            status: "INPROGRESS",
            duedate: orderDetails?.orderDetails?.dates?.responseDeadlineDate,
          },
          tenantId,
        });
      }
    } catch (error) {
      setLoader(false);
    }
    setLoader(false);
  };
```
