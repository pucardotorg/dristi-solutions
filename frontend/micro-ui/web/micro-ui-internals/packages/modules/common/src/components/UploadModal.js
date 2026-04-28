import { CloseSvg, InfoCard } from "@egovernments/digit-ui-components";
import React, { useCallback, useMemo, useState } from "react";
import { buildUploadModalConfig, SIGNATURE_UPLOAD_CONFIG } from "../utils/fileConfig";

/**
 * Generic upload modal component that replaces all modal-based file upload components.
 *
 * Usage:
 *   <UploadModal
 *     t={t}
 *     name="Signature"
 *     config={{
 *       title: "Upload Signed Complaint",
 *       note: "Ensure everyone has signed",
 *       multiUpload: false,
 *       allowedFormats: ["PDF"],
 *       maxFileSizeMB: 10,
 *     }}
 *     onClose={() => setModalOpen(false)}
 *     onSelect={onSelect}
 *     formData={formData}
 *     onSubmit={onSubmit}
 *   />
 */
function UploadModal({
  t,
  config = {},
  onClose,
  onSelect,
  formData,
  name,
  onSubmit,
  isDisabled = false,
  showWarning = false,
  warningText,
  showInfo = false,
  infoHeader = "",
  infoText = "",
  showDownloadText = false,
  fileUploadError,
  onCustomDownload,
}) {
  const [errors, setErrors] = useState({});

  const mergedConfig = useMemo(() => ({ ...SIGNATURE_UPLOAD_CONFIG, ...config }), [config]);

  const internalConfig = useMemo(() => buildUploadModalConfig(name, mergedConfig), [name, mergedConfig]);

  const Modal = window?.Digit?.ComponentRegistryService?.getComponent("Modal");
  const SelectCustomDragDrop = window?.Digit?.ComponentRegistryService?.getComponent("SelectCustomDragDrop");

  const CloseBtn = useCallback(
    (props) => (
      <div onClick={props?.onClick} style={{ height: "100%", display: "flex", alignItems: "center", paddingRight: "20px", cursor: "pointer" }}>
        <CloseSvg />
      </div>
    ),
    []
  );

  const Heading = useCallback(
    (props) => (
      <div className="evidence-title">
        <h1 className="heading-m">{props.label}</h1>
      </div>
    ),
    []
  );

  const hasFiles = formData?.uploadSignature?.[name]?.length > 0;
  const isSubmitDisabled = isDisabled || !hasFiles || formData?.uploadSignature === undefined || Object.keys(errors).length > 0;

  return (
    <Modal
      headerBarEnd={<CloseBtn onClick={onClose} />}
      headerBarMain={<Heading label={t(mergedConfig.title)} />}
      actionSaveLabel={t(mergedConfig.submitLabel)}
      actionSaveOnSubmit={onSubmit}
      isDisabled={isSubmitDisabled}
      className={"add-signature-modal"}
    >
      <div className="add-signature-main-div" style={{ padding: 0, paddingBottom: "10px" }}>
        {showWarning && (
          <InfoCard
            variant={"default"}
            label={t("PLEASE_NOTE")}
            additionalElements={[<p key="note">{t(warningText)}</p>]}
            inline
            textStyle={{}}
            className={`custom-info-card`}
          />
        )}
        {showInfo && (
          <InfoCard
            variant={"default"}
            label={t(infoHeader)}
            additionalElements={[<p key="note">{t(infoText)}</p>]}
            inline
            textStyle={{}}
            className={`custom-info-card`}
          />
        )}
        {showDownloadText && onCustomDownload && (
          <div className="donwload-submission" style={{ paddingTop: "10px", display: "flex", gap: "5px" }}>
            <h2>{t("WANT_TO_DOWNLOAD")}</h2>
            <div style={{ color: "#007E7E", cursor: "pointer", textDecoration: "underline" }} onClick={onCustomDownload}>
              {t("CLICK_HERE")}
            </div>
          </div>
        )}
        <h2>{t(mergedConfig.headerLabel)}</h2>
        <SelectCustomDragDrop
          onSelect={onSelect}
          t={t}
          config={internalConfig}
          formData={formData}
          errors={errors}
          setError={(k, v) => setErrors((prev) => ({ ...prev, [k]: v }))}
          clearErrors={(k) => {
            setErrors((prev) => {
              const e = { ...prev };
              delete e[k];
              return e;
            });
          }}
        />
        {fileUploadError && <span style={{ color: "red", fontSize: "12px" }}>{t(fileUploadError)}</span>}
      </div>
    </Modal>
  );
}

export default UploadModal;
