import { DocumentSearchConfig } from "./DocumentsV2Config";
import { InboxSearchComposer, Loader } from "@egovernments/digit-ui-react-components";
import CustomToast from "../../../components/CustomToast";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import "./tabs.css";
import { SubmissionWorkflowState } from "../../../Utils/submissionWorkflow";
import { getAllAssociatedPartyUuids, getAuthorizedUuid, getDate } from "../../../Utils";
import useDownloadCasePdf from "../../../hooks/dristi/useDownloadCasePdf";
import { useRouteMatch } from "react-router-dom/cjs/react-router-dom.min";
import { MediationWorkflowState } from "../../../Utils/orderWorkflow";
import { DRISTIService } from "../../../services";
import EditSendBackModal from "../../../components/EditSendBackModal";

const DocumentsV2 = ({
  caseDetails,
  caseCourtId,
  tenantId,
  caseId,
  filingNumber,
  cnrNumber,
  setDocumentSubmission,
  setShow,
  setShowMakeAsEvidenceModal,
  setShowConfirmationModal,
  setVoidReason,
  setShowVoidModal,
  setSelectedRow,
  setSelectedItem,
  setShowWitnessDepositionDoc,
  counter,
  setShowWitnessModal,
  setShowExaminationModal,
  setExaminationDocumentNumber,
  setDocumentCounter,
}) => {
  const userRoles = Digit.UserService.getUser()?.info?.roles.map((role) => role.code);
  const roles = Digit.UserService.getUser()?.info?.roles;
  const { path } = useRouteMatch();
  const history = useHistory();
  const { t } = useTranslation();

  const userInfo = JSON.parse(window.localStorage.getItem("user-info"));
  const userUuid = userInfo?.uuid;
  const authorizedUuid = getAuthorizedUuid(userUuid);
  const { downloadPdf } = useDownloadCasePdf();

  const isCitizen = userRoles?.includes("CITIZEN");
  const canSign = roles?.some((role) => role.code === "JUDGE_ROLE");
  const [activeTab, setActiveTab] = useState(sessionStorage.getItem("documents-activeTab") || "Documents");
  const [showToast, setShowToast] = useState(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [deleteDigitalization, setDeleteDigitalization] = useState(null);
  const [deleteEvidence, setDeleteEvidence] = useState(null);

  const { data: evidenceTypeData } = Digit.Hooks.useCustomMDMS(Digit.ULBService.getStateId(), "Evidence", [{ name: "EvidenceType" }], {
    select: (data) => {
      return data?.["Evidence"]?.EvidenceType || [];
    },
  });

  const evidenceTypeOptions = useMemo(() => {
    if (!evidenceTypeData) return [];

    return evidenceTypeData
      ?.map((item) => {
        const name = item?.subtype && item?.subtype.trim() !== "" ? `${item?.type}_${item?.subtype}` : item?.type;

        return {
          ...item,
          name: name,
          // label: t(`EVIDENCE_TYPE_${name}`),
        };
      })
      ?.sort((a, b) => {
        const nameA = t(a?.name);
        const nameB = t(b?.name);
        return nameA?.localeCompare(nameB);
      });
  }, [evidenceTypeData, t]);

  const ditilizationDeleteFunc = (history, column, row, item) => {
    if (item.id === "draft_ditilization_delete") {
      setDeleteDigitalization(row);
    }
  };

  const handleDeleteDigitalization = async () => {
    if (!deleteDigitalization) return;

    setIsActionLoading(true);
    try {
      const documentNumber = deleteDigitalization?.documentNumber;
      const res = await Digit.submissionService.searchDigitalization({
        criteria: {
          tenantId: tenantId,
          courtId: deleteDigitalization?.courtId,
          documentNumber: documentNumber,
        },
        pagination: {
          limit: 10,
          offSet: 0,
        },
      });
      const payload = {
        digitalizedDocument: {
          ...res?.documents?.[0],
          workflow: {
            action: "DELETE_DRAFT",
          },
        },
      };
      await Digit.submissionService.updateDigitalization(payload, tenantId);
      setDocumentCounter((prev) => prev + 1);
      setDeleteDigitalization(null);
    } catch (error) {
      console.error("Failed to delete digitalization draft:", error);
      const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
      setShowToast({ label: t("DELETE_DIGITALIZATION_DRAFT_FAILED"), error: true, errorId });
    } finally {
      setIsActionLoading(false);
    }
  };

  const evidenceDeleteFunc = (row) => {
    setDeleteEvidence(row);
  };

  const handleDeleteEvidence = async () => {
    if (!deleteEvidence) return;

    setIsActionLoading(true);
    try {
      const courtId = deleteEvidence?.courtId;
      const filingNo = deleteEvidence?.filingNumber || filingNumber;
      const artifactNum = deleteEvidence?.artifactNumber;

      const searchRes = await DRISTIService.searchEvidence(
        {
          criteria: {
            courtId: courtId,
            filingNumber: filingNo,
            artifactNumber: artifactNum,
            asUser: authorizedUuid,
            tenantId,
          },
          tenantId,
        },
        {}
      );

      const existing = searchRes?.artifacts?.[0];
      if (!existing) return;

      const payload = {
        ...existing,
        isEvidenceMarkedFlow: true,
        workflow: {
          action: "DELETE_DRAFT",
        },
      };
      await DRISTIService.updateEvidence({ artifact: payload }, {});
      setShowToast({ label: t("DELETE_EVIDENCE_DRAFT_SUCCESS"), error: false });
      history.replace(`${path}?caseId=${caseId}&filingNumber=${filingNumber}&tab=Documents`);
      setDeleteEvidence(null);
    } catch (error) {
      console.error("Error deleting evidence draft:", error);
      const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
      setShowToast({ label: t("DELETE_EVIDENCE_DRAFT_ERROR"), error: true, errorId });
    } finally {
      setIsActionLoading(false);
    }
  };

  const configList = useMemo(() => {
    const docSetFunc = (docObj) => {
      if (docObj?.[0]?.isDigitilization && ["PLEA", "EXAMINATION_OF_ACCUSED", "MEDIATION"]?.includes(docObj?.[0]?.artifactList?.type)) {
        const type = docObj?.[0]?.artifactList?.type;
        const status = docObj?.[0]?.artifactList?.status;
        const filingNumber = docObj?.[0]?.artifactList?.caseFilingNumber;
        const documentNumber = docObj?.[0]?.artifactList?.documentNumber;
        const courtId = docObj?.[0]?.artifactList?.courtId;
        if (type === "PLEA") {
          if (status === "DRAFT_IN_PROGRESS" && !isCitizen) {
            history.push(
              `/${window?.contextPath}/${
                isCitizen ? "citizen" : "employee"
              }/submissions/record-plea?filingNumber=${filingNumber}&documentNumber=${documentNumber}`
            );
            return;
          }

          if (status === "PENDING_E-SIGN" && isCitizen) {
            const respondentData = caseDetails?.additionalDetails?.respondentDetails?.formdata?.find(
              (respondent) => respondent?.uniqueId === docObj?.[0]?.artifactList?.pleaDetails?.accusedUniqueId
            );
            let accusedIndividualId = "";
            if (respondentData?.data?.respondentVerification?.individualDetails?.individualId) {
              accusedIndividualId = respondentData?.data?.respondentVerification?.individualDetails?.individualId;
            }
            const partyUUID = caseDetails?.litigants?.find((lit) => lit?.individualId === accusedIndividualId)?.additionalDetails?.uuid;
            history.push(
              `/${window?.contextPath}/citizen/dristi/home/digitalized-document-sign?tenantId=${tenantId}&digitalizedDocumentId=${documentNumber}&type=${type}`,
              { partyUUID }
            );
            return;
          }

          if (["PENDING_E-SIGN", "PENDING_REVIEW", "COMPLETED", "VOID"]?.includes(status)) {
            history.push(
              `/${window?.contextPath}/${
                isCitizen ? "citizen" : "employee"
              }/home/digitized-document-sign?filingNumber=${filingNumber}&documentNumber=${documentNumber}&caseId=${caseId}`
            );
          }
        } else if (type === "EXAMINATION_OF_ACCUSED") {
          if (status === "DRAFT_IN_PROGRESS") {
            setShowExaminationModal(true);
            setExaminationDocumentNumber(documentNumber);
          }

          if (status === "PENDING_E-SIGN" && isCitizen) {
            const respondentData = caseDetails?.additionalDetails?.respondentDetails?.formdata?.find(
              (respondent) => respondent?.uniqueId === docObj?.[0]?.artifactList?.examinationOfAccusedDetails?.accusedUniqueId
            );
            let accusedIndividualId = "";
            if (respondentData?.data?.respondentVerification?.individualDetails?.individualId) {
              accusedIndividualId = respondentData?.data?.respondentVerification?.individualDetails?.individualId;
            }
            const partyUUID = caseDetails?.litigants?.find((lit) => lit?.individualId === accusedIndividualId)?.additionalDetails?.uuid;
            history.push(
              `/${window?.contextPath}/citizen/dristi/home/digitalized-document-sign?tenantId=${tenantId}&digitalizedDocumentId=${documentNumber}&type=${type}`,
              { partyUUID }
            );
            return;
          }

          if (["PENDING_E-SIGN", "PENDING_REVIEW", "COMPLETED", "VOID"]?.includes(status)) {
            history.push(
              `/${window?.contextPath}/${
                isCitizen ? "citizen" : "employee"
              }/home/digitized-document-sign?filingNumber=${filingNumber}&documentNumber=${documentNumber}&caseId=${caseId}`
            );
          }
        } else if (type === "MEDIATION") {
          if (
            [MediationWorkflowState.PENDING_E_SIGN, MediationWorkflowState.PENDING_UPLOAD, MediationWorkflowState.PENDING_REVIEW]?.includes(status)
          ) {
            history.push(
              `/${window.contextPath}/${
                isCitizen ? "citizen" : "employee"
              }/home/mediation-form-sign?filingNumber=${filingNumber}&documentNumber=${documentNumber}&courtId=${courtId}`
            );
            return;
          }

          if (["COMPLETED", "VOID"]?.includes(status)) {
            history.push(
              `/${window?.contextPath}/${
                isCitizen ? "citizen" : "employee"
              }/home/digitized-document-sign?filingNumber=${filingNumber}&documentNumber=${documentNumber}&caseId=${caseId}`
            );
            return;
          }
        }
      } else if (docObj?.[0]?.isBail) {
        const bailStatus = docObj?.[0]?.artifactList?.status;
        const documentOwnerUuid = docObj?.[0]?.artifactList?.asUser;
        const allAllowedPartiesForDocumentsActions = getAllAssociatedPartyUuids(caseDetails, documentOwnerUuid);

        const bailBondId = docObj?.[0]?.artifactList?.bailId;
        const filingNumber = docObj?.[0]?.artifactList?.filingNumber;
        const caseId = docObj?.[0]?.artifactList?.caseId;
        if (isCitizen) {
          if (bailStatus === "DRAFT_IN_PROGRESS" && allAllowedPartiesForDocumentsActions.includes(userUuid)) {
            history.push(
              `/${window?.contextPath}/${
                isCitizen ? "citizen" : "employee"
              }/submissions/bail-bond?filingNumber=${filingNumber}&bailBondId=${bailBondId}`
            );
          }

          if (bailStatus === "PENDING_E-SIGN") {
            history.push(
              `/${window?.contextPath}/${
                isCitizen ? "citizen" : "employee"
              }/dristi/home/bail-bond-sign?tenantId=${tenantId}&bailbondId=${bailBondId}&filingNumber=${filingNumber}&caseId=${caseId}`
            );
          }

          if (["PENDING_REVIEW", "COMPLETED", "VOID"]?.includes(bailStatus)) {
            history.push(
              `/${window?.contextPath}/${
                isCitizen ? "citizen" : "employee"
              }/home/sign-bail-bond?filingNumber=${filingNumber}&bailId=${bailBondId}&caseId=${caseId}`,
              { state: { params: { caseId, filingNumber } } }
            );
          }
        } else {
          if (["PENDING_REVIEW", "COMPLETED", "VOID"]?.includes(bailStatus)) {
            history.push(
              `/${window?.contextPath}/${
                isCitizen ? "citizen" : "employee"
              }/home/sign-bail-bond?filingNumber=${filingNumber}&bailId=${bailBondId}&caseId=${caseId}`,
              { state: { params: { caseId, filingNumber } } }
            );
          }
        }
      } else if (docObj?.[0]?.details?.applicationType === "WITNESS_DEPOSITION") {
        const artifactNumber = docObj?.[0]?.artifactList?.artifactNumber;
        const documentStatus = docObj?.[0]?.artifactList?.status;
        const sourceID = docObj?.[0]?.artifactList?.sourceID;
        const token = window.localStorage.getItem("token");
        const isUserLoggedIn = Boolean(token);
        if (documentStatus === "PENDING_E-SIGN" && sourceID === userUuid && isUserLoggedIn) {
          history.push(
            `/${
              window?.contextPath
            }/${"citizen"}/dristi/home/evidence-sign?tenantId=${tenantId}&artifactNumber=${artifactNumber}&filingNumber=${filingNumber}`
          );
        }
        if (documentStatus === "DRAFT_IN_PROGRESS") {
          setShowWitnessModal({ show: true, artifactNumber: artifactNumber });
        } else {
          if (documentStatus === "PENDING_REVIEW" && canSign) {
            history.push({
              pathname: `/${window?.contextPath}/employee/home/sign-witness-deposition`,
              search: `?filingNumber=${filingNumber}&artifactNumber=${artifactNumber}&caseId=${caseId}`,
              state: { docObj: docObj?.[0] },
            });
          } else {
            setShowWitnessDepositionDoc({ docObj: docObj?.[0], show: true });
          }
        }
      } else {
        const applicationNumber = docObj?.[0]?.applicationList?.applicationNumber;
        const status = docObj?.[0]?.applicationList?.status;
        const applicationOwnerUuid = docObj?.[0]?.applicationList?.asUser;
        const documentOwnerUuid = docObj?.[0]?.artifactList?.asUser;
        const artifactNumber = docObj?.[0]?.artifactList?.artifactNumber;
        const documentStatus = docObj?.[0]?.artifactList?.status;
        const allAllowedPartiesForApplicationsActions = getAllAssociatedPartyUuids(caseDetails, applicationOwnerUuid);
        const allAllowedPartiesForDocumentsActions = getAllAssociatedPartyUuids(caseDetails, documentOwnerUuid);
        if (documentStatus === "PENDING_E-SIGN" && allAllowedPartiesForDocumentsActions.includes(userUuid)) {
          history.push(
            `/${window?.contextPath}/${
              isCitizen ? "citizen" : "employee"
            }/submissions/submit-document?filingNumber=${filingNumber}&artifactNumber=${artifactNumber}`
          );
        }
        if (
          [SubmissionWorkflowState.PENDINGPAYMENT, SubmissionWorkflowState.PENDINGESIGN, SubmissionWorkflowState.PENDINGSUBMISSION].includes(status)
        ) {
          if (allAllowedPartiesForApplicationsActions.includes(userUuid)) {
            history.push(
              `/${window?.contextPath}/${
                isCitizen ? "citizen" : "employee"
              }/submissions/submissions-create?filingNumber=${filingNumber}&applicationNumber=${applicationNumber}`
            );
          }
        } else {
          setDocumentSubmission(docObj);
          setShow(true);
        }
        if (
          ![SubmissionWorkflowState.PENDINGPAYMENT, SubmissionWorkflowState.PENDINGESIGN, SubmissionWorkflowState.PENDINGSUBMISSION].includes(status)
        ) {
          setDocumentSubmission(docObj);
          setShow(true);
        }
      }
    };

    const handleFilingAction = async (history, column, row, item) => {
      const docObj = [
        {
          itemType: item.id,
          status: row.workflow?.action,
          details: {
            applicationType: row.artifactType,
            applicationSentOn: getDate(parseInt(row.auditdetails.createdTime)),
            sender: row.owner,
            additionalDetails: row.additionalDetails,
            applicationId: row.id,
            auditDetails: row.auditDetails,
          },
          applicationContent: {
            tenantId: row.tenantId,
            fileStoreId: row.file?.fileStore,
            id: row.file?.id,
            documentType: row.file?.documentType,
            documentUid: row.file?.documentUid,
            additionalDetails: row.file?.additionalDetails,
          },
          comments: row.comments,
          artifactList: row,
        },
      ];
      if ("mark_as_evidence" === item.id || "unmark_as_evidence" === item.id || "view_mark_as_evidence" === item.id) {
        setSelectedRow(row);
        setDocumentSubmission(docObj);
        setSelectedItem(item); // Store row before showing the modal
        setShowMakeAsEvidenceModal(true);
        // setShowConfirmationModal(true);
      } else if ("mark_as_void" === item.id || "view_reason_for_voiding" === item.id) {
        setDocumentSubmission(docObj);
        setVoidReason(row?.reason);
        setShowVoidModal(true);
      } else if ("download_filing" === item.id) {
        downloadPdf(tenantId, row?.file?.fileStore);
      } else if ("delete_evidence_draft" === item.id) {
        evidenceDeleteFunc(row);
      }
    };

    const activeTabConfig = DocumentSearchConfig?.DocumentSearchConfig.find((tabConfig) => tabConfig.label === activeTab);
    if (!activeTabConfig) return [];

    const getTabConfig = (tabConfig) => {
      switch (tabConfig.label) {
        case "Documents":
          return {
            ...tabConfig,
            apiDetails: {
              ...tabConfig.apiDetails,
              requestBody: {
                ...tabConfig.apiDetails.requestBody,
                criteria: {
                  caseId: caseId,
                  filingNumber: filingNumber,
                  tenantId: tenantId,
                  ...(caseCourtId && { courtId: caseCourtId }),
                },
              },
            },
            sections: {
              ...tabConfig.sections,
              search: {
                ...tabConfig.sections.search,
                uiConfig: {
                  ...tabConfig.sections.search.uiConfig,
                  fields: [
                    ...tabConfig?.sections?.search?.uiConfig?.fields?.map?.((field) => {
                      if (field.key === "artifactType") {
                        return {
                          ...field,
                          populators: {
                            ...field.populators,
                            options: evidenceTypeOptions || [],
                          },
                        };
                      }
                      return field;
                    }),
                  ],
                },
              },
              searchResult: {
                ...tabConfig.sections.searchResult,
                uiConfig: {
                  ...tabConfig.sections.searchResult.uiConfig,
                  columns: tabConfig.sections.searchResult.uiConfig.columns.map((column) => {
                    switch (column.label) {
                      case "FILE":
                      case "FILING_NAME":
                        return { ...column, clickFunc: docSetFunc };
                      case "CS_ACTIONS":
                        return { ...column, clickFunc: handleFilingAction };
                      default:
                        return column;
                    }
                  }),
                },
              },
            },
          };
        case "Bail Bonds":
          return {
            ...tabConfig,
            apiDetails: {
              ...tabConfig.apiDetails,
              requestBody: {
                ...tabConfig.apiDetails.requestBody,
                criteria: {
                  ...(tabConfig.apiDetails?.requestBody?.criteria || {}),
                  filingNumber: filingNumber,
                },
              },
            },
            sections: {
              ...tabConfig.sections,
              search: {
                ...tabConfig.sections.search,
                uiConfig: {
                  ...tabConfig.sections.search.uiConfig,
                  fields: [...tabConfig.sections.search.uiConfig.fields],
                },
              },
              searchResult: {
                ...tabConfig.sections.searchResult,
                uiConfig: {
                  ...tabConfig.sections.searchResult.uiConfig,
                  columns: tabConfig.sections.searchResult.uiConfig.columns.map((column) => {
                    switch (column.label) {
                      case "BAIL_TYPE":
                        return { ...column, clickFunc: docSetFunc };
                      case "CS_ACTIONS":
                        return { ...column, clickFunc: handleFilingAction };
                      default:
                        return column;
                    }
                  }),
                },
              },
            },
          };
        case "Digitalization Forms":
          return {
            ...tabConfig,
            apiDetails: {
              ...tabConfig.apiDetails,
              requestBody: {
                ...tabConfig.apiDetails.requestBody,
                SearchCriteria: {
                  ...(tabConfig.apiDetails?.requestBody?.SearchCriteria || {}),
                  moduleSearchCriteria: {
                    ...(tabConfig.apiDetails?.requestBody?.SearchCriteria?.moduleSearchCriteria || {}),
                    caseFilingNumber: filingNumber,
                  },
                },
              },
            },
            sections: {
              ...tabConfig.sections,
              search: {
                ...tabConfig.sections.search,
                uiConfig: {
                  ...tabConfig.sections.search.uiConfig,
                  fields: [...tabConfig.sections.search.uiConfig.fields],
                },
              },
              searchResult: {
                ...tabConfig.sections.searchResult,
                uiConfig: {
                  ...tabConfig.sections.searchResult.uiConfig,
                  columns: tabConfig.sections.searchResult.uiConfig.columns.map((column) => {
                    switch (column.label) {
                      case "DOCUMENT_TYPE":
                        return { ...column, clickFunc: docSetFunc };
                      case "CS_ACTIONS":
                        return { ...column, clickFunc: ditilizationDeleteFunc };
                      default:
                        return column;
                    }
                  }),
                },
              },
            },
          };
        default:
          return {
            ...tabConfig,
            apiDetails: {
              ...tabConfig.apiDetails,
              requestParam: {
                ...tabConfig.apiDetails?.requestParam,
                filingNumber: filingNumber,
                cnrNumber,
                applicationNumber: "",
              },
            },
          };
      }
    };

    return getTabConfig(activeTabConfig);
  }, [
    activeTab,
    isCitizen,
    evidenceTypeOptions,
    caseDetails,
    userUuid,
    caseId,
    filingNumber,
    canSign,
    caseCourtId,
    cnrNumber,
    downloadPdf,
    history,
    setDocumentSubmission,
    setExaminationDocumentNumber,
    setSelectedItem,
    setSelectedRow,
    setShow,
    setShowExaminationModal,
    setShowMakeAsEvidenceModal,
    setShowVoidModal,
    setShowWitnessDepositionDoc,
    setShowWitnessModal,
    setVoidReason,
    tenantId,
  ]);
  const newTabSearchConfig = useMemo(
    () => ({
      ...DocumentSearchConfig,
      TabSearchconfig: configList,
    }),
    [configList]
  );
  const tabData = useMemo(() => {
    return DocumentSearchConfig?.DocumentSearchConfig?.map((configItem, index) => ({
      key: index,
      label: configItem.label,
      active: configItem?.label === activeTab ? true : false,
      displayLabel: configItem?.displayLabel,
    }));
  }, [activeTab]);

  useEffect(() => {
    if (sessionStorage.getItem("markAsEvidenceSelectedItem")) {
      setShowMakeAsEvidenceModal(true);
    }
  }, [setShowMakeAsEvidenceModal]);
  const config = useMemo(() => {
    if (!caseDetails?.filingNumber) return null; // wait for caseDetails to load
    return newTabSearchConfig?.TabSearchconfig;
  }, [newTabSearchConfig?.TabSearchconfig, caseDetails?.filingNumber]);

  return (
    <React.Fragment>
      <div style={{ padding: "5px", margin: "5px" }}>
        {tabData?.map((i, num) => {
          const isActive = activeTab === i.label;
          return (
            <button
              key={num}
              onClick={() => {
                setActiveTab(i?.label);
                sessionStorage.setItem("documents-activeTab", i?.label);
              }}
              style={{
                fontSize: "18px",
                fontWeight: isActive ? "bold" : "normal",
                color: isActive ? "#005b5b" : "#8a8a8a",
                border: "none",
                background: "none",
                paddingBottom: "6px",
                borderBottom: isActive ? "3px solid #005b5b" : "3px solid transparent",
                marginRight: "16px",
                cursor: "pointer",
              }}
            >
              {t(i?.displayLabel)}
            </button>
          );
        })}
      </div>
      {config ? (
        <InboxSearchComposer key={`${config?.label}-${counter}-${caseDetails?.filingNumber}`} configs={config} showTab={false}></InboxSearchComposer>
      ) : (
        <Loader></Loader>
      )}
      {(deleteEvidence !== null || deleteDigitalization !== null) && (
        <EditSendBackModal
          t={t}
          handleCancel={() => {
            if (!isActionLoading) {
              setDeleteEvidence(null);
              setDeleteDigitalization(null);
            }
          }}
          handleSubmit={() => {
            if (deleteEvidence !== null) {
              handleDeleteEvidence();
            } else if (deleteDigitalization !== null) {
              handleDeleteDigitalization();
            }
          }}
          headerLabel={"GENERATE_ORDER_CONFIRM_DELETE"}
          saveLabel={"GENERATE_ORDER_DELETE"}
          cancelLabel={"GENERATE_ORDER_CANCEL_EDIT"}
          contentText={
            deleteEvidence !== null
              ? "ARE_YOU_SURE_YOU_WANT_TO_DELETE_THIS_EVIDENCE_DRAFT"
              : "ARE_YOU_SURE_YOU_WANT_TO_DELETE_THIS_DIGITALIZATION_DRAFT"
          }
          className={"edit-send-back-modal"}
          submitButtonStyle={{ backgroundColor: "#C7222A" }}
          loader={isActionLoading}
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
};

export default DocumentsV2;
