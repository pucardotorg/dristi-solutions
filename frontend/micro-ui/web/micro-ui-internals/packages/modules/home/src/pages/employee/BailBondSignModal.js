import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CloseSvg, InfoCard } from "@egovernments/digit-ui-components";
import { Button } from "@egovernments/digit-ui-react-components";
import { FileUploadIcon } from "@egovernments/digit-ui-module-dristi/src/icons/svgIndex";
import AuthenticatedLink from "@egovernments/digit-ui-module-dristi/src/Utils/authenticatedLink";
import { Urls } from "../../hooks";

export const BailBondSignModal = ({ rowData, colData, value, onSigningComplete }) => {
  // Check for stored session data and restore modal state
  const [stepper, setStepper] = useState(() => {
    const savedStepper = sessionStorage.getItem("bailBondStepper");
    return savedStepper ? parseInt(savedStepper) : 0;
  });
  
  // Check if we need to restore row data from session storage
  const [restoredRowData, setRestoredRowData] = useState(() => {
    if (!rowData && sessionStorage.getItem("bailBondData")) {
      try {
        const savedData = JSON.parse(sessionStorage.getItem("bailBondData"));
        return savedData.rowData;
      } catch (e) {
        console.error("Error parsing saved bail bond data", e);
        return null;
      }
    }
    return null;
  });
  
  // Use restored row data if available, otherwise use props
  const effectiveRowData = restoredRowData || rowData;

  const [openUploadSignatureModal, setOpenUploadSignatureModal] = useState(false);
  const { t } = useTranslation();
  const Modal = window?.Digit?.ComponentRegistryService?.getComponent("Modal");
  const DocViewerWrapper = Digit?.ComponentRegistryService?.getComponent("DocViewerWrapper");
  const { handleEsign, checkSignStatus } = Digit.Hooks.orders.useESign();
  const UploadSignatureModal = window?.Digit?.ComponentRegistryService?.getComponent("UploadSignatureModal");
  const [isSigned, setIsSigned] = useState(false);

  const [formData, setFormData] = useState({});
  const [bailBondPdf, setBailBondPdf] = useState(() => sessionStorage.getItem("bailBondPdf") || "");
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const [loader, setLoader] = useState(false);
  const [signedDocumentUploadID, setSignedDocumentUploadID] = useState(() => sessionStorage.getItem("bailBondFileStoreId") || "");

  const name = "Signature";
  const pageModule = "en";
  const { uploadDocuments } = Digit.Hooks.orders.useDocumentUpload();

  const CloseBtn = (props) => {
    return (
      <div onClick={props?.onClick} style={{ height: "100%", display: "flex", alignItems: "center", paddingRight: "20px", cursor: "pointer" }}>
        <CloseSvg />
      </div>
    );
  };

  const Heading = (props) => {
    return (
      <div className="evidence-title">
        <h1 className="heading-m">{props.label}</h1>
      </div>
    );
  };

  const uploadModalConfig = useMemo(() => {
    return {
      key: "uploadSignature",
      populators: {
        inputs: [
          {
            name,
            type: "DragDropComponent",
            uploadGuidelines: "Ensure the image is not blurry and under 5MB.",
            maxFileSize: 5,
            maxFileErrorMessage: "CS_FILE_LIMIT_5_MB",
            fileTypes: ["JPG", "PNG", "JPEG", "PDF"],
            isMultipleUpload: false,
          },
        ],
        validation: {},
      },
    };
  }, [name]);

  const onUploadSubmit = async () => {
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
      }
      setLoader(false);
    }
  };

  const handleCancel = () => {
    if (parseInt(stepper) === 1) {
      // Clear PDF and stepper storage when canceling from document view
      sessionStorage.removeItem("bailBondPdf");
      sessionStorage.removeItem("bailBondStepper");
      sessionStorage.removeItem("bailBondData");
      setStepper(0);
    } else if (parseInt(stepper) === 2) {
      if (isSigned) {
        // Clear all bail bond storage when canceling from signed state
        sessionStorage.removeItem("bailBondFileStoreId");
        sessionStorage.removeItem("bailBondStepper");
        sessionStorage.removeItem("bailBondPdf");
        sessionStorage.removeItem("bailBondData");
        setFormData({});
        setIsSigned(false);
        setSignedDocumentUploadID("");
        setStepper(0); // Return to beginning, not to previous step
      } else {
        // Just remove file ID and go back one step
        sessionStorage.removeItem("bailBondFileStoreId");
        setFormData({});
        setIsSigned(false);
        const newStepper = parseInt(stepper) - 1;
        setStepper(newStepper);
      }
    } else if (openUploadSignatureModal) {
      setOpenUploadSignatureModal(false);
    }
  };

  const onSelect = useCallback((key, value) => {
    if (value?.Signature === null) {
      setFormData({});
      setIsSigned(false);
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [key]: value,
      }));
    }
  }, []);

  const uploadSignedPdf = async () => {
    try {
      setLoader(true);
      const localStorageID = sessionStorage.getItem("bailBondFileStoreId");
      const docData = {
        file: signedDocumentUploadID || localStorageID,
        documentType: "BailBond",
        fileType: "application/pdf",
      };

      // Use the existing uploadDocuments function
      const pdfFile = await uploadDocuments(docData);
      if (pdfFile?.signedFile?.fileStoreId) {
        // Clear ALL session storage related to bail bond
        sessionStorage.removeItem("bailBondFileStoreId");
        sessionStorage.removeItem("bailBondStepper");
        sessionStorage.removeItem("bailBondPdf");
        sessionStorage.removeItem("bailBondData");
        
        // Reset local state
        setStepper(0);
        setIsSigned(false);
        setSignedDocumentUploadID("");
        
        // Trigger data refresh in parent component
        if (onSigningComplete) {
          onSigningComplete();
        }
      } else {
        // Error handling
        console.warn("Failed to upload signed PDF");
      }
    } catch (e) {
      console.error("ERROR IN Upload Sign PDF: ", e);
    } finally {
      setLoader(false);
    }
  };

  useEffect(() => {
    checkSignStatus(name, formData, uploadModalConfig, onSelect, setIsSigned);
  }, [checkSignStatus, name, formData, uploadModalConfig, onSelect]);

  const onESignClick = async () => {
    try {
      // Store all necessary data before redirect
      sessionStorage.setItem("bailBondStepper", "2");
      
      // Save the complete row data for modal restoration
      if (rowData?.businessObject?.orderNotification?.id) {
        sessionStorage.setItem("bailBondData", JSON.stringify({
          id: rowData?.businessObject?.orderNotification?.id,
          rowData: rowData
        }));
      }
      
      // Store PDF data if available
      if (bailBondPdf) {
        sessionStorage.setItem("bailBondPdf", bailBondPdf);
      }
      
      // Proceed with e-sign
      await handleEsign(name, pageModule, bailBondPdf, "BailBond");
    } catch (error) {
      console.error("Error in e-sign process:", error);
    }
  };

  const uri = `${window.location.origin}${Urls.FileFetchById}?tenantId=${tenantId}&fileStoreId=${bailBondPdf}`;

  useEffect(() => {
    if (stepper === 1) {
      const bailBondId = effectiveRowData?.businessObject?.orderNotification?.orderNotificationId;
      const tenantId = effectiveRowData?.tenantId;
      if (bailBondId && tenantId) {
        // Fetch PDF logic
        (async () => {
          try {
            setLoader(true);
            const pdfRes = await Digit.Utils.pdf.getPDFData("BailBond", { bailBondId, tenantId });
            if (pdfRes?.filestoreIds?.length > 0) {
              const pdfKey = pdfRes?.filestoreIds[0];
              let PDF_URL = `${Urls.FileFetchById}?tenantId=${tenantId}&fileStoreId=${pdfKey}`;
              setBailBondPdf(PDF_URL);
              sessionStorage.setItem("bailBondPdf", PDF_URL);
            } else {
              console.log("No PDF available");
            }
          } catch (e) {
            console.log("Error fetching PDF", e);
          } finally {
            setLoader(false);
          }
        })();
      }
    }
  }, [stepper, effectiveRowData]);

  return (
    <div>
      <span
        onClick={() => {
          setStepper(1);
        }}
      >
        {value}
      </span>
      {stepper === 1 && (
        <Modal
          headerBarEnd={<CloseBtn onClick={handleCancel} />}
          headerBarMain={<Heading label={`${value} ${t("BAIL_BOND")}`} />}
          popupStyles={{ width: "70vw" }}
          actionCancelLabel={t("CS_COMMON_CANCEL")}
          actionCancelOnSubmit={handleCancel}
          actionSaveLabel={t("PROCEED_TO_SIGN")}
          actionSaveOnSubmit={() => {
            // Just move to step 2 - no redirect yet so no need for session storage
            setStepper(2);
          }}
          formId="modal-action"
          headerBarMainStyle={{ height: "50px" }}
        >
          <DocViewerWrapper
            key={"fdsfdsf"}
            fileStoreId={"97060b57-eea9-405c-966c-0577c52224fe"}
            tenantId={"kl"}
            docWidth="100%"
            docHeight="70vh"
            showDownloadOption={false}
          />
        </Modal>
      )}
      {stepper === 2 && !openUploadSignatureModal && !isSigned && (
        <Modal
          headerBarMain={<Heading label={t("ADD_SIGNATURE")} />}
          headerBarEnd={<CloseBtn onClick={handleCancel} />}
          actionCancelLabel={t("CS_COMMON_BACK")}
          actionCancelOnSubmit={handleCancel}
          actionSaveLabel={t("submit")}
          isDisabled={!isSigned}
          actionSaveOnSubmit={() => {
            console.log("submiteed");
          }}
          className="add-signature-modal"
        >
          <div className="add-signature-main-div">
            <div className="not-signed">
              <InfoCard
                variant={"default"}
                label={t("PLEASE_NOTE")}
                additionalElements={[<p key="note">{t("YOU_ARE_ADDING_YOUR_SIGNATURE_TO_THE")}</p>]}
                inline
                textStyle={{}}
                className={`custom-info-card`}
              />
              <h1>{t("YOUR_SIGNATURE")}</h1>
              <div className="sign-button-wrap">
                <Button label={t("CS_ESIGN")} onButtonClick={onESignClick} className="aadhar-sign-in" labelClassName="aadhar-sign-in" />
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
                <h2>{t("DOWNLOAD_ADIARY_TEXT")}</h2>
                <AuthenticatedLink
                  uri={uri}
                  style={{ color: "#007E7E", cursor: "pointer", textDecoration: "underline" }}
                  displayFilename={"CLICK_HERE"}
                  t={t}
                  pdf={true}
                />
              </div>
            </div>
          </div>
        </Modal>
      )}
      {stepper === 2 && openUploadSignatureModal && (
        <UploadSignatureModal
          t={t}
          key={name}
          name={name}
          setOpenUploadSignatureModal={setOpenUploadSignatureModal}
          onSelect={onSelect}
          config={uploadModalConfig}
          formData={formData}
          onSubmit={onUploadSubmit}
          isDisabled={loader}
          onClose={handleCancel} // Add consistent cancel handling
        />
      )}
      {stepper === 2 && !openUploadSignatureModal && isSigned && (
        <Modal
          headerBarMain={<Heading label={t("ADD_SIGNATURE")} />}
          headerBarEnd={<CloseBtn onClick={handleCancel} />}
          actionCancelLabel={t("CS_COMMON_BACK")}
          actionCancelOnSubmit={handleCancel}
          actionSaveLabel={t("SUBMIT_BUTTON")}
          actionSaveOnSubmit={uploadSignedPdf}
          className="add-signature-modal"
        >
          <div className="add-signature-main-div">
            <InfoCard
              variant={"default"}
              label={t("PLEASE_NOTE")}
              additionalElements={[<p key="note">{t("YOU_ARE_ADDING_YOUR_SIGNATURE_TO_THE")}</p>]}
              inline
              textStyle={{}}
              className={`custom-info-card`}
            />
            <div style={{ display: "flex", flexDirection: "row", gap: "16px" }}>
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
          </div>
        </Modal>
      )}
    </div>
  );
};
