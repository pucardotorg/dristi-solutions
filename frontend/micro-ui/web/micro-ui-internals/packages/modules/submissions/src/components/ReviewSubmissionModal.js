import React, { useEffect, useMemo, useState } from "react";
import Modal from "../../../dristi/src/components/Modal";
import Axios from "axios";
import { CloseSvg } from "@egovernments/digit-ui-components";
import { Toast } from "@egovernments/digit-ui-react-components";

import { Urls } from "../hooks/services/Urls";
import { useQuery } from "react-query";
import { convertToDateInputFormat } from "../utils/index";

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

// sort the Documents Based on DocumentOrder
const _getSortedByOrder = (documents) => {
  return documents?.sort((a, b) => {
    return (a?.documentOrder || 0) - (b?.documentOrder || 0);
  });
};

const SubmissionPreviewSubmissionTypeMap = {
  RE_SCHEDULE: "application-reschedule-request",
  EXTENSION_SUBMISSION_DEADLINE: "application-submission-extension",
  PRODUCTION_DOCUMENTS: "application-production-of-documents",
  WITHDRAWAL: "application-case-withdrawal",
  TRANSFER: "application-case-transfer",
  BAIL_BOND: "application-bail-bond",
  SURETY: "application-bail-bond",
  OTHERS: "application-generic",
  SETTLEMENT: "application-case-settlement",
  CHECKOUT_REQUEST: "application-for-checkout-request",
  REQUEST_FOR_BAIL: "application-bail-bond",
  SUBMIT_BAIL_DOCUMENTS: "application-submit-bail-documents",
  DELAY_CONDONATION: "application-delay-condonation",
};

const onDocumentUpload = async (fileData, filename) => {
  const fileUploadRes = await Digit.UploadServices.Filestorage("DRISTI", fileData, Digit.ULBService.getCurrentTenantId());
  return { file: fileUploadRes?.data, fileType: fileData.type, filename };
};

function ReviewSubmissionModal({
  applicationType,
  application,
  submissionDate,
  sender,
  additionalDetails,
  setShowReviewModal,
  t,
  setShowsignatureModal,
  handleBack,
  documents = [],
  setApplicationPdfFileStoreId,
}) {
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const DocViewerWrapper = window?.Digit?.ComponentRegistryService?.getComponent("DocViewerWrapper");
  const [showErrorToast, setShowErrorToast] = useState(null);

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

  const { data: { file: applicationPreviewPdf, fileName: applicationPreviewFileName } = {}, isFetching: isLoading } = useQuery({
    queryKey: [
      "applicationPreviewPdf",
      tenantId,
      application?.applicationNumber,
      application?.cnrNumber,
      SubmissionPreviewSubmissionTypeMap[application?.applicationType],
    ],
    cacheTime: 0,
    queryFn: async () => {
      return Axios({
        method: "POST",
        url: Urls.application.submissionPreviewPdf,
        params: {
          tenantId: tenantId,
          applicationNumber: application?.applicationNumber,
          cnrNumber: application?.cnrNumber,
          qrCode: false,
          applicationType: SubmissionPreviewSubmissionTypeMap[application?.applicationType],
        },
        data: {
          RequestInfo: {
            authToken: Digit.UserService.getUser().access_token,
            userInfo: Digit.UserService.getUser()?.info,
            msgId: `${Date.now()}|${Digit.StoreData.getCurrentLanguage()}`,
            apiId: "Rainmaker",
          },
        },
        responseType: "blob",
      }).then((res) => ({ file: res.data, fileName: res.headers["content-disposition"]?.split("filename=")[1] }));
    },
    enabled: !!application?.applicationNumber && !!application?.cnrNumber && !!SubmissionPreviewSubmissionTypeMap[application?.applicationType],
  });

  useEffect(() => {
    const isSignSuccess = localStorage.getItem("esignProcess");
    const applicationPDF = localStorage.getItem("applicationPDF");
    if (isSignSuccess) {
      setShowReviewModal(false);
      setShowsignatureModal(true);
      setApplicationPdfFileStoreId(applicationPDF);
      localStorage.removeItem("esignProcess");
      localStorage.removeItem("applicationPDF");
    }
  }, []);

  const showDocument = useMemo(() => {
    return (
      <React.Fragment>
        {applicationPreviewPdf ? (
          <DocViewerWrapper
            docWidth={"calc(100vw* 76/ 100)"}
            docHeight={"60vh"}
            selectedDocs={[applicationPreviewPdf]}
            displayFilename={applicationPreviewFileName}
            showDownloadOption={false}
          />
        ) : isLoading ? (
          <h2>{t("LOADING")}</h2>
        ) : (
          <h2>{t("PREVIEW_DOC_NOT_AVAILABLE")}</h2>
        )}
      </React.Fragment>
    );
  }, [applicationPreviewPdf, isLoading, t]);

  return (
    <Modal
      headerBarMain={<Heading label={t("REVIEW_SUBMISSION_APPLICATION_HEADING")} />}
      headerBarEnd={<CloseBtn onClick={handleBack} />}
      actionCancelLabel={t("CS_COMMON_BACK")}
      actionCancelOnSubmit={handleBack}
      actionSaveLabel={t("ADD_SIGNATURE")}
      isDisabled={isLoading}
      actionSaveOnSubmit={() => {
        const pdfFile = new File([applicationPreviewPdf], applicationPreviewFileName, { type: "application/pdf" });

        onDocumentUpload(pdfFile, pdfFile.name)
          .then((document) => {
            const fileStoreId = document.file?.files?.[0]?.fileStoreId;
            if (fileStoreId) {
              setApplicationPdfFileStoreId(fileStoreId);
            }
          })
          .then(() => {
            setShowsignatureModal(true);
            setShowReviewModal(false);
          })
          .catch((e) => {
            setShowErrorToast({ label: t("INTERNAL_ERROR_OCCURRED"), error: true });
          });
      }}
      className={"review-submission-appl-modal"}
    >
      <div className="review-submission-appl-body-main">
        <div className="application-details">
          <div className="application-info" style={{ flexWrap: "wrap" }}>
            <div className="info-row">
              <div className="info-key">
                <h3>{t("APPLICATION_TYPE")}</h3>
              </div>
              <div className="info-value">
                <h3>{t(applicationType)}</h3>
              </div>
            </div>
            <div className="info-row">
              <div className="info-key">
                <h3>{t("SUBMISSION_DATE")}</h3>
              </div>
              <div className="info-value">
                <h3>{convertToDateInputFormat(submissionDate)}</h3>
              </div>
            </div>
            <div className="info-row">
              <div className="info-key">
                <h3>{t("SENDER")}</h3>
              </div>
              <div className="info-value">
                <h3>{t(sender)}</h3>
              </div>
            </div>
            {additionalDetails && (
              <div className="info-row">
                <div className="info-key">
                  <h3>{t("ADDITIONAL_DETAILS")}</h3>
                </div>
                <div className="info-value">
                  <h3>{t(additionalDetails)}</h3>
                </div>
              </div>
            )}
          </div>
          <div className="application-view">
            {showDocument}
            {_getSortedByOrder(documents)?.map((docs) => (
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
      {showErrorToast && <Toast error={showErrorToast?.error} label={showErrorToast?.label} isDleteBtn={true} onClose={closeToast} />}
    </Modal>
  );
}

export default ReviewSubmissionModal;
