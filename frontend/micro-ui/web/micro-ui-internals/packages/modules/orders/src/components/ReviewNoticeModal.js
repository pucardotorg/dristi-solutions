import React, { useMemo } from "react";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import ApplicationInfoComponent from "./ApplicationInfoComponent";
import { CloseBtn, Heading } from "@egovernments/digit-ui-module-dristi/src/components/ModalComponents";
// import { combineMultipleFiles } from "@egovernments/digit-ui-module-dristi/src/Utils";
// import downloadPdfFromFile from "@egovernments/digit-ui-module-dristi/src/Utils/downloadPdfFromFile";

function ReviewNoticeModal({ t, handleCloseNoticeModal, rowData, infos }) {
  // const [file, setFile] = React.useState([]);
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const DocViewerWrapper = Digit?.ComponentRegistryService?.getComponent("DocViewerWrapper");
  const doc = rowData?.documents?.find((doc) => doc.documentType === "SIGNED_TASK_DOCUMENT");
  const policeDoc = rowData?.documents?.find((doc) => doc.documentType === "POLICE_REPORT");
  const useDownloadCasePdf = Digit?.Hooks?.dristi?.useDownloadCasePdf;
  const { downloadPdf } = useDownloadCasePdf();

  
  const handleDownload = async (tenantId, filestoreId, filestoreIdPolice) => {
    // await downloadPdfFromFile(file?.[0]);
    if (filestoreId) {
      downloadPdf(tenantId, filestoreId);
    }
    if (filestoreIdPolice) {
      downloadPdf(tenantId, filestoreIdPolice, "Police Report");
    }
  };

  const combinedDoc = useMemo(() => {
    return [policeDoc, doc].filter((d) => d?.fileStore);
  }, [doc, policeDoc]);

  const showDocument = useMemo(() => {
    return (
      <div
        className="show-document-doc-container"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {combinedDoc?.length > 0 ? (
          combinedDoc.map((docs) => (
            <DocViewerWrapper
              key={docs?.fileStore}
              docWidth={"calc(95vw * 62 / 100)"}
              docHeight={"unset"}
              disableInnerViewerScroll={true}
              fileStoreId={docs?.fileStore}
              tenantId={tenantId}
              displayFilename={docs?.additionalDetails?.name}
              showDownloadOption={false}
              documentName={docs?.additionalDetails?.name}
              isLocalizationRequired={false}
            />
          ))
        ) : (
          <h2>{t("PREVIEW_DOC_NOT_AVAILABLE")}</h2>
        )}
      </div>
    );
  }, [combinedDoc, t, tenantId]);

  // use this to combine multiple files
  // useEffect(() => {
  //   const processFiles = async () => {
  //     // filtering out the files that are not of type
  //     const pdfFileArray = rowData?.documents?.filter((doc) => doc.documentType === "SIGNED_TASK_DOCUMENT");
  //     const res = await combineMultipleFiles(pdfFileArray);
  //     setFile(res);
  //   };

  //   processFiles();
  // }, [rowData]);

  return (
    <Modal
      headerBarMain={<Heading label={`${t("VIEW_LINK")} ${t(rowData?.taskType)}`} />}
      headerBarEnd={<CloseBtn onClick={handleCloseNoticeModal} />}
      actionCancelLabel={null}
      actionCancelOnSubmit={() => {}}
      actionSaveLabel={null}
      hideSubmit={true}
      actionSaveOnSubmit={() => {}}
      popupStyles={{ width: "90vw", height: "90vh", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
      popupModuleMianStyles={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden", padding: "0 24px 24px" }}
    >
      {infos && <ApplicationInfoComponent infos={infos} />}
      {showDocument}
      <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center", marginTop: "16px", flexShrink: 0 }}>
        <div
          onClick={() => {
            handleDownload(tenantId, doc?.fileStore, policeDoc?.fileStore);
          }}
          style={{ fontWeight: 700, fontSize: "16px", lineHeight: "18.75px", color: "#007E7E", cursor: "pointer" }}
        >
          {`${t("CS_COMMON_DOWNLOAD")} ${t(rowData?.taskType)}`}
        </div>
      </div>
    </Modal>
  );
}

export default ReviewNoticeModal;
