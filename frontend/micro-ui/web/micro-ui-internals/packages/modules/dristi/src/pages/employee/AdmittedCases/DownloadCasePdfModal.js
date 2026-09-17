import React from "react";
import Modal from "../../../../components/Modal";
import { CloseSvg, Loader } from "@egovernments/digit-ui-react-components";

const Heading = (props) => <h1 className="heading-m">{props.label}</h1>;

const CloseBtn = (props) => (
  <div
    onClick={props?.onClick}
    style={{
      height: "100%",
      display: "flex",
      alignItems: "center",
      paddingRight: "20px",
      cursor: "pointer",
    }}
  >
    <CloseSvg />
  </div>
);

const DownloadCasePdfModal = ({ t, showDownloadCasePdfModal, setShowDownloadCasePdfModal, downloadCasePdfLoading, casePdfError, casePdfFileStoreId, handleDownloadClick }) => {
  if (!showDownloadCasePdfModal) return null;

  return (
    <Modal
      headerBarMain={<Heading label={t("DOWNLOAD_CASE_FILE")} />}
      headerBarEnd={
        <CloseBtn
          onClick={() => {
            if (!downloadCasePdfLoading) {
              setShowDownloadCasePdfModal(false);
            }
          }}
        />
      }
      actionCancelLabel={t("CS_COMMON_CLOSE")}
      actionCancelOnSubmit={() => {
        if (!downloadCasePdfLoading) {
          setShowDownloadCasePdfModal(false);
        }
      }}
      actionSaveLabel={t("DOWNLOAD")}
      actionSaveOnSubmit={handleDownloadClick}
      style={{ height: "40px" }}
      popupStyles={{ width: "35%" }}
      className={"review-order-modal"}
      isDisabled={downloadCasePdfLoading || casePdfError || !casePdfFileStoreId}
      isBackButtonDisabled={downloadCasePdfLoading}
      children={
        downloadCasePdfLoading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "24px" }}>
            <Loader />
            <p style={{ margin: 0, textAlign: "center" }}>{t("CASE_BUNDLE_GENERATION_IN_PROGRESS")}</p>
          </div>
        ) : casePdfError ? (
          <div style={{ padding: "24px" }}>
            <p style={{ margin: 0, color: "#D4351C" }}>{casePdfError}</p>
          </div>
        ) : (
          <div style={{ padding: "24px" }}>
            <p style={{ margin: 0 }}>{t("CASE_BUNDLE_IS_READY")}</p>
          </div>
        )
      }
    />
  );
};

export default DownloadCasePdfModal;
