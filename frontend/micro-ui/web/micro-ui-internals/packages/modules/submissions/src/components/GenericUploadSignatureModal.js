import { CloseSvg } from "@egovernments/digit-ui-components";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import React, { useMemo, useState } from "react";

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
  title="SELECT_MODE_SIGNING",
  infoText="BAIL_SIGN_INFO"
}) => {
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const { uploadDocuments } = Digit.Hooks.orders.useDocumentUpload();
  const [formData, setFormData] = useState({});
  const UploadSignatureModal = window?.Digit?.ComponentRegistryService?.getComponent("UploadSignatureModal");
  const name = "Signature";

  const uploadModalConfig = useMemo(() => {
    return {
      key: "uploadSignature",
      populators: {
        inputs: [
          {
            name: name,
            type: "DragDropComponent",
            uploadGuidelines: "Ensure the file is not blurry and under 5MB.",
            maxFileSize: 10,
            maxFileErrorMessage: "CS_FILE_LIMIT_10_MB",
            fileTypes: ["PDF"],
            isMultipleUpload: false,
          },
        ],
        validation: {},
      },
    };
  }, [name]);

  const onSelect = (key, value) => {
    if (value?.[name] === null) {
      setFormData({});
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [key]: value,
      }));
    }
  };

  const onSubmit = async () => {
    if (formData?.uploadSignature?.Signature?.length > 0) {
      try {
        setLoader(true);
        const uploadedFileId = await uploadDocuments(formData?.uploadSignature?.Signature, tenantId);
        handleSubmit(uploadedFileId?.[0]?.fileStoreId);
      } catch (error) {
        setLoader(false);
        console.error("error", error);
        setFormData({});
      }
    }
  };

  return (
    <React.Fragment>
      <Modal
        headerBarMain={<Heading label={t(title)} />}
        headerBarEnd={<CloseBtn onClick={handleCloseSignatureModal} />}
        actionCancelLabel={t("CS_COMMON_DOWNLOAD")}
        actionCancelOnSubmit={handleDownload}
        actionSaveLabel={t("CS_ESIGN")}
        actionCustomLabel={t("UPLOAD_SIGNED_COPY")}
        actionCustomLabelSubmit={() => setShowUploadSignature(true)}
        actionSaveOnSubmit={handleESign}
        cancelClassName={"bail-cancel-className"}
        customActionClassName={"selector-button-border"}
        className={"bail-signature-modal"}
      >
        <div style={{ padding: "10px" }}>
          <p style={{ marginBottom: "24px", color: "#0A0A0A" }}>{t(infoText)}</p>
        </div>
      </Modal>

      {showUploadSignature && (
        <UploadSignatureModal
          t={t}
          key={name}
          name={name}
          setOpenUploadSignatureModal={setShowUploadSignature}
          onSelect={onSelect}
          config={uploadModalConfig}
          formData={formData}
          onSubmit={onSubmit}
          isDisabled={loader}
          showInfo={true}
          infoHeader={"CS_PLEASE_COMMON_NOTE"}
          infoText={"PLEASE_ENSURE_SIGN"}
          showDownloadText={true}
          fileStoreId={fileStoreId}
          cancelLabel={"SUBMIT"}
        />
      )}
    </React.Fragment>
  );
};

export default GenericUploadSignatureModal;
