import { CloseSvg } from "@egovernments/digit-ui-components";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import React, { useMemo, useState } from "react";
import { useQuery } from "react-query";
import { Urls } from "../hooks/services/Urls";
import axiosInstance from "@egovernments/digit-ui-module-core/src/Utils/axiosInstance";

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

const bailBondPreviewSubmissionTypeMap = {
  BAIL_BOND: "bail-bond",
};

const BailBondReviewModal = ({
  t,
  handleBack,
  bailBondDetails,
  documents = [],
  setBailBondFileStoreId,
  setShowBailBondReview,
  setShowsignatureModal,
  courtId,
}) => {
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const DocViewerWrapper = window?.Digit?.ComponentRegistryService?.getComponent("DocViewerWrapper");
  const [showErrorToast, setShowErrorToast] = useState(null);

  const { data: { file: bailBondPreviewPdf, fileName: bailBondPreviewFileName } = {}, isFetching: isLoading } = useQuery({
    queryKey: ["bailBondPreviewPdf", tenantId, bailBondDetails?.bailId, bailBondDetails?.cnrNumber, bailBondPreviewSubmissionTypeMap["BAIL_BOND"]],
    cacheTime: 0,
    queryFn: async () => {
      return axiosInstance
        .post(
          Urls.bailBond.bailBondPreviewPdf,
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
              bailBondId: bailBondDetails?.bailId, // need to change
              cnrNumber: bailBondDetails?.cnrNumber,
              qrCode: false,
              bailBondPdfType: bailBondPreviewSubmissionTypeMap["BAIL_BOND"], // need to change
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
    enabled: !!bailBondDetails?.bailId && !!bailBondDetails?.cnrNumber && !!bailBondPreviewSubmissionTypeMap["BAIL_BOND"],
  });

  const showDocument = useMemo(() => {
    return (
      <React.Fragment>
        {bailBondPreviewPdf ? (
          <DocViewerWrapper
            docWidth={"calc(100vw* 76/ 100)"}
            selectedDocs={[bailBondPreviewPdf]}
            displayFilename={bailBondPreviewFileName}
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
  }, [bailBondPreviewPdf, isLoading, t]);

  return (
    <React.Fragment>
      <Modal
        headerBarMain={<Heading label={t("REVIEW_BAIL_BOND")} />}
        headerBarEnd={<CloseBtn onClick={handleBack} />}
        actionCancelLabel={t("CS_COMMON_BACK")}
        actionCancelOnSubmit={handleBack}
        actionSaveLabel={t("PROCEED_TO_SIGN")}
        isDisabled={false}
        actionSaveOnSubmit={() => {
          const pdfFile = new File([bailBondPreviewPdf], bailBondPreviewFileName, { type: "application/pdf" });

          onDocumentUpload(pdfFile, pdfFile.name)
            .then((document) => {
              const fileStoreId = document.file?.files?.[0]?.fileStoreId;
              if (fileStoreId) {
                setBailBondFileStoreId(fileStoreId);
              }
            })
            .then(() => {
              setShowsignatureModal(true);
              setShowBailBondReview(false);
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
              {bailBondPreviewPdf &&
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
    </React.Fragment>
  );
};

export default BailBondReviewModal;
