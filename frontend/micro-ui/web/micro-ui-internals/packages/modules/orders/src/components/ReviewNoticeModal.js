import { CloseSvg } from "@egovernments/digit-ui-components";
import React, { useMemo } from "react";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import ApplicationInfoComponent from "./ApplicationInfoComponent";
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
  const handleDownload = async (tenantId, filestoreId, filestoreIdPolice) => {
    // await downloadPdfFromFile(file?.[0]);
    if (filestoreId) {
      downloadPdf(tenantId, filestoreId);
    }
    if(filestoreIdPolice) {
      downloadPdf(tenantId, filestoreIdPolice, "Police Report");
    }
  };

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
          // selectedDocs={file}
          tenantId={tenantId}
          displayFilename={doc?.additionalDetails?.name}
          showDownloadOption={false}
          documentName={doc?.additionalDetails?.name}
          isLocalizationRequired={false}
        />
      </div>
    );
  }, [doc?.additionalDetails?.name, doc?.fileStore, tenantId]);

  const showDocumentPolice = useMemo(() => {
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
          key={policeDoc?.fileStore}
          docWidth={"calc(95vw * 62 / 100)"}
          docHeight={"unset"}
          fileStoreId={policeDoc?.fileStore}
          // selectedDocs={file}
          tenantId={tenantId}
          displayFilename={policeDoc?.additionalDetails?.name}
          showDownloadOption={false}
          documentName={policeDoc?.additionalDetails?.name}
          isLocalizationRequired={false}
        />
      </div>
    );
  }, [policeDoc?.additionalDetails?.name, policeDoc?.fileStore, tenantId]);

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
      {showDocumentPolice}
      {showDocument}
      
      <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
        <div
          onClick={() => {
            handleDownload(tenantId, doc?.fileStore, policeDoc?.fileStore);
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
