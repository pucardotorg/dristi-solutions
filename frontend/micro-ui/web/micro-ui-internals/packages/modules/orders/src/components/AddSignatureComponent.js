import { InfoCard } from "@egovernments/digit-ui-components";
import { FileUploadIcon } from "@egovernments/digit-ui-module-dristi/src/icons/svgIndex";
import { Button, FileIcon, PrintIcon } from "@egovernments/digit-ui-react-components";
import React, { useEffect, useMemo, useState } from "react";
import useESign from "../hooks/orders/useESign";
import { Urls } from "../hooks/services/Urls";
import useDocumentUpload from "../hooks/orders/useDocumentUpload";
import AuthenticatedLink from "@egovernments/digit-ui-module-dristi/src/Utils/authenticatedLink";

const AddSignatureComponent = ({ t, isSigned, setIsSigned, handleSigned, rowData, setSignatureId, signatureId, deliveryChannel }) => {
  const { handleEsign, checkSignStatus } = useESign();
  const { uploadDocuments } = useDocumentUpload();
  const [formData, setFormData] = useState({}); // storing the file upload data
  const [openUploadSignatureModal, setOpenUploadSignatureModal] = useState(false);
  const UploadSignatureModal = window?.Digit?.ComponentRegistryService?.getComponent("UploadSignatureModal");
  const [fileStoreId, setFileStoreId] = useState(rowData?.documents?.[0]?.fileStore || ""); // have to set the uploaded fileStoreID
  const [pageModule, setPageModule] = useState("en");
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const mockESignEnabled = window?.globalConfigs?.getConfig("mockESignEnabled") === "true" ? true : false;
  const [fileUploadError, setFileUploadError] = useState(null);
  const uri = `${window.location.origin}${Urls.FileFetchById}?tenantId=${tenantId}&fileStoreId=${fileStoreId}`;
  const name = "Signature";
  const signPlaceHolder = "Signature";
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
            fileTypes: ["PDF", "PNG", "JPEG", "JPG"],
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
        const uploadedFileId = await uploadDocuments(formData?.uploadSignature?.Signature, tenantId);
        setSignatureId(uploadedFileId?.[0]?.fileStoreId);
        handleSigned(true);
        setOpenUploadSignatureModal(false);
      } catch (error) {
        console.error("error", error);
        setFormData({});
        handleSigned(false);
        setFileUploadError(error?.response?.data?.Errors?.[0]?.code || "CS_FILE_UPLOAD_ERROR");
      }
    }
  };

  useEffect(() => {
    checkSignStatus(name, formData, uploadModalConfig, onSelect, handleSigned);
  }, [checkSignStatus]);

  const documentType = useMemo(() => {
    let txt = "";
    if (rowData?.orderType === "SUMMONS") {
      txt = "Summons";
    } else if (rowData?.orderType === "WARRANT") {
      txt = "Warrant";
    } else if (rowData?.orderType === "PROCLAMATION") {
      txt = "Proclamation";
    } else if (rowData?.orderType === "ATTACHMENT") {
      txt = "Attachment";
    } else {
      txt = "Notice";
    }
    return `${txt} Document`;
  }, [rowData]);

  const fileStore = sessionStorage.getItem("fileStoreId") || signatureId;

  const handleClickEsign = () => {
    if (mockESignEnabled) {
      setIsSigned(true);
    } else {
      const placeHolder = rowData?.taskType === "MISCELLANEOUS_PROCESS" ? "Judicial Magistrate of First Class" : signPlaceHolder;
      sessionStorage.setItem("ESignSummons", JSON.stringify(rowData));
      sessionStorage.setItem("delieveryChannel", deliveryChannel);
      sessionStorage.setItem("homeActiveTab", "CS_HOME_PROCESS");
      handleEsign(name, pageModule, rowData?.documents?.[0]?.fileStore, placeHolder);
    }
  };

  return (
    <div>
      {!openUploadSignatureModal ? (
        <div
          style={{
            padding: "24px",
            display: "flex",
            flexDirection: "column",

            gap: "24px",
          }}
        >
          <InfoCard
            variant={"default"}
            label={t("PLEASE_NOTE")}
            additionalElements={[
              <p key="note">
                {t("YOU_ARE_ADDING_YOUR_SIGNATURE_TO_THE")}
                <span style={{ fontWeight: "bold" }}>{`${t(rowData?.taskType)} ${t("DOCUMENT_TEXT")}`}</span>
              </p>,
            ]}
            inline
            textStyle={{}}
            className={`custom-info-card`}
          />

          {!isSigned ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <h1
                style={{
                  margin: 0,
                  fontFamily: "Roboto",
                  fontSize: "24px",
                  fontWeight: 700,
                  lineHeight: "28.13px",
                  textAlign: "left",
                  color: "#3d3c3c",
                }}
              >
                {t("YOUR_SIGNATURE")}
              </h1>
              <div style={{ display: "flex", gap: "16px" }}>
                <Button
                  label={t("CS_ESIGN")}
                  onButtonClick={handleClickEsign}
                  style={{
                    width: "96px",
                    background: "none",
                    color: "#007e7e",
                    boxShadow: "none",
                    fontFamily: "Roboto",
                    fontSize: "16px",
                    fontWeight: 700,
                    textAlign: "center",
                  }}
                />
                <Button
                  icon={<FileUploadIcon />}
                  label={t("UPLOAD_DIGITAL_SIGN_CERTI")}
                  onButtonClick={() => {
                    setOpenUploadSignatureModal(true);
                  }}
                  style={{
                    background: "none",
                    color: "#007e7e",
                    border: "none",
                    boxShadow: "none",
                    fontFamily: "Roboto",
                    fontSize: "16px",
                    fontWeight: 700,
                    textAlign: "center",
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <h2 style={{ margin: 0 }}>{t("WANT_TO_DOWNLOAD")}</h2>
                <AuthenticatedLink
                  uri={uri}
                  style={{ color: "#007E7E", cursor: "pointer", textDecoration: "underline" }}
                  t={t}
                  displayFilename={"CLICK_HERE"}
                  pdf={true}
                />
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <h1
                  style={{
                    margin: 0,
                    fontFamily: "Roboto",
                    fontSize: "24px",
                    fontWeight: 700,
                    lineHeight: "28.13px",
                    textAlign: "left",
                    color: "#3d3c3c",
                  }}
                >
                  {t("YOUR_SIGNATURE")}
                </h1>
                <h2
                  style={{
                    margin: 0,
                    fontFamily: "Roboto",
                    fontSize: "14px",
                    fontWeight: 400,
                    lineHeight: "16.41px",
                    textAlign: "center",
                    color: "#00703c",
                    padding: "6px",
                    backgroundColor: "#e4f2e4",
                    borderRadius: "999px",
                  }}
                >
                  {t("SIGNED")}
                </h2>
              </div>
              <div>
                {rowData?.taskDetails?.deliveryChannels?.channelCode === "POLICE" && fileStore && (
                  <div className="print-documents-box-div">
                    <div className="print-documents-box-text">
                      <FileIcon />
                      <div style={{ marginLeft: "0.5rem" }}>{documentType}</div>
                    </div>
                    <button className="print-button" disabled={!fileStore}>
                      <PrintIcon />
                      {fileStore ? (
                        <AuthenticatedLink
                          uri={`${window.location.origin}${Urls.FileFetchById}?tenantId=${tenantId}&fileStoreId=${fileStore}`}
                          t={t}
                          style={{ marginLeft: "0.5rem", color: "#007E7E" }}
                          displayFilename={"PRINT"}
                        />
                      ) : (
                        <span style={{ marginLeft: "0.5rem", color: "grey" }}>Print</span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
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
          fileUploadError={fileUploadError}
        />
      )}
    </div>
  );
};

export default AddSignatureComponent;
