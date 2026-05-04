import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import { getAuthorizedUuid } from "@egovernments/digit-ui-module-dristi/src/Utils";
import React, { useMemo, useState } from "react";
import { CloseBtn, Heading } from "@egovernments/digit-ui-module-dristi/src/components/ModalComponents";
import CustomToast from "@egovernments/digit-ui-module-dristi/src/components/CustomToast";
import { SIGNATURE_UPLOAD_CONFIG, UploadModal } from "@egovernments/digit-ui-module-common";
const GenericUploadSignatureModal = ({
  t,
  handleCloseSignatureModal,
  handleDownload,
  handleESign,
  handleSubmit,
  setShowUploadSignature,
  showUploadSignature,
  setLoader,
  loader,
  fileStoreId,
  title = "SELECT_MODE_SIGNING",
  infoText = "BAIL_SIGN_INFO",
  customUploadDocuments,
  onCustomDownload,
}) => {
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const { uploadDocuments: defaultUploadDocuments } = Digit.Hooks.orders.useDocumentUpload();
  const uploadDocuments = customUploadDocuments || defaultUploadDocuments;
  const [formData, setFormData] = useState({});
  const [fileUploadError, setFileUploadError] = useState(null);
  const [showToast, setShowToast] = useState(null);
  const name = "Signature";
  const userUuid = Digit.UserService.getUser()?.info?.uuid;
  const authorizedUuid = getAuthorizedUuid(userUuid);

  const onSelect = (key, value) => {
    if (value?.[name] === null) {
      setFormData({});
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [key]: value,
      }));
    }
    setFileUploadError(null);
  };

  const onSubmit = async (combineResult) => {
    if (formData?.uploadSignature?.Signature?.length > 0) {
      try {
        setLoader(true);
        const filesToUpload = combineResult?.combinedFiles || formData?.uploadSignature?.Signature;
        const uploadResult = await uploadDocuments(filesToUpload, tenantId);
        const uploadedFileStoreId = uploadResult?.[0]?.fileStoreId;
        handleSubmit(uploadedFileStoreId);
      } catch (error) {
        console.error("error", error);
        setFormData({});
        const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
        const errorCode = error?.response?.data?.Errors?.[0]?.code || "CS_FILE_UPLOAD_ERROR";
        setFileUploadError(errorCode);
        setShowToast({ label: t(errorCode), error: true, errorId });
      } finally {
        setLoader(false);
      }
    }
  };
  const saveLabel = useMemo(() => {
    if (authorizedUuid !== userUuid) {
      // only advocate himself can esign. not junior adv/clerk
      return null;
    }
    return t("CS_ESIGN");
  }, [t, authorizedUuid, userUuid]);

  return (
    <React.Fragment>
      <Modal
        headerBarMain={<Heading label={t(title)} />}
        headerBarEnd={<CloseBtn onClick={handleCloseSignatureModal} />}
        actionCancelLabel={t("CS_COMMON_DOWNLOAD")}
        actionCancelOnSubmit={handleDownload}
        actionSaveLabel={saveLabel}
        actionCustomLabel={t("UPLOAD_SIGNED_COPY")}
        actionCustomLabelSubmit={() => setShowUploadSignature(true)}
        actionSaveOnSubmit={handleESign}
        cancelClassName={"bail-cancel-className"}
        customActionClassName={"selector-button-border"}
        className={"bail-signature-modal"}
      >
        <div style={{ padding: "0px 10px" }}>
          <p style={{ color: "#0A0A0A" }}>{t("YOU_CAN_CHOOSE_SIGN_MODE")}</p>
          <p style={{ color: "#0A0A0A" }}>{t(infoText)}</p>
        </div>
      </Modal>

      {showUploadSignature && (
        <UploadModal
          t={t}
          key={name}
          name={name}
          onClose={() => setShowUploadSignature(false)}
          onSelect={onSelect}
          formData={formData}
          onSubmit={onSubmit}
          isDisabled={loader}
          isParentLoading={loader}
          showInfo={true}
          infoHeader={"CS_PLEASE_COMMON_NOTE"}
          infoText={"PLEASE_ENSURE_SIGN"}
          showDownloadText={true}
          fileUploadError={fileUploadError}
          onCustomDownload={onCustomDownload}
        />
      )}
      {showToast && (
        <CustomToast
          error={showToast?.error}
          label={showToast?.label}
          errorId={showToast?.errorId}
          onClose={() => setShowToast(null)}
          duration={showToast?.errorId ? 7000 : 5000}
        />
      )}
    </React.Fragment>
  );
};

export default GenericUploadSignatureModal;
