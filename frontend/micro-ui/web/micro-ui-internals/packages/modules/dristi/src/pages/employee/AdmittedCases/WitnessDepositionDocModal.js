import { CloseSvg } from "@egovernments/digit-ui-components";
import React, { useMemo } from "react";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";

function WitnessDepositionDocModal({ t, docObj, setShowWitnessDepositionDoc }) {
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const DocViewerWrapper = Digit?.ComponentRegistryService?.getComponent("DocViewerWrapper");
  const artifact = docObj?.artifactList;
  const useDownloadCasePdf = Digit?.Hooks?.dristi?.useDownloadCasePdf;
  const { downloadPdf } = useDownloadCasePdf();
  const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
  const userRoles = Digit.UserService.getUser()?.info?.roles.map((role) => role.code);

  const isCitizen = userRoles?.includes("CITIZEN");
  const isJudge = userRoles?.includes("JUDGE_ROLE");
  const isFSO = userRoles?.some((role) => role.code === "FSO_ROLE");
  const isCourtRoomManager = userRoles?.some((role) => role.code === "COURT_ROOM_MANAGER");
  const isBenchClerk = userRoles?.some((role) => role.code === "BENCH_CLERK");
  const isTypist = userRoles?.some((role) => role.code === "TYPIST_ROLE");

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
      <div
        className="show-document-doc-container"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          maxHeight: "60vh",
          maxWidth: "100%",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {docObj?.applicationContent?.fileStoreId ? (
          <DocViewerWrapper
            key={docObj?.applicationContent?.fileStoreId}
            docWidth={"calc(95vw * 62 / 100)"}
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
      </div>
    );
  }, [docObj, t, tenantId]);

  const saveLabel = useMemo(() => {
    if (isBenchClerk || isTypist || isJudge) {
      if (artifact?.status === "PENDING_E-SIGN") {
        return t("EDIT_DETAILS_DEPOSITION");
      } else return null;
    } else if (isCitizen && userInfo?.uuid !== artifact?.sourceId) {
      return null;
    } else return null;
  }, [isBenchClerk, isCitizen, isJudge, isTypist, artifact, t, userInfo?.uuid]);

  const handleSubmit = () => {
    setShowWitnessDepositionDoc({ docObj: null, show: false });
    if(saveLabel === t("EDIT_DETAILS_DEPOSITION")) {
      
    }
  };

  return (
    <Modal
      headerBarMain={<Heading label={`${t("WITNESS_DEPOSITION")} ${t(artifact?.tag)}`} />}
      headerBarEnd={<CloseBtn onClick={() => setShowWitnessDepositionDoc({ docObj: null, show: false })} />}
      actionCancelLabel={t("BACK")}
      actionCancelOnSubmit={() => setShowWitnessDepositionDoc({ docObj: null, show: false })}
      actionSaveLabel={saveLabel}
      hideSubmit={!Boolean(saveLabel)}
      actionSaveOnSubmit={handleSubmit}
      popupStyles={{ minWidth: "880px", width: "80%" }}
    >
      {showDocument}
    
    </Modal>
  );
}

export default WitnessDepositionDocModal;
