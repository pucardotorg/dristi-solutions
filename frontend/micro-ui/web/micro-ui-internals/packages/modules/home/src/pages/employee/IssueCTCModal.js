import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { DateUtils, downloadPdfFromBlob } from "@egovernments/digit-ui-module-dristi/src/Utils";
import { CloseBtn, Heading } from "@egovernments/digit-ui-module-dristi/src/components/ModalComponents";
const HeaderBarEnd = ({ t, setShowModal, handleDownload }) => {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingRight: "20px" }}>
      <div
        style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#007E7E", fontWeight: "700" }}
        onClick={handleDownload}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M8.00004 1.33398C8.36823 1.33398 8.66671 1.63246 8.66671 2.00065V9.72451L11.5286 6.86258C11.789 6.60223 12.2111 6.60223 12.4714 6.86258C12.7318 7.12293 12.7318 7.54504 12.4714 7.80539L8.47144 11.8054C8.2111 12.0657 7.78899 12.0657 7.52864 11.8054L3.52864 7.80539C3.26829 7.54504 3.26829 7.12293 3.52864 6.86258C3.78899 6.60223 4.2111 6.60223 4.47144 6.86258L7.33337 9.72451V2.00065C7.33337 1.63246 7.63185 1.33398 8.00004 1.33398ZM1.33337 14.0007C1.33337 13.6325 1.63185 13.334 2.00004 13.334H14C14.3682 13.334 14.6667 13.6325 14.6667 14.0007C14.6667 14.3688 14.3682 14.6673 14 14.6673H2.00004C1.63185 14.6673 1.33337 14.3688 1.33337 14.0007Z"
            fill="#007E7E"
          />
        </svg>
        <span style={{ fontSize: "16px" }}>{t("DOWNLOAD_APPLICATION")}</span>
      </div>
      <CloseBtn onClick={() => setShowModal(false)} />
    </div>
  );
};

const IssueCTCModal = ({ rowData, setShowModal, handleIssue, handleCancelSubmit }) => {
  const { t } = useTranslation();
  const tenantId = window?.Digit.ULBService.getStateId();
  const DocViewerWrapper = window?.Digit?.ComponentRegistryService?.getComponent("DocViewerWrapper");
  const Modal = window?.Digit?.ComponentRegistryService?.getComponent("Modal");

  const handleDownload = () => {
    const documentBlob = rowData?.businessObject?.downloadedDocument;
    const fileName = rowData?.businessObject?.fileName || rowData?.businessObject?.documentTitle || "CTC_Document.pdf";
    if (documentBlob) {
      downloadPdfFromBlob(documentBlob, fileName);
    }
  };

  return (
    <Modal
      headerBarMain={<Heading style={{ margin: 0 }} label={t("DOCUMENT_REVIEW")} />}
      headerBarEnd={<HeaderBarEnd t={t} setShowModal={setShowModal} handleDownload={handleDownload} />}
      actionCancelLabel={t("REJECT")}
      actionCancelOnSubmit={handleCancelSubmit}
      actionSaveLabel={t("ISSUE")}
      isDisabled={false}
      actionSaveOnSubmit={() => {
        if (handleIssue) handleIssue(rowData);
        setShowModal(false);
      }}
      className={"ctc-review-modal"}
      popupStyles={{ borderRadius: "4px" }}
    >
      <div
        className="review-submission-appl-body-main"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          width: "100%",
          margin: "0 auto",
          padding: "24px",
        }}
      >
        {/* Application Info Box */}
        <div style={{ background: "#f7f5f3", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "50% 50%", gap: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0a0a0a" }}>{t("APPLICATION_NUMBER")}</h3>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 400, color: "#3d3c3c" }}>{rowData?.businessObject?.ctcApplicationNumber || ""}</h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "50% 50%", gap: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0a0a0a" }}>{t("APPLICATION_SUBMISSION_DATE")}</h3>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 400, color: "#3d3c3c" }}>
              {DateUtils.getFormattedDate(rowData?.businessObject?.dateOfApplication) || ""}
            </h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "50% 50%", gap: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0a0a0a" }}>{t("APPLICATION_FILER")}</h3>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 400, color: "#3d3c3c" }}>{rowData?.businessObject?.nameOfApplicant || ""}</h3>
          </div>
          {rowData?.businessObject?.dateOfApplicationApproval && rowData?.businessObject?.dateOfApplicationApproval !== 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "50% 50%", gap: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0a0a0a" }}>{t("APPLICATION_APPROVAL_DATE")}</h3>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 400, color: "#3d3c3c" }}>
                {DateUtils.getFormattedDate(rowData?.businessObject?.dateOfApplicationApproval)}
              </h3>
            </div>
          ) : null}
        </div>

        {/* Document Preview Area */}
        <div style={{ overflowY: "scroll" }}>
          {DocViewerWrapper && rowData?.businessObject?.downloadedDocument ? (
            <DocViewerWrapper
              key={rowData?.businessObject?.ctcApplicationNumber}
              selectedDocs={[rowData.businessObject.downloadedDocument]}
              tenantId={tenantId}
              docWidth={"100%"}
              docHeight={"100%"}
              showDownloadOption={false}
              displayFilename={rowData?.businessObject?.fileName || rowData?.businessObject?.documentTitle}
            />
          ) : (
            <div style={{ color: "#505A5F", textAlign: "center", padding: "40px", border: "1px solid #d6d5d4", width: "100%", height: "100%" }}>
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/4/4b/Cheque.png"
                alt="Cheque Placeholder"
                style={{ maxWidth: "100%", maxHeight: "300px", objectFit: "contain", opacity: "0.2" }}
              />
              <p style={{ marginTop: "16px", fontWeight: 500 }}>
                {t("A valid fileStoreId is required from the API to view documents natively using DocViewerWrapper here.")}
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default IssueCTCModal;
