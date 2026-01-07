import { Button, CloseSvg } from "@egovernments/digit-ui-components";
import React, { useEffect, useMemo, useState } from "react";
import Modal from "../../../dristi/src/components/Modal";
import { Urls } from "../hooks/services/Urls";
import { FileUploadIcon } from "../../../dristi/src/icons/svgIndex";
import AuthenticatedLink from "@egovernments/digit-ui-module-dristi/src/Utils/authenticatedLink";

function SubmissionSignatureModal({
  t,
  handleProceed,
  handleCloseSignaturePopup,
  setSignedDocumentUploadID,
  applicationPdfFileStoreId,
  applicationType,
}) {
  const [isSigned, setIsSigned] = useState(false);
  const { handleEsign, checkSignStatus } = Digit.Hooks.orders.useESign();
  const { uploadDocuments } = Digit.Hooks.orders.useDocumentUpload();
  const [formData, setFormData] = useState({}); // storing the file upload data
  const [pageModule, setPageModule] = useState("ci");
  const [openUploadSignatureModal, setOpenUploadSignatureModal] = useState(false);
  const [loader, setLoader] = useState(false);
  const UploadSignatureModal = window?.Digit?.ComponentRegistryService?.getComponent("UploadSignatureModal");
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const uri = `${window.location.origin}${Urls.FileFetchById}?tenantId=${tenantId}&fileStoreId=${applicationPdfFileStoreId}`;
  const name = "Signature";
  const advocatePlaceholder = "Advocate Signature";
  const mockESignEnabled = window?.globalConfigs?.getConfig("mockESignEnabled") === "true" ? true : false;

  const applicationPlaceHolder = useMemo(() => {
    if (applicationType === "APPLICATION_TO_CHANGE_POWER_OF_ATTORNEY_DETAILS") {
      return name;
    } else {
      return advocatePlaceholder;
    }
  }, [applicationType]);

  const uploadModalConfig = useMemo(() => {
    return {
      key: "uploadSignature",
      populators: {
        inputs: [
          {
            name: name,
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
        setLoader(false);
        console.error("error", error);
        setFormData({});
      }
      setLoader(false);
    }
  };

  useEffect(() => {
    checkSignStatus(name, formData, uploadModalConfig, onSelect, setIsSigned);
  }, [checkSignStatus]);

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

  const handleClickEsign = () => {
    if (mockESignEnabled) {
      setIsSigned(true);
    } else {
      sessionStorage.setItem("applicationPDF", applicationPdfFileStoreId);
      handleEsign(name, pageModule, applicationPdfFileStoreId, applicationPlaceHolder);
    }
  };

  return !openUploadSignatureModal ? (
    <Modal
      headerBarMain={<Heading label={t("ADD_SIGNATURE")} />}
      headerBarEnd={<CloseBtn onClick={() => handleCloseSignaturePopup()} />}
      actionCancelLabel={t("BACK")}
      actionCancelOnSubmit={() => handleCloseSignaturePopup()}
      actionSaveLabel={t("PROCEED")}
      isDisabled={!isSigned}
      actionSaveOnSubmit={() => {
        handleProceed();
      }}
      className={"submission-add-signature-modal"}
    >
      <div className="add-signature-main-div">
        {!isSigned ? (
          <div className="not-signed">
            <h1 style={{ color: "#3d3c3c", fontSize: "24px", fontWeight: "bold" }}>{t("YOUR_SIGNATURE")}</h1>
            <div className="buttons-div">
              <Button
                label={t("CS_ESIGN_AADHAR")}
                onClick={handleClickEsign}
                className={"aadhar-sign-in"}
                labelClassName={"submission-aadhar-sign-in"}
              ></Button>
              <Button
                icon={<FileUploadIcon />}
                label={t("CS_UPLOAD_ESIGNATURE")}
                onClick={() => {
                  // setOpenUploadSignatureModal(true);
                  // setIsSigned(true);
                  setOpenUploadSignatureModal(true);
                }}
                className={"upload-signature"}
                labelClassName={"submission-upload-signature-label"}
              ></Button>
            </div>
            <div className="click-for-download">
              <h2>{t("WANT_TO_DOWNLOAD")}</h2>
              <AuthenticatedLink
                style={{ color: "#007E7E", cursor: "pointer", textDecoration: "underline" }}
                uri={uri}
                t={t}
                displayFilename={"CLICK_HERE"}
                pdf={true}
              />
            </div>
          </div>
        ) : (
          <div className="signed">
            <h1>{t("YOUR_SIGNATURE")}</h1>
            <span>{t("SIGNED")}</span>
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
    />
  );
}

export default SubmissionSignatureModal;
