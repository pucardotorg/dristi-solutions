import { Button } from "@egovernments/digit-ui-components";
import React, { useEffect, useMemo, useState } from "react";
import Modal from "../../../dristi/src/components/Modal";
import { Urls } from "../hooks/services/Urls";
import { FileUploadIcon } from "../../../dristi/src/icons/svgIndex";
import AuthenticatedLink from "@egovernments/digit-ui-module-dristi/src/Utils/authenticatedLink";
import { getAuthorizedUuid } from "@egovernments/digit-ui-module-dristi/src/Utils";
import { CloseBtn, Heading } from "@egovernments/digit-ui-module-dristi/src/components/ModalComponents";
import CustomToast from "@egovernments/digit-ui-module-dristi/src/components/CustomToast";
import { SIGNATURE_UPLOAD_CONFIG, buildUploadModalConfig, UploadModal } from "@egovernments/digit-ui-module-common";

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
  const pageModule = "ci";
  const [openUploadSignatureModal, setOpenUploadSignatureModal] = useState(false);
  const [loader, setLoader] = useState(false);
  const [fileUploadError, setFileUploadError] = useState(null);
  const [showToast, setShowToast] = useState(null);
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const uri = `${window.location.origin}${Urls.FileFetchById}?tenantId=${tenantId}&fileStoreId=${applicationPdfFileStoreId}`;
  const name = "Signature";
  const advocatePlaceholder = "Advocate Signature";
  const mockESignEnabled = window?.globalConfigs?.getConfig("mockESignEnabled") === "true" ? true : false;
  const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
  const userUuid = userInfo?.uuid; // use userUuid only if required explicitly, otherwise use only authorizedUuid.
  const authorizedUuid = getAuthorizedUuid(userUuid);

  const applicationPlaceHolder = useMemo(() => {
    if (applicationType === "APPLICATION_TO_CHANGE_POWER_OF_ATTORNEY_DETAILS") {
      return name;
    } else {
      return advocatePlaceholder;
    }
  }, [applicationType]);

  const uploadModalConfig = useMemo(() => buildUploadModalConfig(name, SIGNATURE_UPLOAD_CONFIG), [name]);

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

  const onSubmit = async (combineResult) => {
    if (formData?.uploadSignature?.Signature?.length > 0) {
      try {
        setLoader(true);
        const filesToUpload = combineResult?.combinedFiles || formData?.uploadSignature?.Signature;
        const uploadedFileId = await uploadDocuments(filesToUpload, tenantId);
        setSignedDocumentUploadID(uploadedFileId?.[0]?.fileStoreId);
        setIsSigned(true);
        setOpenUploadSignatureModal(false);
      } catch (error) {
        console.error("error", error);
        setFormData({});
        setIsSigned(false);
        const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
        const errorCode = error?.response?.data?.Errors?.[0]?.code || "CS_FILE_UPLOAD_ERROR";
        setFileUploadError(errorCode);
        setShowToast({ label: t(errorCode), error: true, errorId });
      } finally {
        setLoader(false);
      }
    }
  };

  useEffect(() => {
    checkSignStatus(name, formData, uploadModalConfig, onSelect, setIsSigned);
  }, [checkSignStatus]);

  const handleClickEsign = () => {
    if (mockESignEnabled) {
      setIsSigned(true);
    } else {
      sessionStorage.setItem("applicationPDF", applicationPdfFileStoreId);
      handleEsign(name, pageModule, applicationPdfFileStoreId, setShowToast, t, applicationPlaceHolder);
    }
  };

  return (
    <React.Fragment>
      {!openUploadSignatureModal ? (
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
                  {authorizedUuid === userUuid && ( // Alllowing only for senior adv himself, not junior adv/clerks
                    <Button
                      label={t("CS_ESIGN_AADHAR")}
                      onClick={handleClickEsign}
                      className={"aadhar-sign-in"}
                      labelClassName={"submission-aadhar-sign-in"}
                    ></Button>
                  )}
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
        <UploadModal
          t={t}
          key={name}
          name={name}
          onClose={() => setOpenUploadSignatureModal(false)}
          onSelect={onSelect}
          formData={formData}
          onSubmit={onSubmit}
          isDisabled={loader}
          isParentLoading={loader}
          fileUploadError={fileUploadError}
          submitLabel={"CS_SUBMIT_SIGNATURE"}
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
}

export default SubmissionSignatureModal;
