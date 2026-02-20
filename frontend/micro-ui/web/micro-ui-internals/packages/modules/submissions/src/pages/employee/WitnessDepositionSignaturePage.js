import React, { useEffect, useMemo, useState } from "react";
import { ActionBar, SubmitBar, Button, Toast, Loader } from "@egovernments/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import BailEsignModal from "../../components/BailEsignModal";
import SuccessBannerModal from "../../components/SuccessBannerModal";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { useQuery } from "react-query";
import { Urls } from "../../hooks/services/Urls";
import { submissionService } from "../../hooks/services";
import { useLocation } from "react-router-dom/cjs/react-router-dom";
import useOpenApiSearchWitnessDeposition from "../../hooks/submissions/useOpenApiSearchWitnessDeposition";
import useSearchEvidenceService from "../../hooks/submissions/useSearchEvidenceService";
import axiosInstance from "@egovernments/digit-ui-module-core/src/Utils/axiosInstance";

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

const WitnessDepositionSignaturePage = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { artifactNumber, filingNumber } = Digit.Hooks.useQueryParams();
  const mobileNumber = location?.state?.mobileNumber;
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const styles = getStyles();
  const history = useHistory();
  const token = window.localStorage.getItem("token");
  const isAuthorised = location?.state?.isAuthorised;
  const isUserLoggedIn = Boolean(token);
  const userInfo = Digit.UserService.getUser()?.info;
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo?.type]);
  const DocViewerWrapper = Digit?.ComponentRegistryService?.getComponent("DocViewerWrapper");
  const EditSendBackModal = Digit?.ComponentRegistryService?.getComponent("EditSendBackModal");
  const [isEditCaseModal, setEditCaseModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(null);
  const userRoles = Digit.UserService.getUser()?.info?.roles.map((role) => role.code);
  const isCitizen = userRoles?.includes("CITIZEN");

  const [esignMobileNumber, setEsignMobileNumber] = useState("");
  const [loader, setLoader] = useState(false);

  const { data: witnessDepositionOpenData, isLoading: isWitnessDepositionOpenLoading } = useOpenApiSearchWitnessDeposition(
    {
      tenantId,
      artifactNumber: artifactNumber,
      mobileNumber: mobileNumber || esignMobileNumber,
    },
    {},
    `witness-deposition-details-${artifactNumber}`,
    Boolean(artifactNumber && !isUserLoggedIn)
  );

  const { data: witnessDeposition, isLoading: isWitnessDepositionLoading } = useSearchEvidenceService(
    {
      criteria: {
        artifactNumber: artifactNumber,
        filingNumber: filingNumber,
      },
      tenantId,
    },
    {},
    `witness-deposition-details-${artifactNumber}`,
    Boolean(artifactNumber && isUserLoggedIn)
  );

  const witnessDepositionDetails = useMemo(() => {
    return witnessDeposition?.artifacts?.[0] || witnessDepositionOpenData;
  }, [witnessDeposition, witnessDepositionOpenData]);

  const fileStoreId = useMemo(() => {
    return witnessDepositionDetails?.file?.fileStore;
  }, [witnessDepositionDetails]);

  const { data: { file: orderPreviewPdf, fileName: orderPreviewFileName } = {}, isFetching: isLoading } = useQuery({
    queryKey: ["witnessDepositionSignaturePdf", tenantId, artifactNumber, userInfo?.uuid],
    retry: 3,
    cacheTime: 0,
    queryFn: async () => {
      return axiosInstance
        .post(
          `${Urls.openApi.FileFetchByFileStore}`,
          {
            tenantId: "kl",
            fileStoreId: fileStoreId,
            moduleName: "DRISTI",
          },
          { responseType: "blob" }
        )
        .then((res) => ({ file: res.data, fileName: res.headers["content-disposition"]?.split("filename=")[1] }));
    },
    onError: (error) => {
      console.error("Failed to fetch order preview PDF:", error);
    },
    enabled: Boolean(fileStoreId),
  });

  const handleSubmit = () => {
    // TODO : update APi Call
    setShowSignatureModal(true);
  };

  const handleCloseSignatureModal = () => {
    setShowSignatureModal(false);
  };

  const handleEsignProceed = async () => {
    // TODO: Update call with Signed FileStore
    try {
      const fileStoreId = sessionStorage.getItem("fileStoreId");
      const payload = {
        tenantId,
        artifactNumber: artifactNumber,
        partyType: witnessDepositionDetails?.sourceType,
        mobileNumber: mobileNumber || esignMobileNumber,
        fileStoreId: fileStoreId,
      };
      sessionStorage.removeItem("fileStoreId");
      const res = await submissionService.updateOpenWitnessDeposition(payload, { tenantId });
      setShowSignatureModal(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error while updating bail bond:", error);
      setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
    } finally {
      setShowSignatureModal(false);
      sessionStorage.removeItem("isSignSuccess");
    }
  };

  const handleCloseSuccessModal = () => {
    sessionStorage.removeItem("isAuthorised");
    sessionStorage.removeItem("fileStoreId");
    history.replace(`/${window?.contextPath}/citizen/dristi/home`);
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
    if (!isUserLoggedIn && !isAuthorised) {
      history.replace(`/${window?.contextPath}/citizen/dristi/home/evidence-login?tenantId=${tenantId}&artifactNumber=${artifactNumber}`);
    }

    if (!artifactNumber) {
      history.replace(`/${window?.contextPath}/${userType}/home/home-pending-task`);
    }
  }, [artifactNumber, history, isAuthorised, isCitizen, isUserLoggedIn, tenantId, userType]);

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

  const handleMockESign = async () => {
    try {
      setLoader(true);

      const payload = {
        tenantId,
        artifactNumber: artifactNumber,
        partyType: witnessDepositionDetails?.sourceType,
        mobileNumber: isUserLoggedIn ? userInfo?.mobileNumber : mobileNumber,
        fileStoreId: fileStoreId,
      };
      sessionStorage.removeItem("fileStoreId");
      const res = await submissionService.updateOpenWitnessDeposition(payload, { tenantId });
      setShowSignatureModal(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error while updating witness deposition:", error);
      setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
    } finally {
      setLoader(false);
    }
  };

  if (isWitnessDepositionOpenLoading || isWitnessDepositionLoading || isLoading) {
    return <Loader />;
  }

  return (
    <div className="witness-deposition-signature">
      {loader && (
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
      )}
      <div className="header">{`${t("WITNESS_DEPOSITION")} (${witnessDepositionDetails?.tag})`}</div>
      <div className="doc-viewer">
        {!isLoading ? (
          <DocViewerWrapper
            docWidth={"100%"}
            docHeight={"100%"}
            selectedDocs={orderPreviewPdf ? [orderPreviewPdf] : []}
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
          {
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
          }
          {witnessDepositionDetails?.status === "PENDING_E-SIGN" && (
            <SubmitBar
              label={
                <div style={{ boxShadow: "none", display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
                  <span>{t("PROCEED_TO_E_SIGN")}</span>
                </div>
              }
              onSubmit={handleSubmit}
              style={styles.submitButton}
            />
          )}
        </div>
      </ActionBar>

      {showSignatureModal && (
        <BailEsignModal
          t={t}
          handleCloseSignaturePopup={handleCloseSignatureModal}
          handleProceed={handleEsignProceed}
          fileStoreId={fileStoreId}
          signPlaceHolder={"Deponent"}
          mobileNumber={isUserLoggedIn ? userInfo?.mobileNumber : mobileNumber}
          forWitnessDeposition={true}
          handleMockESign={handleMockESign}
          customizedNote={t("WITNESS_DEPOSITION_POPUP_NOTES")}
        />
      )}
      {showSuccessModal && (
        <SuccessBannerModal t={t} handleCloseSuccessModal={handleCloseSuccessModal} message={"SIGNED_WITNESS_DEPOSITION_MESSAGE"} />
      )}
      {showErrorToast && <Toast error={showErrorToast?.error} label={showErrorToast?.label} isDleteBtn={true} onClose={closeToast} />}
    </div>
  );
};

export default WitnessDepositionSignaturePage;
