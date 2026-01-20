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

const WitnessDepositionSignatureModal = ({
  t,
  handleCloseSignatureModal,
  handleDownload,
  handleESign,
  handleSubmit,
  setShowUploadSignature,
  showUploadSignature,
  setLoader,
  loader,
  witnessDepositionFileStoreId,
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
      <style>
        {`
            .bail-signature-modal {
                width:638px;
                height:230px;
                border-radius:4px;
            }

            .bail-signature-modal .popup-module-main .popup-module-action-bar{
                display: flex;
                justify-content: flex-start;
                gap: 16px;
            }
            
            .bail-signature-modal .popup-module-main .popup-module-action-bar button:nth-child(2) {
                margin-left: auto;
            }

            .bail-signature-modal .popup-module-main .popup-module-action-bar .selector-button-border{
                border: 1px solid rgb(0, 126, 126);
                background-color : white;
            }

            .bail-signature-modal .popup-module-main .popup-module-action-bar .selector-button-border h2{
                color: rgb(0, 126, 126);
            }

            .bail-signature-modal .popup-module-main .popup-module-action-bar .bail-cancel-className {
              border: none !important;
              background-color: white;
              position: relative;
              padding-left: 32px;
            }

            .bail-signature-modal .popup-module-main .popup-module-action-bar .bail-cancel-className h2 {
              color: rgb(0, 126, 126);
              display: inline-flex;
              align-items: center;
              gap: 8px;
              font-size: 16px;
            }

            .bail-signature-modal .popup-module-main .popup-module-action-bar .bail-cancel-className::before {
              content: '';
              background-image: url('data:image/svg+xml;utf8,<svg width="10" height="12" viewBox="0 0 10 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.66634 4H6.99967V0H2.99967V4H0.333008L4.99967 8.66667L9.66634 4ZM0.333008 10V11.3333H9.66634V10H0.333008Z" fill="%23007E7E"/></svg>');
              background-repeat: no-repeat;
              background-size: 10px 21px;
              position: absolute;
              left: 10px;
              top: 50%;
              transform: translateY(-50%);
              width: 20px;
              height: 20px;
            }

        `}
      </style>
      <Modal
        headerBarMain={<Heading label={t("SELECT_MODE_SIGNING")} />}
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
          <p style={{ marginBottom: "24px", color: "#0A0A0A" }}>{t("BAIL_SIGN_INFO")}</p>
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
          fileStoreId={witnessDepositionFileStoreId}
          cancelLabel={"SUBMIT"}
        />
      )}
    </React.Fragment>
  );
};

export default WitnessDepositionSignatureModal;
