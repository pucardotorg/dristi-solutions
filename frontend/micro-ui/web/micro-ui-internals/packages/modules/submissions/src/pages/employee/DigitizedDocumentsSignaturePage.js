import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActionBar, SubmitBar, Button, Loader } from "@egovernments/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import BailEsignModal from "../../components/BailEsignModal";
import GenericUploadSignatureModal from "../../components/GenericUploadSignatureModal";
import SuccessBannerModal from "../../components/SuccessBannerModal";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { useQuery } from "react-query";
import { Urls } from "../../hooks/services/Urls";
import { submissionService } from "../../hooks/services";
import { useLocation } from "react-router-dom/cjs/react-router-dom";
import useOpenApiSearchDigitizedDocuments from "../../hooks/submissions/useOpenApiSearchDigitizedDocuments";
import axiosInstance from "@egovernments/digit-ui-module-core/src/Utils/axiosInstance";
import useDownloadCasePdf from "@egovernments/digit-ui-module-dristi/src/hooks/dristi/useDownloadCasePdf";
import CustomToast from "@egovernments/digit-ui-module-dristi/src/components/CustomToast";

const getStyles = () => ({
  details: { color: "#0A0A0A", fontWeight: 700, fontSize: "18px", paddingBottom: "22px" },
  detailsSection: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  signedLabel: {
    padding: "6px 8px",
    borderRadius: "999px",
    color: "#00703C",
    backgroundColor: "#E4F2E4",
    fontSize: "14px",
    fontWeight: 400,
  },
  unSignedLabel: {
    padding: "6px 8px",
    borderRadius: "999px",
    color: "#9E400A",
    backgroundColor: "#FFF6E8",
    fontSize: "14px",
    fontWeight: 400,
  },
  actionBar: { display: "flex", justifyContent: "flex-end", width: "100%" },
  submitButton: { boxShadow: "none", backgroundColor: "#008080", color: "#fff", fontWeight: "bold", cursor: "pointer" },
  editCaseButton: { backgroundColor: "#fff", border: "#007E7E solid", color: "#007E7E", cursor: "pointer" },
});

const DigitizedDocumentsSignaturePage = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
  const { digitalizedDocumentId: documentNumber, filingNumber, type } = Digit.Hooks.useQueryParams();
  const mobileNumber = location?.state?.mobileNumber;
  const partyUUID = location?.state?.partyUUID;
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const styles = getStyles();
  const history = useHistory();
  const token = window.localStorage.getItem("token");
  const isAuthorised = location?.state?.isAuthorised;
  const isUserLoggedIn = Boolean(token);
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo?.type]);
  const DocViewerWrapper = Digit?.ComponentRegistryService?.getComponent("DocViewerWrapper");
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showSigningChoiceModal, setShowSigningChoiceModal] = useState(false);
  const [showUploadSignature, setShowUploadSignature] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showToast, setShowToast] = useState(null);
  const { downloadPdf } = useDownloadCasePdf();

  const [esignMobileNumber, setEsignMobileNumber] = useState("");
  const [loader, setLoader] = useState(false);
  const [uploadLoader, setUploadLoader] = useState(false);

  // Open API file upload for unauthenticated SMS users
  const openApiUploadDocuments = useCallback(async (files, tenantId) => {
    const file = files?.[0];
    if (!file) throw new Error("No file provided");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("tenantId", tenantId);
    formData.append("module", "DRISTI");

    const response = await axiosInstance.post(Urls.openApi.fileUpload, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return response?.data?.files || response?.files || [];
  }, []);

  const { data: digitizedDocumentsOpenData, isLoading: isDigitizedDocumentsOpenOpenLoading } = useOpenApiSearchDigitizedDocuments(
    {
      tenantId,
      documentNumber: documentNumber,
      mobileNumber: mobileNumber || esignMobileNumber,
    },
    {},
    `digitized-documents-details-${documentNumber}`,
    Boolean(documentNumber && mobileNumber && !isUserLoggedIn)
  );

  const { data: documentsData, isloading: isDocumentsDataLoading, refetch: documentsRefetch } = Digit.Hooks.submissions.useSearchDigitalization(
    {
      criteria: {
        caseFilingNumber: filingNumber,
        type,
        tenantId,
        documentNumber,
      },
      tenantId,
    },
    {},
    `examination-of-accused-${documentNumber}`,
    Boolean(documentNumber && isUserLoggedIn)
  );

  const digitizedDocumentsDetails = useMemo(() => {
    return digitizedDocumentsOpenData?.documents?.[0] || documentsData?.documents?.[0];
  }, [digitizedDocumentsOpenData, documentsData]);

  const fileStoreId = useMemo(() => {
    return digitizedDocumentsDetails?.documents?.[0]?.fileStore;
  }, [digitizedDocumentsDetails]);

  const ifUserAuthorized = useMemo(() => {
    if (isUserLoggedIn) {
      const mobNumber =
        type === "PLEA"
          ? digitizedDocumentsDetails?.pleaDetails?.accusedMobileNumber
          : digitizedDocumentsDetails?.examinationOfAccusedDetails?.accusedMobileNumber;
      return mobNumber === userInfo?.mobileNumber;
    }
    return isAuthorised;
  }, [digitizedDocumentsDetails, isAuthorised, isUserLoggedIn, type, userInfo?.mobileNumber]);

  const accMobileNum = useMemo(() => {
    let mobNumber = "";

    if (isUserLoggedIn) {
      if (type === "PLEA") {
        mobNumber = digitizedDocumentsDetails?.pleaDetails?.accusedMobileNumber;
      } else {
        mobNumber = digitizedDocumentsDetails?.examinationOfAccusedDetails?.accusedMobileNumber;
      }
    } else {
      mobNumber = mobileNumber;
    }
    return mobNumber;
  }, [digitizedDocumentsDetails, isUserLoggedIn, type, mobileNumber]);

  const { data: { file: documentPreviewPdf } = {}, isFetching: isLoading } = useQuery({
    queryKey: ["DigitizedDocumentSignaturePdf", tenantId, documentNumber, userInfo?.uuid],
    retry: 3,
    cacheTime: 0,
    queryFn: async () => {
      return axiosInstance
        .post(
          `${Urls.openApi.FileFetchByFileStore}`,
          {
            tenantId,
            fileStoreId: fileStoreId,
            moduleName: "DRISTI",
          },
          { responseType: "blob" }
        )
        .then((res) => ({ file: res.data, fileName: res.headers["content-disposition"]?.split("filename=")[1] }));
    },
    onError: (error) => {
      console.error("Failed to fetch order preview PDF:", error);
      const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
      setShowToast({ label: t("FAILED_TO_FETCH_DOCUMENT_PREVIEW"), error: true, errorId });
    },
    enabled: Boolean(fileStoreId),
  });

  const handleSubmit = () => {
    setShowSigningChoiceModal(true);
  };

  const handleCloseSigningChoiceModal = () => {
    setShowSigningChoiceModal(false);
  };

  const handleCloseSignatureModal = () => {
    setShowSignatureModal(false);
  };

  const handleESignChoice = () => {
    setShowSigningChoiceModal(false);
    setShowSignatureModal(true);
  };

  const handleDownloadPdf = () => {
    if (!fileStoreId) return;

    if (isUserLoggedIn) {
      downloadPdf(tenantId, fileStoreId);
    } else if (documentPreviewPdf) {
      // For unauthenticated SMS users, use the already-fetched blob from the open API
      const blob = new Blob([documentPreviewPdf], { type: documentPreviewPdf.type || "application/pdf" });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "downloadedFile.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    }
  };

  const handleUploadSubmit = async (uploadedFileStoreId) => {
    try {
      setLoader(true);
      const payload = {
        tenantId,
        documentNumber: documentNumber,
        mobileNumber: accMobileNum,
        action: "UPLOAD",
        fileStoreId: uploadedFileStoreId,
      };
      await submissionService.updateOpenDigitizedDocument(payload, { tenantId });
      setShowSigningChoiceModal(false);
      setShowUploadSignature(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error uploading signed document:", error);
      const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
      setShowToast({ label: t("DIGITIZED_DOCUMENT_SIGNATURE_FAILED"), error: true, errorId });
    } finally {
      setLoader(false);
    }
  };

  const handleEsignProceed = async () => {
    // TODO: Update call with Signed FileStore
    try {
      const fileStoreId = sessionStorage.getItem("fileStoreId");
      const payload = {
        tenantId,
        documentNumber: documentNumber,
        mobileNumber: mobileNumber || esignMobileNumber,
        fileStoreId: fileStoreId,
      };
      sessionStorage.removeItem("fileStoreId");
      await submissionService.updateOpenDigitizedDocument(payload, { tenantId });
      setShowSignatureModal(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error while updating:", error);
      const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
      setShowToast({ label: t("DIGITIZED_DOCUMENT_SIGNATURE_FAILED"), error: true, errorId });
    } finally {
      setShowSignatureModal(false);
      sessionStorage.removeItem("isSignSuccess");
    }
  };

  const handleCloseSuccessModal = () => {
    sessionStorage.removeItem("isAuthorised");
    sessionStorage.removeItem("fileStoreId");
    if (isUserLoggedIn) {
      history.replace(`/${window?.contextPath}/citizen/dristi/home`);
    } else {
      window.location.replace(process.env.REACT_APP_PROXY_API || "https://oncourts.kerala.gov.in");
    }
  };

  useEffect(() => {
    const isSignSuccess = sessionStorage.getItem("esignProcess");
    const mobileNumber = sessionStorage.getItem("mobileNumber");
    if (isSignSuccess) {
      setShowSignatureModal(true);
      setEsignMobileNumber(JSON.parse(mobileNumber));

      const timer = setTimeout(() => {
        sessionStorage.removeItem("esignProcess");
        sessionStorage.removeItem("mobileNumber");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!isUserLoggedIn && !ifUserAuthorized) {
      history.replace(
        `/${window?.contextPath}/citizen/dristi/home/digitalized-document-login?tenantId=${tenantId}&documentNumber=${documentNumber}&type=${type}`
      );
    }

    if (!documentNumber) {
      history.replace(`/${window?.contextPath}/${userType}/home/home-pending-task`);
    }
  }, [
    documentNumber,
    history,
    isAuthorised,
    isUserLoggedIn,
    tenantId,
    userType,
    isDocumentsDataLoading,
    digitizedDocumentsDetails,
    ifUserAuthorized,
    type,
  ]);

  const handleMockESign = async () => {
    try {
      setLoader(true);

      const payload = {
        tenantId,
        documentNumber: documentNumber,
        mobileNumber: accMobileNum,
        fileStoreId: fileStoreId,
      };
      sessionStorage.removeItem("fileStoreId");
      await submissionService.updateOpenDigitizedDocument(payload, { tenantId });
      setShowSignatureModal(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error while updating document:", error);
      const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
      setShowToast({ label: t("DIGITIZED_DOCUMENT_UPDATE_FAILED"), error: true, errorId });
    } finally {
      setLoader(false);
    }
  };

  const isSubmitButtonEnabled = useMemo(() => {
    if (digitizedDocumentsDetails?.status !== "PENDING_E-SIGN") return false;
    if (isUserLoggedIn && partyUUID && partyUUID !== userInfo?.uuid) return false;

    const mobNumber =
      type === "PLEA"
        ? digitizedDocumentsDetails?.pleaDetails?.accusedMobileNumber
        : digitizedDocumentsDetails?.examinationOfAccusedDetails?.accusedMobileNumber;
    if (isUserLoggedIn && mobNumber !== userInfo?.mobileNumber) {
      return false;
    }
    return true;
  }, [digitizedDocumentsDetails, isUserLoggedIn, partyUUID, type, userInfo?.mobileNumber, userInfo?.uuid]);

  if (isDigitizedDocumentsOpenOpenLoading || isLoading || isDocumentsDataLoading) {
    return <Loader />;
  }

  return (
    <div className="witness-deposition-signature">
      {loader || isDocumentsDataLoading || isDigitizedDocumentsOpenOpenLoading ? (
        <div
          style={{
            width: "100vw",
            height: "100vh",
            zIndex: "99999999",
            position: "fixed",
            right: "0",
            display: "flex",
            top: "0",
            background: "rgb(234 234 245 / 50%)",
            alignItems: "center",
            justifyContent: "center",
          }}
          className="submit-loader"
        >
          <Loader />
        </div>
      ) : (
        <div>
          <div className="header">{`${t(type)}`}</div>
          <div className="doc-viewer">
            {!isLoading ? (
              <DocViewerWrapper
                docWidth={"100%"}
                docHeight={"100%"}
                selectedDocs={documentPreviewPdf ? [documentPreviewPdf] : []}
                tenantId={tenantId}
                docViewerCardClassName={"doc-card"}
                showDownloadOption={false}
              />
            ) : (
              <h2>{t("PREVIEW_DOC_NOT_AVAILABLE")}</h2>
            )}
          </div>
          <ActionBar>
            <div className="action-bar">
              {isUserLoggedIn && (
                <Button
                  label={t("BACK")}
                  variation={"secondary"}
                  onButtonClick={() => {
                    history.goBack();
                  }}
                  textStyles={{
                    fontFamily: "Roboto",
                    fontSize: "16px",
                    fontWeight: 700,
                    lineHeight: "18.75px",
                    textAlign: "center",
                    color: "#007E7E",
                  }}
                  className="back-button"
                />
              )}
              {isSubmitButtonEnabled && (
                <SubmitBar
                  label={
                    <div style={{ boxShadow: "none", display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
                      <span>{t("PROCEED_TO_SIGN")}</span>
                    </div>
                  }
                  onSubmit={handleSubmit}
                  style={styles.submitButton}
                />
              )}
            </div>
          </ActionBar>

          {showSigningChoiceModal && (
            <GenericUploadSignatureModal
              t={t}
              handleCloseSignatureModal={handleCloseSigningChoiceModal}
              handleDownload={handleDownloadPdf}
              handleESign={handleESignChoice}
              setShowUploadSignature={setShowUploadSignature}
              showUploadSignature={showUploadSignature}
              handleSubmit={handleUploadSubmit}
              setLoader={setUploadLoader}
              loader={uploadLoader}
              fileStoreId={fileStoreId}
              infoText={type === "PLEA" ? "PLEA_SIGN_INFO" : "EXAMINATION_SIGN_INFO"}
              customUploadDocuments={!isUserLoggedIn ? openApiUploadDocuments : undefined}
              onCustomDownload={!isUserLoggedIn ? handleDownloadPdf : undefined}
            />
          )}
          {showSignatureModal && (
            <BailEsignModal
              t={t}
              handleCloseSignaturePopup={handleCloseSignatureModal}
              handleProceed={handleEsignProceed}
              fileStoreId={fileStoreId}
              signPlaceHolder={"Signature of Accused"}
              mobileNumber={accMobileNum}
              forWitnessDeposition={true}
              handleMockESign={handleMockESign}
              customizedNote={type === "PLEA" ? t("PLEA_POPUP_NOTES") : t("EXAMINATION_OF_ACCUSED_POPUP_NOTES")}
            />
          )}
          {showSuccessModal && (
            <SuccessBannerModal
              t={t}
              handleCloseSuccessModal={handleCloseSuccessModal}
              message={type === "PLEA" ? "SIGNED_PLEA_DOCUMENT_MESSAGE" : "SIGNED_EXAMINATION_OF_ACCUSED_MESSAGE"}
            />
          )}
          {showToast && (
            <CustomToast
              error={showToast?.error}
              label={showToast?.label}
              errorId={showToast?.errorId}
              onClose={() => setShowToast(null)}
              duration={showToast?.errorId ? 7000 : 5000}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default DigitizedDocumentsSignaturePage;
