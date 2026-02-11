import React, { useEffect, useMemo, useState, useRef } from "react";
import { ActionBar, Button, Toast, Loader, CloseSvg, LabelFieldPair, CardLabel, Dropdown } from "@egovernments/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { useHistory, useLocation } from "react-router-dom/cjs/react-router-dom.min";
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
import useOpenApiSearchDigitizedDocuments from "../../../../../submissions/src/hooks/submissions/useOpenApiSearchDigitizedDocuments";
import { useQuery } from "react-query";
import axiosInstance from "@egovernments/digit-ui-module-core/src/Utils/axiosInstance";
import { Urls } from "../../../../../submissions/src/hooks/services/Urls";
import useESignOpenApi from "../../../../../submissions/src/hooks/submissions/useESignOpenApi";

const MediationFormSignaturePage = () => {
  const { t } = useTranslation();
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
  const {
    digitalizedDocumentId: documentId,
    documentNumber: documentNumberUrl,
    filingNumber,
    courtId,
    type,
    tenantId: tenantIdFromUrl,
  } = Digit.Hooks.useQueryParams();
  const documentNumber = documentId || documentNumberUrl;
  const tenantId = tenantIdFromUrl || Digit.ULBService.getCurrentTenantId();
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
  const [selectedParty, setSelectedParty] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("selectedParty")) || null;
    } catch {
      return null;
    }
  });
  const location = useLocation();
  const token = window.localStorage.getItem("token");
  const isAuthorised = location?.state?.isAuthorised;
  const isUserLoggedIn = Boolean(token);
  const mobileNumber = location?.state?.mobileNumber;

  const eSignLoggedIn = Digit.Hooks.orders.useESign();
  const eSignOpenApi = useESignOpenApi();

  const { handleEsign } = isUserLoggedIn ? eSignLoggedIn : eSignOpenApi;

  const pageModule = isUserLoggedIn ? (isCitizen ? "ci" : "en") : "ci";

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

  const {
    data: digitizedDocumentsOpenData,
    isLoading: isDigitizedDocumentsOpenOpenLoading,
    refetch: refetchDigitizedDocumentsOpenData,
  } = useOpenApiSearchDigitizedDocuments(
    {
      tenantId,
      documentNumber: documentNumber,
      mobileNumber: mobileNumber,
    },
    {},
    `digitized-documents-details-${documentNumber}`,
    Boolean(documentNumber && mobileNumber && !isUserLoggedIn)
  );

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
    Boolean(documentNumber && caseCourtId && isUserLoggedIn),
    5 * 60
  );

  const digitalizationServiceDetails = useMemo(() => {
    return digitizedDocumentsOpenData?.documents?.[0] || digitalizationData?.documents?.[0] || {};
  }, [digitizedDocumentsOpenData, digitalizationData]);

  const ifUserAuthorized = useMemo(() => {
    if (isUserLoggedIn) {
      const mobNumber = digitalizationServiceDetails?.mediationDetails?.partyDetails?.map((party) => party?.mobileNumber);
      return mobNumber?.includes(userInfo?.mobileNumber);
    }
    return isAuthorised;
  }, [digitalizationServiceDetails, isAuthorised, isUserLoggedIn, userInfo?.mobileNumber]);

  const hasUserSigned = useMemo(() => {
    return digitalizationServiceDetails?.mediationDetails?.partyDetails?.find((party) => party?.mobileNumber === mobileNumber)?.hasSigned;
  }, [digitalizationServiceDetails?.mediationDetails?.partyDetails, mobileNumber]);

  const mediationFileStoreId = useMemo(() => {
    return digitalizationServiceDetails?.documents?.[0]?.fileStore;
  }, [digitalizationServiceDetails]);

  const { data: { file: documentPreviewPdf } = {}, isFetching: isLoading } = useQuery({
    queryKey: ["DigitizedDocumentSignaturePdf", tenantId, documentNumber, userInfo?.uuid, mediationFileStoreId],
    retry: 3,
    cacheTime: 0,
    queryFn: async () => {
      return axiosInstance
        .post(
          `${Urls.openApi.FileFetchByFileStore}`,
          {
            tenantId: "kl",
            fileStoreId: mediationFileStoreId,
            moduleName: "mediation-document",
          },
          { responseType: "blob" }
        )
        .then((res) => ({ file: res.data, fileName: res.headers["content-disposition"]?.split("filename=")[1] }));
    },
    onError: (error) => {
      console.error("Failed to fetch order preview PDF:", error);
    },
    enabled: Boolean(mediationFileStoreId && !isUserLoggedIn),
  });

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
    Boolean(filingNumber && digitalizationServiceDetails?.orderNumber && caseCourtId && isUserLoggedIn)
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
        if (isESign && (party?.uniqueId === selectedId || party?.uniqueId === userId || party?.mobileNumber === mobileNumber)) {
          return { ...party, hasSigned: true };
        }
        return party;
      });
      if (isUserLoggedIn) {
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
      } else {
        await submissionService.updateOpenDigitizedDocument({
          tenantId,
          documentNumber: documentNumber,
          mobileNumber: mobileNumber,
          fileStoreId: signatureDocumentId,
          mediationDetails: {
            ...digitalizationServiceDetails?.mediationDetails,
            partyDetails: updatedPartyDetails,
          },
        });
      }
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
      if (isCitizen && isUserLoggedIn) {
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
          if (isUserLoggedIn) {
            await handleCaseUnlockingWhenMockESign();
          } else {
            setEsignSuccess(true);
          }
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
    if (isUserLoggedIn) {
      history.replace(
        `/${window?.contextPath}/${userType}/dristi/home/view-case?caseId=${digitalizationServiceDetails?.caseId}&filingNumber=${filingNumber}&tab=Documents`
      );
    } else {
      window.location.replace(process.env.REACT_APP_PROXY_API || "https://oncourts.kerala.gov.in");
    }
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
          if (isUserLoggedIn) {
            await refetchDigitalizationData();
          } else {
            await refetchDigitizedDocumentsOpenData();
          }
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
  }, [isEsignSuccess, digitalizationServiceDetails?.documentNumber, isCitizen, isUserLoggedIn]);

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
      if (isCitizen && isUserLoggedIn) {
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

  useEffect(() => {
    if (!isUserLoggedIn && !ifUserAuthorized) {
      history.replace(
        `/${window?.contextPath}/citizen/dristi/home/digitalized-document-login?tenantId=${tenantId}&documentNumber=${documentNumber}&type=${type}`
      );
    }

    if (!documentNumber) {
      history.replace(`/${window?.contextPath}/${userType}/home/home-pending-task`);
    }
  }, [documentNumber, history, ifUserAuthorized, isUserLoggedIn, tenantId, type, userType]);

  return (
    <React.Fragment>
      <div className="mediation-form-signature">
        {(loader || isLoading || isDigitizedDocumentsOpenOpenLoading || isMediationSearchResponseLoading || isOrdersLoading) && (
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
              {(isUserLoggedIn ? signatureDocumentId || mediationFileStoreId : documentPreviewPdf) && (
                <DocViewerWrapper
                  docWidth="100%"
                  docHeight="100%"
                  fileStoreId={isUserLoggedIn && (signatureDocumentId || mediationFileStoreId)}
                  selectedDocs={!isUserLoggedIn && documentPreviewPdf ? [documentPreviewPdf] : []}
                  tenantId={tenantId}
                  docViewerCardClassName="doc-card"
                  showDownloadOption={false}
                />
              )}
            </div>
            {isUserLoggedIn && isMediationCreator && (
              <div style={{ flex: 1 }} title={mediationOrderDetails?.status === OrderWorkflowState.PUBLISHED && t("ORDER_ALREADY_PUBLISHED")}>
                <Button
                  className={"edit-button"}
                  variation="secondary"
                  onButtonClick={() => setShowEditConfirmModal(true)}
                  label={t("EDIT")}
                  isDisabled={mediationOrderDetails?.status === OrderWorkflowState.PUBLISHED}
                  icon={<EditPencilIcon width="20" height="20" />}
                />
              </div>
            )}
          </div>
          <ActionBar className="action-bar">
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
              {isUserLoggedIn &&
                isCitizen &&
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
                {isUserLoggedIn && (signatureDocumentId || mediationFileStoreId) && (
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
                {isUserLoggedIn &&
                  ((isMediationCreator && digitalizationServiceDetails?.status === MediationWorkflowState.PENDING_E_SIGN) || isCitizen) && (
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
                {((isUserLoggedIn && isMediationApprover && digitalizationServiceDetails?.status === MediationWorkflowState.PENDING_REVIEW) ||
                  ((isCitizen || (!isUserLoggedIn && isAuthorised && !hasUserSigned)) &&
                    digitalizationServiceDetails?.status === MediationWorkflowState.PENDING_E_SIGN)) && (
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
