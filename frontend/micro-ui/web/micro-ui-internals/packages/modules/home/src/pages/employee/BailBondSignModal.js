import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CloseSvg, InfoCard } from "@egovernments/digit-ui-components";
import { Button, Loader } from "@egovernments/digit-ui-react-components";
import { FileDownloadIcon, FileUploadIcon } from "@egovernments/digit-ui-module-dristi/src/icons/svgIndex";
import AuthenticatedLink from "@egovernments/digit-ui-module-dristi/src/Utils/authenticatedLink";
import { Banner, CardLabel } from "@egovernments/digit-ui-react-components";

export const clearBailBondSessionData = () => {
  sessionStorage.removeItem("bailBondStepper");
  sessionStorage.removeItem("bailBondPdf");
  sessionStorage.removeItem("bailBondFileStoreId");
  sessionStorage.removeItem("bulkBailBondSignSelectedItem");
};

export const BailBondSignModal = ({ selectedBailBond, setShowBulkSignModal, rowData, colData, value, onSigningComplete, bailBondPaginationData }) => {
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const courtId = localStorage.getItem("courtId");
  const bulkSignUrl = window?.globalConfigs?.getConfig("BULK_SIGN_URL") || "http://localhost:1620";
  const selectedBailBondFilestoreid = "97060b57-eea9-405c-966c-0577c52224fe";

  const [stepper, setStepper] = useState(() => {
    const bulkBailBondSignSelectedItem = sessionStorage.getItem("bulkBailBondSignSelectedItem");
    if (
      bulkBailBondSignSelectedItem &&
      JSON.parse(bulkBailBondSignSelectedItem)?.businessObject?.orderNotification?.id === selectedBailBond?.businessObject?.orderNotification?.id
    ) {
      const savedStepper = sessionStorage.getItem("bailBondStepper");
      return savedStepper ? parseInt(savedStepper) : 0;
    }
    return 0;
  });

  const [restoredRowData] = useState(() => {
    if (!selectedBailBond && sessionStorage.getItem("bailBondData")) {
      try {
        const savedData = JSON.parse(sessionStorage.getItem("bailBondData"));
        return savedData.selectedBailBond;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const effectiveRowData = restoredRowData || selectedBailBond || rowData;

  const [openUploadSignatureModal, setOpenUploadSignatureModal] = useState(false);
  const { t } = useTranslation();
  const Modal = window?.Digit?.ComponentRegistryService?.getComponent("Modal");
  const DocViewerWrapper = Digit?.ComponentRegistryService?.getComponent("DocViewerWrapper");
  const { checkSignStatus } = Digit.Hooks.orders.useESign();
  const UploadSignatureModal = window?.Digit?.ComponentRegistryService?.getComponent("UploadSignatureModal");
  const [isSigned, setIsSigned] = useState(false);

  const [formData, setFormData] = useState({});
  const [bailBondPdf, setBailBondPdf] = useState(() => sessionStorage.getItem("bailBondPdf") || "");
  const [loader, setLoader] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  const name = "Signature";
  const { uploadDocuments } = Digit.Hooks.orders.useDocumentUpload();

  const CloseBtn = useCallback((props) => {
    return (
      <div onClick={props?.onClick} style={{ height: "100%", display: "flex", alignItems: "center", paddingRight: "20px", cursor: "pointer" }}>
        <CloseSvg />
      </div>
    );
  }, []);

  const Heading = useCallback((props) => {
    return (
      <div className="evidence-title">
        <h1 className="heading-m">{props.label}</h1>
      </div>
    );
  }, []);

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

  const onSelect = (key, value) => {
    if (value?.Signature === null) {
      setFormData({});
      setIsSigned(false);
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [key]: value,
      }));
    }
  };

  const onUploadSubmit = useCallback(async () => {
    if (formData?.uploadSignature?.Signature?.length > 0) {
      try {
        setLoader(true);
        const uploadedFileId = await uploadDocuments(formData?.uploadSignature?.Signature, tenantId);
        // Clear session storage on successful upload, but keep search state
        sessionStorage.removeItem("bailBondStepper");
        sessionStorage.removeItem("bailBondPdf");
        sessionStorage.removeItem("bailBondFileStoreId");
        sessionStorage.removeItem("bulkBailBondSelectedItem");
        setIsSigned(true);
        setOpenUploadSignatureModal(false);
      } catch (error) {
        console.log("error", error);
        setLoader(false);
      }
      setLoader(false);
    }
  }, [formData, uploadDocuments, tenantId, onSigningComplete]);

  const handleCancel = useCallback(() => {
    if (parseInt(stepper) === 0) {
      setShowBulkSignModal(false);
    } else if (parseInt(stepper) === 1) {
      if (!openUploadSignatureModal && !isSigned) {
        clearBailBondSessionData();
        setFormData({});
        setStepper(0);
      } else if (!openUploadSignatureModal && isSigned) {
        setIsSigned(false);
        setFormData({});
        setStepper(1);
      } else if (openUploadSignatureModal) {
        setIsSigned(false);
        setFormData({});
        setStepper(1);
        setOpenUploadSignatureModal(false);
      }
    } else if (openUploadSignatureModal) {
      setOpenUploadSignatureModal(false);
    }
  }, [stepper, isSigned, openUploadSignatureModal]);

  useEffect(() => {
    checkSignStatus(name, formData, uploadModalConfig, onSelect, setIsSigned);
  }, [checkSignStatus, name, formData, uploadModalConfig, setIsSigned]);

  const onESignClick = useCallback(() => {
    try {
      setLoader(true);

      // Build the e-sign URL with proper parameters
      // const url = `${bulkSignUrl}/bailbond/sign?bailBondId=${effectiveRowData?.businessObject?.orderNotification?.id}&tenantId=${tenantId}&courtId=${courtId}`;

      // Store the current state in sessionStorage before redirecting
      sessionStorage.setItem("bailBondStepper", stepper);
      sessionStorage.setItem("bailBondData", JSON.stringify({ selectedBailBond: effectiveRowData }));
      sessionStorage.setItem("bulkBailBondSignlimit", bailBondPaginationData?.limit);
      sessionStorage.setItem("bulkBailBondSignCaseTitle", bailBondPaginationData?.caseTitle);
      sessionStorage.setItem("bulkBailBondSignoffset", bailBondPaginationData?.offset);
      sessionStorage.setItem("homeActiveTab", "BULK_BAIL_BOND_SIGN");
      sessionStorage.setItem("bulkBailBondSignSelectedItem", JSON.stringify(effectiveRowData));

      // Redirect to the e-sign URL
      // window.open(url, "_self");
    } catch (error) {
      console.log("E-sign navigation error:", error);
      setLoader(false);
    }
  }, [bulkSignUrl, effectiveRowData, tenantId, courtId, stepper]);

  // const uri = useMemo(() => {
  //   const id = effectiveRowData?.businessObject?.orderNotification?.id;
  //   return id ? Urls.formatPdfViewUrlForOrderId("CREATED", id, tenantId, courtId) : "";
  // }, [effectiveRowData, tenantId, courtId]);

  useEffect(() => {
    const id = effectiveRowData?.businessObject?.orderNotification?.id;

    if (stepper === 1 && id) {
      // Store data to session storage for recovery after e-sign redirect
      sessionStorage.setItem("bailBondStepper", stepper.toString());
    }
  }, [effectiveRowData, stepper]);

  const MemoDocViewerWrapper = useMemo(
    () => (
      <DocViewerWrapper
        key={"fdsfdsf"}
        fileStoreId={selectedBailBondFilestoreid}
        tenantId={"kl"}
        docWidth="100%"
        docHeight="70vh"
        showDownloadOption={false}
      />
    ),
    [selectedBailBondFilestoreid]
  );

  return (
    <div>
      {loader && <Loader />}
      {stepper === 0 && (
        <Modal
          headerBarEnd={<CloseBtn onClick={() => setShowBulkSignModal(false)} />}
          headerBarMain={<Heading label={`${value} ${t("BAIL_BOND")}`} />}
          popupStyles={{ width: "70vw" }}
          actionCancelLabel={t("REJECT")}
          actionCancelOnSubmit={() => {
            setIsRejectModalOpen(true);
          }}
          actionSaveLabel={t("PROCEED_TO_SIGN")}
          actionSaveOnSubmit={() => {
            setStepper(1);
          }}
          formId="modal-action"
          headerBarMainStyle={{ height: "50px" }}
        >
          {MemoDocViewerWrapper}
        </Modal>
      )}
      {stepper === 1 && !openUploadSignatureModal && !isSigned && (
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
                  // uri={uri}
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
      {stepper === 1 && openUploadSignatureModal && (
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
        />
      )}
      {stepper === 1 && !openUploadSignatureModal && isSigned && (
        <Modal
          headerBarMain={<Heading label={t("ADD_SIGNATURE")} />}
          headerBarEnd={<CloseBtn onClick={handleCancel} />}
          actionCancelLabel={t("CS_COMMON_BACK")}
          actionCancelOnSubmit={handleCancel}
          actionSaveLabel={t("SUBMIT_BUTTON")}
          actionSaveOnSubmit={() => {
            setStepper(2);
          }}
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
      {stepper === 2 && (
        <Modal
          actionCancelLabel={t("DOWNLOAD_ORDER")}
          actionCancelOnSubmit={() => {}}
          actionSaveLabel={"Close"}
          actionSaveOnSubmit={() => setShowBulkSignModal(false)}
          className={"orders-success-modal"}
          cancelButtonBody={<FileDownloadIcon></FileDownloadIcon>}
        >
          <div style={{ padding: "8px 24px" }}>
            <div>
              <Banner
                whichSvg={"tick"}
                successful={true}
                message={t("You have successfully signed the Bail Bonds.")}
                headerStyles={{ fontSize: "32px" }}
                style={{ minWidth: "100%", marginTop: "10px" }}
              ></Banner>
            </div>
          </div>
        </Modal>
      )}

      {isRejectModalOpen && (
        <Modal
          headerBarMain={<Heading label={t("REJECT_BAIL_BOND")} />}
          headerBarEnd={<CloseBtn onClick={() => setIsRejectModalOpen(false)} />}
          actionCancelLabel={t("CS_COMMON_CANCEL")}
          actionCancelOnSubmit={() => setIsRejectModalOpen(false)}
          actionSaveLabel={t("REJECT")}
          actionSaveOnSubmit={() => {
            setIsRejectModalOpen(false);
            setShowBulkSignModal(false);
          }}
          className="reject-modal"
        >
          <div className="reject-modal-content">
            <p>{t("REJECT_BAIL_BOND_CONFIRMATION")}</p>
          </div>
        </Modal>
      )}
    </div>
  );
};
