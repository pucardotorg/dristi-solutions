import React, { useEffect, useMemo, useState } from "react";
import { ActionBar, SubmitBar, Button, Toast, Loader } from "@egovernments/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import SuccessBannerModal from "../../../../../submissions/src/components/SuccessBannerModal";

const MediationFormSignaturePage = () => {
  const { t } = useTranslation();
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const history = useHistory();
  const token = window.localStorage.getItem("token");
  const isUserLoggedIn = Boolean(token);
  const userInfo = Digit.UserService.getUser()?.info;
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo?.type]);
  const DocViewerWrapper = Digit?.ComponentRegistryService?.getComponent("DocViewerWrapper");
  const EditSendBackModal = Digit?.ComponentRegistryService?.getComponent("EditSendBackModal");
  const [isEditCaseModal, setEditCaseModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(null);
  const [loader] = useState(false);

  // Dummy data for signatories
  const dummyLitigants = [
    {
      additionalDetails: {
        fullName: "Accused 1",
        type: "Accused",
      },
      hasSigned: false,
    },
    {
      additionalDetails: {
        fullName: "Complainant 1",
        type: "Complainant",
      },
      hasSigned: false,
    },
    {
      additionalDetails: {
        fullName: "Accused 2",
        type: "Accused",
      },
      hasSigned: false,
    },
    {
      additionalDetails: {
        fullName: "Complainant 2",
        type: "Complainant",
      },
      hasSigned: false,
    },
  ];

  const handleSubmit = () => {
    // TODO : update APi Call
    setShowSignatureModal(true);
  };

  const handleCloseSuccessModal = () => {
    sessionStorage.removeItem("isAuthorised");
    sessionStorage.removeItem("fileStoreId");
    history.replace(`/${window?.contextPath}/citizen/dristi/home`);
  };

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
      <div className="mediation-form-signature">
        {loader && (
          <div className="submit-loader">
            <Loader />
          </div>
        )}
        <div className="header">{t("BAIL_BOND")}</div>
        <div className="container">
          <div className="left-panel">
            <div className="details-section">
              <div className="details">
                <div>{t("E-sign Status")}</div>
              </div>
              <div>
                {dummyLitigants?.map((litigant, index) => (
                  <div key={index} className="litigant-details">
                    <span>
                      {index + 1}. {litigant?.additionalDetails?.fullName}
                    </span>
                    {litigant?.hasSigned ? (
                      <span className="signed-label">{t("SIGNED")}</span>
                    ) : (
                      <span className="unsigned-label">{t("PENDING")}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="right-panel">
            <div className="doc-viewer">
              <DocViewerWrapper
                docWidth="100%"
                docHeight="100%"
                fileStoreId={"5148cbc0-09bd-498c-bafd-7e849a56dd7e"}
                tenantId={tenantId}
                docViewerCardClassName="doc-card"
                showDownloadOption={false}
              />
            </div>
          </div>
          <ActionBar className="action-bar">
            <Button
              label={t("CS_COMMON_BACK")}
              variation={"secondary"}
              style={{ boxShadow: "none", backgroundColor: "#fff", padding: "8px 24px", width: "fit-content", border: "none" }}
              textStyles={{
                fontFamily: "Roboto",
                fontSize: "16px",
                fontWeight: 700,
                lineHeight: "18.75px",
                textAlign: "center",
                color: "#007E7E",
              }} // onButtonClick={handleGoBack}
            />
            <Button
              label={t("SAVE_AS_DRAFT")}
              variation={"secondary"}
              style={{ boxShadow: "none", backgroundColor: "#fff", padding: "8px 24px", width: "fit-content" }}
              textStyles={{
                fontFamily: "Roboto",
                fontSize: "16px",
                fontWeight: 700,
                lineHeight: "18.75px",
                textAlign: "center",
                color: "#007E7E",
              }}
              onButtonClick={async () => {
                try {
                  // await handleSaveDraft(currentOrder);
                  setShowErrorToast({ label: t("DRAFT_SAVED_SUCCESSFULLY"), error: false });
                } catch (error) {
                  setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
                }
              }}
            />
            <Button
              label={t("PREVIEW_ORDER_PDF")}
              variation={"primary"}
              style={{ boxShadow: "none", backgroundColor: "#007E7E", padding: "8px 24px", width: "fit-content" }}
              textStyles={{
                fontFamily: "Roboto",
                fontSize: "16px",
                fontWeight: 700,
                lineHeight: "18.75px",
                textAlign: "center",
                color: "white",
              }}
              onButtonClick={async () => {
                try {
                  // await handleSaveDraft(currentOrder);
                  setShowErrorToast({ label: t("DRAFT_SAVED_SUCCESSFULLY"), error: false });
                } catch (error) {
                  setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
                }
              }}
            />
          </ActionBar>
        </div>
      </div>
      {/* {isEditCaseModal && (
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
          handleMockESign={handleMockESign}
        />
      )} */}
      {showSuccessModal && <SuccessBannerModal t={t} handleCloseSuccessModal={handleCloseSuccessModal} message={"SIGNED_BAIL_BOND_MESSAGE"} />}
      {showErrorToast && <Toast error={showErrorToast?.error} label={showErrorToast?.label} isDleteBtn={true} onClose={closeToast} />}
    </React.Fragment>
  );
};

export default MediationFormSignaturePage;
