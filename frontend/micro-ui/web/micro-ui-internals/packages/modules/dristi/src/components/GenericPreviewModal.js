import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import PropTypes from "prop-types";
import React from "react";
import CustomChip from "./CustomChip";
import { CloseBtn } from "./ModalComponents";

const previewConfigRowKey = (item) => {
  const k = item?.key == null ? "" : String(item.key);
  const v = typeof item?.value === "string" || typeof item?.value === "number" ? String(item.value) : JSON.stringify(item?.value ?? "");
  return k ? `${k}::${v}` : `preview-row-${v}`;
};

const Heading = ({ t, showCustomChip, label, customChipText }) => {
  return (
    <div className="evidence-title">
      <h1 className="heading-m">{t(label)}</h1>
      {showCustomChip && <CustomChip text={t(customChipText) || ""} shade={"grey"} />}
    </div>
  );
};
Heading.propTypes = {
  customChipText: PropTypes.string,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  showCustomChip: PropTypes.bool,
  t: PropTypes.func.isRequired,
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

  return (
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
              {config.map((item) => (
                <div style={getStyles("infoRow")} key={previewConfigRowKey(item)}>
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
  );
};

GenericPreviewModal.propTypes = {
  cancelLabel: PropTypes.string,
  className: PropTypes.string,
  config: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.node,
      value: PropTypes.node,
    })
  ),
  customChipText: PropTypes.string,
  documents: PropTypes.array,
  handleBack: PropTypes.func.isRequired,
  header: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  isDisabled: PropTypes.bool,
  onCancel: PropTypes.func,
  onSubmit: PropTypes.func,
  saveLabel: PropTypes.string,
  showCustomChip: PropTypes.bool,
  t: PropTypes.func.isRequired,
};

export default GenericPreviewModal;
