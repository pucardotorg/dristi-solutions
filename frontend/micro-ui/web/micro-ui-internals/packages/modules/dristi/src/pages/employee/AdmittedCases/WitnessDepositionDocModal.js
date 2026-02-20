import { CloseSvg } from "@egovernments/digit-ui-components";
import { Toast, Loader } from "@egovernments/digit-ui-react-components";

import React, { useEffect, useMemo, useState } from "react";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import { DRISTIService } from "../../../services";

function WitnessDepositionDocModal({
  t,
  docObj,
  setShowWitnessDepositionDoc,
  showWitnessModal,
  setShowWitnessModal,
  setEditWitnessDepositionArtifact,
  editWitnessDepositionArtifact,
}) {
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const DocViewerWrapper = Digit?.ComponentRegistryService?.getComponent("DocViewerWrapper");
  const artifact = docObj?.artifactList;
  const useDownloadCasePdf = Digit?.Hooks?.dristi?.useDownloadCasePdf;
  const { downloadPdf } = useDownloadCasePdf();
  const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
  const userRoles = Digit.UserService.getUser()?.info?.roles.map((role) => role.code);
  const [showErrorToast, setShowErrorToast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const isCitizen = useMemo(() => userRoles?.includes("CITIZEN"), [userRoles]);
  const isEmployee = useMemo(() => userRoles?.includes("EMPLOYEE"), [userRoles]);

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

  const showDocument = useMemo(() => {
    return (
      <React.Fragment>
        {docObj?.applicationContent?.fileStoreId ? (
          <DocViewerWrapper
            key={docObj?.applicationContent?.fileStoreId}
            docWidth={"75vw"}
            docHeight={"unset"}
            fileStoreId={docObj?.applicationContent?.fileStoreId}
            tenantId={tenantId}
            displayFilename={docObj?.applicationContent?.additionalDetails?.name}
            showDownloadOption={false}
            documentName={docObj?.applicationContent?.additionalDetails?.name}
            isLocalizationRequired={false}
          />
        ) : (
          <h2>{t("PREVIEW_DOC_NOT_AVAILABLE")}</h2>
        )}
      </React.Fragment>
    );
  }, [docObj, t, tenantId]);

  const saveLabel = useMemo(() => {
    if (isEmployee) {
      if (artifact?.status === "PENDING_E-SIGN") {
        return t("EDIT_DETAILS_DEPOSITION");
      } else return null;
    } else if (isCitizen && userInfo?.uuid !== artifact?.sourceId) {
      return null;
    } else return null;
  }, [isCitizen, artifact, t, userInfo?.uuid, isEmployee]);

  const handleSubmit = async () => {
    if (saveLabel === t("EDIT_DETAILS_DEPOSITION")) {
      try {
        setIsLoading(true);
        const updateEvidenceReqBody = {
          artifact: {
            ...artifact,
            workflow: {
              ...artifact?.workflow,
              action: "EDIT",
            },
          },
        };
        const updatedEvidence = await DRISTIService.updateEvidence(updateEvidenceReqBody);
        if (updatedEvidence?.artifact) {
          setShowWitnessModal(true);
          setEditWitnessDepositionArtifact(updatedEvidence?.artifact?.artifactNumber);
          setShowWitnessDepositionDoc({ docObj: null, show: false });
        }
      } catch (error) {
        console.error("Error updating witness:", error);
        setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div>
      <Modal
        headerBarMain={<Heading label={`${t("WITNESS_DEPOSITION")} ${t(artifact?.tag)}`} />}
        headerBarEnd={<CloseBtn onClick={() => setShowWitnessDepositionDoc({ docObj: null, show: false })} />}
        actionCancelLabel={t("BACK")}
        actionCancelOnSubmit={() => setShowWitnessDepositionDoc({ docObj: null, show: false })}
        actionSaveLabel={saveLabel}
        hideSubmit={!Boolean(saveLabel)}
        actionSaveOnSubmit={handleSubmit}
        popupStyles={{ width: "70vw", minHeight: "75vh", maxHeight: "90vh" }}
        headerBarMainStyle={{ minHeight: "50px" }}
        className={"review-submission-appl-modal bail-bond"}
        style={{ backgroundColor: "#007e7e !important" }}
        textStyle={{ color: "#fff", fontSize: "1.2rem", fontWeight: "600", margin: "0px" }}
        formId="modal-action"
      >
        <div className="review-submission-appl-body-main">
          <div className="application-details">
            <div className="application-view doc-preview">{showDocument}</div>
          </div>
        </div>
        {isLoading && (
          <div
            style={{
              width: "100vw",
              height: "100vh",
              zIndex: "9999",
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
        {showErrorToast && <Toast error={showErrorToast?.error} label={showErrorToast?.label} isDleteBtn={true} onClose={closeToast} />}
      </Modal>
    </div>
  );
}

export default WitnessDepositionDocModal;
