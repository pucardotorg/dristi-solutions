import React, { useEffect, useMemo, useState, useRef } from "react";
import { ActionBar, Button, Toast, Loader, CloseSvg, LabelFieldPair, CardLabel, Dropdown } from "@egovernments/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import SuccessBannerModal from "../../../../../submissions/src/components/SuccessBannerModal";
import useSearchDigitalization from "../../../../../submissions/src/hooks/submissions/useSearchDigitalization";
import useSearchOrdersService from "@egovernments/digit-ui-module-orders/src/hooks/orders/useSearchOrdersService";
import { EditPencilIcon } from "../../../icons/svgIndex";
import { submissionService } from "../../../../../submissions/src/hooks/services";
import { MediationWorkflowAction, MediationWorkflowState, OrderWorkflowAction, OrderWorkflowState } from "../../../Utils/orderWorkflow";
import { DRISTIService } from "../../../services";
import useDownloadCasePdf from "../../../hooks/dristi/useDownloadCasePdf";
import Modal from "../../../components/Modal";
import { ordersService } from "@egovernments/digit-ui-module-orders/src/hooks/services";

const MediationFormSignaturePage = () => {
  const { t } = useTranslation();
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const history = useHistory();
  const userInfo = Digit.UserService.getUser()?.info;
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo?.type]);
  const isCitizen = useMemo(() => userInfo?.type === "CITIZEN", [userInfo?.type]);
  const isMediationApprover = useMemo(() => userInfo?.roles?.some((role) => ["MEDIATION_APPROVER"]?.includes(role?.code)), [userInfo?.roles]);
  const isMediationCreator = useMemo(() => userInfo?.roles?.some((role) => ["MEDIATION_CREATOR"]?.includes(role?.code)), [userInfo?.roles]);
  const DocViewerWrapper = Digit?.ComponentRegistryService?.getComponent("DocViewerWrapper");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(null);
  const [loader, setLoader] = useState(false);
  const [uploadLoader, setUploadLoader] = useState(false);
  const { documentNumber, filingNumber, courtId } = Digit.Hooks.useQueryParams();
  const caseCourtId = courtId || localStorage.getItem("courtId");
  const [showUploadSignatureModal, setShowUploadSignatureModal] = useState(false);
  const [showPartySelectionModal, setShowPartySelectionModal] = useState(false);
  const [showEditConfirmModal, setShowEditConfirmModal] = useState(false);
  const name = "Signature";
  const [formData, setFormData] = useState({});
  const { uploadDocuments } = Digit.Hooks.orders.useDocumentUpload();
  const [signatureDocumentId, setSignatureDocumentId] = useState(null);
  const [isEsignSuccess, setEsignSuccess] = useState(false);
  const isUpdatingRef = useRef(false);
  const { downloadPdf } = useDownloadCasePdf();
  const UploadSignatureModal = window?.Digit?.ComponentRegistryService?.getComponent("UploadSignatureModal");
  const [showSkipConfirmModal, setShowSkipConfirmModal] = useState(false);
  const mockESignEnabled = window?.globalConfigs?.getConfig("mockESignEnabled") === "true" ? true : false;
  const { handleEsign } = Digit.Hooks.orders.useESign();
  const [selectedParty, setSelectedParty] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("selectedParty")) || null;
    } catch {
      return null;
    }
  });

  const pageModule = isCitizen ? "ci" : "en";

  const Heading = (props) => {
    return <h1 className="heading-m">{props.label}</h1>;
  };

  const CloseBtn = (props) => {
    return (
      <div onClick={props?.onClick} style={{ height: "100%", display: "flex", alignItems: "center", cursor: "pointer" }}>
        <CloseSvg />
      </div>
    );
  };

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

  const { data: digitalizationData, isLoading: isMediationSearchResponseLoading, refetch: refetchDigitalizationData } = useSearchDigitalization(
    {
      criteria: {
        documentNumber: documentNumber,
        ...(caseCourtId && { courtId: caseCourtId }),
        tenantId,
      },
    },
    {},
    `digitilization-${documentNumber}`,
    Boolean(documentNumber && caseCourtId),
    5 * 60
  );

  const digitalizationServiceDetails = useMemo(() => {
    return digitalizationData?.documents?.[0] || {};
  }, [digitalizationData]);

  const mediationFileStoreId = useMemo(() => {
    return digitalizationServiceDetails?.documents?.[0]?.fileStore;
  }, [digitalizationServiceDetails]);

  const poaPartyDetails = useMemo(() => {
    const parties = digitalizationServiceDetails?.mediationDetails?.partyDetails || [];

    const uniquePoaUuids = [...new Set(parties?.filter((p) => p?.poaUuid)?.map((p) => p?.poaUuid))];

    const poaParties = uniquePoaUuids?.map((uuid) => ({
      poaUuid: uuid,
      partyDetails: parties?.filter((p) => p?.poaUuid === uuid || p?.uniqueId === uuid),
    }));
    return poaParties?.find((p) => p?.poaUuid === userInfo?.uuid) || null;
  }, [userInfo, digitalizationServiceDetails]);

  const { data: mediationOrderData, isLoading: isOrdersLoading } = useSearchOrdersService(
    {
      tenantId,
      criteria: {
        filingNumber,
        orderNumber: digitalizationServiceDetails?.orderNumber,
        orderType: "REFERRAL_CASE_TO_ADR",
        ...(caseCourtId && { courtId: caseCourtId }),
      },
      pagination: { limit: 1000, offset: 0 },
    },
    { tenantId },
    filingNumber + digitalizationServiceDetails?.orderNumber + "REFERRAL_CASE_TO_ADR",
    Boolean(filingNumber && digitalizationServiceDetails?.orderNumber && caseCourtId)
  );

  const mediationOrderDetails = useMemo(() => {
    const order = mediationOrderData?.list?.[0];
    if (order?.orderCategory === "INTERMEDIATE") {
      return order;
    } else {
      const adrItem = order?.compositeItems?.find((item) => item?.orderType === "REFERRAL_CASE_TO_ADR");
      return {
        ...order,
        orderType: adrItem?.orderType,
        additionalDetails: adrItem?.orderSchema?.additionalDetails,
        orderDetails: adrItem?.orderSchema?.orderDetails,
        itemId: adrItem?.id,
      };
    }
  }, [mediationOrderData]);

  const updateMediationDocument = async (digitalizationAction, fileStoreId) => {
    try {
      const parties = digitalizationServiceDetails?.mediationDetails?.partyDetails || [];
      const isESign = digitalizationAction === MediationWorkflowAction.E_SIGN || digitalizationAction === MediationWorkflowAction.SIGN;
      const isUpload = digitalizationAction === MediationWorkflowAction.UPLOAD;

      const selectedId = selectedParty?.uniqueId;
      const userId = userInfo?.uuid;

      const updatedPartyDetails = parties?.map((party) => {
        if (isUpload) return { ...party, hasSigned: true };
        if (isESign && (party?.uniqueId === selectedId || party?.uniqueId === userId)) {
          return { ...party, hasSigned: true };
        }
        return party;
      });

      await submissionService.updateDigitalization({
        digitalizedDocument: {
          ...digitalizationServiceDetails,
          mediationDetails: {
            ...digitalizationServiceDetails?.mediationDetails,
            partyDetails: updatedPartyDetails,
          },
          ...((signatureDocumentId || fileStoreId) && {
            documents: [
              {
                ...digitalizationServiceDetails?.documents?.[0],
                fileStore: signatureDocumentId || fileStoreId,
                documentType: "SIGNED",
              },
            ],
          }),
          workflow: {
            action: digitalizationAction,

            documents: [{}],
          },
        },
      });
      setShowSuccessModal(true);
    } catch (error) {
      throw error;
    } finally {
      setSelectedParty(null);
      sessionStorage.removeItem("selectedParty");
    }
  };

  const onSelect = (key, value) => {
    if (value?.[name] === null) {
      setFormData({});
      setSignatureDocumentId(null);
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
        setUploadLoader(true);
        const uploadedFile = await uploadDocuments(formData?.uploadSignature?.Signature, tenantId);
        const uploadedFileStoreId = uploadedFile?.[0]?.fileStoreId;
        setSignatureDocumentId(uploadedFileStoreId);
        await updateMediationDocument(MediationWorkflowAction.UPLOAD, uploadedFileStoreId);
      } catch (error) {
        console.error("error", error);
        setFormData({});
      } finally {
        setUploadLoader(false);
      }
    }
  };

  const getPlaceholder = () => {
    if (isMediationApprover) return "Signature of Magistrate";

    const party = selectedParty || digitalizationServiceDetails?.mediationDetails?.partyDetails?.find((p) => p?.uniqueId === userInfo?.uuid);
    if (!party) return "";

    const typeLabel = party.partyType === "COMPLAINANT" ? "Complainant" : "Accused";
    return `${typeLabel} ${party.partyIndex} Signature`;
  };

  const handleCaseUnlockingWhenMockESign = async () => {
    if (isCitizen) {
      await DRISTIService.setCaseUnlock({}, { uniqueId: digitalizationServiceDetails?.documentNumber, tenantId: tenantId });
    }
    setEsignSuccess(true);
  };

  const handleEditMediation = async () => {
    try {
      if (mediationOrderDetails?.status === OrderWorkflowState.PENDING_BULK_E_SIGN) {
        await ordersService.updateOrder(
          {
            order: {
              ...mediationOrderDetails,
              workflow: { ...mediationOrderDetails.workflow, action: OrderWorkflowAction.SAVE_DRAFT, documents: [{}] },
            },
          },
          { tenantId }
        );
      }
      sessionStorage.setItem("currentOrderType", mediationOrderDetails?.orderType);
      history.push(
        `/${window?.contextPath}/${userType}/orders/generate-order?filingNumber=${filingNumber}&orderNumber=${mediationOrderDetails?.orderNumber}`
      );
    } catch (error) {
      console.error("Error:", error);
      setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
    }
  };

  const handleEsignAction = async () => {
    setLoader(true);
    try {
      if (isCitizen) {
        const caseLockStatus = await DRISTIService.getCaseLockStatus(
          {},
          {
            uniqueId: digitalizationServiceDetails?.documentNumber,
            tenantId: tenantId,
          }
        );
        if (caseLockStatus?.Lock?.isLocked) {
          setShowErrorToast({ label: t("SOMEONEELSE_IS_ESIGNING_CURRENTLY"), error: true });
          setLoader(false);
          return;
        }

        await DRISTIService.setCaseLock(
          { Lock: { uniqueId: digitalizationServiceDetails?.documentNumber, tenantId: tenantId, lockType: "ESIGN" } },
          {}
        );
      }

      if (mockESignEnabled) {
        try {
          setSignatureDocumentId(mediationFileStoreId);

          await handleCaseUnlockingWhenMockESign();
        } catch (error) {
          console.error("Error:", error);
          setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
        }
      } else {
        handleEsign(name, pageModule, mediationFileStoreId, getPlaceholder());
      }
    } catch (error) {
      console.error("Error:", error);
      setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
      setLoader(false);
    } finally {
      setLoader(false);
    }
  };

  const handleCloseSuccessModal = () => {
    sessionStorage.removeItem("fileStoreId");
    sessionStorage.setItem("documents-activeTab", "Digitalization Forms");
    history.replace(
      `/${window?.contextPath}/${userType}/dristi/home/view-case?caseId=${digitalizationServiceDetails?.caseId}&filingNumber=${filingNumber}&tab=Documents`
    );
  };

  const closeToast = () => {
    setShowErrorToast(null);
  };

  useEffect(() => {
    const esignMediationUpdate = async () => {
      if (isEsignSuccess && digitalizationServiceDetails?.documentNumber && !isUpdatingRef.current) {
        isUpdatingRef.current = true;
        setEsignSuccess(false);
        setLoader(true);
        try {
          await updateMediationDocument(isCitizen ? MediationWorkflowAction.E_SIGN : MediationWorkflowAction.SIGN);
          await refetchDigitalizationData();
        } catch (error) {
          console.error("Error:", error);
          setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
        } finally {
          setLoader(false);
          isUpdatingRef.current = false;
        }
      }
    };

    esignMediationUpdate();
  }, [isEsignSuccess, digitalizationServiceDetails?.documentNumber, isCitizen]);

  const handleCaseUnlocking = async () => {
    await DRISTIService.setCaseUnlock({}, { uniqueId: documentNumber, tenantId: tenantId });
  };

  const handleSkipAndSubmit = async () => {
    try {
      setLoader(true);
      const caseLockStatus = await DRISTIService.getCaseLockStatus(
        {},
        {
          uniqueId: digitalizationServiceDetails?.documentNumber,
          tenantId: tenantId,
        }
      );
      if (caseLockStatus?.Lock?.isLocked) {
        setShowErrorToast({ label: t("SOMEONEELSE_IS_ESIGNING_CURRENTLY"), error: true });
        setLoader(false);
        return;
      }

      await DRISTIService.setCaseLock(
        { Lock: { uniqueId: digitalizationServiceDetails?.documentNumber, tenantId: tenantId, lockType: "ESIGN" } },
        {}
      );
      await updateMediationDocument(MediationWorkflowAction.SKIP_SIGN_AND_SUBMIT);
      await handleCaseUnlocking();
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoader(false);
    }
  };

  useEffect(() => {
    const isSignSuccess = sessionStorage.getItem("isSignSuccess");
    const storedESignObj = sessionStorage.getItem("signStatus");
    const parsedESignObj = JSON.parse(storedESignObj);
    const esignProcess = sessionStorage.getItem("esignProcess");

    if (isSignSuccess) {
      const matchedSignStatus = parsedESignObj?.find((obj) => obj.name === name && obj.isSigned === true);
      if (isSignSuccess === "success" && matchedSignStatus) {
        const fileStoreId = sessionStorage.getItem("fileStoreId");
        setSignatureDocumentId(fileStoreId);
        setEsignSuccess(true);
      }
    }
    if (esignProcess && digitalizationServiceDetails?.documentNumber) {
      if (isCitizen) {
        handleCaseUnlocking();
      }
      sessionStorage.removeItem("esignProcess");
    }

    const cleanupTimer = setTimeout(() => {
      sessionStorage.removeItem("isSignSuccess");
      sessionStorage.removeItem("signStatus");
      sessionStorage.removeItem("fileStoreId");
    }, 2000);

    return () => clearTimeout(cleanupTimer);
  }, [tenantId, digitalizationServiceDetails, isCitizen]);

  useEffect(() => {
    if (showErrorToast) {
      const timer = setTimeout(() => {
        setShowErrorToast(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showErrorToast]);

  return (
    <React.Fragment>
      <div className="mediation-form-signature">
        {(loader || isMediationSearchResponseLoading || isOrdersLoading) && (
          <div className="submit-loader">
            <Loader />
          </div>
        )}
        <div className="header">{t("MEDIATION_REFERAL_ORDER")}</div>
        <div className="container">
          <div className="left-panel">
            <div className="details-section">
              <div className="details">
                <div>{t("E_SIGN_STATUS")}</div>
              </div>
              <div>
                {digitalizationServiceDetails?.mediationDetails?.partyDetails?.map((party, index) => (
                  <div key={index} className="litigant-details">
                    <span>
                      {index + 1}. {party?.partyName}
                    </span>
                    {party?.hasSigned ? <span className="signed-label">{t("SIGNED")}</span> : <span className="unsigned-label">{t("PENDING")}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="right-panel">
            <div className="doc-viewer">
              {(signatureDocumentId || mediationFileStoreId) && (
                <DocViewerWrapper
                  docWidth="100%"
                  docHeight="100%"
                  fileStoreId={signatureDocumentId || mediationFileStoreId}
                  tenantId={tenantId}
                  docViewerCardClassName="doc-card"
                  showDownloadOption={false}
                />
              )}
            </div>
            <div style={{ flex: 1 }} title={mediationOrderDetails?.status === OrderWorkflowState.PUBLISHED && t("ORDER_ALREADY_PUBLISHED")}>
              {isMediationCreator && (
                <Button
                  className={"edit-button"}
                  variation="secondary"
                  onButtonClick={() => setShowEditConfirmModal(true)}
                  label={t("EDIT")}
                  isDisabled={mediationOrderDetails?.status === OrderWorkflowState.PUBLISHED}
                  icon={<EditPencilIcon width="20" height="20" />}
                />
              )}
            </div>
          </div>
          <ActionBar className="action-bar">
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
              {isCitizen &&
                digitalizationServiceDetails?.status === MediationWorkflowState.PENDING_E_SIGN &&
                digitalizationServiceDetails?.mediationDetails?.partyDetails?.some((party) => party?.hasSigned) && (
                  <Button
                    label={t("SUBMIT_TO_COURT")}
                    variation={"secondary"}
                    onButtonClick={() => setShowSkipConfirmModal(true)}
                    style={{ boxShadow: "none", backgroundColor: "#fff", padding: "8px 24px", width: "100%", border: "none" }}
                    textStyles={{
                      fontFamily: "Roboto",
                      fontSize: "16px",
                      fontWeight: 700,
                      lineHeight: "18.75px",
                      textAlign: "center",
                      color: "#007E7E",
                    }}
                  />
                )}
              <div style={{ display: "flex", justifyContent: "flex-end", width: "100%", gap: "20px" }}>
                {(signatureDocumentId || mediationFileStoreId) && (
                  <Button
                    label={t("PRINT_DOCUMENT_MEDIATION")}
                    variation={"secondary"}
                    style={{ boxShadow: "none", backgroundColor: "#fff", padding: "8px 24px", width: "fit-content", border: "none" }}
                    textStyles={{
                      fontFamily: "Roboto",
                      fontSize: "16px",
                      fontWeight: 700,
                      lineHeight: "18.75px",
                      textAlign: "center",
                      color: "#007E7E",
                    }}
                    onButtonClick={() => downloadPdf(tenantId, signatureDocumentId || mediationFileStoreId)}
                  />
                )}
                {((isMediationCreator && digitalizationServiceDetails?.status === MediationWorkflowState.PENDING_UPLOAD) || isCitizen) && (
                  <Button
                    label={isMediationCreator ? t("UPLOAD_SIGNED_COPY_MEDIATION") : t("BACK_MEDIATION")}
                    variation={"secondary"}
                    style={{ boxShadow: "none", backgroundColor: "#fff", padding: "8px 24px", width: "fit-content" }}
                    textStyles={{
                      fontFamily: "Roboto",
                      fontSize: "16px",
                      fontWeight: 700,
                      lineHeight: "18.75px",
                      textAlign: "center",
                      color: "#007E7E",
                    }}
                    onButtonClick={() => {
                      if (isMediationCreator) {
                        setShowUploadSignatureModal(true);
                      } else {
                        history.goBack();
                      }
                    }}
                  />
                )}
                {((isMediationApprover && digitalizationServiceDetails?.status === MediationWorkflowState.PENDING_REVIEW) ||
                  (isCitizen && digitalizationServiceDetails?.status === MediationWorkflowState.PENDING_E_SIGN)) && (
                  <Button
                    label={t("E_SIGN_MEDIATION")}
                    variation={"primary"}
                    style={{ boxShadow: "none", backgroundColor: "#007E7E", padding: "8px 24px", width: "fit-content" }}
                    textStyles={{
                      fontFamily: "Roboto",
                      fontSize: "16px",
                      fontWeight: 700,
                      lineHeight: "18.75px",
                      textAlign: "center",
                      color: "white",
                    }}
                    onButtonClick={async () => {
                      if (poaPartyDetails) {
                        setShowPartySelectionModal(true);
                      } else {
                        await handleEsignAction();
                      }
                    }}
                    isDisabled={
                      (poaPartyDetails
                        ? poaPartyDetails?.partyDetails?.every((party) => party?.hasSigned)
                        : digitalizationServiceDetails?.mediationDetails?.partyDetails?.find((party) => party?.uniqueId === userInfo?.uuid)
                            ?.hasSigned) ||
                      (isCitizen &&
                        !digitalizationServiceDetails?.mediationDetails?.partyDetails?.some((party) =>
                          [party?.userUuid, party?.uniqueId, party?.poaUuid]?.includes(userInfo?.uuid)
                        )) ||
                      loader
                    }
                  />
                )}
              </div>
            </div>
          </ActionBar>
        </div>
      </div>
      {showPartySelectionModal && (
        <Modal
          headerBarEnd={<CloseBtn onClick={() => !loader && setShowPartySelectionModal(false)} />}
          formId="modal-action"
          headerBarMain={<Heading label={t("CS_DETAILS")} />}
          actionSaveOnSubmit={() => {
            sessionStorage.setItem("selectedParty", JSON?.stringify(selectedParty));
            handleEsignAction();
          }}
          actionCancelOnSubmit={() => setShowPartySelectionModal(false)}
          isDisabled={loader}
          isBackButtonDisabled={loader}
          actionCancelLabel={t("BACK_MEDIATION")}
          actionSaveLabel={t("E_SIGN_MEDIATION")}
          popupStyles={{
            width: "40%",
          }}
        >
          {loader ? (
            <Loader />
          ) : (
            <LabelFieldPair className="case-label-field-pair" style={{ padding: "22px 0px" }}>
              <CardLabel className="case-input-label">{`${t("SELECT_PARTY_TO_SIGN")}`}</CardLabel>
              <Dropdown
                t={t}
                option={poaPartyDetails?.partyDetails}
                selected={selectedParty}
                optionKey={"partyName"}
                select={(e) => {
                  setSelectedParty(e);
                }}
                topbarOptionsClassName={"top-bar-option"}
                style={{
                  marginBottom: "1px",
                  maxWidth: "100%",
                }}
              />
            </LabelFieldPair>
          )}
        </Modal>
      )}
      {showUploadSignatureModal && (
        <UploadSignatureModal
          t={t}
          key={name}
          name={name}
          setOpenUploadSignatureModal={setShowUploadSignatureModal}
          onSelect={onSelect}
          config={uploadModalConfig}
          formData={formData}
          onSubmit={onSubmit}
          isDisabled={uploadLoader}
        />
      )}
      {showSkipConfirmModal && (
        <Modal
          headerBarMain={<Heading label={t("CONFIRM_SKIP_AND_SUBMIT_TO_COURT")} />}
          headerBarEnd={<CloseBtn onClick={() => setShowSkipConfirmModal(false)} />}
          actionCancelLabel={t("CS_SKIP_AND_SUBMIT_BACK")}
          actionCancelOnSubmit={() => setShowSkipConfirmModal(false)}
          actionSaveLabel={t("CS_SKIP_AND_SUBMIT_CONFIRM")}
          actionSaveOnSubmit={handleSkipAndSubmit}
          style={{ height: "40px", background: "#007E7E" }}
          popupStyles={{ width: "35%" }}
          className={"review-order-modal"}
          children={
            <div className="delete-warning-text">
              <h3 style={{ margin: "12px 24px" }}>{t("SKIP_AND_SUBMIT_TEXT")}</h3>
            </div>
          }
        />
      )}
      {showEditConfirmModal && (
        <Modal
          headerBarMain={<Heading label={t("CONFIRM_EDIT_MEDIATION")} />}
          headerBarEnd={<CloseBtn onClick={() => setShowEditConfirmModal(false)} />}
          actionCancelLabel={t("CS_EDIT_BACK")}
          actionCancelOnSubmit={() => setShowEditConfirmModal(false)}
          actionSaveLabel={t("CS_EDIT_CONFIRM")}
          actionSaveOnSubmit={handleEditMediation}
          style={{ height: "40px", background: "#007E7E" }}
          popupStyles={{ width: "35%" }}
          className={"review-order-modal"}
          children={
            <div className="delete-warning-text">
              <h3 style={{ margin: "12px 24px" }}>{t("EDIT_MEDIATION_CONFIRMATION_TEXT")}</h3>
            </div>
          }
        />
      )}
      {showSuccessModal && (
        <SuccessBannerModal t={t} handleCloseSuccessModal={handleCloseSuccessModal} message={"SIGNED_MEDIATION_DOCUMENT_MESSAGE"} />
      )}
      {showErrorToast && <Toast error={showErrorToast?.error} label={showErrorToast?.label} isDleteBtn={true} onClose={closeToast} />}
    </React.Fragment>
  );
};

export default MediationFormSignaturePage;
