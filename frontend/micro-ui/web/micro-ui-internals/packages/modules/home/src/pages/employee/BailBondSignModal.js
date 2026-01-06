import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CloseSvg, InfoCard } from "@egovernments/digit-ui-components";
import { Button, Loader } from "@egovernments/digit-ui-react-components";
import { FileDownloadIcon, FileUploadIcon } from "@egovernments/digit-ui-module-dristi/src/icons/svgIndex";
import AuthenticatedLink from "@egovernments/digit-ui-module-dristi/src/Utils/authenticatedLink";
import { Banner } from "@egovernments/digit-ui-react-components";
import { Urls } from "../../hooks";
import { bailBondWorkflowAction } from "@egovernments/digit-ui-module-dristi/src/Utils/submissionWorkflow";
import { HomeService } from "../../hooks/services";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";

export const clearBailBondSessionData = () => {
  sessionStorage.removeItem("esignProcess");
  sessionStorage.removeItem("bailBondStepper");
  sessionStorage.removeItem("bailBondFileStoreId");
  sessionStorage.removeItem("bulkBailBondSignSelectedItem");
  sessionStorage.removeItem("signStatus");
  sessionStorage.removeItem("bulkBailBondSignlimit");
  sessionStorage.removeItem("bulkBailBondSignoffset");
  sessionStorage.removeItem("homeActiveTab");
};

export const BailBondSignModal = ({ selectedBailBond, setShowBulkSignModal = () => {}, bailBondPaginationData, setCounter = () => {} }) => {
  const queryStrings = Digit.Hooks.useQueryParams();

  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const courtId = localStorage.getItem("courtId");
  const userInfo = Digit.UserService.getUser()?.info;
  const roles = useMemo(() => userInfo?.roles, [userInfo]);
  const isCitizen = useMemo(() => roles?.some((role) => role.code === "CITIZEN"), [roles]);
  const isJudge = useMemo(() => roles?.some((role) => role.code === "JUDGE_ROLE"), [roles]);

  const [stepper, setStepper] = useState(() => {
    const bulkBailBondSignSelectedItem = sessionStorage.getItem("bulkBailBondSignSelectedItem");
    if (
      bulkBailBondSignSelectedItem &&
      JSON.parse(bulkBailBondSignSelectedItem)?.businessObject?.bailDetails?.id === selectedBailBond?.businessObject?.bailDetails?.id
    ) {
      const savedStepper = sessionStorage.getItem("bailBondStepper");
      return savedStepper ? parseInt(savedStepper) : 0;
    }
    return 0;
  });

  const [effectiveRowData, setEffectiveRowData] = useState(selectedBailBond);
  const selectedBailBondFilestoreid =
    effectiveRowData?.businessObject?.bailDetails?.documents?.find((doc) => doc.documentType === "SIGNED")?.fileStore ||
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
  const [bailBondSignedPdf, setBailBondSignedPdf] = useState("");
  const [loader, setLoader] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [bailDocuments, setBailDocuments] = useState([]);
  const [bailBondLoader, setBailBondLoader] = useState(false);
  const name = "Signature";
  const pageModule = "en";
  const { uploadDocuments } = Digit.Hooks.orders.useDocumentUpload();
  const mockESignEnabled = window?.globalConfigs?.getConfig("mockESignEnabled") === "true" ? true : false;

  useEffect(() => {
    const fetchBailBondData = async () => {
      try {
        setBailBondLoader(true);
        if (queryStrings?.bailId || selectedBailBond?.businessObject?.bailDetails?.bailId || selectedBailBond?.bailId) {
          const searchBailBondResponse = await HomeService.searchBailBond({
            criteria: {
              tenantId: tenantId,
              courtId: courtId,
              bailId: queryStrings.bailId || selectedBailBond?.businessObject?.bailDetails?.bailId || selectedBailBond?.bailId,
              fuzzySearch: false,
            },
            pagination: {
              limit: 10,
              offSet: 0,
              sortBy: "bailCreatedTime",
              order: "asc",
            },
          });
          const bailBondData = searchBailBondResponse?.bails?.[0];
          setEffectiveRowData(bailBondData);
          const combinedDocuments = [
            ...bailBondData?.documents.filter((doc) => doc.documentType === "SIGNED"),
            ...bailBondData?.sureties.flatMap((surety) => surety.documents),
          ];

          setBailDocuments(combinedDocuments);
        }
        setBailBondLoader(false);
      } catch (error) {
        setBailBondLoader(false);
      }
    };
    fetchBailBondData();
  }, [queryStrings.bailId, tenantId, courtId, selectedBailBond?.bailId, selectedBailBond?.businessObject?.bailDetails?.bailId]);

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
        setBailBondSignedPdf(uploadedFileId?.[0]?.fileStoreId);
        clearBailBondSessionData();
      } catch (error) {
        console.error("error", error);
      } finally {
        setLoader(false);
      }
    }
  }, [formData, uploadDocuments, tenantId]);

  const updateBailBond = async ({ bailBondId, Action, fileStoreId }) => {
    try {
      setLoader(true);
      await HomeService.searchBailBond({
        criteria: {
          tenantId: tenantId,
          courtId: courtId,
          bailId: bailBondId,
          fuzzySearch: false,
        },
        pagination: {
          limit: 10,
          offSet: 0,
          sortBy: "bailCreatedTime",
          order: "asc",
        },
      }).then(async (res) => {
        if (res?.bails?.length > 0) {
          const bailBondDetails = res?.bails[0];
          const payload = {
            bail: {
              ...bailBondDetails,
              documents: [
                ...bailBondDetails?.documents?.map((doc) => {
                  if (fileStoreId && doc?.documentType === "SIGNED") {
                    return { ...doc, isActive: false };
                  }
                  return doc;
                }),
                ...(fileStoreId ? [{ documentType: "SIGNED", fileStore: fileStoreId }] : []),
              ],
              workflow: { action: Action },
            },
          };
          await HomeService.updateBailBond(payload, { tenantId }).then((res) => {
            setTimeout(() => {
              if (!fileStoreId && setCounter && typeof setCounter === "function") setCounter((prev) => parseInt(prev) + 1);
              if (fileStoreId) {
                setIsSigned(false);

                setFormData({});
                clearBailBondSessionData();
                setStepper(2);
              } else {
                setIsRejectModalOpen(false);
                setShowBulkSignModal(false);
                if (queryStrings?.bailId) {
                  clearBailBondSessionData();
                  if (userType && caseId && filingNumber) {
                    sessionStorage.setItem("documents-activeTab", "Bail Bonds");
                    history.push(
                      `/${window?.contextPath}/${userType}/dristi/home/view-case?caseId=${caseId}&filingNumber=${filingNumber}&tab=Documents`
                    );
                  } else history.push(`/${window?.contextPath}/${userType}/home/home-screen`);
                }
              }
              setLoader(false);
            }, 1000);
          });
        }
      });
    } catch (error) {
      console.error("Error while updating bail bond:", error);
      setIsRejectModalOpen(false);
      setShowBulkSignModal(false);
      if (queryStrings?.bailId) {
        clearBailBondSessionData();
        if (userType && caseId && filingNumber) {
          sessionStorage.setItem("documents-activeTab", "Bail Bonds");
          history.push(`/${window?.contextPath}/${userType}/dristi/home/view-case?caseId=${caseId}&filingNumber=${filingNumber}&tab=Documents`);
        } else history.push(`/${window?.contextPath}/${userType}/home/home-screen`);
      }
      setLoader(false);
    }
  };

  const handleCancel = useCallback(() => {
    sessionStorage.removeItem("fileStoreId");
    if (parseInt(stepper) === 0) {
      setShowBulkSignModal(false);
      if (queryStrings?.bailId) {
        clearBailBondSessionData();
        if (userType && caseId && filingNumber) {
          sessionStorage.setItem("documents-activeTab", "Bail Bonds");
          history.push(`/${window?.contextPath}/${userType}/dristi/home/view-case?caseId=${caseId}&filingNumber=${filingNumber}&tab=Documents`);
        } else history.push(`/${window?.contextPath}/${userType}/home/home-screen`);
      }
      return; // Ensure function exits here to prevent double redirection
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

        sessionStorage.setItem("bailBondStepper", stepper);
        sessionStorage.setItem("bulkBailBondSignSelectedItem", JSON.stringify(effectiveRowData));
        sessionStorage.setItem("homeActiveTab", "BULK_BAIL_BOND_SIGN");
        if (bailBondPaginationData?.limit) sessionStorage.setItem("bulkBailBondSignlimit", bailBondPaginationData?.limit);
        if (bailBondPaginationData?.caseTitle) sessionStorage.setItem("bulkBailBondSignCaseTitle", bailBondPaginationData?.caseTitle);
        if (bailBondPaginationData?.offset) sessionStorage.setItem("bulkBailBondSignoffset", bailBondPaginationData?.offset);
        handleEsign(name, pageModule, selectedBailBondFilestoreid, "Magistrate Signature");
      } catch (error) {
        console.error("E-sign navigation error:", error);
        setLoader(false);
      } finally {
        setLoader(false);
      }
    }
  }, [stepper, effectiveRowData, bailBondPaginationData, handleEsign, selectedBailBondFilestoreid]);

  const uri = `${window.location.origin}${Urls.FileFetchById}?tenantId=${tenantId}&fileStoreId=${selectedBailBondFilestoreid}`;
  const uploadSignedPdf = async () => {
    try {
      const localStorageID = sessionStorage.getItem("fileStoreId");
      const newFilestore = bailBondSignedPdf || localStorageID;
      // fileStoreIds.delete(newFilestore);
      // if (ADiarypdf) {
      //   fileStoreIds.delete(ADiarypdf);
      // }
      await updateBailBond({
        bailBondId: effectiveRowData?.businessObject?.bailDetails?.bailId || effectiveRowData?.bailId,
        Action: bailBondWorkflowAction.SIGN,
        fileStoreId: newFilestore,
      });
      setBailBondSignedPdf(newFilestore);
      sessionStorage.removeItem("fileStoreId");
    } catch (error) {
      console.error("Error :", error);
      setIsSigned(false);
      setBailBondSignedPdf("");
      setFormData({});
    }
  };

  const isSign = useMemo(() => {
    if (isCitizen || !isJudge) {
      return false;
    } else {
      if (["VOID", "COMPLETED"]?.includes(effectiveRowData?.status)) {
        return false;
      }
      return true;
    }
  }, [effectiveRowData?.status, isCitizen, isJudge]);

  const customStyles = `
  .popup-module.review-submission-appl-modal .popup-module-main .popup-module-action-bar .selector-button-primary  {
    background-color: #007e7e !important;
  };
  `;
  const MemoizedDocViewers = useMemo(() => {
    return (
      <React.Fragment>
        {bailDocuments?.map((docs) => (
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
  }, [bailDocuments, tenantId]);

  useEffect(() => {
    return () => {
      clearBailBondSessionData();
    };
  });

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
          headerBarMain={
            <Heading
              label={
                bailBondLoader
                  ? t(" ")
                  : `${effectiveRowData?.businessObject?.bailDetails?.caseTitle || effectiveRowData?.caseTitle || ""} - ${t("BAIL_BOND")}`
              }
            />
          }
          popupStyles={{ width: "70vw", minHeight: "75vh", maxheight: "90vh" }}
          actionCancelLabel={isSign && t("REJECT")}
          actionCancelOnSubmit={() => {
            setIsRejectModalOpen(true);
          }}
          actionSaveLabel={isSign && t("PROCEED_TO_SIGN")}
          actionSaveOnSubmit={() => {
            setStepper(1);
          }}
          formId="modal-action"
          headerBarMainStyle={{ minHeight: "50px" }}
          className={"review-submission-appl-modal bail-bond"}
          isDisabled={bailBondLoader}
          isBackButtonDisabled={bailBondLoader}
          style={{ backgroundColor: "#007e7e !important" }}
          textStyle={{ color: "#fff", fontSize: "1.2rem", fontWeight: "600", margin: "0px" }}
        >
          <div className="review-submission-appl-body-main">
            <div className="application-details">
              <div className="application-view">{bailBondLoader ? <Loader /> : <React.Fragment>{MemoizedDocViewers}</React.Fragment>}</div>
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
                additionalElements={[<p key="note">{t("YOU_ARE_ADDING_YOUR_SIGNATURE_TO_THE_BAIL_BOND")}</p>]}
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
              additionalElements={[<p key="note">{t("YOU_ARE_ADDING_YOUR_SIGNATURE_TO_THE_BAIL_BOND")}</p>]}
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
          actionCancelLabel={t("DOWNLOAD_BAIL_BOND")}
          actionCancelOnSubmit={() => {
            downloadPdf(tenantId, bailBondSignedPdf || sessionStorage.getItem("fileStoreId"));
          }}
          actionSaveLabel={t("BULK_SUCCESS_CLOSE")}
          actionSaveOnSubmit={() => {
            if (setCounter && typeof setCounter === "function") setCounter((prev) => parseInt(prev) + 1);
            setShowBulkSignModal(false);
            setBailBondSignedPdf("");
            if (queryStrings?.bailId) {
              clearBailBondSessionData();
              if (userType && caseId && filingNumber) {
                sessionStorage.setItem("documents-activeTab", "Bail Bonds");
                history.push(`/${window?.contextPath}/${userType}/dristi/home/view-case?caseId=${caseId}&filingNumber=${filingNumber}&tab=Documents`);
              } else {
                history.push(`/${window?.contextPath}/${userType}/home/home-screen`);
              }
            }
          }}
          className={"orders-success-modal"}
          cancelButtonBody={<FileDownloadIcon></FileDownloadIcon>}
        >
          <div style={{ padding: "8px 24px" }}>
            <div>
              <Banner
                whichSvg={"tick"}
                successful={true}
                message={t("YOU_HAVE_SUCCESSFULLY_ISSUED_BAIL_BOND")}
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
          actionSaveLabel={t("CONFIRM")}
          actionSaveOnSubmit={async () => {
            await updateBailBond({
              bailBondId: effectiveRowData?.businessObject?.bailDetails?.bailId || effectiveRowData?.bailId,
              Action: bailBondWorkflowAction.REJECT,
            });
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
