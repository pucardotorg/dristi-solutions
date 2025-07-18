import React, { useEffect, useMemo, useState } from "react";
import { ActionBar, SubmitBar, Button, Toast, Loader } from "@egovernments/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import BailEsignModal from "../../components/BailEsignModal";
import SuccessBannerModal from "../../components/SuccessBannerModal";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { useQuery } from "react-query";
import Axios from "axios";
import { Urls } from "../../hooks/services/Urls";
import useOpenApiSearchBailBond from "../../hooks/submissions/useOpenApiSearchBailBond";
import { submissionService } from "../../hooks/services";
import { useLocation } from "react-router-dom/cjs/react-router-dom";
import useSearchBailBondService from "../../hooks/submissions/useSearchBailBondService";
import { bailBondWorkflowAction } from "@egovernments/digit-ui-module-dristi/src/Utils/submissionWorkflow";

const getStyles = () => ({
  header: { fontSize: "26px", padding: "12px 40px", fontWeight: 700, borderBottom: "1px solid #E8E8E8" },
  container: {
    display: "flex",
    flexDirection: "row",
    marginBottom: "50px",
    paddingRight: "24px",
    paddingLeft: "24px",
    height: "100%",
  },
  details: { color: "#0A0A0A", fontWeight: 700, fontSize: "18px", paddingBottom: "22px" },
  detailsSection: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  leftPanel: {
    width: "350px",
    paddingTop: "30px",
    paddingBottom: "16px",
    paddingLeft: "16px",
    borderRight: "1px solid #E8E8E8",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  rightPanel: {
    flex: 1,
    padding: "24px",
    height: "100%",
    boxSizing: "border-box",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  docViewer: {
    flex: 1,
    marginTop: "24px",
    border: "1px solid #e0e0e0",
    overflow: "auto",
    borderRadius: "8px",
    background: "#fafafa",
  },
  litigantDetails: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #E8E8E8",
    color: "#77787B",
    paddingTop: "8px",
    paddingBottom: "20px",
    paddingRight: "16px",
    fontWeight: 700,
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

const BailBondSignaturePage = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { bailbondId } = Digit.Hooks.useQueryParams();
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
  const [esignMobileNumber, setEsignMobileNumber] = useState("");

  const { data: bailBondOpenData, isLoading: isBailBondLoading } = useOpenApiSearchBailBond(
    {
      tenantId,
      bailId: bailbondId,
      mobileNumber: mobileNumber || esignMobileNumber,
    },
    {},
    `bail-bond-details-${bailbondId}`,
    Boolean(bailbondId && !isUserLoggedIn)
  );

  const { data: bailBond, isLoading: isBailDataLoading } = useSearchBailBondService(
    {
      criteria: {
        bailId: bailbondId,
      },
      tenantId,
    },
    {},
    `bail-bond-details-${bailbondId}`,
    Boolean(bailbondId && isUserLoggedIn)
  );

  const bailBondDetails = useMemo(() => {
    return bailBond?.bails?.[0] || bailBondOpenData;
  }, [bailBond, bailBondOpenData]);

  const isCreator = useMemo(() => {
    if (!isUserLoggedIn) return false;

    const createdByUuid = bailBondDetails?.auditDetails?.createdBy;
    const loggedInUserUuid = userInfo?.uuid;

    return Boolean(createdByUuid && loggedInUserUuid && createdByUuid === loggedInUserUuid);
  }, [isUserLoggedIn, bailBondDetails?.auditDetails?.createdBy, userInfo?.uuid]);

  const fileStoreId = useMemo(() => {
    return bailBondDetails?.documents?.[0]?.fileStore;
  }, [bailBondDetails]);

  const dummyLitigants = useMemo(() => {
    const data = [];

    const litigant = {
      additionalDetails: {
        fullName: bailBondDetails?.litigantName || "",
        type: "Accused",
      },
      hasSigned: bailBondDetails?.litigantSigned || false,
      mobileNumber: bailBondDetails?.litigantMobileNumber || bailBondDetails?.phoneNumber,
      placeHolder: "Accused Signature",
    };

    if (Array.isArray(bailBondDetails?.sureties)) {
      bailBondDetails.sureties.forEach((surety, index) => {
        data.push({
          additionalDetails: {
            fullName: surety?.name || "",
            type: `Surety ${index + 1}`,
          },
          hasSigned: surety?.hasSigned || false,
          mobileNumber: surety?.mobileNumber,
          placeHolder: `Surety${index + 1} Signature`,
        });
      });
    }

    return [litigant, ...data];
  }, [bailBondDetails]);

  const signingUserDetails = useMemo(() => {
    let matchedMobileNumber = "";
    if (isUserLoggedIn) {
      matchedMobileNumber = userInfo?.mobileNumber;
    } else {
      matchedMobileNumber = mobileNumber;
    }

    const matched = dummyLitigants?.find((person) => person?.mobileNumber === matchedMobileNumber);

    return {
      mobileNumber: matched?.mobileNumber,
      placeHolder: matched?.placeHolder || "",
      hasSigned: matched?.hasSigned,
    };
  }, [dummyLitigants, isUserLoggedIn, mobileNumber, userInfo?.mobileNumber]);

  const { data: { file: orderPreviewPdf, fileName: orderPreviewFileName } = {}, isFetching: isLoading } = useQuery({
    queryKey: ["bailBondSignaturePdf", tenantId, bailbondId, userInfo?.uuid],
    retry: 3,
    cacheTime: 0,
    queryFn: async () => {
      return Axios({
        method: "POST",
        url: `${Urls.openApi.FileFetchByFileStore}`,
        data: {
          tenantId: "kl",
          fileStoreId: fileStoreId,
          moduleName: "DRISTI",
        },
        responseType: "blob",
      }).then((res) => ({ file: res.data, fileName: res.headers["content-disposition"]?.split("filename=")[1] }));
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
        bailId: bailbondId,
        mobileNumber: mobileNumber || esignMobileNumber,
        fileStoreId: fileStoreId,
      };
      sessionStorage.removeItem("fileStoreId");
      const res = await submissionService.updateOpenBailBond(payload, { tenantId });
      setShowSignatureModal(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error while updating bail bond:", error);
      setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
    } finally {
      setShowSignatureModal(false);
    }
  };

  const handleCloseSuccessModal = () => {
    sessionStorage.removeItem("isAuthorised");
    sessionStorage.removeItem("fileStoreId");
    history.replace(`/${window?.contextPath}/${userType}/home/home-pending-task`);
  };

  const handleEditBailBondSubmit = async () => {
    // TODO : Update Api CAll
    try {
      sessionStorage.removeItem("isAuthorised");
      if (isUserLoggedIn) {
        const payload = {
          bail: {
            ...bailBondDetails,
            workflow: { ...bailBondDetails.workflow, action: bailBondWorkflowAction.EDIT, documents: [{}] },
          },
        };
        const res = await submissionService.updateBailBond(payload, { tenantId });
        history.replace(
          `/${window?.contextPath}/${userType}/submissions/bail-bond?filingNumber=${bailBondDetails?.filingNumber}&bailBondId=${bailbondId}`
        );
      } else {
        history.replace(`/${window?.contextPath}/citizen/dristi/home/login`);
      }
    } catch (error) {
      console.error("Error while updating bail bond:", error);
      setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
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
    if (!isUserLoggedIn && !isAuthorised) {
      history.replace(`/${window?.contextPath}/citizen/dristi/home/bail-bond-login?tenantId=${tenantId}&bailbondId=${bailbondId}`);
    }

    if (!bailbondId) {
      history.replace(`/${window?.contextPath}/${userType}/home/home-pending-task`);
    }
  }, []);

  const closeToast = () => {
    setShowErrorToast(null);
  };

  if (isBailDataLoading || isBailBondLoading) {
    return <Loader />;
  }

  return (
    <React.Fragment>
      <div style={styles.header}>{t("BAIL_BOND")}</div>
      <div style={styles.container}>
        <div style={styles.leftPanel}>
          <div style={styles.detailsSection}>
            <div style={styles.details}>
              <div>{t("E-sign Status")}</div>
            </div>
            <div>
              {dummyLitigants?.map((litigant, index) => (
                <div key={index} style={{ ...styles.litigantDetails, marginTop: "5px", fontSize: "16px" }}>
                  {litigant?.additionalDetails?.fullName}
                  {` (${litigant?.additionalDetails?.type})`}
                  {litigant?.hasSigned ? (
                    <span style={{ ...styles.signedLabel, alignItems: "right" }}>{t("SIGNED")}</span>
                  ) : (
                    <span style={{ ...styles.unSignedLabel, alignItems: "right" }}>{t("PENDING")}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={styles.rightPanel}>
          <div style={styles.docViewer}>
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
        </div>
        <ActionBar>
          <div style={styles.actionBar}>
            {isCreator && (
              <Button
                label={t("EDIT")}
                variation={"secondary"}
                onButtonClick={() => {
                  setEditCaseModal(true);
                }}
                style={{ backgroundColor: "#fff", padding: "10px", width: "90px", marginRight: "20px" }}
                textStyles={{
                  fontFamily: "Roboto",
                  fontSize: "16px",
                  fontWeight: 700,
                  lineHeight: "18.75px",
                  textAlign: "center",
                  color: "#007E7E",
                }}
              />
            )}
            {signingUserDetails?.mobileNumber && !signingUserDetails?.hasSigned && (
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
      </div>
      {isEditCaseModal && (
        <EditSendBackModal
          t={t}
          handleCancel={() => setEditCaseModal(false)}
          handleSubmit={handleEditBailBondSubmit}
          headerLabel={"CONFIRM_EDIT_BAIL_BOND"}
          saveLabel={"CONFIRM_BAIL_BOND"}
          cancelLabel={"CANCEL_EDIT"}
          contentText={"INVALIDATE_ALL_SIGN"}
        />
      )}
      {showSignatureModal && (
        <BailEsignModal
          t={t}
          handleCloseSignaturePopup={handleCloseSignatureModal}
          handleProceed={handleEsignProceed}
          fileStoreId={fileStoreId}
          signPlaceHolder={signingUserDetails?.placeHolder}
          mobileNumber={signingUserDetails?.mobileNumber}
        />
      )}
      {showSuccessModal && <SuccessBannerModal t={t} handleCloseSuccessModal={handleCloseSuccessModal} message={"SIGNED_BAIL_BOND_MESSAGE"} />}
      {showErrorToast && <Toast error={showErrorToast?.error} label={showErrorToast?.label} isDleteBtn={true} onClose={closeToast} />}
    </React.Fragment>
  );
};

export default BailBondSignaturePage;
