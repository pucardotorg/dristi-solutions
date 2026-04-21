import React, { useCallback, useMemo, useState } from "react";
import { Button, Modal, TextInput } from "@egovernments/digit-ui-react-components";
import { hearingService } from "@egovernments/digit-ui-module-hearings/src/hooks/services";
import useDownloadCasePdf from "@egovernments/digit-ui-module-dristi/src/hooks/dristi/useDownloadCasePdf";
import { sanitizeData } from "@egovernments/digit-ui-module-dristi/src/Utils";
import { CloseBtn, Heading } from "@egovernments/digit-ui-module-dristi/src/components/ModalComponents";
import CustomToast from "@egovernments/digit-ui-module-dristi/src/components/CustomToast";
function ADiaryDocumentPdfModal({ t, tenantId, data, setShowDocumentPdfModal, isSelectedDataSigned, setReload, reload }) {
  const DocViewerWrapper = Digit?.ComponentRegistryService?.getComponent("DocViewerWrapper");
  const [businessOfTheDay, setBusinessOfTheDay] = useState(data?.rowData?.businessOfDay || "");
  const [showToast, setShowToast] = useState(null);

  const { downloadPdf } = useDownloadCasePdf();

  const handleDownload = useCallback(
    (filestoreId) => {
      if (filestoreId) {
        try {
          downloadPdf(tenantId, filestoreId);
        } catch (error) {
          console.error("Failed to generate diary document PDF:", error);
          const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
          setShowToast({ error: true, label: t("DIARY_DOCUMENT_PDF_FAILED"), errorId });
        }
      }
    },
    [downloadPdf, tenantId, t]
  );

  const handleUpdateBusinessOfDayEntry = async () => {
    try {
      await hearingService.aDiaryEntryUpdate(
        {
          diaryEntry: {
            ...data?.rowData,
            businessOfDay: businessOfTheDay,
          },
        },
        {}
      );
      setShowToast({ error: false, label: t("BUSINESS_OF_THE_DAY_UPDATED_SUCCESSFULLY") });
    } catch (error) {
      console.error("error: ", error);
      const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
      setShowToast({ error: true, label: t("BUSINESS_OF_THE_DAY_UPDATE_FAILED"), errorId });
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
          key={data?.document?.fileStore}
          docWidth={"calc(95vw * 62 / 100)"}
          docHeight={"unset"}
          fileStoreId={data?.document?.fileStore}
          tenantId={tenantId}
          displayFilename={data?.document?.additionalDetails?.name}
          showDownloadOption={false}
          documentName={data?.document?.additionalDetails?.name}
          isLocalizationRequired={false}
        />
      </div>
    );
  }, [data?.document?.fileStore, data?.document?.additionalDetails?.name, tenantId]);

  return (
    <Modal
      headerBarMain={<Heading label={t("VIEW_DOCUMENT")} />}
      headerBarEnd={
        <CloseBtn
          onClick={() => {
            setShowDocumentPdfModal({ show: false, rowData: null });
            // setReload(!reload);
          }}
        />
      }
      actionCancelLabel={null}
      actionCancelOnSubmit={() => {}}
      actionSaveLabel={null}
      hideSubmit={true}
      actionSaveOnSubmit={() => {}}
      popupStyles={{ minWidth: "880px", width: "80%" }}
    >
      {showDocument}

      <React.Fragment>
        <h3 style={{ marginTop: "24px", marginBottom: "2px" }}>{t("BUSINESS_OF_THE_DAY")} </h3>
        <div style={{ display: "flex", gap: "10px" }}>
          <TextInput
            className="field desktop-w-full"
            onChange={(e) => setBusinessOfTheDay(sanitizeData(e.target.value))}
            disable={isSelectedDataSigned ? true : false}
            value={businessOfTheDay}
            style={{ minWidth: "500px" }}
            textInputStyle={{ maxWidth: "100%" }}
          />
          <Button
            label={t("SAVE")}
            variation={"primary"}
            style={{ padding: 15, boxShadow: "none" }}
            onButtonClick={() => {
              handleUpdateBusinessOfDayEntry();
            }}
            isDisabled={isSelectedDataSigned ? true : false} //BOTD should not be editable if Adiary is already signed
          />
        </div>
        <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
          <div
            onClick={() => {
              handleDownload(data?.document?.fileStore);
            }}
            style={{ fontWeight: 700, fontSize: "16px", lineHeight: "18.75px", color: "#007E7E", cursor: "pointer" }}
          >
            {t("DOWNLOAD_DOCUMENT")}
          </div>
        </div>
        {showToast && (
          <CustomToast
            error={showToast?.error}
            label={showToast?.label}
            errorId={showToast?.errorId}
            onClose={() => setShowToast(null)}
            duration={showToast?.errorId ? 7000 : 5000}
          />
        )}
      </React.Fragment>
    </Modal>
  );
}

export default ADiaryDocumentPdfModal;
