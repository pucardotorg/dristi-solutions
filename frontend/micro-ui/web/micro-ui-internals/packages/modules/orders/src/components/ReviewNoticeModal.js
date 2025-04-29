import { CloseSvg } from "@egovernments/digit-ui-components";
import React, { useMemo } from "react";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import ApplicationInfoComponent from "./ApplicationInfoComponent";

function ReviewNoticeModal({ t, handleCloseNoticeModal, rowData, infos }) {
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const DocViewerWrapper = Digit?.ComponentRegistryService?.getComponent("DocViewerWrapper");
  const doc = rowData?.documents?.find((doc) => doc.documentType === "SIGNED_TASK_DOCUMENT");
  const useDownloadCasePdf = Digit?.Hooks?.dristi?.useDownloadCasePdf;
  const { downloadPdf } = useDownloadCasePdf();

  const Heading = (props) => {
    return <h1 className="heading-m">{props.label}</h1>;
  };

  const CloseBtn = (props) => {
    return (
      <div onClick={props?.onClick} style={{ height: "100%", display: "flex", alignItems: "center", paddingRight: "20px", cursor: "pointer" }}>
        <CloseSvg />
      </div>
    );
  };
  const handleDownload = (tenantId, filestoreId) => {
    if (filestoreId) {
      downloadPdf(tenantId, filestoreId);
    }
  };

  const showDocument = useMemo(() => {
    return (
      <div
        className="show-document-doc-container"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          maxHeight: "60vh",
          maxWidth: "100%",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        <DocViewerWrapper
          key={doc?.fileStore}
          docWidth={"calc(95vw * 62 / 100)"}
          docHeight={"unset"}
          fileStoreId={doc?.fileStore}
          tenantId={tenantId}
          displayFilename={doc?.additionalDetails?.name}
          showDownloadOption={false}
          documentName={doc?.additionalDetails?.name}
          isLocalizationRequired={false}
        />
      </div>
    );
  }, [doc, tenantId]);

  return (
    <Modal
      headerBarMain={<Heading label={`${t("VIEW_LINK")} ${rowData.orderType.charAt(0).toUpperCase() + rowData.orderType.slice(1).toLowerCase()}`} />}
      headerBarEnd={<CloseBtn onClick={handleCloseNoticeModal} />}
      actionCancelLabel={null}
      actionCancelOnSubmit={() => {}}
      actionSaveLabel={null}
      hideSubmit={true}
      actionSaveOnSubmit={() => {}}
      popupStyles={{ minWidth: "880px", width: "80%" }}
    >
      {infos && <ApplicationInfoComponent infos={infos} />}
      {showDocument}

      <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
        <div
          onClick={() => {
            handleDownload(tenantId, doc?.fileStore);
          }}
          style={{ fontWeight: 700, fontSize: "16px", lineHeight: "18.75px", color: "#007E7E", cursor: "pointer" }}
        >
          {`${t("CS_COMMON_DOWNLOAD")} ${rowData.orderType.charAt(0).toUpperCase() + rowData.orderType.slice(1).toLowerCase()}`}
        </div>
      </div>
    </Modal>
  );
}

export default ReviewNoticeModal;
