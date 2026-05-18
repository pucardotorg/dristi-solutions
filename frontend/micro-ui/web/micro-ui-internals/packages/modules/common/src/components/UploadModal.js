import { CloseSvg, InfoCard } from "@egovernments/digit-ui-components";
import React, { useRef, useCallback, useMemo, useState } from "react";
import { buildUploadModalConfig, SIGNATURE_UPLOAD_CONFIG } from "../utils/fileConfig";
// import AuthenticatedLink from "@egovernments/digit-ui-module-dristi/src/Utils/authenticatedLink";
// import { Urls } from "@egovernments/digit-ui-module-dristi/src/hooks";
import axiosInstance from "@egovernments/digit-ui-module-core/src/Utils/axiosInstance";
import { Loader } from "@egovernments/digit-ui-react-components";

const AuthenticatedLink = ({ t, uri, displayFilename = false, pdf = false }) => {
  const handleClick = (e) => {
    e.preventDefault();

    const authToken = localStorage.getItem("token");
    axiosInstance
      .get(uri, {
        headers: {
          "auth-token": `${authToken}`,
        },
        responseType: "blob",
      })
      .then((response) => {
        if (response.status === 200) {
          const blob = new Blob([response.data], { type: pdf ? "application/pdf" : "application/octet-stream" });
          const mimeType = response.data.type || "application/octet-stream";
          const extension = mimeType.includes("/") ? mimeType.split("/")[1] : "bin";
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = `downloadedFile.${extension}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        } else {
          console.error("Failed to fetch the PDF:", response.statusText);
        }
      })
      .catch((error) => {
        console.error("Error during the API request:", error);
      });
  };

  return (
    <span
      onClick={handleClick}
      style={{
        display: "flex",
        color: "#007e7e",
        // width: 250,
        maxWidth: "250px",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        cursor: "pointer",
        textDecoration: "underline",
        marginLeft: "5px",
      }}
    >
      {displayFilename ? t(displayFilename) : t("CS_CLICK_TO_DOWNLOAD")}
    </span>
  );
};

/**
 * Generic upload modal component that replaces all modal-based file upload components.
 *
 * Usage:
 *   <UploadModal
 *     t={t}
 *     name="Signature"
 *     config={{
 *       multiUpload: false,
 *       allowedFormats: ["PDF"],
 *       maxFileSizeMB: 10,
 *     }}
 *     onClose={() => setModalOpen(false)}
 *     onSelect={onSelect}
 *     formData={formData}
 *     onSubmit={onSubmit}
 * title={title}
 *     submitLabel={submitLabel}
 *     infoHeader={infoHeader}
 * infoText={infoText}
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
  warningText = null,
  warningHeader = "PLEASE_NOTE",
  infoHeader = "CS_PLEASE_NOTE",
  infoText = null,
  showDownloadText = false,
  onCustomDownload,
  title = "CS_UPLOAD_SIGNATURE",
  submitLabel = "CS_SUBMIT_SIGNATURE",
  uploadGuidelines = null,
  fileStoreId,
  isParentLoading = false,
}) {
  const [errors, setErrors] = useState({});
  const combineAndSelectRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();

  const mergedConfig = useMemo(() => ({ ...SIGNATURE_UPLOAD_CONFIG, ...config }), [config]);

  const internalConfig = useMemo(() => buildUploadModalConfig(name, mergedConfig, uploadGuidelines), [name, mergedConfig, uploadGuidelines]);

  const Modal = window?.Digit?.ComponentRegistryService?.getComponent("Modal");
  const SelectCustomDragDrop = window?.Digit?.ComponentRegistryService?.getComponent("SelectCustomDragDrop");
  const uri = fileStoreId ? `${window.location.origin}/filestore/v1/files/id?tenantId=${tenantId}&fileStoreId=${fileStoreId}` : null;

  const CloseBtn = useCallback(
    (props) => (
      <div onClick={props?.onClick} style={{ height: "100%", display: "flex", alignItems: "center", paddingRight: "20px", cursor: "pointer" }}>
        <CloseSvg />
      </div>
    ),
    []
  );

  const Heading = (props) => {
    return (
      <h1 className={props?.className || "heading-m"} style={props?.style}>
        {props.label}
      </h1>
    );
  };

  const handleCancel = () => {
    onSelect(internalConfig.key, { ...formData[internalConfig.key], [name]: null });
    onClose();
  };

  const handleSubmit = async () => {
    let combineResult = null;
    if (combineAndSelectRef.current) {
      try {
        setIsLoading(true);
        combineResult = await combineAndSelectRef.current();
      } catch (err) {
        console.error("Error combining files:", err);
        setIsLoading(false);
        return;
      } finally {
        setIsLoading(false);
      }
    }
    onSubmit(combineResult);
  };

  const isMultipleUpload = internalConfig?.populators?.inputs?.[0]?.isMultipleUpload;
  const additionalText = isMultipleUpload ? "UPLOAD_MODAL_MULTIPLE_DOCS_NOTE" : null;

  const hasFiles = formData?.uploadSignature?.[name]?.length > 0;
  const isSubmitDisabled =
    isLoading || isParentLoading || isDisabled || !hasFiles || formData?.uploadSignature === undefined || Object.keys(errors).length > 0;

  return (
    <Modal
      headerBarEnd={<CloseBtn onClick={handleCancel} />}
      headerBarMain={<Heading label={t(title)} />}
      actionSaveLabel={t(submitLabel)}
      actionSaveOnSubmit={handleSubmit}
      isDisabled={isSubmitDisabled}
      // className={"add-signature-modal"}
      className="upload-signature-modal"
      submitTextClassName="upload-signature-button"
    >
      <div className="add-signature-main-div" style={{ padding: "0 10px 10px 10px" }}>
        {(isLoading || isParentLoading) && (
          <div
            style={{
              width: "100vw",
              height: "100vh",
              zIndex: "9999999999999",
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
        {warningText && (
          <InfoCard
            variant={"default"}
            label={t(warningHeader || "")}
            additionalElements={[<p key="note">{t(warningText)}</p>]}
            inline
            textStyle={{}}
            className={`custom-info-card`}
          />
        )}
        {infoText && (
          <InfoCard
            variant={"default"}
            label={t(infoHeader || "")}
            additionalElements={[<p key="note">{t(infoText)}</p>]}
            inline
            textStyle={{}}
            className={`custom-info-card`}
          />
        )}
        {additionalText && (
          <InfoCard
            variant={"default"}
            label={t(infoHeader || "")}
            additionalElements={[<p key="note">{t(additionalText)}</p>]}
            inline
            textStyle={{}}
            className={`custom-info-card`}
          />
        )}
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
          combineAndSelectRef={combineAndSelectRef}
        />
      </div>
      {showDownloadText && fileStoreId && (
        <div className="donwload-submission" style={{ display: "flex", alignItems: "center" }}>
          <h2>{t("WANT_TO_UNSIGNED_DOWNLOAD")}</h2>
          {onCustomDownload ? (
            <span
              onClick={onCustomDownload}
              style={{
                display: "flex",
                color: "#007e7e",
                maxWidth: "250px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                cursor: "pointer",
                textDecoration: "underline",
                marginLeft: "5px",
              }}
            >
              {t("CLICK_HERE")}
            </span>
          ) : (
            <AuthenticatedLink uri={uri} t={t} displayFilename={"CLICK_HERE"} pdf={true} />
          )}
        </div>
      )}
    </Modal>
  );
}

export default UploadModal;
