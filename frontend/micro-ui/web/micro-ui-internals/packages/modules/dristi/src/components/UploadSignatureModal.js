import { CloseSvg } from "@egovernments/digit-ui-react-components";
import React, { useState } from "react";
import SelectCustomDragDrop from "./SelectCustomDragDrop";
import Modal from "./Modal";
import { useToast } from "./Toast/useToast";
import WarningTextComponent from "./WarningTextComponent";
import CustomErrorTooltip from "./CustomErrorTooltip";
import AuthenticatedLink from "../Utils/authenticatedLink";
import { Urls } from "../hooks";

function UploadSignatureModal({
  t,
  setOpenUploadSignatureModal,
  config,
  onSelect,
  formData,
  name,
  showWarning = false,
  warningText,
  onSubmit,
  isDisabled = false,
  cancelLabel = "CS_SUBMIT_SIGNATURE",
  showInfo = false,
  infoHeader = "",
  infoText = "",
  showDownloadText = false,
  fileStoreId,
  fileUploadError,
}) {
  const toast = useToast();
  const [error, setError] = useState({});
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const uri = `${window.location.origin}${Urls.FileFetchById}?tenantId=${tenantId}&fileStoreId=${fileStoreId}`;

  function setValue(value, input) {
    if (Array.isArray(input)) {
      onSelect(config.key, {
        ...formData[config.key],
        ...input.reduce((res, curr) => {
          res[curr] = value[curr];
          return res;
        }, {}),
      });
    } else onSelect(config.key, { ...formData[config.key], [input]: value });
  }

  const CloseBtn = (props) => {
    return (
      <div onClick={props?.onClick} style={{ height: "100%", display: "flex", alignItems: "center", paddingRight: "20px", cursor: "pointer" }}>
        <CloseSvg />
      </div>
    );
  };

  const Heading = (props) => {
    return <h1 className="heading-m">{props.label}</h1>;
  };

  const onCancel = () => {
    setValue(null, name);
    setOpenUploadSignatureModal(false);
  };

  const clearError = (key) => {
    if (!key) return;
    const updatedError = { ...error };
    delete updatedError[key];
    setError(updatedError);
  };

  const setErrors = (key, errorMsg) => {
    if (!key) return;
    setError((prevErrors) => ({ ...prevErrors, [key]: errorMsg }));
  };

  return (
    <Modal
      headerBarEnd={<CloseBtn onClick={onCancel} />}
      actionSaveLabel={t(cancelLabel)}
      actionSaveOnSubmit={onSubmit}
      formId="modal-action"
      isDisabled={!formData?.[config.key] || Boolean(Object.keys(error).length) || isDisabled}
      headerBarMain={<Heading label={t("CS_UPLOAD_SIGNATURE")} />}
      className="upload-signature-modal"
      submitTextClassName="upload-signature-button"
      popupStyles={{ padding: "10px" }}
    >
      {showInfo && (
        <div className="custom-note-main-div" style={{ marginTop: "8px" }}>
          <div className="custom-note-heading-div">
            <CustomErrorTooltip message={t("")} showTooltip={true} />
            <h2>{t(infoHeader)}</h2>
          </div>
          <div className="custom-note-info-div" style={{ display: "flex", alignItems: "center" }}>
            {<p>{t(infoText)}</p>}
          </div>
        </div>
      )}
      {showWarning && <WarningTextComponent t={t} label={warningText} />}
      <div className="upload-signature-modal-main">
        <SelectCustomDragDrop
          config={config}
          t={t}
          onSelect={onSelect}
          formData={formData}
          errors={error}
          setError={setErrors}
          clearErrors={clearError}
        />
        {fileUploadError && (
          <div className="error-message" style={{ color: "red", marginTop: "8px" }}>
            {t(fileUploadError)}
          </div>
        )}
      </div>
      {showDownloadText && (
        <div className="donwload-submission" style={{ display: "flex", alignItems: "center" }}>
          <h2>{t("WANT_TO_UNSIGNED_DOWNLOAD")}</h2>
          <AuthenticatedLink uri={uri} t={t} displayFilename={"CLICK_HERE"} pdf={true} />
        </div>
      )}
    </Modal>
  );
}

export default UploadSignatureModal;
