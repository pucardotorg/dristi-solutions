import React, { useMemo } from "react";
import Modal from "../../../dristi/src/components/Modal";
import { SubmissionDocumentWorkflowState } from "../utils/submissionDocumentsWorkflow";
import { CloseBtn, Heading } from "@egovernments/digit-ui-module-dristi/src/components/ModalComponents";

function ReviewDocumentSubmissionModal({
  t,
  combinedFileStoreId,
  handleSubmit,
  handleGoBack,
  currentSubmissionStatus,
  combinedDocumentFile,
  handleDownloadReviewModal,
}) {
  const DocViewerWrapper = window?.Digit?.ComponentRegistryService?.getComponent("DocViewerWrapper");
  const tenantId = Digit.ULBService.getCurrentTenantId();

  const showDocument = useMemo(() => {
    return (
      <React.Fragment>
        {combinedDocumentFile || combinedFileStoreId ? (
          <DocViewerWrapper
            docWidth={"100%"}
            docHeight={"fit-content"}
            errorHeight={"460px"}
            tenantId={tenantId}
            showDownloadOption={false}
            docViewerStyle={{ maxWidth: "100%", width: "100%", padding: "0px 16px 24px 16px" }}
            fileStoreId={currentSubmissionStatus === SubmissionDocumentWorkflowState.PENDING_ESIGN && combinedFileStoreId}
            selectedDocs={[combinedDocumentFile]}
          />
        ) : (
          <h2>{t("PREVIEW_DOC_NOT_AVAILABLE")}</h2>
        )}
      </React.Fragment>
    );
  }, [combinedDocumentFile, combinedFileStoreId, currentSubmissionStatus, t, tenantId]);

  return (
    <Modal
      headerBarMain={<Heading label={t("REVIEW_SUBMISSION_DOCUMENT_HEADING")} />}
      headerBarEnd={<CloseBtn t={t} onClick={handleGoBack} handleDownload={handleDownloadReviewModal} />}
      actionCancelLabel={currentSubmissionStatus !== SubmissionDocumentWorkflowState.PENDING_ESIGN && t("SUBMISSION_DOCUMENT_BACK")}
      actionCancelOnSubmit={handleGoBack}
      actionSaveLabel={t("SUBMIT")}
      actionSaveOnSubmit={() => {
        handleSubmit();
      }}
      className={"review-submission-appl-modal"}
      textStyle={{ color: "#FFFFFF", margin: 0 }}
      style={{ backgroundColor: "#007E7E" }}
    >
      <div className="review-submission-appl-body-main" style={{ display: "flex", justifyContent: "space-between", flexDirection: "column" }}>
        <div className="application-details" style={{ alignItems: "center", padding: "0px 12px 0 24px" }}>
          <div className="application-view" style={{ width: "100%" }}>
            {showDocument}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default ReviewDocumentSubmissionModal;
