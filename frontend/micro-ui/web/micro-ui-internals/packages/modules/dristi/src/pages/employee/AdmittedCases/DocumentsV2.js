import { DocumentSearchConfig } from "./DocumentsV2Config";
import { InboxSearchComposer } from "@egovernments/digit-ui-react-components";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import "./tabs.css";
import { SubmissionWorkflowState } from "../../../Utils/submissionWorkflow";
import { getDate } from "../../../Utils";
import useDownloadCasePdf from "../../../hooks/dristi/useDownloadCasePdf";

const DocumentsV2 = ({
  caseDetails,
  caseCourtId,
  tenantId,
  filingNumber,
  cnrNumber,
  setDocumentSubmission,
  setShow,
  setShowConfirmationModal,
  setVoidReason,
  setShowVoidModal,
  setSelectedRow,
  setSelectedItem,
}) => {
  const userRoles = Digit.UserService.getUser()?.info?.roles.map((role) => role.code);
  const roles = Digit.UserService.getUser()?.info?.roles;
  const history = useHistory();
  const { t } = useTranslation();

  const userInfo = useMemo(() => Digit.UserService.getUser()?.info, []);
  const { downloadPdf } = useDownloadCasePdf();

  const isCitizen = userRoles?.includes("CITIZEN");
  const isJudge = userRoles?.includes("JUDGE_ROLE");
  const isFSO = roles?.some((role) => role.code === "FSO_ROLE");
  const isCourtRoomManager = roles?.some((role) => role.code === "COURT_ROOM_MANAGER");
  const isBenchClerk = roles?.some((role) => role.code === "BENCH_CLERK");
  const isTypist = roles?.some((role) => role.code === "TYPIST_ROLE");
  const [activeTab, setActiveTab] = useState("Documents");
  const configList = useMemo(() => {
    const docSetFunc = (docObj) => {
      const applicationNumber = docObj?.[0]?.applicationList?.applicationNumber;
      const status = docObj?.[0]?.applicationList?.status;
      const createdByUuid = docObj?.[0]?.applicationList?.statuteSection?.auditdetails?.createdBy;
      const documentCreatedByUuid = docObj?.[0]?.artifactList?.auditdetails?.createdBy;
      const artifactNumber = docObj?.[0]?.artifactList?.artifactNumber;
      const documentStatus = docObj?.[0]?.artifactList?.status;
      if (isCitizen || isBenchClerk || isTypist || isJudge) {
        if (documentStatus === "PENDING_E-SIGN" && documentCreatedByUuid === userInfo?.uuid) {
          history.push(
            `/${window?.contextPath}/${
              isCitizen ? "citizen" : "employee"
            }/submissions/submit-document?filingNumber=${filingNumber}&artifactNumber=${artifactNumber}`
          );
        }
        if (
          [SubmissionWorkflowState.PENDINGPAYMENT, SubmissionWorkflowState.PENDINGESIGN, SubmissionWorkflowState.PENDINGSUBMISSION].includes(status)
        ) {
          if (createdByUuid === userInfo?.uuid) {
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
      } else {
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
      if ("mark_as_evidence" === item.id || "unmark_as_evidence" === item.id) {
        setSelectedRow(row);
        setSelectedItem(item); // Store row before showing the modal
        setShowConfirmationModal(true);
      } else if ("mark_as_void" === item.id || "view_reason_for_voiding" === item.id) {
        setDocumentSubmission(docObj);
        setVoidReason(row?.reason);
        setShowVoidModal(true);
      } else if ("download_filing" === item.id) {
        downloadPdf(tenantId, row?.file?.fileStore);
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
                  caseId: caseDetails?.id,
                  filingNumber: caseDetails?.filingNumber,
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
                  fields: [...tabConfig.sections.search.uiConfig.fields],
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
                  ...tabConfig.apiDetails?.criteria,
                  filingNumber: filingNumber,
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
  }, [activeTab, userInfo, isBenchClerk, isTypist, isJudge, isCitizen, isFSO, isCourtRoomManager]);
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
  const config = useMemo(() => {
    return newTabSearchConfig?.TabSearchconfig;
  }, [newTabSearchConfig?.TabSearchconfig]);

  return (
    <React.Fragment>
      {tabData?.map((i, num) => (
        <button
          className={i?.active === true ? "search-tab-head-selected" : "search-tab-head"}
          onClick={() => {
            debugger;

            console.log(i?.label);

            setActiveTab(i?.label);
          }}
          style={{ fontSize: "18px" }}
        >
          {t(i?.displayLabel)}
        </button>
      ))}
      <InboxSearchComposer key={`${config?.label}`} configs={config} showTab={false}></InboxSearchComposer>
    </React.Fragment>
  );
};

export default DocumentsV2;
