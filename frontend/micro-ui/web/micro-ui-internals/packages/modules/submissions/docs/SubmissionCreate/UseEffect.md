# Code Documentation

This document explains the functionality, purpose, and usage of the provided code. It manages submissions and pending tasks in a legal case management system.

---

### `useEffect`

#### Purpose:
When user comes on the createSubmission Page with applicationNumber and the status is pendingEsign or pendingPayment, it always show the respective modal
- if status of application is pending Esign, it will open review of the created order
- if status of application is pending Payment, it will open make payment modal.

#### Code:

```javascript
useEffect(() => {
    if (applicationDetails) {
      if ([SubmissionWorkflowState.PENDINGESIGN, SubmissionWorkflowState.PENDINGSUBMISSION].includes(applicationDetails?.status)) {
        setShowReviewModal(true);
        return;
      }
      if (applicationDetails?.status === SubmissionWorkflowState.PENDINGPAYMENT) {
        setShowPaymentModal(true);
        return;
      }
    }
  }, [applicationDetails]);
```
