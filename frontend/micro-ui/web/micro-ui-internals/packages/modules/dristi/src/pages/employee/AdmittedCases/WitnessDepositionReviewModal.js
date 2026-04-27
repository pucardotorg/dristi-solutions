import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import React, { useMemo, useState } from "react";
import { useQuery } from "react-query";
import { Urls } from "../../../hooks";
import axiosInstance from "@egovernments/digit-ui-module-core/src/Utils/axiosInstance";
import { CloseBtn, Heading } from "../../../components/ModalComponents";
import CustomToast from "@egovernments/digit-ui-module-dristi/src/components/CustomToast";
const onDocumentUpload = async (fileData, filename) => {
  const fileUploadRes = await Digit.UploadServices.Filestorage("DRISTI", fileData, Digit.ULBService.getCurrentTenantId());
  return { file: fileUploadRes?.data, fileType: fileData.type, filename };
};

const witnessDepositionPreviewSubmissionTypeMap = {
  WITNESS_DEPOSITION: "witness-deposition",
};

const WitnessDepositionReviewModal = ({
  t,
  handleBack,
  currentEvidence,
  tag,
  setWitnessDepositionFileStoreId,
  setShowWitnessDepositionReview,
  setShowsignatureModal,
  courtId,
  cnrNumber,
  filingNumber,
}) => {
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const DocViewerWrapper = window?.Digit?.ComponentRegistryService?.getComponent("DocViewerWrapper");

  const [showToast, setShowToast] = useState(null);

  const { data: { file: witnessDepositionPreviewPdf, fileName: witnessDepositionPreviewFilename } = {}, isFetching: isLoading } = useQuery({
    queryKey: [
      "witnessPreviewPdf",
      tenantId,
      currentEvidence?.artifactNumber, // artifact number
      cnrNumber, // pick from case
      witnessDepositionPreviewSubmissionTypeMap["WITNESS_DEPOSITION"],
    ],
    cacheTime: 0,
    queryFn: async () => {
      return axiosInstance
        .post(
          Urls.hearing.witnessDepositionPreviewPdf,
          {
            RequestInfo: {
              authToken: Digit.UserService.getUser().access_token,
              userInfo: Digit.UserService.getUser()?.info,
              msgId: `${Date.now()}|${Digit.StoreData.getCurrentLanguage()}`,
              apiId: "Dristi",
            },
          },
          {
            params: {
              tenantId: tenantId,
              artifactNumber: currentEvidence?.artifactNumber, // need to change
              cnrNumber: cnrNumber,
              filingNumber: filingNumber,
              qrCode: false,
              hearingPdfType: witnessDepositionPreviewSubmissionTypeMap["WITNESS_DEPOSITION"], // need to change
              courtId: courtId,
            },
            responseType: "blob",
          }
        )
        .then((res) => ({
          file: res.data,
          fileName: res.headers["content-disposition"]?.split("filename=")[1],
        }));
    },
    onError: (error) => {
      console.error("Failed to fetch witness deposition preview PDF:", error);
      const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
      setShowToast({ label: t("ERROR_FETCHING_WITNESS_DEPOSITION_PREVIEW_PDF"), error: true, errorId });
    },
    enabled: !!currentEvidence?.artifactNumber && !!cnrNumber && !!witnessDepositionPreviewSubmissionTypeMap["WITNESS_DEPOSITION"],
  });

  const showDocument = useMemo(() => {
    return (
      <React.Fragment>
        {witnessDepositionPreviewPdf ? (
          <DocViewerWrapper
            docWidth={"calc(100vw* 76/ 100)"}
            selectedDocs={[witnessDepositionPreviewPdf]}
            displayFilename={witnessDepositionPreviewFilename}
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
  }, [witnessDepositionPreviewPdf, witnessDepositionPreviewFilename, isLoading, t]);

  return (
    <React.Fragment>
      <style>
        {`
         .bail-bond .popup-module-main .popup-module-action-bar .selector-button-primary {
           background-color: #007e7e !important;
         }

         .bail-bond .popup-module-main .popup-module-action-bar .selector-button-primary h2 {
           color: white !important;
         }
        `}
      </style>
      <Modal
        headerBarMain={<Heading label={`${t("WITNESS_DEPOSITION")} (${tag})`} />}
        headerBarEnd={<CloseBtn onClick={handleBack} />}
        actionCancelLabel={t("CS_COMMON_BACK")}
        actionCancelOnSubmit={handleBack}
        actionSaveLabel={t("PROCEED_TO_SIGN")}
        isDisabled={false}
        actionSaveOnSubmit={() => {
          const pdfFile = new File([witnessDepositionPreviewPdf], witnessDepositionPreviewFilename, { type: "application/pdf" });

          onDocumentUpload(pdfFile, pdfFile.name)
            .then((document) => {
              const fileStoreId = document.file?.files?.[0]?.fileStoreId;
              if (fileStoreId) {
                setWitnessDepositionFileStoreId(fileStoreId);
              }
            })
            .then(() => {
              setShowsignatureModal(true);
              setShowWitnessDepositionReview(false);
              localStorage.removeItem("artifactNumber");
              localStorage.removeItem("showPdfPreview");
            })
            .catch((e) => {
              setShowToast({ label: t("ERROR_UPLOADING_DOCUMENT"), error: true, errorId: null });
            });
        }}
        className={"review-submission-appl-modal bail-bond"}
      >
        <div className="review-submission-appl-body-main">
          <div className="application-details">
            <div className="application-view">{showDocument}</div>
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

export default WitnessDepositionReviewModal;
