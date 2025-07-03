import { CloseSvg } from "@egovernments/digit-ui-components";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import React, { useMemo, useState } from "react";
// import { useQuery } from "react-query";
// import Axios from "axios";
// import { Urls } from "../hooks/services/Urls";

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

// const onDocumentUpload = async (fileData, filename) => {
//   const fileUploadRes = await Digit.UploadServices.Filestorage("DRISTI", fileData, Digit.ULBService.getCurrentTenantId());
//   return { file: fileUploadRes?.data, fileType: fileData.type, filename };
// };

const BailBondReviewModal = ({
  t,
  handleBack,
  application,
  SubmissionPreviewSubmissionTypeMap,
  documents = [],
  setApplicationPdfFileStoreId,
  setShowBailBondReview,
  setShowsignatureModal,
  courtId,
}) => {
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const DocViewerWrapper = window?.Digit?.ComponentRegistryService?.getComponent("DocViewerWrapper");
  const [showErrorToast, setShowErrorToast] = useState(null);

  // const {
  //   data: { file: applicationPreviewPdf, fileName: applicationPreviewFileName } = {},
  //   isFetching: isLoading,
  // } = useQuery({
  //   queryKey: [
  //     "applicationPreviewPdf",
  //     tenantId,
  //     application?.applicationNumber,
  //     application?.cnrNumber,
  //     SubmissionPreviewSubmissionTypeMap[application?.applicationType],
  //   ],
  //   cacheTime: 0,
  //   queryFn: async () => {
  //     return Axios({
  //       method: "POST",
  //       url: Urls.application.submissionPreviewPdf,
  //       params: {
  //         tenantId: tenantId,
  //         applicationNumber: application?.applicationNumber,
  //         cnrNumber: application?.cnrNumber,
  //         qrCode: false,
  //         applicationType: SubmissionPreviewSubmissionTypeMap[application?.applicationType],
  //         courtId: courtId,
  //       },
  //       data: {
  //         RequestInfo: {
  //           authToken: Digit.UserService.getUser().access_token,
  //           userInfo: Digit.UserService.getUser()?.info,
  //           msgId: `${Date.now()}|${Digit.StoreData.getCurrentLanguage()}`,
  //           apiId: "Rainmaker",
  //         },
  //       },
  //       responseType: "blob",
  //     }).then((res) => ({
  //       file: res.data,
  //       fileName: res.headers["content-disposition"]?.split("filename=")[1],
  //     }));
  //   },
  //   enabled: !!application?.applicationNumber && !!application?.cnrNumber && !!SubmissionPreviewSubmissionTypeMap[application?.applicationType],
  // });

  //   const showDocument = useMemo(() => {
  //     return (
  //       <React.Fragment>
  //         {applicationPreviewPdf ? (
  //           <DocViewerWrapper
  //             docWidth={"calc(100vw* 76/ 100)"}
  //             docHeight={"60vh"}
  //             selectedDocs={[applicationPreviewPdf]}
  //             displayFilename={applicationPreviewFileName}
  //             showDownloadOption={false}
  //           />
  //         ) : isLoading ? (
  //           <h2>{t("LOADING")}</h2>
  //         ) : (
  //           <h2>{t("PREVIEW_DOC_NOT_AVAILABLE")}</h2>
  //         )}
  //       </React.Fragment>
  //     );
  //   }, [applicationPreviewPdf, isLoading, t]);

  // TODO: remove when api integration
  const showDocument = (
    <DocViewerWrapper
      docWidth="calc(100vw * 76 / 100)"
      docHeight="60vh"
      fileStoreId={"620e3843-1f9c-4abb-92fe-af6bc30f0e6b"}
      displayFilename="SampleBailBondPreview.pdf"
      showDownloadOption={false}
      tenantId={tenantId}
    />
  );

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
        headerBarMain={<Heading label={t("REVIEW_BAIL_BOND")} />}
        headerBarEnd={<CloseBtn onClick={handleBack} />}
        actionCancelLabel={t("CS_COMMON_BACK")}
        actionCancelOnSubmit={handleBack}
        actionSaveLabel={t("PROCEED_TO_SIGN")}
        isDisabled={false}
        actionSaveOnSubmit={() => {
          // const pdfFile = new File([applicationPreviewPdf], applicationPreviewFileName, { type: "application/pdf" });

          // onDocumentUpload(pdfFile, pdfFile.name)
          //   .then((document) => {
          //     const fileStoreId = document.file?.files?.[0]?.fileStoreId;
          //     if (fileStoreId) {
          //       setApplicationPdfFileStoreId(fileStoreId);
          //     }
          //   })
          //   .then(() => {
          //     setShowsignatureModal(true);
          //     setShowBailBondReview(false);
          //   })
          //   .catch((e) => {
          //     setShowErrorToast({ label: t("INTERNAL_ERROR_OCCURRED"), error: true });
          //   });

            // TODO: remove when api integration
          setShowBailBondReview(false);
          setShowsignatureModal(true);
        }}
        className={"review-submission-appl-modal bail-bond"}
      >
        <div className="review-submission-appl-body-main">
          <div className="application-details">
            <div className="application-view">
              {showDocument}
              {documents?.map((docs) => (
                <DocViewerWrapper
                  key={docs.fileStore}
                  fileStoreId={docs.fileStore}
                  tenantId={tenantId}
                  docWidth="100%"
                  docHeight="unset"
                  showDownloadOption={false}
                  documentName={docs.fileName}
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
