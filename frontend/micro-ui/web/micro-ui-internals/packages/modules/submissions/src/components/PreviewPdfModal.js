import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import React, { useMemo, useState } from "react";
import { useQuery } from "react-query";
import axiosInstance from "@egovernments/digit-ui-module-core/src/Utils/axiosInstance";
import { CloseBtn, Heading } from "@egovernments/digit-ui-module-dristi/src/components/ModalComponents";
import CustomToast from "@egovernments/digit-ui-module-dristi/src/components/CustomToast";
const onDocumentUpload = async (fileData, filename) => {
  const fileUploadRes = await Digit.UploadServices.Filestorage("DRISTI", fileData, Digit.ULBService.getCurrentTenantId());
  return { file: fileUploadRes?.data, fileType: fileData.type, filename };
};

const PreviewPdfModal = ({
  t,
  handleBack,
  documents = [],
  setPreviewModal,
  setFileStoreId,
  setShowsignatureModal,
  pdfConfig,
  header,
  saveLabel,
  cancelLabel,
  callback,
}) => {
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const DocViewerWrapper = window?.Digit?.ComponentRegistryService?.getComponent("DocViewerWrapper");
  const [showToast, setShowToast] = useState(null);

  const { data: { file: previewPdf, fileName: previewPdfFilename } = {}, isFetching: isLoading } = useQuery({
    queryKey: ["previewPdf", tenantId, pdfConfig?.id, pdfConfig?.cnrNumber, pdfConfig?.pdfMap],
    cacheTime: 0,
    queryFn: async () => {
      return axiosInstance
        .post(
          pdfConfig?.url,
          {
            RequestInfo: {
              authToken: Digit.UserService.getUser().access_token,
              userInfo: Digit.UserService.getUser()?.info,
              msgId: `${Date.now()}|${Digit.StoreData.getCurrentLanguage()}`,
              apiId: "Dristi",
            },
          },
          {
            params: pdfConfig?.params,
            responseType: "blob",
          }
        )
        .then((res) => ({
          file: res.data,
          fileName: res.headers["content-disposition"]?.split("filename=")[1],
        }));
    },
    onError: (error) => {
      console.error("Failed to fetch preview PDF:", error);
      const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
      setShowToast({ label: t("ERROR_FETCHING_PREVIEW_PDF"), error: true, errorId });
    },
    enabled: pdfConfig?.enabled,
  });

  const showDocument = useMemo(() => {
    return (
      <React.Fragment>
        {previewPdf ? (
          <DocViewerWrapper
            docWidth={"calc(100vw* 76/ 100)"}
            selectedDocs={[previewPdf]}
            displayFilename={previewPdfFilename}
            showDownloadOption={false}
            docHeight={"unset"}
          />
        ) : isLoading ? (
          <h2>{t("LOADING")}</h2>
        ) : (
          <h2>{t("PREVIEW_DOC_NOT_AVAILABLE")}</h2>
        )}
      </React.Fragment>
    );
  }, [previewPdf, isLoading, t]);

  return (
    <React.Fragment>
      <Modal
        headerBarMain={<Heading label={t(header)} />}
        headerBarEnd={<CloseBtn onClick={handleBack} />}
        actionCancelLabel={t(cancelLabel)}
        actionCancelOnSubmit={handleBack}
        actionSaveLabel={t(saveLabel)}
        isDisabled={isLoading}
        actionSaveOnSubmit={() => {
          const pdfFile = new File([previewPdf], previewPdfFilename, { type: "application/pdf" });

          onDocumentUpload(pdfFile, pdfFile.name)
            .then((document) => {
              const fileStoreId = document.file?.files?.[0]?.fileStoreId;
              if (fileStoreId) {
                setFileStoreId(fileStoreId);
              }
            })
            .then(() => {
              setShowsignatureModal(true);
              setPreviewModal(false);
              callback && callback();
            })
            .catch((e) => {
              const errorId = e?.response?.headers?.["x-correlation-id"] || e?.response?.headers?.["X-Correlation-Id"];
              setShowToast({ label: t("ERROR_UPLOADING_DOCUMENT"), error: true, errorId });
            });
        }}
        className={"review-submission-appl-modal bail-bond"}
      >
        <div className="review-submission-appl-body-main">
          <div className="application-details">
            <div className="application-view">
              {showDocument}
              {previewPdf &&
                documents?.map((docs) => (
                  <DocViewerWrapper
                    key={docs.fileStore}
                    fileStoreId={docs.fileStore}
                    tenantId={tenantId}
                    docWidth="100%"
                    docHeight={"unset"}
                    showDownloadOption={false}
                    documentName={docs?.name}
                  />
                ))}
            </div>
          </div>
        </div>
      </Modal>
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
  );
};

export default PreviewPdfModal;
