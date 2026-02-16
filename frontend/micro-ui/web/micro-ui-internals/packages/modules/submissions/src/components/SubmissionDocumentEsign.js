import React, { useState, useMemo, useEffect, useContext } from "react";
import useESign from "@egovernments/digit-ui-module-orders/src/hooks/orders/useESign";
import useDocumentUpload from "@egovernments/digit-ui-module-orders/src/hooks/orders/useDocumentUpload";
import { FileUploadIcon } from "@egovernments/digit-ui-module-dristi/src/icons/svgIndex";
import { Urls } from "../hooks/services/Urls";
import Button from "@egovernments/digit-ui-module-dristi/src/components/Button";
import { getAuthorizedUuid } from "@egovernments/digit-ui-module-dristi/src/Utils";
import { AdvocateDataContext } from "@egovernments/digit-ui-module-core";

function SubmissionDocumentEsign({ t, setSignedId, setIsSignedHeading, setSignedDocumentUploadID, combinedFileStoreId }) {
  const [isSigned, setIsSigned] = useState(false);
  const { handleEsign, checkSignStatus } = useESign();
  const [formData, setFormData] = useState({}); // storing the file upload data
  const [openUploadSignatureModal, setOpenUploadSignatureModal] = useState(false);
  const UploadSignatureModal = window?.Digit?.ComponentRegistryService?.getComponent("UploadSignatureModal");
  const userInfo = Digit.UserService.getUser()?.info;
  const isEmployee = useMemo(() => userInfo?.type === "EMPLOYEE", [userInfo]);
  const [pageModule, setPageModule] = useState(() => (isEmployee ? "en" : "ci")); // here
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const uri = `${window.location.origin}${Urls.FileFetchById}?tenantId=${tenantId}&fileStoreId=${combinedFileStoreId}`;
  const { uploadDocuments } = useDocumentUpload();
  const mockESignEnabled = window?.globalConfigs?.getConfig("mockESignEnabled") === "true" ? true : false;
  const userUuid = userInfo?.uuid; // use userUuid only if required explicitly, otherwise use only authorizedUuid.
  const authorizedUuid = getAuthorizedUuid(userUuid);
  const { AdvocateData } = useContext(AdvocateDataContext);
  const storedAdvocate = AdvocateData;

  const name = "Signature";
  const isAdvocateOrClerk = userInfo?.roles?.some((role) => ["ADVOCATE_ROLE", "ADVOCATE_CLERK_ROLE"].includes(role.code));

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
      setIsSignedHeading(false);
      setSignedDocumentUploadID(null);
      setSignedId(null);
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [key]: value,
      }));
    }
  };

  const cleanString = (input) => {
    if (typeof input !== "string") return "";
    return input
      .replace(/\b(null|undefined)\b/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const onSubmit = async () => {
    if (formData?.uploadSignature?.Signature?.length > 0) {
      try {
        const uploadedFileId = await uploadDocuments(formData?.uploadSignature?.Signature, tenantId);
        setSignedDocumentUploadID(uploadedFileId?.[0]?.fileStoreId);
        setSignedId(uploadedFileId?.[0]?.fileStoreId);
        setIsSigned(true);
        setIsSignedHeading(true);
        setOpenUploadSignatureModal(false);
      } catch (error) {
        console.error("error", error);
        setFormData({});
      }
    }
  };

  useEffect(() => {
    checkSignStatus(name, formData, uploadModalConfig, onSelect, setIsSigned, setIsSignedHeading);
  }, [checkSignStatus]);

  const handleClickEsign = () => {
    if (mockESignEnabled) {
      setIsSigned(true);
      setIsSignedHeading(true);
    } else {
      sessionStorage.setItem("combineDocumentsPdf", combinedFileStoreId);
      handleEsign(name, pageModule, combinedFileStoreId);
    }
  };

  return !openUploadSignatureModal ? (
    <div style={{ padding: "30px 30px 5px 30px", width: "80%" }}>
      {!isSigned ? (
        <div>
          <h1 style={{ fontFamily: "Roboto", fontSize: "24px", fontWeight: 700, lineHeight: "28.13px", textAlign: "left" }}>
            {t("SUBMISSION_DOCUMENT_ADD_SIGNATURE")}
          </h1>
          <div>
            <h2 style={{ fontFamily: "Roboto", fontSize: "16px", fontWeight: 400, lineHeight: "18.75px", textAlign: "left" }}>
              {authorizedUuid === userUuid
                ? t("SUBMISSION_DOCUMENT_SIGNATURE_SUBTEXT_MAIN")
                : t("SUBMISSION_DOCUMENT_SIGNATURE_SUBTEXT_CLERK_OR_JUNIOR_ADV")}
            </h2>
          </div>
          <div style={{ display: "flex" }}>
            {authorizedUuid === userUuid && ( // only advocate himself can esign. not junior adv/clerk
              <Button
                label={""}
                onButtonClick={handleClickEsign}
                style={{ boxShadow: "none", backgroundColor: "#007E7E", border: "none", padding: "20px 30px", maxWidth: "fit-content" }}
                textStyles={{
                  width: "unset",
                }}
              >
                <h1
                  style={{
                    fontFamily: "Roboto",
                    fontSize: "16px",
                    fontWeight: 700,
                    lineHeight: "18.75px",
                    textAlign: "center",
                    color: "#FFFFFF",
                  }}
                >
                  {t("CS_ESIGN")}
                </h1>
              </Button>
            )}
            <Button
              icon={<FileUploadIcon />}
              label={""}
              onButtonClick={() => {
                setOpenUploadSignatureModal(true);
              }}
              style={{ boxShadow: "none", background: "none", border: "none", padding: "20px 10px", maxWidth: "fit-content" }}
              textStyles={{
                width: "unset",
              }}
            >
              <h1
                style={{
                  fontFamily: "Roboto",
                  fontSize: "16px",
                  fontWeight: 700,
                  lineHeight: "18.75px",
                  textAlign: "center",
                  color: "#007E7E",
                }}
              >
                {t("UPLOAD_DIGITAL_SIGN_CERTI")}
              </h1>
            </Button>
          </div>
        </div>
      ) : (
        <div style={{ background: "#ECF3FD", padding: "8px 16px", borderRadius: "4px" }}>
          <div
            style={{
              paddingBottom: "20px",
              fontFamily: "Roboto",
              fontSize: "16px",
              fontWeight: 400,
              lineHeight: "18.75px",
              textAlign: "left",
              color: "#3D3C3C",
            }}
          >
            {t("E_SIGNED_BY")}
          </div>
          <div
            style={{
              fontFamily: "Roboto",
              fontSize: "20px",
              fontWeight: 500,
              lineHeight: "23.44px",
              textAlign: "left",
              color: "#000000",
              fontStyle: "italic",
              paddingBottom: "10px",
            }}
          >
            {isAdvocateOrClerk && storedAdvocate?.advocateName ? cleanString(storedAdvocate?.advocateName) : cleanString(userInfo?.name)}
          </div>
          {isAdvocateOrClerk && <div>{t("ADVOCATE_KERALA_HIGH_COURT")}</div>}
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
    />
  );
}

export default SubmissionDocumentEsign;
