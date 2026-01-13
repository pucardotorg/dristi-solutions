import { CloseSvg } from "@egovernments/digit-ui-components";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "react-query";
import axiosInstance from "@egovernments/digit-ui-module-core/src/Utils/axiosInstance";
import { Toast } from "@egovernments/digit-ui-react-components";

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
  const [showErrorToast, setShowErrorToast] = useState(null);

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

  const closeToast = () => {
    setShowErrorToast(null);
  };

  useEffect(() => {
    if (showErrorToast) {
      const timer = setTimeout(() => {
        setShowErrorToast(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showErrorToast]);

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
              setShowErrorToast({ label: t("INTERNAL_ERROR_OCCURRED"), error: true });
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
      {showErrorToast && (
        <Toast error={showErrorToast?.error} label={showErrorToast?.label} isDleteBtn={true} onClose={closeToast} style={{ zIndex: "10001" }} />
      )}
    </React.Fragment>
  );
};

export default PreviewPdfModal;
