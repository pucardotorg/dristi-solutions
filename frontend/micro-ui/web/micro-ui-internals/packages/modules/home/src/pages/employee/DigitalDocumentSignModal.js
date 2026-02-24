import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CloseSvg, InfoCard } from "@egovernments/digit-ui-components";
import { Button, Loader } from "@egovernments/digit-ui-react-components";
import { FileDownloadIcon, FileUploadIcon } from "@egovernments/digit-ui-module-dristi/src/icons/svgIndex";
import AuthenticatedLink from "@egovernments/digit-ui-module-dristi/src/Utils/authenticatedLink";
import { Banner } from "@egovernments/digit-ui-react-components";
import { Urls } from "../../hooks";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import CustomChip from "@egovernments/digit-ui-module-dristi/src/components/CustomChip";

export const clearDigitalDocumentSessionData = () => {
  sessionStorage.removeItem("esignProcess");
  sessionStorage.removeItem("digitalDocumentStepper");
  sessionStorage.removeItem("digitalDocumentFileStoreId");
  sessionStorage.removeItem("bulkDigitalDocumentSignSelectedItem");
  sessionStorage.removeItem("signStatus");
  sessionStorage.removeItem("bulkDigitalDocumentSignlimit");
  sessionStorage.removeItem("bulkDigitalDocumentSignoffset");
  sessionStorage.removeItem("homeActiveTab");
};

const createRoleActionMapping = {
  EXAMINATION_OF_ACCUSED: ["EXAMINATION_CREATOR", "EXAMINATION_EDITOR"],
  PLEA: ["PLEA_CREATOR", "PLEA_EDITOR"],
  MEDIATION: ["MEDIATION_CREATOR", "MEDIATION_EDITOR"],
};

const signRoleActionMapping = {
  EXAMINATION_OF_ACCUSED: ["EXAMINATION_APPROVER"],
  PLEA: ["PLEA_APPROVER"],
  MEDIATION: ["MEDIATION_APPROVER"],
};

const checkIfRolesPresentForGivenUserAndAction = (userRoles, action, docType) => {
  if (action === "edit") {
    const requiredRoles = createRoleActionMapping[docType]; // create and edit actions have same required roles.
    let isAllowed = true;
    for (const role of requiredRoles) {
      if (!userRoles?.some((r) => r?.code === role)) {
        isAllowed = false;
        break;
      }
    }
    return isAllowed;
  } else if (action === "sign") {
    const requiredRoles = signRoleActionMapping[docType];
    let isAllowed = true;
    for (const role of requiredRoles) {
      if (!userRoles?.some((r) => r?.code === role)) {
        isAllowed = false;
        break;
      }
    }
    return isAllowed;
  }
};

const _getLabel = (status, userType, roles, docType) => {
  if (userType === "EMPLOYEE") {
    if (status === "PENDING_E-SIGN" && checkIfRolesPresentForGivenUserAndAction(roles, "edit", docType)) {
      return "EDIT";
    } else if (status === "PENDING_REVIEW" && checkIfRolesPresentForGivenUserAndAction(roles, "sign", docType)) {
      return "PROCEED_TO_SIGN";
    }
    return null;
  } else {
    if (status === "PENDING_E-SIGN") {
      return "PROCEED_TO_SIGN";
    }
    return null;
  }
};

export const DigitalDocumentSignModal = ({
  selectedDigitizedDocument,
  setShowBulkSignModal = () => {},
  digitalDocumentPaginationData,
  setCounter = () => {},
}) => {
  const queryStrings = Digit.Hooks.useQueryParams();

  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const courtId = localStorage.getItem("courtId");
  const userInfo = Digit.UserService.getUser()?.info;
  const roles = useMemo(() => userInfo?.roles, [userInfo]);
  const isCitizen = useMemo(() => roles?.some((role) => role.code === "CITIZEN"), [roles]);

  const [stepper, setStepper] = useState(() => {
    const bulkDigitalDocumentSignSelectedItem = sessionStorage.getItem("bulkDigitalDocumentSignSelectedItem");
    if (
      bulkDigitalDocumentSignSelectedItem &&
      JSON.parse(bulkDigitalDocumentSignSelectedItem)?.businessObject?.digitalizedDocumentDetails?.documentNumber ===
        selectedDigitizedDocument?.businessObject?.digitalizedDocumentDetails?.documentNumber
    ) {
      const savedStepper = sessionStorage.getItem("digitalDocumentStepper");
      return savedStepper ? parseInt(savedStepper) : 0;
    }
    return 0;
  });

  const [effectiveRowData, setEffectiveRowData] = useState(selectedDigitizedDocument);
  const selectedDigitalDocumentFilestoreid =
    effectiveRowData?.businessObject?.digitalizedDocumentDetails?.documents?.find((doc) => doc.documentType === "SIGNED")?.fileStore ||
    effectiveRowData?.documents?.find((doc) => doc.documentType === "SIGNED")?.fileStore;

  const [openUploadSignatureModal, setOpenUploadSignatureModal] = useState(false);
  const { t } = useTranslation();
  const history = useHistory();
  const userType = useMemo(() => (isCitizen ? "citizen" : "employee"), [isCitizen]);
  const caseId = queryStrings?.caseId || history?.location?.state?.state?.params?.caseId;
  const filingNumber = queryStrings?.filingNumber || history?.location?.state?.state?.params?.filingNumber;

  const { downloadPdf } = Digit.Hooks.dristi.useDownloadCasePdf();

  const Modal = window?.Digit?.ComponentRegistryService?.getComponent("Modal");
  const DocViewerWrapper = Digit?.ComponentRegistryService?.getComponent("DocViewerWrapper");
  const { handleEsign, checkSignStatus } = Digit.Hooks.orders.useESign();

  const UploadSignatureModal = window?.Digit?.ComponentRegistryService?.getComponent("UploadSignatureModal");
  const [isSigned, setIsSigned] = useState(false);

  const [formData, setFormData] = useState({});
  const [digitalDocumentSignedPdf, setDigitalDocumentSignedPdf] = useState("");
  const [loader, setLoader] = useState(false);
  const [documentFiles, setDocumentFiles] = useState([]);
  const [documentLoader, setDocumentLoader] = useState(false);
  const name = "Signature";
  const pageModule = "en";
  const { uploadDocuments } = Digit.Hooks.orders.useDocumentUpload();
  const [isEditModal, setIsEditModal] = useState(false);
  const mockESignEnabled = window?.globalConfigs?.getConfig("mockESignEnabled") === "true" ? true : false;

  useEffect(() => {
    const fetchDocumentData = async () => {
      try {
        setDocumentLoader(true);
        if (
          queryStrings?.documentNumber ||
          selectedDigitizedDocument?.businessObject?.digitalizedDocumentDetails?.documentNumber ||
          selectedDigitizedDocument?.documentNumber
        ) {
          const searchDocumentResponse = await Digit.submissionService.searchDigitalization({
            criteria: {
              tenantId: tenantId,
              courtId: courtId,
              documentNumber:
                queryStrings.documentNumber ||
                selectedDigitizedDocument?.businessObject?.digitalizedDocumentDetails?.documentNumber ||
                selectedDigitizedDocument?.documentNumber,
              fuzzySearch: false,
            },
            pagination: {
              limit: 10,
              offSet: 0,
            },
          });
          const documentData = searchDocumentResponse?.documents?.[0];
          setEffectiveRowData(documentData);

          setDocumentFiles(documentData?.documents || []);
        }
        setDocumentLoader(false);
      } catch (error) {
        setDocumentLoader(false);
      }
    };
    fetchDocumentData();
  }, [
    queryStrings.documentNumber,
    tenantId,
    courtId,
    selectedDigitizedDocument?.documentNumber,
    selectedDigitizedDocument?.businessObject?.digitalizedDocumentDetails?.documentNumber,
  ]);

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
        <CustomChip text={props.status} shade={"green"} />
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
        setIsSigned(true);
        setOpenUploadSignatureModal(false);
        setDigitalDocumentSignedPdf(uploadedFileId?.[0]?.fileStoreId);
        clearDigitalDocumentSessionData();
      } catch (error) {
        console.error("error", error);
      } finally {
        setLoader(false);
      }
    }
  }, [formData, uploadDocuments, tenantId]);

  const updateDigitalDocument = async ({ documentNumber, Action, fileStoreId }) => {
    try {
      setLoader(true);
      await Digit.submissionService
        .searchDigitalization({
          criteria: {
            tenantId: tenantId,
            courtId: courtId,
            documentNumber: documentNumber,
            fuzzySearch: false,
          },
          pagination: {
            limit: 10,
            offSet: 0,
          },
        })
        .then(async (res) => {
          if (res?.documents?.length > 0) {
            const documentDetails = res?.documents?.[0];
            let name = "";
            if (documentDetails?.type === "PLEA") {
              name = documentDetails?.pleaDetails?.accusedName;
            } else {
              name = documentDetails?.examinationOfAccusedDetails?.accusedName;
            }
            const payload = {
              digitalizedDocument: {
                ...documentDetails,
                documents: [
                  ...(fileStoreId
                    ? [
                        {
                          documentType: "SIGNED",
                          fileStore: fileStoreId,
                          additionalDetails: {
                            name: `${t(documentDetails?.type)} (${name}).pdf`,
                          },
                        },
                      ]
                    : []),
                ],
                workflow: { action: Action },
              },
            };
            await Digit.submissionService.updateDigitalization(payload, { tenantId }).then((res) => {
              setTimeout(() => {
                if (!fileStoreId && setCounter && typeof setCounter === "function") setCounter((prev) => parseInt(prev) + 1);
                if (fileStoreId) {
                  setIsSigned(false);

                  setFormData({});
                  clearDigitalDocumentSessionData();
                  setStepper(2);
                } else {
                  setShowBulkSignModal(false);
                  if (queryStrings?.documentNumber) {
                    clearDigitalDocumentSessionData();
                    if (Action !== "EDIT") {
                      if (userType && caseId && filingNumber) {
                        sessionStorage.setItem("documents-activeTab", "Digitalization Forms");
                        history.push(
                          `/${window?.contextPath}/${userType}/dristi/home/view-case?caseId=${caseId}&filingNumber=${filingNumber}&tab=Documents`
                        );
                      } else history.push(`/${window?.contextPath}/${userType}/home/home-screen`);
                    }
                  }
                }
                setLoader(false);
              }, 1000);
            });
          }
        });
    } catch (error) {
      throw error;
    }
  };

  const handleCancel = useCallback(() => {
    sessionStorage.removeItem("fileStoreId");
    if (parseInt(stepper) === 0) {
      setShowBulkSignModal(false);
      if (queryStrings?.documentNumber) {
        clearDigitalDocumentSessionData();
        if (userType && caseId && filingNumber) {
          sessionStorage.setItem("documents-activeTab", "Digitalization Forms");
          history.push(`/${window?.contextPath}/${userType}/dristi/home/view-case?caseId=${caseId}&filingNumber=${filingNumber}&tab=Documents`);
        } else history.push(`/${window?.contextPath}/${userType}/home/home-screen`);
      }
      return; // Ensure function exits here to prevent double redirection
    } else if (parseInt(stepper) === 1) {
      if (!openUploadSignatureModal && !isSigned) {
        clearDigitalDocumentSessionData();
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
  }, [stepper, openUploadSignatureModal, setShowBulkSignModal, isSigned, queryStrings, userType, caseId, filingNumber, history]);

  useEffect(() => {
    checkSignStatus(name, formData, uploadModalConfig, onSelect, setIsSigned);
  }, [checkSignStatus, name, formData, uploadModalConfig, setIsSigned]);

  const onESignClick = useCallback(() => {
    if (mockESignEnabled) {
      setIsSigned(true);
    } else {
      try {
        setLoader(true);
        sessionStorage.removeItem("fileStoreId");
        sessionStorage.setItem("digitalDocumentStepper", stepper);
        sessionStorage.setItem("bulkDigitalDocumentSignSelectedItem", JSON.stringify(effectiveRowData));
        sessionStorage.setItem("homeActiveTab", "CS_HOME_SIGN_FORMS");
        sessionStorage.setItem("esignProcess", "true");
        if (digitalDocumentPaginationData?.limit) sessionStorage.setItem("bulkDigitalDocumentSignlimit", digitalDocumentPaginationData?.limit);
        if (digitalDocumentPaginationData?.caseTitle)
          sessionStorage.setItem("bulkDigitalDocumentSignCaseTitle", digitalDocumentPaginationData?.caseTitle);
        if (digitalDocumentPaginationData?.offset) sessionStorage.setItem("bulkDigitalDocumentSignoffset", digitalDocumentPaginationData?.offset);
        handleEsign(name, pageModule, selectedDigitalDocumentFilestoreid, "Signature of Magistrate");
      } catch (error) {
        console.error("E-sign navigation error:", error);
        setLoader(false);
      } finally {
        setLoader(false);
      }
    }
  }, [stepper, effectiveRowData, digitalDocumentPaginationData, handleEsign, selectedDigitalDocumentFilestoreid]);

  const uri = `${window.location.origin}${Urls.FileFetchById}?tenantId=${tenantId}&fileStoreId=${selectedDigitalDocumentFilestoreid}`;
  const uploadSignedPdf = async () => {
    try {
      const localStorageID = sessionStorage.getItem("fileStoreId");
      const newFilestore = digitalDocumentSignedPdf || localStorageID;

      await updateDigitalDocument({
        documentNumber: effectiveRowData?.businessObject?.digitalizedDocumentDetails?.documentNumber || effectiveRowData?.documentNumber,
        Action: "SIGN",
        fileStoreId: newFilestore,
      });
      setDigitalDocumentSignedPdf(newFilestore);
      sessionStorage.removeItem("fileStoreId");
    } catch (error) {
      console.error("Error :", error);
      setIsSigned(false);
      setDigitalDocumentSignedPdf("");
      setFormData({});
      console.error("Error while updating digital document:", error);
      setShowBulkSignModal(false);
      if (queryStrings?.documentNumber) {
        clearDigitalDocumentSessionData();
        if (userType && caseId && filingNumber) {
          sessionStorage.setItem("documents-activeTab", "Digitalization Forms");
          history.push(`/${window?.contextPath}/${userType}/dristi/home/view-case?caseId=${caseId}&filingNumber=${filingNumber}&tab=Documents`);
        } else history.push(`/${window?.contextPath}/${userType}/home/home-screen`);
      }
      setLoader(false);
    }
  };

  const handleSubmit = async () => {
    const userType = isCitizen ? "CITIZEN" : "EMPLOYEE";
    const label = _getLabel(effectiveRowData?.status, userType, roles, effectiveRowData?.type);

    if (label === "EDIT") {
      setIsEditModal(true);
    } else {
      setStepper(1);
    }
  };

  const handleConfirmEdit = async () => {
    try {
      setLoader(true);
      const docsNumber = effectiveRowData?.businessObject?.digitalizedDocumentDetails?.documentNumber || effectiveRowData?.documentNumber;
      await updateDigitalDocument({
        documentNumber: docsNumber,
        Action: "EDIT",
      });
      if (effectiveRowData?.type === "PLEA") {
        history.replace(`/${window?.contextPath}/employee/submissions/record-plea?filingNumber=${filingNumber}&documentNumber=${docsNumber}`);
      }
      if (effectiveRowData?.type === "EXAMINATION_OF_ACCUSED") {
        history.replace(
          `/${
            window?.contextPath
          }/employee/dristi/home/view-case?caseId=${caseId}&filingNumber=${filingNumber}&tab=Documents&openExaminationModal=${true}&examinationDocNumber=${docsNumber}`
        );
      }
    } catch (error) {
      console.error("Error while updating digital document:", error);
      setShowBulkSignModal(false);
    } finally {
      setLoader(false);
    }
  };

  const handleDownload = async () => {
    try {
      const fileStoreId = effectiveRowData?.documents?.[0]?.fileStore;
      await downloadPdf(tenantId, fileStoreId);
    } catch (error) {
      console.error("Error: ", error);
    }
  };

  const isSign = useMemo(() => {
    if (isCitizen) {
      return false;
    }

    if (["VOID", "COMPLETED"]?.includes(effectiveRowData?.status)) {
      return false;
    }
    return true;
  }, [effectiveRowData, isCitizen]);

  const customStyles = `
  .popup-module.review-submission-appl-modal .popup-module-main .popup-module-action-bar .selector-button-primary  {
    background-color: #007e7e !important;
  };
  `;
  const MemoizedDocViewers = useMemo(() => {
    return (
      <React.Fragment>
        {documentFiles?.map((docs) => (
          <DocViewerWrapper
            key={docs.fileStore}
            fileStoreId={docs.fileStore}
            tenantId={tenantId}
            docWidth="100%"
            docHeight="unset"
            showDownloadOption={false}
            documentName={docs?.name || docs?.additionalDetails?.name}
          />
        ))}
      </React.Fragment>
    );
  }, [documentFiles, tenantId]);

  useEffect(() => {
    return () => {
      clearDigitalDocumentSessionData();
    };
  });

  useEffect(() => {
    const clearFileStoreId = () => {
      sessionStorage.removeItem("fileStoreId");
    };
    window.addEventListener("beforeunload", clearFileStoreId);
    window.addEventListener("popstate", clearFileStoreId);
    return () => {
      window.removeEventListener("beforeunload", clearFileStoreId);
      window.removeEventListener("popstate", clearFileStoreId);
    };
  }, []);

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
          headerBarMain={<Heading label={t(effectiveRowData?.type)} status={t(effectiveRowData?.status)} />}
          popupStyles={{ width: "70vw", minHeight: "75vh", maxheight: "90vh" }}
          actionCancelLabel={t("CS_COMMON_DOWNLOAD")}
          actionCancelOnSubmit={handleDownload}
          actionSaveLabel={isSign ? t(_getLabel(effectiveRowData?.status, isCitizen ? "CITIZEN" : "EMPLOYEE", roles, effectiveRowData?.type)) : null}
          actionSaveOnSubmit={handleSubmit}
          formId="modal-action"
          headerBarMainStyle={{ minHeight: "50px" }}
          className={"review-submission-appl-modal bail-bond"}
          isDisabled={documentLoader}
          isBackButtonDisabled={documentLoader}
          style={{ backgroundColor: "#007e7e !important" }}
          textStyle={{ color: "#fff", fontSize: "1.2rem", fontWeight: "600", margin: "0px" }}
        >
          <div className="review-submission-appl-body-main">
            <div className="application-details">
              <div className="application-view doc-preview">
                {documentLoader ? <Loader /> : <React.Fragment>{MemoizedDocViewers}</React.Fragment>}
              </div>
            </div>
          </div>
        </Modal>
      )}
      {/* to select e-sign or upload */}
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
                additionalElements={[<p key="note">{`${t("YOU_ARE_ADDING_YOUR_SIGNATURE_TO_THE")} ${t(effectiveRowData?.type)}`}</p>]}
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
                <h2>{t("DOWNLOAD_DIGITILIZATION_TEXT")}</h2>
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
      {/* upload doc modal */}
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
      {/* after signing showing signed modal */}
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
              additionalElements={[<p key="note">{`${t("YOU_ARE_ADDING_YOUR_SIGNATURE_TO_THE")} ${t(effectiveRowData?.type)}`}</p>]}
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
            downloadPdf(tenantId, digitalDocumentSignedPdf || sessionStorage.getItem("fileStoreId"));
          }}
          actionSaveLabel={t("BULK_SUCCESS_CLOSE")}
          actionSaveOnSubmit={() => {
            if (setCounter && typeof setCounter === "function") setCounter((prev) => parseInt(prev) + 1);
            setShowBulkSignModal(false);
            setDigitalDocumentSignedPdf("");
            if (queryStrings?.documentNumber) {
              clearDigitalDocumentSessionData();
              if (userType && caseId && filingNumber) {
                sessionStorage.setItem("documents-activeTab", "Digitalization Forms");
                history.replace(
                  `/${window?.contextPath}/${userType}/dristi/home/view-case?caseId=${caseId}&filingNumber=${filingNumber}&tab=Documents`
                );
              } else {
                history.replace(`/${window?.contextPath}/${userType}/home/home-screen`);
              }
            }
          }}
          className={"orders-success-modal success-modal"}
          cancelButtonBody={<FileDownloadIcon></FileDownloadIcon>}
        >
          <div style={{ padding: "8px 24px" }}>
            <div>
              <Banner
                whichSvg={"tick"}
                successful={true}
                message={`${t("YOU_HAVE_SUCCESSFULLY_ISSUED")} ${t(effectiveRowData?.type)}`}
                headerStyles={{ fontSize: "32px" }}
                style={{ minWidth: "100%", marginTop: "10px" }}
              ></Banner>
            </div>
          </div>
        </Modal>
      )}

      {isEditModal && (
        <Modal
          headerBarMain={<Heading label={`${t("EDIT_DIGITILIZATION_MODAL_HEADER")} ${t(effectiveRowData?.type)}`} />}
          headerBarEnd={<CloseBtn onClick={() => setIsEditModal(false)} />}
          actionCancelLabel={t("CS_COMMON_CANCEL")}
          actionCancelOnSubmit={() => setIsEditModal(false)}
          actionSaveLabel={t("CONFIRM")}
          actionSaveOnSubmit={handleConfirmEdit}
          className="reject-modal"
        >
          <div className="reject-modal-content">
            <p>{t("EDIT_DIGITILIZATION_MODAL_TEXT")}</p>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DigitalDocumentSignModal;
