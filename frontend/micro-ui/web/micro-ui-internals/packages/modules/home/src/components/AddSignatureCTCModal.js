import { Button, CloseSvg } from "@egovernments/digit-ui-react-components";
import React, { useEffect, useMemo, useState } from "react";
import { Urls } from "../hooks/services";
import { FileUploadIcon } from "@egovernments/digit-ui-module-dristi/src/icons/svgIndex";
import AuthenticatedLink from "@egovernments/digit-ui-module-dristi/src/Utils/authenticatedLink";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import { InfoCard } from "@egovernments/digit-ui-components";
import { downloadPdfFromBlob } from "@egovernments/digit-ui-module-dristi/src/Utils";

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

const AddSignatureCTCModal = ({
  t,
  setSignedDocumentUploadID,
  handleGoBackSignatureModal,
  saveOnsubmitLabel,
  handleIssue,
  documentBlob,
  documentName,
  selectedRowData,
}) => {
  const [isSigned, setIsSigned] = useState(false);
  const { handleEsign, checkSignStatus } = Digit.Hooks.orders.useESign();
  const [formData, setFormData] = useState({});
  const [openUploadSignatureModal, setOpenUploadSignatureModal] = useState(false);
  const UploadSignatureModal = window?.Digit?.ComponentRegistryService?.getComponent("UploadSignatureModal");
  const [pageModule, setPageModule] = useState("en");
  const [loader, setLoader] = useState(false);
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const { uploadDocuments } = Digit.Hooks.orders.useDocumentUpload();
  const name = "Signature";
  const [fileUploadError, setFileUploadError] = useState(null);
  const mockESignEnabled = window?.globalConfigs?.getConfig("mockESignEnabled") === "true" ? true : false;
  const uploadModalConfig = useMemo(() => {
    return {
      key: "uploadSignature",
      populators: {
        inputs: [
          {
            name: name,
            // documentHeader: "CS_ADD_SIGNATURE",
            type: "DragDropComponent",
            uploadGuidelines: "Ensure the image is not blurry and under 5MB.",
            maxFileSize: 10,
            maxFileErrorMessage: "CS_FILE_LIMIT_10_MB",
            fileTypes: ["JPG", "PNG", "JPEG", "PDF"],
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
      setIsSigned(false);
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [key]: value,
      }));
    }
    setFileUploadError(null);
  };

  const onSubmit = async () => {
    if (formData?.uploadSignature?.Signature?.length > 0) {
      try {
        setLoader(true);
        const uploadedFileId = await uploadDocuments(formData?.uploadSignature?.Signature, tenantId);
        setSignedDocumentUploadID(uploadedFileId?.[0]?.fileStoreId);
        setIsSigned(true);
        setOpenUploadSignatureModal(false);
      } catch (error) {
        console.error("error", error);
        setLoader(false);
        setFormData({});
        setIsSigned(false);
        setFileUploadError(error?.response?.data?.Errors?.[0]?.code || "CS_FILE_UPLOAD_ERROR");
      }
      setLoader(false);
    }
  };

  useEffect(() => {
    checkSignStatus(name, formData, uploadModalConfig, onSelect, setIsSigned);
  }, []);

  const handleClickEsign = async () => {
    if (documentBlob) {
      try {
        setLoader(true);
        const file = new File([documentBlob], documentName || "CTC_Document.pdf", { type: documentBlob.type || "application/pdf" });
        const uploadedFileId = await uploadDocuments([file], tenantId);
        const uploadedFileStoreId = uploadedFileId?.[0]?.fileStoreId;

        if (mockESignEnabled) {
          setIsSigned(true);
          if (setSignedDocumentUploadID) {
            setSignedDocumentUploadID(uploadedFileStoreId);
          }
        } else {
          sessionStorage.setItem("homeActiveTab", "CS_HOME_ISSUE_CTC_COPY");
          sessionStorage.setItem("ctcSignState", JSON.stringify(selectedRowData));
          sessionStorage.setItem("docPdf", uploadedFileStoreId);
          handleEsign(name, pageModule, uploadedFileStoreId, "Certification Signature");
        }
      } catch (error) {
        console.error("Failed to upload document for e-sign", error);
        setFileUploadError(error?.response?.data?.Errors?.[0]?.code || "CS_FILE_UPLOAD_ERROR");
      } finally {
        setLoader(false);
      }
    }
  };

  const handleDownload = () => {
    if (documentBlob) {
      downloadPdfFromBlob(documentBlob, documentName || "CTC_Document.pdf");
    }
  };

  return !openUploadSignatureModal ? (
    <Modal
      headerBarMain={<Heading label={t("ADD_SIGNATURE")} />}
      headerBarEnd={<CloseBtn onClick={handleGoBackSignatureModal} />}
      actionCancelLabel={t("CS_COMMON_BACK")}
      actionCancelOnSubmit={handleGoBackSignatureModal}
      actionSaveLabel={t(saveOnsubmitLabel)}
      isDisabled={!isSigned}
      actionSaveOnSubmit={handleIssue}
      className={"add-signature-modal"}
    >
      <div className="add-signature-main-div">
        {!isSigned ? (
          <div className="not-signed">
            <h1>{t("YOUR_SIGNATURE")}</h1>
            <div className="sign-button-wrap">
              <Button label={t("CS_ESIGN")} onButtonClick={handleClickEsign} className="aadhar-sign-in" labelClassName="aadhar-sign-in" />
              <Button
                icon={<FileUploadIcon />}
                label={t("UPLOAD_DIGITAL_SIGN_CERTI")}
                onButtonClick={() => {
                  setOpenUploadSignatureModal(true);
                }}
                className="upload-signature"
                labelClassName="upload-signature-label"
              />
            </div>
            <div className="donwload-submission">
              <h2>{t("WANT_TO_DOWNLOAD")}</h2>
              <div style={{ color: "#007E7E", background: "white", cursor: "pointer", textDecoration: "underline" }} onClick={handleDownload}>
                {t("CLICK_HERE")}
              </div>
            </div>
          </div>
        ) : (
          <div className="signed">
            <h1>{t("YOUR_SIGNATURE")}</h1>
            <h2>{t("SIGNED")}</h2>
          </div>
        )}
      </div>
    </Modal>
  ) : (
    <UploadSignatureModal
      t={t}
      key={name}
      name={name}
      setOpenUploadSignatureModal={setOpenUploadSignatureModal}
      onSelect={onSelect}
      config={uploadModalConfig}
      formData={formData}
      onSubmit={onSubmit}
      isDisabled={loader}
      fileUploadError={fileUploadError}
    />
  );
};

export default AddSignatureCTCModal;
