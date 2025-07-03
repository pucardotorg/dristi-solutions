import React, { useEffect, useMemo, useState } from "react";
import { ActionBar, SubmitBar, Button } from "@egovernments/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import BailEsignModal from "../../components/BailEsignModal";
import SuccessBannerModal from "../../components/SuccessBannerModal";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";

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
    overflow: "auto",
  },
  docViewer: { marginTop: "24px", border: "1px solid #e0e0e0", display: "flex", overflow: "hidden" },
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

const BailBondSignaturePage = ({ setHideBack }) => {
  const { t } = useTranslation();
  const { filingNumber } = Digit.Hooks.useQueryParams();
  const styles = getStyles();
  const history = useHistory();
  const token = window.localStorage.getItem("token");
  const isAuthorised = window.sessionStorage.getItem("isAuthorised");
  const isUserLoggedIn = Boolean(token);
  const userInfo = Digit.UserService.getUser()?.info;
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo?.type]);
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const DocViewerWrapper = Digit?.ComponentRegistryService?.getComponent("DocViewerWrapper");
  const EditSendBackModal = Digit?.ComponentRegistryService?.getComponent("EditSendBackModal");
  const [isEditCaseModal, setEditCaseModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const dummyLitigants = [
    {
      additionalDetails: {
        fullName: "John Doe",
        uuid: "user-1",
      },
      hasSigned: false,
    },
    {
      additionalDetails: {
        fullName: "Jane Smith",
        uuid: "user-2",
      },
      hasSigned: true,
    },
    {
      additionalDetails: {
        fullName: "Alice Johnson",
        uuid: "user-3",
      },
      hasSigned: true,
    },
  ];

  const handleSubmit = () => {
    // TODO : update APi Call
    setShowSignatureModal(true);
  };

  const handleCloseSignatureModal = () => {
    setShowSignatureModal(false);
  };

  const handleEsignProceed = () => {
    // TODO: Update call with Signed FileStore
    setShowSignatureModal(false);
    setShowSuccessModal(true);
  };

  const handleCloseSuccessModal = () => {
    sessionStorage.removeItem("isAuthorised");
    history.replace(`/${window?.contextPath}/${userType}/home/home-pending-task`);
  };

  const handleEditBailBondSubmit = () => {
    // TODO : Update Api CAll
    sessionStorage.removeItem("isAuthorised");
    if(isUserLoggedIn){
      history.replace(`/${window?.contextPath}/${userType}/submissions/bail-bond?filingNumber=KL-001625-2025`);
    }
    else{
      history.replace(`/${window?.contextPath}/citizen/dristi/home/login`);
    }
  };

  useEffect(()=>{
    setHideBack(true);

    if(!isUserLoggedIn && !isAuthorised){
      history.replace(`/${window?.contextPath}/citizen/dristi/home/bail-bond-login?filingNumber=${filingNumber}`)
    }
  },[])

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
            {true ? (
              <DocViewerWrapper
                docWidth={"100vh"}
                docHeight={"70vh"}
                fileStoreId={"620e3843-1f9c-4abb-92fe-af6bc30f0e6b"}
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
            <SubmitBar
              label={
                <div style={{ boxShadow: "none", display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
                  <span>{t("PROCEED_TO_E_SIGN")}</span>
                </div>
              }
              onSubmit={handleSubmit}
              style={styles.submitButton}
            />
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
      {showSignatureModal && <BailEsignModal t={t} handleCloseSignaturePopup={handleCloseSignatureModal} handleProceed={handleEsignProceed} />}
      {showSuccessModal && <SuccessBannerModal t={t} handleCloseSuccessModal={handleCloseSuccessModal} message={"SIGNED_BAIL_BOND_MESSAGE"} />}
    </React.Fragment>
  );
};

export default BailBondSignaturePage;
