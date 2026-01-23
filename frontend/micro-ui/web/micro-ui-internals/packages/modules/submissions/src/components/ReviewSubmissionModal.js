import React, { useEffect, useMemo, useState } from "react";
import Modal from "../../../dristi/src/components/Modal";
import { CloseSvg } from "@egovernments/digit-ui-components";
import { Toast } from "@egovernments/digit-ui-react-components";

import { Urls } from "../hooks/services/Urls";
import { useQuery } from "react-query";
import { convertToDateInputFormat } from "../utils/index";
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

const getStyles = (key) => {
  const styles = {
    container: {
      position: "relative",
      padding: "16px 24px",
      background: "#f7f5f3",
      display: "flex",
      flexWrap: "wrap",
      gap: "20px",
      alignItems: "flex-start",
    },

    infoRow: {
      display: "flex",
      alignItems: "flex-start",
      gap: "10px",
    },

    infoKey: {
      width: "fit-content",
      margin: 0,
      fontFamily: "Roboto",
      fontSize: "16px",
      fontWeight: 700,
      lineHeight: "18.75px",
      color: "#0a0a0a",
    },

    infoValue: {
      width: "fit-content",
      margin: 0,
      fontFamily: "Roboto",
      fontSize: "16px",
      fontWeight: 400,
      lineHeight: "18.75px",
      color: "#3d3c3c",
    },
  };

  return styles[key];
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
  // BAIL_BOND: "application-bail-bond",
  // SURETY: "application-bail-bond",
  OTHERS: "application-generic",
  SETTLEMENT: "application-case-settlement",
  CHECKOUT_REQUEST: "application-for-checkout-request",
  REQUEST_FOR_BAIL: "application-bail-bond",
  SUBMIT_BAIL_DOCUMENTS: "application-submit-bail-documents",
  DELAY_CONDONATION: "application-delay-condonation",
  CORRECTION_IN_COMPLAINANT_DETAILS: "application-profile-edit",
  ADDING_WITNESSES: "application-witness-deposition",
  APPLICATION_TO_CHANGE_POWER_OF_ATTORNEY_DETAILS: "poa-claim-application",
  ADVANCEMENT_OR_ADJOURNMENT_APPLICATION: "application-reschedule-hearing",
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
  courtId,
  cancelLabel,
  handleSubmit,
  handleCancel,
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
      return axiosInstance
        .post(
          Urls.application.submissionPreviewPdf,
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
              applicationNumber: application?.applicationNumber,
              cnrNumber: application?.cnrNumber,
              qrCode: false,
              applicationType: SubmissionPreviewSubmissionTypeMap[application?.applicationType],
              courtId: courtId || application?.courtId,
            },
            responseType: "blob",
          }
        )
        .then((res) => ({ file: res.data, fileName: res.headers["content-disposition"]?.split("filename=")[1] }));
    },
    enabled: !!application?.applicationNumber && !!application?.cnrNumber && !!SubmissionPreviewSubmissionTypeMap[application?.applicationType],
  });

  useEffect(() => {
    const isSignSuccess = sessionStorage.getItem("esignProcess");
    const applicationPDF = sessionStorage.getItem("applicationPDF");
    if (isSignSuccess) {
      setShowReviewModal(false);
      setShowsignatureModal(true);
      setApplicationPdfFileStoreId(applicationPDF);
      sessionStorage.removeItem("esignProcess");
      sessionStorage.removeItem("applicationPDF");
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
      actionCancelLabel={t(cancelLabel)}
      actionCancelOnSubmit={handleCancel}
      actionSaveLabel={t("ADD_SIGNATURE")}
      isDisabled={isLoading}
      actionSaveOnSubmit={() => handleSubmit({ applicationPreviewPdf, applicationPreviewFileName })}
      className={"review-submission-appl-modal"}
    >
      <div className="review-submission-appl-body-main">
        <div className="application-details">
          <div style={getStyles("container")}>
            <div style={getStyles("infoRow")}>
              <h3 style={getStyles("infoKey")}>{t("APPLICATION_TYPE")}</h3>
              <h3 style={getStyles("infoValue")}>{t(applicationType)}</h3>
            </div>

            <div style={getStyles("infoRow")}>
              <h3 style={getStyles("infoKey")}>{t("SUBMISSION_DATE")}</h3>
              <h3 style={getStyles("infoValue")}>{convertToDateInputFormat(submissionDate)}</h3>
            </div>

            <div style={getStyles("infoRow")}>
              <h3 style={getStyles("infoKey")}>{t("SENDER")}</h3>
              <h3 style={getStyles("infoValue")}>{sender || application?.additionalDetails?.owner || ""}</h3>
            </div>

            {additionalDetails && (
              <div style={getStyles("infoRow")}>
                <h3 style={getStyles("infoKey")}>{t("ADDITIONAL_DETAILS")}</h3>
                <h3 style={getStyles("infoValue")}>{t(additionalDetails)}</h3>
              </div>
            )}
          </div>

          <div className="application-view">
            {showDocument}
            {applicationPreviewPdf &&
              _getSortedByOrder(documents)?.map((docs) => (
                <DocViewerWrapper
                  key={docs.fileStore}
                  fileStoreId={docs.fileStore}
                  tenantId={tenantId}
                  docWidth="100%"
                  docHeight="unset"
                  showDownloadOption={false}
                  documentName={docs?.fileName || docs?.additionalDetails?.name || docs?.name}
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
