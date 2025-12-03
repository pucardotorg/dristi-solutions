import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Banner, Button, Loader } from "@egovernments/digit-ui-react-components";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import { CloseSvg, InfoCard } from "@egovernments/digit-ui-components";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import CustomChip from "@egovernments/digit-ui-module-dristi/src/components/CustomChip";
import { FileDownloadIcon, FileUploadIcon } from "@egovernments/digit-ui-module-dristi/src/icons/svgIndex";
import AuthenticatedLink from "@egovernments/digit-ui-module-dristi/src/Utils/authenticatedLink";
import { Urls } from "../../hooks";

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
      <CustomChip text={props.status} shade={"green"} />
    </div>
  );
};

const _getLabel = (status, userType, isJudge) => {
  if (userType === "EMPLOYEE") {
    if (status === "PENDING_E-SIGN") {
      return "EDIT";
    } else if (status === "PENDING_REVIEW" && isJudge) {
      return "PROCEED_TO_SIGN";
    }
    return null;
  } else {
    if (status === "PENDING_E-SIGN" && !isJudge) {
      return "PROCEED_TO_SIGN";
    }
    return null;
  }
};

const DigitizesDocumentModal = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const courtId = localStorage.getItem("courtId");
  const { caseId, filingNumber, documentNumber } = Digit.Hooks.useQueryParams();
  const userInfo = Digit.UserService.getUser()?.info;
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo?.type]);
  const roles = useMemo(() => userInfo?.roles, [userInfo]);
  const isCitizen = useMemo(() => roles?.some((role) => role.code === "CITIZEN"), [roles]);
  const isJudge = useMemo(() => roles?.some((role) => role.code === "JUDGE_ROLE"), [roles]);
  const [stepper, setStepper] = useState(0);
  const [loader, setLoader] = useState(false);
  const DocViewerWrapper = Digit?.ComponentRegistryService?.getComponent("DocViewerWrapper");
  const UploadSignatureModal = window?.Digit?.ComponentRegistryService?.getComponent("UploadSignatureModal");
  const { downloadPdf } = Digit.Hooks.dristi.useDownloadCasePdf();
  const [openUploadSignatureModal, setOpenUploadSignatureModal] = useState(false);
  const [pleaSignedPdf, setPleaSignedPdf] = useState("");
  const [isSigned, setIsSigned] = useState(false);
  const [formData, setFormData] = useState({});
  const name = "Signature";
  const pageModule = "en";
  const { uploadDocuments } = Digit.Hooks.orders.useDocumentUpload();
  const { handleEsign, checkSignStatus } = Digit.Hooks.orders.useESign();

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

  const { data: digitalizedDocumentResponse, isLoading: isDigitalizedDocumentResponseLoading } = Digit.Hooks.submissions.useSearchDigitalization(
    {
      criteria: {
        documentNumber: documentNumber,
        ...(courtId && { courtId: courtId }),
        tenantId,
      },
    },
    {},
    `digitilization-${documentNumber}`,
    Boolean(documentNumber)
  );

  const digitalizedDocumentResponseDetails = useMemo(() => {
    return digitalizedDocumentResponse?.documents?.[0] || {};
  }, [digitalizedDocumentResponse]);

  const digitilizationDocs = useMemo(() => {
    return digitalizedDocumentResponseDetails?.documents || [];
  }, [digitalizedDocumentResponseDetails]);

  const handleCancel = () => {
    sessionStorage.setItem("documents-activeTab", "Digitalization Forms");
    sessionStorage.removeItem("fileStoreId");
    history.replace(`/${window?.contextPath}/${userType}/dristi/home/view-case?caseId=${caseId}&filingNumber=${filingNumber}&tab=Documents`);
  };

  const isSign = useMemo(() => {
    if (isCitizen) {
      return false;
    }

    if (["VOID", "COMPLETED"]?.includes(digitalizedDocumentResponseDetails?.status)) {
      return false;
    }
    return true;
  }, [digitalizedDocumentResponseDetails, isCitizen]);

  const customStyles = `
      .popup-module.review-submission-appl-modal .popup-module-main .popup-module-action-bar .selector-button-primary  {
        background-color: #007e7e !important;
      };
      `;
  const MemoizedDocViewers = useMemo(() => {
    return (
      <React.Fragment>
        {digitilizationDocs?.map((docs) => (
          <DocViewerWrapper
            key={docs.fileStore}
            fileStoreId={docs.fileStore}
            tenantId={tenantId}
            docWidth="100%"
            docHeight="unset"
            showDownloadOption={false}
            documentName={docs?.name}
          />
        ))}
      </React.Fragment>
    );
  }, [digitilizationDocs, tenantId]);

  const handleDownload = async () => {
    try {
      const fileStoreId = digitilizationDocs?.[0]?.fileStore;
      await downloadPdf(tenantId, fileStoreId);
    } catch (error) {
      console.log("Error: ", error);
    }
  };

  const onESignClick = useCallback(() => {
    try {
      setLoader(true);
      sessionStorage.setItem("digitilization", stepper);
      sessionStorage.setItem("documents-activeTab", "Digitalization Forms");
      handleEsign(name, pageModule, digitilizationDocs?.[0]?.fileStore, "Signature of the Magistrate");
    } catch (error) {
      console.error("E-sign navigation error:", error);
      setLoader(false);
    } finally {
      setLoader(false);
    }
  }, [stepper, handleEsign, digitilizationDocs]);

  const onUploadSubmit = useCallback(async () => {
    if (formData?.uploadSignature?.Signature?.length > 0) {
      try {
        setLoader(true);
        const uploadedFileId = await uploadDocuments(formData?.uploadSignature?.Signature, tenantId);
        setIsSigned(true);
        setOpenUploadSignatureModal(false);
        setPleaSignedPdf(uploadedFileId?.[0]?.fileStoreId);
      } catch (error) {
        console.error("error", error);
      } finally {
        setLoader(false);
      }
    }
  }, [formData, uploadDocuments, tenantId]);

  const uploadSignedPdf = async () => {
    try {
      setLoader(true);
      const localStorageID = sessionStorage.getItem("fileStoreId");
      const newFilestore = pleaSignedPdf || localStorageID;

      const documents = Array.isArray(digitalizedDocumentResponseDetails?.documents) ? digitalizedDocumentResponseDetails.documents : [];
      let name = "";
      if (digitalizedDocumentResponseDetails?.type === "PLEA") {
        name = digitalizedDocumentResponseDetails?.pleaDetails?.accusedName;
      } else {
        name = digitalizedDocumentResponseDetails?.examinationOfAccusedDetails?.accusedName;
      }
      const documentsFile = newFilestore
        ? [
            {
              fileStore: newFilestore,
              documentType: "SIGNED",
              additionalDetails: {
                name: `${t(digitalizedDocumentResponseDetails?.type)} (${name}).pdf`,
              },
              tenantId,
            },
          ]
        : null;

      const payload = {
        digitalizedDocument: {
          ...digitalizedDocumentResponseDetails,
          documents: documentsFile ? [...documentsFile] : documents,
          workflow: {
            ...digitalizedDocumentResponseDetails.workflow,
            action: "SIGN",
          },
        },
      };

      await Digit.submissionService.updateDigitalization(payload, tenantId);
      setPleaSignedPdf(newFilestore);
      sessionStorage.removeItem("fileStoreId");
      setStepper(stepper + 1);
    } catch (error) {
      console.error("Error :", error);
    } finally {
      setLoader(false);
    }
  };

  const handleSubmit = async () => {
    const userType = isCitizen ? "CITIZEN" : "EMPLOYEE";
    const label = _getLabel(digitalizedDocumentResponseDetails?.status, userType, isJudge);

    if (label === "EDIT") {
      try {
        setLoader(true);
        const payload = {
          digitalizedDocument: {
            ...digitalizedDocumentResponseDetails,
            workflow: {
              ...digitalizedDocumentResponseDetails.workflow,
              action: "EDIT",
            },
          },
        };
        await Digit.submissionService.updateDigitalization(payload, tenantId);
        if (digitalizedDocumentResponseDetails?.type === "PLEA") {
          history.replace(`/${window?.contextPath}/employee/submissions/plea?filingNumber=${filingNumber}&documentNumber=${documentNumber}`);
        }
        if (digitalizedDocumentResponseDetails?.type === "EXAMINATION_OF_ACCUSED") {
          history.replace(
            `/${
              window?.contextPath
            }/employee/dristi/home/view-case?caseId=${caseId}&filingNumber=${filingNumber}&tab=Documents&openExaminationModal=${true}&examinationDocNumber=${documentNumber}`
          );
        }
      } catch (error) {
        console.error("Error :", error);
      } finally {
        setLoader(false);
      }
    } else {
      setStepper(1);
    }
  };

  useEffect(() => {
    checkSignStatus(name, formData, uploadModalConfig, onSelect, setIsSigned);
  }, [checkSignStatus, name, formData, uploadModalConfig, setIsSigned]);

  useEffect(() => {
    const isSignSuccess = sessionStorage.getItem("esignProcess");
    const step = sessionStorage.getItem("digitilization");
    if (isSignSuccess) {
      setStepper(step);

      const cleanupTimer = setTimeout(() => {
        sessionStorage.removeItem("esignProcess");
        sessionStorage.removeItem("digitilization");
      }, 2000);

      return () => clearTimeout(cleanupTimer);
    }
  }, []);

  if (isDigitalizedDocumentResponseLoading) {
    return <Loader />;
  }

  return (
    <div>
      <style>{customStyles}</style>
      {loader && (
        <div
          style={{
            width: "100vw",
            height: "100vh",
            zIndex: "10001",
            position: "fixed",
            right: "0",
            display: "flex",
            top: "0",
            background: "rgb(234 234 245 / 50%)",
            alignItems: "center",
            justifyContent: "center",
          }}
          className="submit-loader"
        >
          <Loader />
        </div>
      )}

      {stepper === 0 && (
        <Modal
          headerBarEnd={<CloseBtn onClick={handleCancel} />}
          headerBarMain={<Heading label={t(digitalizedDocumentResponseDetails?.type)} status={t(digitalizedDocumentResponseDetails?.status)} />}
          popupStyles={{ width: "70vw", minHeight: "75vh", maxheight: "90vh" }}
          actionCancelLabel={t("CS_COMMON_DOWNLOAD")}
          actionCancelOnSubmit={handleDownload}
          actionSaveLabel={isSign ? t(_getLabel(digitalizedDocumentResponseDetails?.status, isCitizen ? "CITIZEN" : "EMPLOYEE", isJudge)) : null}
          actionSaveOnSubmit={handleSubmit}
          formId="modal-action"
          headerBarMainStyle={{ minHeight: "50px" }}
          className={"review-submission-appl-modal bail-bond"}
          isDisabled={isDigitalizedDocumentResponseLoading}
          isBackButtonDisabled={isDigitalizedDocumentResponseLoading}
          style={{ backgroundColor: "#007e7e !important" }}
          textStyle={{ color: "#fff", fontSize: "1.2rem", fontWeight: "600", margin: "0px" }}
        >
          <div className="review-submission-appl-body-main">
            <div className="application-details">
              <div className="application-view">
                {isDigitalizedDocumentResponseLoading ? <Loader /> : <React.Fragment>{MemoizedDocViewers}</React.Fragment>}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {stepper === 1 && !openUploadSignatureModal && !isSigned && (
        <Modal
          headerBarMain={<Heading label={t("ADD_SIGNATURE")} />}
          headerBarEnd={<CloseBtn onClick={handleCancel} />}
          actionCancelLabel={t("CS_COMMON_BACK")}
          actionCancelOnSubmit={handleCancel}
          actionSaveLabel={t("CS_COMMON_SUBMIT")}
          isDisabled={!isSigned}
          actionSaveOnSubmit={() => {}}
          className="add-signature-modal"
        >
          <div className="add-signature-main-div">
            <div className="not-signed">
              <InfoCard
                variant={"default"}
                label={t("PLEASE_NOTE")}
                additionalElements={[
                  <p key="note">{`${t("YOU_ARE_ADDING_YOUR_SIGNATURE_TO_THE")} ${t(digitalizedDocumentResponseDetails?.type)}`}</p>,
                ]}
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
                <h2>{t("DOWNLOAD_BAILBOND_TEXT")}</h2>
                <AuthenticatedLink
                  uri={`${window.location.origin}${Urls.FileFetchById}?tenantId=${tenantId}&fileStoreId=${digitilizationDocs?.[0]?.fileStore}`}
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
          actionSaveOnSubmit={uploadSignedPdf}
          className="add-signature-modal"
        >
          <div className="add-signature-main-div">
            <InfoCard
              variant={"default"}
              label={t("PLEASE_NOTE")}
              additionalElements={[<p key="note">{`${t("YOU_ARE_ADDING_YOUR_SIGNATURE_TO_THE")} ${t(digitalizedDocumentResponseDetails?.type)}`}</p>]}
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
          actionCancelLabel={t("CS_COMMON_DOWNLOAD")}
          actionCancelOnSubmit={() => {
            downloadPdf(tenantId, pleaSignedPdf || sessionStorage.getItem("fileStoreId"));
          }}
          actionSaveLabel={t("BULK_SUCCESS_CLOSE")}
          actionSaveOnSubmit={() => handleCancel}
          className={"orders-success-modal"}
          cancelButtonBody={<FileDownloadIcon></FileDownloadIcon>}
        >
          <div style={{ padding: "8px 24px" }}>
            <div>
              <Banner
                whichSvg={"tick"}
                successful={true}
                message={`${t("YOU_HAVE_SUCCESSFULLY_ISSUED")} ${t(digitalizedDocumentResponseDetails?.type)}`}
                headerStyles={{ fontSize: "32px" }}
                style={{ minWidth: "100%", marginTop: "10px" }}
              ></Banner>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DigitizesDocumentModal;
