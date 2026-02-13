import React, { useEffect, useMemo, useState } from "react";
import { ActionBar, SubmitBar, Button, Toast, Loader } from "@egovernments/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import BailEsignModal from "../../components/BailEsignModal";
import SuccessBannerModal from "../../components/SuccessBannerModal";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { useQuery } from "react-query";
import { Urls } from "../../hooks/services/Urls";
import useOpenApiSearchBailBond from "../../hooks/submissions/useOpenApiSearchBailBond";
import { submissionService } from "../../hooks/services";
import { useLocation } from "react-router-dom/cjs/react-router-dom";
import useSearchBailBondService from "../../hooks/submissions/useSearchBailBondService";
import { bailBondWorkflowAction } from "@egovernments/digit-ui-module-dristi/src/Utils/submissionWorkflow";
import axiosInstance from "@egovernments/digit-ui-module-core/src/Utils/axiosInstance";
import { getAllAssociatedPartyUuids } from "@egovernments/digit-ui-module-dristi/src/Utils";
import useSearchCaseService from "@egovernments/digit-ui-module-dristi/src/hooks/dristi/useSearchCaseService";

const BailBondSignaturePage = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { bailbondId, filingNumber, caseId } = Digit.Hooks.useQueryParams();
  const mobileNumber = location?.state?.mobileNumber;
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const [viewportWidth, setViewportWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1920);
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
  const [loader, setLoader] = useState(false);

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
        filingNumber: filingNumber,
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

  const { data: caseData, refetch: refetchCaseData, isLoading: isCaseLoading } = useSearchCaseService(
    {
      criteria: [
        {
          filingNumber: filingNumber,
          caseId: caseId,
        },
      ],
      tenantId,
    },
    {},
    `case-details-${filingNumber}-${caseId}`,
    filingNumber,
    Boolean(filingNumber && isUserLoggedIn)
  );

  const isCreator = useMemo(() => {
    if (!isUserLoggedIn) return false;

    const bailBondAsUser = bailBondDetails?.asUser;
    const allowedParties = getAllAssociatedPartyUuids(caseData?.criteria?.[0]?.responseList?.[0], bailBondAsUser);
    const loggedInUserUuid = userInfo?.uuid;

    return Boolean(loggedInUserUuid && allowedParties?.includes(loggedInUserUuid));
  }, [isUserLoggedIn, userInfo?.uuid, caseData, bailBondDetails?.asUser]);

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
      bailBondDetails.sureties.forEach((surety) => {
        data.push({
          additionalDetails: {
            fullName: surety?.name || "",
            type: `Surety ${surety?.index}`,
          },
          hasSigned: surety?.hasSigned || false,
          mobileNumber: surety?.phoneNumber,
          placeHolder: `Surety${surety?.index} Signature`,
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
      return axiosInstance
        .post(
          `${Urls.openApi.FileFetchByFileStore}`,
          {
            tenantId: "kl",
            fileStoreId: fileStoreId,
            moduleName: "DRISTI",
          },
          {
            responseType: "blob",
          }
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
      sessionStorage.removeItem("isSignSuccess");
    }
  };

  const handleCloseSuccessModal = () => {
    sessionStorage.removeItem("isAuthorised");
    sessionStorage.removeItem("fileStoreId");
    history.replace(`/${window?.contextPath}/citizen/dristi/home`);
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
    } finally {
      setEditCaseModal(false);
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
        bailId: bailbondId,
        mobileNumber: isUserLoggedIn ? userInfo?.mobileNumber : mobileNumber,
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
      setLoader(false);
    }
  };

  if (isBailDataLoading || isBailBondLoading || isCaseLoading) {
    return <Loader />;
  }

  return (
    <React.Fragment>
      <div className="bail-bond-signature-page">
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
                    {litigant?.additionalDetails?.fullName}
                    {` (${litigant?.additionalDetails?.type})`}
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
              {!isLoading ? (
                <DocViewerWrapper
                  docWidth="100%"
                  docHeight="100%"
                  selectedDocs={orderPreviewPdf ? [orderPreviewPdf] : []}
                  tenantId={tenantId}
                  docViewerCardClassName="doc-card"
                  showDownloadOption={false}
                />
              ) : (
                <h2>{t("PREVIEW_DOC_NOT_AVAILABLE")}</h2>
              )}
            </div>
          </div>
          <ActionBar className="action-bar-buttons">
            <div className="action-bar">
              {isCreator && <Button label={t("EDIT")} variation="secondary" onButtonClick={() => setEditCaseModal(true)} className="edit-btn" />}

              {signingUserDetails?.mobileNumber && !signingUserDetails?.hasSigned && (
                <SubmitBar label={<span>{t("PROCEED_TO_E_SIGN")}</span>} onSubmit={handleSubmit} className="submit-btn" />
              )}
            </div>
          </ActionBar>
        </div>
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
          handleMockESign={handleMockESign}
        />
      )}
      {showSuccessModal && <SuccessBannerModal t={t} handleCloseSuccessModal={handleCloseSuccessModal} message={"SIGNED_BAIL_BOND_MESSAGE"} />}
      {showErrorToast && <Toast error={showErrorToast?.error} label={showErrorToast?.label} isDleteBtn={true} onClose={closeToast} />}
    </React.Fragment>
  );
};

export default BailBondSignaturePage;
