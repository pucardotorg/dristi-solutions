import { CloseSvg } from "@egovernments/digit-ui-components";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import React, { useEffect, useState } from "react";
import { Toast } from "@egovernments/digit-ui-react-components";
import CustomChip from "./CustomChip";

const Heading = ({ t, showCustomChip, label, customChipText }) => {
  return (
    <div className="evidence-title">
      <h1 className="heading-m">{t(label)}</h1>
      {showCustomChip && <CustomChip text={t(customChipText) || ""} shade={"grey"} />}
    </div>
  );
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
      display: "grid",
      gridTemplateColumns: "220px 1fr",
      gap: "10px 24px",
      alignItems: "baseline",
    },

    infoRow: {
      display: "contents",
    },

    infoKey: {
      margin: 0,
      fontFamily: "Roboto",
      fontSize: "16px",
      fontWeight: 700,
      lineHeight: "1.4",
      color: "#0a0a0a",
      whiteSpace: "nowrap",
    },

    infoValue: {
      margin: 0,
      fontFamily: "Roboto",
      fontSize: "16px",
      fontWeight: 400,
      lineHeight: "1.4",
      color: "#3d3c3c",
      wordBreak: "normal",
      overflowWrap: "anywhere",
      textAlign: "left",
    },
  };

  return styles[key];
};

const GenericPreviewModal = ({
  t,
  handleBack,
  documents = [],
  config = [],
  header,
  saveLabel,
  cancelLabel,
  onSubmit,
  onCancel,
  isDisabled = false,
  showCustomChip = false,
  customChipText = "Review Pending",
  className = "generic-preview-modal",
}) => {
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

  return (
    <React.Fragment>
      <Modal
        headerBarMain={<Heading t={t} label={header} showCustomChip={showCustomChip} customChipText={customChipText} />}
        headerBarEnd={<CloseBtn onClick={handleBack} />}
        actionCancelLabel={t(cancelLabel)}
        actionCancelOnSubmit={onCancel || handleBack}
        actionSaveLabel={saveLabel ? t(saveLabel) : undefined}
        isDisabled={isDisabled}
        actionSaveOnSubmit={onSubmit}
        className={`review-submission-appl-modal ${className}`}
      >
        <div className="review-submission-appl-body-main">
          <div className="application-details">
            {config && config.length > 0 && (
              <div style={getStyles("container")}>
                {config.map((item, index) => (
                  <div style={getStyles("infoRow")} key={index}>
                    <h3 style={getStyles("infoKey")}>{item?.key}</h3>
                    <h3 style={getStyles("infoValue")}>{item?.value === "CS_NA" ? t(item?.value) : item?.value}</h3>
                  </div>
                ))}
              </div>
            )}
            <div className="application-view">
              {documents && documents?.length > 0 ? (
                documents.map((docs) => (
                  <DocViewerWrapper
                    key={docs?.fileStore}
                    fileStoreId={docs?.fileStore}
                    tenantId={tenantId}
                    docWidth="100%"
                    docHeight={"calc(100vh - 250px)"}
                    showDownloadOption={false}
                    documentName={docs?.name}
                  />
                ))
              ) : (
                <div style={{ padding: "20px", textAlign: "center" }}>
                  <h2>{t("PREVIEW_DOC_NOT_AVAILABLE")}</h2>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
      {showErrorToast && (
        <Toast error={showErrorToast?.error} label={showErrorToast?.label} isDleteBtn={true} onClose={closeToast} style={{ zIndex: "10001" }} />
      )}
    </React.Fragment>
  );
};

export default GenericPreviewModal;
