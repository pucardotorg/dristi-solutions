# Code Documentation

This document explains the functionality, purpose, and usage of the provided code. It manages submissions and pending tasks in a legal case management system.

---

### `actionSaveOnSubmit`

#### Purpose:

HandleClick Function on primary button of `EvidenceModal` - [`actionSaveLabel`](./ActionSaveLabel.md)

- If the button is Download Submission, It will download the pdf of the submitted signed submission
- If it's Add Comment (Respond), then it will be Respond action on the submission
- If it's "Accept", the confirmation modal for accept submission will open up
- In case of mark or unmark evidence, it will show confirmation modal and respective action on the same

#### Code:

```javascript
const actionSaveOnSubmit = async () => {
  if (actionSaveLabel === t("DOWNLOAD_SUBMISSION") && signedSubmission?.applicationContent?.fileStoreId) {
    downloadPdf(tenantId, signedSubmission?.applicationContent?.fileStoreId);
    return;
  }
  if (userType === "employee") {
    modalType === "Documents" ? setShowConfirmationModal({ type: "documents-confirmation" }) : setShowConfirmationModal({ type: "accept" });
  } else {
    if (actionSaveLabel === t("ADD_COMMENT")) {
      try {
      } catch (error) {}
      await handleRespondApplication();
      try {
        DRISTIService.customApiService(Urls.dristi.pendingTask, {
          pendingTask: {
            entityType: "application-order-submission-feedback",
            status: "RESPOND_TO_PRODUCTION_DOCUMENTS",
            referenceId: `MANUAL_${signedSubmission?.applicationList?.applicationNumber}`,
            cnrNumber,
            filingNumber,
            isCompleted: true,
            tenantId,
          },
        });
      } catch (error) {
        console.error("error :>> ", error);
      }
    }
    ///show a toast message
    counterUpdate();
    setShow(false);
    counterUpdate();
    history.replace(`/${window.contextPath}/${userType}/dristi/home/view-case?caseId=${caseId}&filingNumber=${filingNumber}&tab=Submissions`);
  }
};
```
