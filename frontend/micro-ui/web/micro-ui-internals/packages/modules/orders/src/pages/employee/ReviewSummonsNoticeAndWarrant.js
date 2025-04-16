import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Header, InboxSearchComposer } from "@egovernments/digit-ui-react-components";
import { defaultSearchValuesForJudgePending, SummonsTabsConfig, SummonsTabsConfigJudge } from "../../configs/SuumonsConfig";
import { useTranslation } from "react-i18next";
import DocumentModal from "../../components/DocumentModal";
import PrintAndSendDocumentComponent from "../../components/Print&SendDocuments";
import DocumentViewerWithComment from "../../components/DocumentViewerWithComment";
import AddSignatureComponent from "../../components/AddSignatureComponent";
import CustomStepperSuccess from "../../components/CustomStepperSuccess";
import UpdateDeliveryStatusComponent from "../../components/UpdateDeliveryStatusComponent";
import { ordersService, taskService } from "../../hooks/services";
import { Urls } from "../../hooks/services/Urls";
import { convertToDateInputFormat, formatDate } from "../../utils/index";
import { DRISTIService } from "@egovernments/digit-ui-module-dristi/src/services";
import { useHistory } from "react-router-dom";
import isEqual from "lodash/isEqual";
import axios from "axios";
import ReviewNoticeModal from "../../components/ReviewNoticeModal";
const defaultSearchValues = {
  eprocess: "",
  caseId: "",
};

const handleTaskDetails = (taskDetails) => {
  try {
    // Check if taskDetails is a string
    if (typeof taskDetails === "string") {
      // First, remove escape characters like backslashes if present
      const cleanedDetails = taskDetails.replace(/\\n/g, "").replace(/\\/g, "");
      return JSON.parse(cleanedDetails);
    }
    // If taskDetails is not a string, return it as it is
    return taskDetails;
  } catch (error) {
    console.error("Failed to parse taskDetails:", error);
    return null;
  }
};

export const getJudgeDefaultConfig = () => {
  return SummonsTabsConfig?.SummonsTabsConfig?.map((item, index) => {
    return {
      ...item,
      sections: {
        ...item?.sections,
        search: {
          ...item?.sections?.search,
          uiConfig: {
            ...item?.sections?.search?.uiConfig,
            defaultValues: index === 0 ? defaultSearchValuesForJudgePending : defaultSearchValues,
          },
        },
      },
    };
  });
};

const ReviewSummonsNoticeAndWarrant = () => {
  const { t } = useTranslation();
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const [defaultValues, setDefaultValues] = useState(defaultSearchValues);
  const roles = Digit.UserService.getUser()?.info?.roles;
  const isJudge = roles.some((role) => role.code === "JUDGE_ROLE");
  const [config, setConfig] = useState(isJudge ? getJudgeDefaultConfig()?.[0] : SummonsTabsConfig?.SummonsTabsConfig?.[0]);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showNoticeModal, setshowNoticeModal] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isIcops, setIsIcops] = useState({ state: null, message: "", icopsAcknowledgementNumber: "" });
  const [actionModalType, setActionModalType] = useState("");
  const [isDisabled, setIsDisabled] = useState(true);
  const [rowData, setRowData] = useState({});
  const { taskNumber } = Digit.Hooks.useQueryParams();
  const [nextHearingDate, setNextHearingDate] = useState();
  const [step, setStep] = useState(0);
  const [signatureId, setSignatureId] = useState("");
  const [deliveryChannel, setDeliveryChannel] = useState("");
  const [reload, setReload] = useState(false);
  // const [taskDetails, setTaskDetails] = useState({});
  const [tasksData, setTasksData] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [selectedDelievery, setSelectedDelievery] = useState({});
  const history = useHistory();
  const dayInMillisecond = 24 * 3600 * 1000;
  const todayDate = new Date().getTime();
  const [updateStatusDate, setUpdateStatusDate] = useState("");

  const [tabData, setTabData] = useState(
    isJudge
      ? getJudgeDefaultConfig()?.map((configItem, index) => ({ key: index, label: configItem.label, active: index === 0 ? true : false }))
      : SummonsTabsConfig?.SummonsTabsConfig?.map((configItem, index) => ({
          key: index,
          label: configItem.label,
          active: index === 0 ? true : false,
        }))
  );

  // const handleOpen = (props) => {
  //change status to signed or unsigned
  // };

  const handleDownload = useCallback(() => {
    const fileStoreId = rowData?.documents?.filter((data) => data?.documentType === "SIGNED_TASK_DOCUMENT")?.[0]?.fileStore;
    const uri = `${window.location.origin}${Urls.FileFetchById}?tenantId=${tenantId}&fileStoreId=${fileStoreId}`;
    const authToken = localStorage.getItem("token");
    axios
      .get(uri, {
        headers: {
          "auth-token": `${authToken}`,
        },
        responseType: "blob",
      })
      .then((response) => {
        if (response.status === 200) {
          const blob = new Blob([response.data], { type: "application/octet-stream" });
          const blobUrl = URL.createObjectURL(blob);
          const mimeType = response.data.type || "application/octet-stream";
          const extension = mimeType.includes("/") ? mimeType.split("/")[1] : "bin";
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = `downloadedFile.${extension}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        } else {
          console.error("Failed to fetch the PDF:", response.statusText);
        }
      })
      .catch((error) => {
        console.error("Error during the API request:", error);
      });
  }, [rowData, tenantId]);

  const { data: fetchedTasksData, refetch } = Digit.Hooks.hearings.useGetTaskList(
    {
      criteria: {
        tenantId: tenantId,
        taskNumber: rowData?.taskNumber,
      },
    },
    {},
    rowData?.taskNumber,
    Boolean(showActionModal || step)
  );

  const getTaskDetailsByTaskNumber = useCallback(
    async function () {
      const response = await DRISTIService.customApiService("/task/v1/table/search", {
        criteria: {
          searchText: taskNumber,
          tenantId,
        },
      });
      handleRowClick({ original: response?.list?.[0] });
    },
    [taskNumber, tenantId]
  );

  useEffect(() => {
    if (fetchedTasksData && !isEqual(fetchedTasksData, tasksData)) {
      setTasksData(fetchedTasksData); // Store tasksData only if it's different
    }
  }, [fetchedTasksData, tasksData]);

  const { data: orderData } = Digit.Hooks.orders.useSearchOrdersService(
    { tenantId, criteria: { id: tasksData?.list[0]?.orderId } },
    { tenantId },
    tasksData?.list[0]?.orderId,
    Boolean(tasksData)
  );

  const compositeItem = useMemo(
    () => orderData?.list?.[0]?.compositeItems?.find((item) => item?.id === tasksData?.list[0]?.additionalDetails?.itemId),
    [orderData, tasksData]
  );

  const orderType = useMemo(
    () => (orderData?.list?.[0]?.orderCategory === "COMPOSITE" ? compositeItem?.orderType : orderData?.list?.[0]?.orderType),
    [orderData, compositeItem]
  );

  const handleSubmitButtonDisable = (disable) => {
    setIsDisabled(disable);
  };

  const handleClose = useCallback(() => {
    localStorage.removeItem("SignedFileStoreID");
    setShowActionModal(false);
    if (taskNumber) history.replace(`/${window?.contextPath}/employee/orders/Summons&Notice`);
    setReload(!reload);
  }, [history, reload, taskNumber]);

  const handleSubmit = useCallback(async () => {
    localStorage.removeItem("SignedFileStoreID");
    const { data: tasksData } = await refetch();
    if (tasksData) {
      try {
        const task = tasksData?.list?.[0];
        const reqBody = {
          task: {
            ...task,
            ...(typeof task?.taskDetails === "string" && { taskDetails: JSON.parse(task?.taskDetails) }),
            taskDetails: {
              ...(typeof task?.taskDetails === "string" ? JSON.parse(task?.taskDetails) : task?.taskDetails),
              deliveryChannels: {
                ...task?.taskDetails?.deliveryChannels,
                statusChangeDate: formatDate(new Date()),
              },
            },
            workflow: {
              ...tasksData?.list?.[0]?.workflow,
              action: "SEND",
              documents: [{}],
            },
          },
        };
        await taskService.updateTask(reqBody, { tenantId });
        setShowActionModal(false);
        setReload(!reload);
      } catch (error) {
        console.error("Error updating task data:", error);
      }
    }
  }, [refetch, reload, tasksData, tenantId]);

  const handleUpdateStatus = useCallback(async () => {
    const { data: tasksData } = await refetch();
    if (tasksData) {
      try {
        const task = tasksData?.list?.[0];
        const reqBody = {
          task: {
            ...task,
            ...(typeof task?.taskDetails === "string" && { taskDetails: JSON.parse(task?.taskDetails) }),
            taskDetails: {
              ...(typeof task?.taskDetails === "string" ? JSON.parse(task?.taskDetails) : task?.taskDetails),
              deliveryChannels: {
                ...task?.taskDetails?.deliveryChannels,
                statusChangeDate: updateStatusDate
                  ? updateStatusDate
                  : convertToDateInputFormat(rowData?.taskDetails?.deliveryChannels?.statusChangeDate),
              },
              remarks: {
                remark: remarks,
              },
            },
            workflow: {
              ...tasksData?.list?.[0]?.workflow,
              action:
                selectedDelievery?.key === "DELIVERED"
                  ? orderType === "WARRANT"
                    ? "DELIVERED"
                    : "SERVED"
                  : orderType === "WARRANT"
                  ? "NOT_DELIVERED"
                  : "NOT_SERVED",
              documents: [{}],
            },
          },
        };
        await taskService.updateTask(reqBody, { tenantId }).then(async (res) => {
          if (res?.task && selectedDelievery?.key === "NOT_DELIVERED" && orderType !== "WARRANT") {
            await taskService.updateTask(
              {
                task: {
                  ...res.task,
                  workflow: {
                    ...res.task?.workflow,
                    action: orderType === "SUMMONS" ? "NEW_SUMMON" : "NEW_NOTICE",
                  },
                },
              },
              { tenantId }
            );
          }
        });
        if (selectedDelievery?.key === "NOT_DELIVERED") {
          ordersService.customApiService(Urls.orders.pendingTask, {
            pendingTask: {
              name: `Re-issue ${orderType === "NOTICE" ? "Notice" : "Summon"}`,
              entityType: "order-default",
              referenceId: `MANUAL_${orderData?.list[0]?.hearingNumber}`,
              status: `RE-ISSUE_${orderType === "NOTICE" ? "NOTICE" : "SUMMON"}`,
              assignedTo: [],
              assignedRole: ["JUDGE_ROLE"],
              cnrNumber: tasksData?.list[0]?.cnrNumber,
              filingNumber: tasksData?.list[0]?.filingNumber,
              isCompleted: false,
              stateSla: 3 * dayInMillisecond + todayDate,
              additionalDetails: {},
              tenantId,
            },
          });
        }
        setShowActionModal(false);
        setReload(!reload);
      } catch (error) {
        console.error("Error updating task data:", error);
      }
    }
  }, [dayInMillisecond, orderData, orderType, refetch, reload, selectedDelievery, tasksData, tenantId, todayDate]);

  useEffect(() => {
    // Set default values when component mounts
    setDefaultValues(defaultSearchValues);
    const isSignSuccess = localStorage.getItem("esignProcess");
    const isRowData = JSON.parse(localStorage.getItem("ESignSummons"));
    const delieveryCh = localStorage.getItem("delieveryChannel");
    if (isSignSuccess) {
      if (rowData) {
        setRowData(isRowData);
      }
      if (delieveryCh) {
        setDeliveryChannel(delieveryCh);
      }
      setShowActionModal(true);
      setActionModalType("SIGN_PENDING");
      setStep(1);
      localStorage.removeItem("esignProcess");
      localStorage.removeItem("ESignSummons");
    }
  }, []);

  const onTabChange = (n) => {
    setTabData((prev) => prev.map((i, c) => ({ ...i, active: c === n ? true : false }))); //setting tab enable which is being clicked
    setConfig(SummonsTabsConfig?.SummonsTabsConfig?.[n]);
    setReload(!reload);
  };

  function findNextHearings(objectsList) {
    const now = Date.now();
    const futureStartTimes = objectsList.filter((obj) => obj.startTime > now);
    futureStartTimes.sort((a, b) => a.startTime - b.startTime);
    return futureStartTimes.length > 0 ? futureStartTimes[0] : null;
  }

  const getHearingFromCaseId = async () => {
    try {
      const response = await Digit.HearingService.searchHearings(
        {
          criteria: {
            tenantId: Digit.ULBService.getCurrentTenantId(),
            filingNumber: rowData?.filingNumber,
          },
        },
        {}
      );
      setNextHearingDate(findNextHearings(response?.HearingList));
    } catch (error) {
      console.error("error :>> ", error);
    }
  };

  const infos = useMemo(() => {
    if (rowData?.taskDetails || nextHearingDate) {
      const caseDetails = handleTaskDetails(rowData?.taskDetails);
      return [
        { key: "ISSUE_TO", value: caseDetails?.respondentDetails?.name },
        { key: "ISSUE_DATE", value: convertToDateInputFormat(rowData?.createdDate) },
        // { key: "Next Hearing Date", value: nextHearingDate?.startTime ? formatDate(nextHearingDate?.startTime) : "N/A" },
        { key: "AMOUNT_PAID_TEXT", value: `Rs. ${caseDetails?.deliveryChannels?.fees || 100}` },
        { key: "CHANNEL_DETAILS_TEXT", value: caseDetails?.deliveryChannels?.channelName },
      ];
    }
  }, [rowData, nextHearingDate]);

  const links = useMemo(() => {
    return [{ text: "View order", link: "" }];
  }, []);

  const documents = useMemo(() => {
    if (rowData?.documents)
      return rowData?.documents?.map((document) => {
        return { ...document, fileName: `${t(rowData?.taskType)} ${t("DOCUMENT_TEXT")}` };
      });
  }, [rowData, orderType]);

  const submissionData = useMemo(() => {
    return [
      { key: "Issued Date", value: rowData?.createdDate && convertToDateInputFormat(rowData?.createdDate), copyData: false },
      { key: "E_PROCESS_ID", value: rowData?.taskNumber, copyData: true },
    ];
  }, [rowData]);

  const submissionDataIcops = useMemo(() => {
    return [
      { key: "Issued Date", value: rowData?.createdDate && convertToDateInputFormat(rowData?.createdDate), copyData: false },
      { key: "ICOPS_ACKNOWLEDGEMENT_NUMBER", value: isIcops?.icopsAcknowledgementNumber },
    ];
  }, [rowData, isIcops]);

  const successMessage = useMemo(() => {
    let msg = "";
    const isViaPolice = rowData?.taskDetails?.deliveryChannels?.channelCode === "POLICE";
    if (documents && !isViaPolice) {
      if (orderType === "NOTICE") {
        msg = t("SUCCESSFULLY_SIGNED_NOTICE");
      } else if (orderType === "WARRANT") {
        msg = t("SUCCESSFULLY_SIGNED_WARRANT");
      } else {
        msg = t("SUCCESSFULLY_SIGNED_SUMMON");
      }
    } else {
      if (orderType === "NOTICE") {
        msg = t("SENT_NOTICE_VIA");
      } else if (orderType === "WARRANT") {
        msg = t("SENT_WARRANT_VIA");
      } else {
        msg = t("SENT_SUMMONS_VIA");
      }
    }
    return `${msg}${!documents || isViaPolice ? " " + deliveryChannel : ""}`;
  }, [documents, orderType, deliveryChannel]);

  const handleSubmitEsign = useCallback(async () => {
    try {
      const localStorageID = localStorage.getItem("fileStoreId");
      const documents = Array.isArray(rowData?.documents) ? rowData.documents : [];
      const documentsFile =
        signatureId !== "" || localStorageID
          ? {
              documentType: "SIGNED_TASK_DOCUMENT",
              fileStore: signatureId || localStorageID,
            }
          : null;
      localStorage.removeItem("fileStoreId");
      localStorage.setItem("SignedFileStoreID", documentsFile?.fileStore);
      const reqBody = {
        task: {
          ...rowData,
          ...(typeof rowData?.taskDetails === "string" && { taskDetails: JSON.parse(rowData?.taskDetails) }),
          documents: documentsFile ? [...documents, documentsFile] : documents,
          tenantId,
        },
        tenantId,
      };

      // Attempt to upload the document and handle the response
      setIsLoading(true);
      const response = await taskService.UploadTaskDocument(reqBody, { tenantId });
      if (rowData?.taskDetails?.deliveryChannels?.channelCode === "POLICE") {
        // localStorage.removeItem("SignedFileStoreID");
        const { data: tasksData } = await refetch();
        if (tasksData) {
          try {
            const task = tasksData?.list?.[0];
            const reqBody = {
              task: {
                ...task,
                ...(typeof task?.taskDetails === "string" && { taskDetails: JSON.parse(task?.taskDetails) }),
                taskDetails: {
                  ...(typeof task?.taskDetails === "string" ? JSON.parse(task?.taskDetails) : task?.taskDetails),
                  deliveryChannels: {
                    ...task?.taskDetails?.deliveryChannels,
                    statusChangeDate: formatDate(new Date()),
                  },
                },
                workflow: {
                  ...tasksData?.list?.[0]?.workflow,
                  action: "SEND",
                  documents: [{}],
                },
              },
            };
            const res = await taskService.updateTask(reqBody, { tenantId });
            const icopsAcknowledgementNumber = res?.task?.taskDetails?.deliveryChannels?.channelAcknowledgementId || "";
            setIsIcops({ state: "success", message: "", icopsAcknowledgementNumber });
            return { continue: true };
          } catch (error) {
            setIsIcops({ state: "failed", message: `Something went wrong. ${error}`, icopsAcknowledgementNumber: "" });
            console.error("Error updating task data:", error);
            return { continue: true };
          }
        }
      }
      return { continue: true };
    } catch (error) {
      // Handle errors that occur during the upload process
      console.error("Error uploading document:", error);
    } finally {
      setIsLoading(false);
    }
  }, [rowData, signatureId, tenantId]);

  const unsignedModalConfig = useMemo(() => {
    return {
      handleClose: handleClose,
      heading: { label: `${t("REVIEW_DOCUMENT_TEXT")} ${t(rowData?.taskType)} ${t("DOCUMENT_TEXT")}` },
      actionSaveLabel: t("E_SIGN_TEXT"),
      isStepperModal: true,
      actionSaveOnSubmit: () => {},
      steps: [
        {
          type: "document",
          modalBody: <DocumentViewerWithComment infos={infos} documents={documents} links={links} />,
          actionSaveOnSubmit: () => {},
          hideSubmit: rowData?.taskType === "WARRANT" && rowData?.documentStatus === "SIGN_PENDING" && !isJudge,
        },
        {
          heading: { label: t("ADD_SIGNATURE") },
          actionSaveLabel: deliveryChannel === "Email" ? t("SEND_EMAIL_TEXT") : t("PROCEED_TO_SENT"),
          actionCancelLabel: t("BACK"),
          modalBody: (
            <div>
              <AddSignatureComponent
                t={t}
                isSigned={isSigned}
                setIsSigned={setIsSigned}
                handleSigned={() => setIsSigned(true)}
                rowData={rowData}
                setSignatureId={setSignatureId}
                signatureId={signatureId}
                deliveryChannel={deliveryChannel}
              />
            </div>
          ),
          isDisabled: !isSigned || isLoading ? true : false,
          actionSaveOnSubmit: handleSubmitEsign,
          async: true,
        },
        ...(rowData?.taskDetails?.deliveryChannels?.channelCode !== "POLICE" ||
        (rowData?.taskDetails?.deliveryChannels?.channelCode === "POLICE" && isIcops?.state)
          ? [
              {
                type: isIcops?.state === "failed" ? "failure" : "success",
                hideSubmit: true,
                heading: isIcops?.state === "failed" ? { label: t("FIELD_ERROR") } : null,
                actionCancelLabel: isIcops?.state === "failed" ? t("CS_COMMON_BACK") : null,
                modalBody:
                  isIcops?.state === "failed" ? (
                    <div style={{ margin: "25px" }}>
                      <h1>{isIcops?.message}</h1>
                    </div>
                  ) : isIcops?.state === "success" ? (
                    <CustomStepperSuccess
                      successMessage={successMessage}
                      bannerSubText={t("PARTY_NOTIFIED_ABOUT_DOCUMENT")}
                      submitButtonText={"CS_COMMON_CLOSE"}
                      // closeButtonText={}
                      // closeButtonAction={false}
                      submitButtonAction={() => {
                        setShowActionModal(false);
                        setReload(!reload);
                      }}
                      t={t}
                      submissionData={submissionDataIcops}
                      documents={documents}
                      deliveryChannel={deliveryChannel}
                      orderType={orderType}
                    />
                  ) : (
                    <CustomStepperSuccess
                      successMessage={successMessage}
                      bannerSubText={t("PARTY_NOTIFIED_ABOUT_DOCUMENT")}
                      submitButtonText={documents ? "MARK_AS_SENT" : "CS_CLOSE"}
                      closeButtonText={documents ? "CS_CLOSE" : "DOWNLOAD_DOCUMENT"}
                      closeButtonAction={handleClose}
                      submitButtonAction={handleSubmit}
                      t={t}
                      submissionData={submissionData}
                      documents={documents}
                      deliveryChannel={deliveryChannel}
                      orderType={orderType}
                    />
                  ),
              },
            ]
          : [{}]),
      ],
    };
  }, [
    handleClose,
    t,
    rowData,
    infos,
    documents,
    links,
    isJudge,
    deliveryChannel,
    isSigned,
    signatureId,
    handleSubmitEsign,
    isIcops,
    successMessage,
    handleSubmit,
    submissionData,
    orderType,
  ]);

  const handleCloseActionModal = useCallback(() => {
    setShowActionModal(false);
    if (taskNumber) history.replace(`/${window?.contextPath}/employee/orders/Summons&Notice`);
  }, [history, taskNumber]);

  const signedModalConfig = useMemo(() => {
    return {
      handleClose: () => handleCloseActionModal(),
      heading: { label: t("PRINT_SEND_DOCUMENT") },
      actionSaveLabel: t("MARK_AS_SENT"),
      isStepperModal: false,
      modalBody: (
        <PrintAndSendDocumentComponent
          infos={infos}
          documents={documents?.filter((docs) => docs.documentType === "SIGNED_TASK_DOCUMENT")}
          links={links}
          t={t}
        />
      ),
      actionSaveOnSubmit: handleSubmit,
    };
  }, [documents, handleCloseActionModal, handleSubmit, infos, links, t]);

  const sentModalConfig = useMemo(() => {
    return {
      handleClose: () => handleCloseActionModal(),
      heading: { label: t("DELIVERY_STATUS_AND_DETAILS") },
      actionSaveLabel: t("UPDATE_STATUS"),
      actionCancelLabel: t("VIEW_DOCUMENT_TEXT"),
      isStepperModal: false,
      modalBody: (
        <UpdateDeliveryStatusComponent
          infos={infos}
          links={links}
          t={t}
          handleSubmitButtonDisable={handleSubmitButtonDisable}
          rowData={rowData}
          selectedDelievery={selectedDelievery}
          setSelectedDelievery={setSelectedDelievery}
          orderType={orderType}
          remarks={remarks}
          setRemarks={setRemarks}
          setUpdateStatusDate={setUpdateStatusDate}
        />
      ),
      actionSaveOnSubmit: handleUpdateStatus,
      actionCancelOnSubmit: handleDownload,
      isDisabled: isDisabled,
    };
  }, [handleCloseActionModal, handleDownload, handleUpdateStatus, infos, isDisabled, links, orderType, rowData, selectedDelievery, t]);

  useEffect(() => {
    // if (rowData?.id) getTaskDocuments();
    if (rowData?.filingNumber) getHearingFromCaseId();
    setSelectedDelievery(
      rowData?.status === "NOTICE_SENT" || rowData?.status === "SUMMON_SENT" || rowData?.status === "WARRANT_SENT" || rowData?.status === "DELIVERED"
        ? {
            key: "DELIVERED",
            value: "Delivered",
          }
        : {}
    );
  }, [rowData]);

  const handleRowClick = (props) => {
    if (["DELIVERED", "UNDELIVERED", "EXECUTED", "NOT_EXECUTED"].includes(props?.original?.status)) {
      setRowData(props?.original);
      setshowNoticeModal(true);
      return;
    }

    setRemarks("");
    setRowData(props?.original);
    setActionModalType(props?.original?.documentStatus);
    setShowActionModal(true);
    setStep(0);
    setIsSigned(props?.original?.documentStatus === "SIGN_PENDING" ? false : true);
    setDeliveryChannel(handleTaskDetails(props?.original?.taskDetails)?.deliveryChannels?.channelName);
    // setTaskDetails(handleTaskDetails(props?.original?.taskDetails));
  };

  useEffect(() => {
    if (taskNumber) {
      getTaskDetailsByTaskNumber();
    }
  }, [taskNumber, getTaskDetailsByTaskNumber]);

  const handleCloseNoticeModal = useCallback(() => {
    setshowNoticeModal(false);
    setRowData({});
  }, []);

  return (
    <div className="review-summon-warrant">
      <div className="header-wraper">
        <Header>{t("REVIEW_SUMMON_NOTICE_WARRANTS_TEXT")}</Header>
      </div>

      <div className="inbox-search-wrapper pucar-home home-view">
        {/* Pass defaultValues as props to InboxSearchComposer */}
        <InboxSearchComposer
          key={`inbox-composer-${reload}`}
          configs={config}
          defaultValues={defaultValues}
          showTab={true}
          tabData={tabData}
          onTabChange={onTabChange}
          additionalConfig={{
            resultsTable: {
              onClickRow: handleRowClick, // Use the new row click handler
            },
          }}
        ></InboxSearchComposer>
        {showActionModal && (
          <DocumentModal
            config={config?.label === "PENDING" ? (actionModalType !== "SIGN_PENDING" ? signedModalConfig : unsignedModalConfig) : sentModalConfig}
            currentStep={step}
          />
        )}
        {showNoticeModal && <ReviewNoticeModal rowData={rowData} handleCloseNoticeModal={handleCloseNoticeModal} t={t} />}
      </div>
    </div>
  );
};

export default ReviewSummonsNoticeAndWarrant;
