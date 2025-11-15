import React, { useCallback, useEffect, useMemo, useState } from "react";
import { InboxSearchComposer, SubmitBar, Toast, CloseSvg, Loader, Banner } from "@egovernments/digit-ui-react-components";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import { SummonsTabsConfig } from "../../configs/SuumonsConfig";
import { useTranslation } from "react-i18next";
import DocumentModal from "../../components/DocumentModal";
import DocumentViewerWithComment from "../../components/DocumentViewerWithComment";
import AddSignatureComponent from "../../components/AddSignatureComponent";
import useDocumentUpload from "../../hooks/orders/useDocumentUpload";
import CustomStepperSuccess from "../../components/CustomStepperSuccess";
import UpdateDeliveryStatusComponent from "../../components/UpdateDeliveryStatusComponent";
import { ordersService, taskService, processManagementService } from "../../hooks/services";
import axios from "axios";
import qs from "qs";
import { Urls } from "../../hooks/services/Urls";
import { convertToDateInputFormat, formatDate, getPartyNameForInfos } from "../../utils/index";
import { DRISTIService } from "@egovernments/digit-ui-module-dristi/src/services";
import { useHistory } from "react-router-dom";
import isEqual from "lodash/isEqual";
import ReviewNoticeModal from "../../components/ReviewNoticeModal";
import useDownloadCasePdf from "@egovernments/digit-ui-module-dristi/src/hooks/dristi/useDownloadCasePdf";

const defaultSearchValues = {
  eprocess: "",
  caseId: "",
};

const sectionsParentStyle = {
  height: "50%",
  display: "flex",
  flexDirection: "column",
  gridTemplateColumns: "20% 1fr",
  gap: "1rem",
};

const handleTaskDetails = (taskDetails) => {
  try {
    if (typeof taskDetails === "string") {
      const cleanedDetails = taskDetails.replace(/\\n/g, "").replace(/\\/g, "");
      return JSON.parse(cleanedDetails);
    }
    return taskDetails;
  } catch (error) {
    console.error("Failed to parse taskDetails:", error);
    return null;
  }
};

export const getJudgeDefaultConfig = (courtId) => {
  return SummonsTabsConfig?.SummonsTabsConfig?.map((item, index) => {
    return {
      ...item,
      sections: {
        ...item?.sections,
        search: {
          ...item?.sections?.search,
          uiConfig: {
            ...item?.sections?.search?.uiConfig,
          },
        },
      },
    };
  });
};

function getAction(selectedDelievery, orderType) {
  const key = selectedDelievery?.key;

  if (key === "OTHER") {
    return "OTHER";
  }

  if (key === "DELIVERED") {
    return orderType === "WARRANT" || orderType === "PROCLAMATION" || orderType === "ATTACHMENT" ? "DELIVERED" : "SERVED";
  }

  return orderType === "WARRANT" || orderType === "PROCLAMATION" || orderType === "ATTACHMENT" ? "NOT_DELIVERED" : "NOT_SERVED";
}

const ReviewSummonsNoticeAndWarrant = () => {
  const { t } = useTranslation();
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const [defaultValues, setDefaultValues] = useState(defaultSearchValues);
  const roles = Digit.UserService.getUser()?.info?.roles;

  const hasViewAttachmentAccess = useMemo(() => roles?.some((role) => role?.code === "VIEW_PROCESS_ATTACHMENT"), [roles]);
  const hasViewProclamationAccess = useMemo(() => roles?.some((role) => role?.code === "VIEW_PROCESS_PROCLAMATION"), [roles]);
  const hasViewSummonsAccess = useMemo(() => roles?.some((role) => role?.code === "VIEW_PROCESS_SUMMONS"), [roles]);
  const hasViewWarrantAccess = useMemo(() => roles?.some((role) => role?.code === "VIEW_PROCESS_WARRANT"), [roles]);
  const hasViewNoticeAccess = useMemo(() => roles?.some((role) => role?.code === "VIEW_PROCESS_NOTICE"), [roles]);

  const hasSignAttachmentAccess = useMemo(() => roles?.some((role) => role?.code === "SIGN_PROCESS_ATTACHMENT"), [roles]);
  const hasSignProclamationAccess = useMemo(() => roles?.some((role) => role?.code === "SIGN_PROCESS_PROCLAMATION"), [roles]);
  const hasSignSummonsAccess = useMemo(() => roles?.some((role) => role?.code === "SIGN_PROCESS_SUMMONS"), [roles]);
  const hasSignWarrantAccess = useMemo(() => roles?.some((role) => role?.code === "SIGN_PROCESS_WARRANT"), [roles]);
  const hasSignNoticeAccess = useMemo(() => roles?.some((role) => role?.code === "SIGN_PROCESS_NOTICE"), [roles]);

  const hasEditTaskAccess = useMemo(() => roles?.some((role) => role?.code === "TASK_EDITOR"), [roles]);

  const isJudge = roles?.some((role) => role.code === "JUDGE_ROLE");
  const isTypist = roles?.some((role) => role.code === "TYPIST_ROLE");

  const canSign = useMemo(() => {
    return isJudge || hasSignAttachmentAccess || hasSignProclamationAccess || hasSignSummonsAccess || hasSignWarrantAccess || hasSignNoticeAccess;
  }, [isJudge, hasSignAttachmentAccess, hasSignProclamationAccess, hasSignSummonsAccess, hasSignWarrantAccess, hasSignNoticeAccess]);

  const courtId = localStorage.getItem("courtId");
  const [showActionModal, setShowActionModal] = useState(false);
  const [showNoticeModal, setshowNoticeModal] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
  const [showErrorToast, setShowErrorToast] = useState(null);
  const [bulkSignList, setBulkSignList] = useState([]);
  const [bulkSendList, setBulkSendList] = useState([]);
  const [showBulkSignConfirmModal, setShowBulkSignConfirmModal] = useState(false);
  const [showBulkSendConfirmModal, setShowBulkSendConfirmModal] = useState(false);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [isBulkSending, setIsBulkSending] = useState(false);
  const [showBulkSignatureModal, setShowBulkSignatureModal] = useState(false);
  const [bulkSignatureData, setBulkSignatureData] = useState({});
  const [isBulkSigned, setIsBulkSigned] = useState(false);
  const [bulkSignatureId, setBulkSignatureId] = useState("");
  const [showBulkSignSuccessModal, setShowBulkSignSuccessModal] = useState(false);
  const [allSelectedPolice, setAllSelectedPolice] = useState(false);

  // Initialize download PDF hook
  const { downloadPdf } = useDownloadCasePdf();
  const { uploadDocuments } = useDocumentUpload();
  const UploadSignatureModal = window?.Digit?.ComponentRegistryService?.getComponent("UploadSignatureModal");
  const history = useHistory();
  const dayInMillisecond = 24 * 3600 * 1000;
  const todayDate = new Date().getTime();
  const [updateStatusDate, setUpdateStatusDate] = useState("");
  const userInfo = Digit.UserService.getUser()?.info;
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo?.type]);
  const mockESignEnabled = window?.globalConfigs?.getConfig("mockESignEnabled") === "true" ? true : false;

  const [tabData, setTabData] = useState(
    isJudge
      ? getJudgeDefaultConfig(courtId)?.map((configItem, index) => ({ key: index, label: configItem.label, active: index === 0 ? true : false }))
      : SummonsTabsConfig?.SummonsTabsConfig?.map((configItem, index) => ({
          key: index,
          label: configItem.label,
          active: index === 0 ? true : false,
        }))
  );
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
        ...(courtId && { courtId }),
      },
    },
    {},
    rowData?.taskNumber,
    Boolean((showActionModal || step) && courtId)
  );

  const getTaskDetailsByTaskNumber = useCallback(
    async function () {
      const response = await DRISTIService.customApiService("/task/v1/table/search", {
        criteria: {
          searchText: taskNumber,
          tenantId,
          ...(courtId && { courtId }),
        },
      });
      handleRowClick({ original: response?.list?.[0] });
    },
    [taskNumber, tenantId, courtId]
  );

  useEffect(() => {
    if (fetchedTasksData && !isEqual(fetchedTasksData, tasksData)) {
      setTasksData(fetchedTasksData); // Store tasksData only if it's different
    }
  }, [fetchedTasksData, tasksData]);

  const { data: orderData } = Digit.Hooks.orders.useSearchOrdersService(
    { tenantId, criteria: { id: tasksData?.list[0]?.orderId, ...(courtId && { courtId }) } },
    { tenantId },
    tasksData?.list[0]?.orderId,
    Boolean(tasksData && courtId)
  );

  const orderDetails = useMemo(() => orderData?.list?.[0] || {}, [orderData]);

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

  // handleClose is declared after activeTabIndex to avoid 'used before defined' lint errors

  const handleSubmit = useCallback(async () => {
    if (!hasEditTaskAccess) {
      setShowActionModal(false);
      return;
    }
    setIsSubmitting(true);
    sessionStorage.removeItem("SignedFileStoreID");
    sessionStorage.removeItem("homeActiveTab");

    try {
      const { data: tasksData } = await refetch();
      if (tasksData) {
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
        setShowErrorToast({
          message: t("DOCUMENT_SENT_SUCCESSFULLY"),
          error: false,
        });
        setTimeout(() => {
          setShowErrorToast(null);
        }, 3000);
        setBulkSendList((prev) => prev?.filter((item) => item?.taskNumber !== rowData?.taskNumber) || []);
      }

      setShowActionModal(false);
      setReload(!reload);
    } catch (error) {
      setShowErrorToast({
        message: t("SEND_FAILED"),
        error: true,
      });
      setTimeout(() => {
        setShowErrorToast(null);
      }, 5000);
    } finally {
      setIsSubmitting(false);
    }
  }, [refetch, reload, tenantId, t, rowData?.taskNumber]);

  const callBulkSendApi = useCallback(
    async (selectedItems) => {
      const bulkSendUrl = window?.globalConfigs?.getConfig("BULK_SEND_URL") || "http://localhost:9000/task/v1/bulk-send";
      const user = Digit?.UserService?.getUser?.();
      const userInfo = user?.info || {};
      const authToken = localStorage.getItem("token");

      const payload = {
        bulkSendTasks: (selectedItems || []).map((item) => ({
          taskNumber: item?.taskNumber,
          tenantId: tenantId,
        })),
        RequestInfo: {
          apiId: "Rainmaker",
          authToken: authToken,
          userInfo: userInfo,
          msgId: `${Date.now()}|${window?.Digit?.i18n?.language || "en_IN"}`,
          plainAccessRequest: {},
        },
      };

      try {
        const data = await processManagementService.bulkSend(payload, {});
        const tasks = Array.isArray(data?.bulkSendTasks) ? data.bulkSendTasks : null;
        if (tasks) {
          const successful = tasks.filter((t) => t?.success).length;
          const failed = tasks.length - successful;
          return { successful, failed, total: tasks.length };
        }
        const results = Array.isArray(data?.results) ? data?.results : null;
        if (results) {
          const successful = results.filter((r) => r?.success).length;
          const failed = results.length - successful;
          return { successful, failed, total: results.length };
        }
        if (typeof data?.success === "boolean") {
          const successful = data.success ? selectedItems.length : 0;
          const failed = data.success ? 0 : selectedItems.length;
          return { successful, failed, total: selectedItems.length };
        }

        // If structure is unknown, treat as failure rather than optimistic success
        return { successful: 0, failed: selectedItems.length, total: selectedItems.length };
      } catch (error) {
        return { successful: 0, failed: selectedItems.length, total: selectedItems.length };
      }
    },
    [tenantId]
  );

  const handleBulkSendSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setIsBulkSending(true);

    try {
      const selectedItems = bulkSendList?.filter((item) => item?.isSelected) || [];

      const { successful, failed, total } = await callBulkSendApi(selectedItems);
      if (successful === total && total > 0) {
        setShowErrorToast({ message: t("DOCUMENT_SENT_SUCCESSFULLY", { successful, total }), error: false });
        setTimeout(() => setShowErrorToast(null), 3000);
        setBulkSendList((prev) => prev?.filter((item) => !selectedItems.some((s) => s.taskNumber === item.taskNumber)) || []);
        setReload(!reload);
      } else {
        setShowErrorToast({ message: t("FAILED_TO_SEND_DOCUMENTS", { failed, total }), error: true });
        setTimeout(() => setShowErrorToast(null), 5000);
        setBulkSendList([]);
        setReload((prev) => prev + 1);
      }
    } catch (error) {
      setShowErrorToast({ message: t("FAILED_TO_PERFORM_BULK_SEND"), error: true });
      setTimeout(() => setShowErrorToast(null), 5000);
      setBulkSendList([]);
      setReload((prev) => prev + 1);
    } finally {
      setIsSubmitting(false);
      setIsBulkSending(false);
      setShowBulkSendConfirmModal(false);
    }
  }, [bulkSendList, t, reload, callBulkSendApi]);

  const handleBulkSendConfirm = useCallback(() => {
    handleBulkSendSubmit();
  }, [bulkSendList, t, handleBulkSendSubmit]);

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
              action: getAction(selectedDelievery, orderType),
              documents: [{}],
            },
          },
        };
        await taskService.updateTask(reqBody, { tenantId }).then(async (res) => {
          if (
            res?.task &&
            selectedDelievery?.key === "NOT_DELIVERED" &&
            !(orderType === "WARRANT" || orderType === "PROCLAMATION" || orderType === "ATTACHMENT")
          ) {
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
              actionCategory: "Review Process",
              name: `Re-issue ${orderType === "NOTICE" ? "Notice" : "Summon"}`,
              entityType: "order-default",
              referenceId: `MANUAL_${orderData?.list[0]?.scheduledHearingNumber || orderData?.list[0]?.hearingNumber}`,
              status: `RE-ISSUE_${orderType === "NOTICE" ? "NOTICE" : "SUMMON"}`,
              assignedTo: [],
              assignedRole: [orderType === "NOTICE" ? "PENDING_TASK_REISSUE_NOTICE" : "PENDING_TASK_REISSUE_SUMMON"], //checkForCourtRoomManager?
              cnrNumber: tasksData?.list[0]?.cnrNumber,
              filingNumber: tasksData?.list[0]?.filingNumber,
              caseId: tasksData?.list[0]?.caseId,
              caseTitle: tasksData?.list[0]?.caseTitle,
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
    const isSignSuccess = sessionStorage.getItem("esignProcess");
    const isRowData = JSON.parse(sessionStorage.getItem("ESignSummons"));
    const delieveryCh = sessionStorage.getItem("delieveryChannel");
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
      sessionStorage.removeItem("esignProcess");
      sessionStorage.removeItem("ESignSummons");
      sessionStorage.removeItem("delieveryChannel");
      sessionStorage.removeItem("homeActiveTab");
    }
  }, []);

  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const handleClose = useCallback(() => {
    sessionStorage.removeItem("SignedFileStoreID");
    sessionStorage.removeItem("homeActiveTab");
    setShowActionModal(false);
    setShowBulkSendConfirmModal(false);
    // If navigated via deep-link, go back to listing route without forcing a data reload
    if (taskNumber) history.replace(`/${window?.contextPath}/employee/orders/Summons&Notice`);

    // Determine current tab label to decide whether to reload
    const currentConfig = isJudge ? getJudgeDefaultConfig(courtId)?.[activeTabIndex] : SummonsTabsConfig?.SummonsTabsConfig?.[activeTabIndex];
    const isPendingSignTab = currentConfig?.label === "PENDING_SIGN";

    // Do NOT trigger reload for Pending Sign tab (to preserve selections),
    // keep existing behavior for other tabs if needed
    if (!isPendingSignTab) {
      setReload(!reload);
    }
  }, [taskNumber, history, isJudge, courtId, activeTabIndex, reload]);

  const onTabChange = (n) => {
    setTabData((prev) => prev.map((i, c) => ({ ...i, active: c === n ? true : false })));
    setActiveTabIndex(n);
    setBulkSignList([]);
    setBulkSendList([]);
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
            ...(courtId && userType === "employee" && { courtId }),
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
        { key: "ISSUE_TO", value: getPartyNameForInfos(orderDetails, compositeItem, orderType, rowData?.taskDetails) },
        {
          key: "NEXT_HEARING_DATE",
          value: caseDetails?.caseDetails?.hearingDate ? formatDate(new Date(caseDetails?.caseDetails?.hearingDate)) : "N/A",
        },
        // { key: "AMOUNT_PAID_TEXT", value: `Rs. ${caseDetails?.deliveryChannels?.fees || 100}` },
        { key: "PROCESS_FEE_PAID_ON", value: caseDetails?.deliveryChannels?.feePaidDate || "N/A" },
        { key: "CHANNEL_DETAILS_TEXT", value: caseDetails?.deliveryChannels?.channelName },
        { key: "E_PROCESS_ID", value: rowData?.taskNumber },
      ];
    }
  }, [rowData?.taskDetails, rowData?.taskNumber, nextHearingDate, orderDetails, compositeItem, orderType]);

  const reverseToDDMMYYYY = (dateStr) => {
    if (!dateStr) return "N/A";

    const parts = dateStr.split("-");

    if (parts.length !== 3) return "N/A";

    // Check if it's in YYYY-MM-DD format
    if (parts[0].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    // Already in DD-MM-YYYY
    return dateStr;
  };

  const sentInfos = useMemo(() => {
    if (rowData?.taskDetails || nextHearingDate) {
      const caseDetails = handleTaskDetails(rowData?.taskDetails);
      return [
        { key: "ISSUE_TO", value: getPartyNameForInfos(orderDetails, compositeItem, orderType, rowData?.taskDetails) },
        { key: "ISSUE_DATE", value: convertToDateInputFormat(rowData?.createdDate) },
        { key: "PROCESS_FEE_PAID_ON", value: caseDetails?.deliveryChannels?.feePaidDate || "N/A" },
        { key: "SENT_ON", value: reverseToDDMMYYYY(caseDetails?.deliveryChannels?.statusChangeDate) || "N/A" },
        { key: "CHANNEL_DETAILS_TEXT", value: caseDetails?.deliveryChannels?.channelName },
        {
          key: "NEXT_HEARING_DATE",
          value: caseDetails?.caseDetails?.hearingDate ? formatDate(new Date(caseDetails?.caseDetails?.hearingDate)) : "N/A",
        },
      ];
    }
  }, [rowData?.taskDetails, rowData?.createdDate, nextHearingDate, orderDetails, compositeItem, orderType]);

  const ReviewInfo = useMemo(() => {
    if (rowData?.taskDetails || nextHearingDate) {
      const caseDetails = handleTaskDetails(rowData?.taskDetails);
      return [
        { key: "ISSUE_TO", value: getPartyNameForInfos(orderDetails, compositeItem, orderType) },
        { key: "CHANNEL_DETAILS_TEXT", value: caseDetails?.deliveryChannels?.channelName },
        {
          key: "NEXT_HEARING_DATE",
          value: caseDetails?.caseDetails?.hearingDate ? formatDate(new Date(caseDetails?.caseDetails?.hearingDate)) : "N/A",
        },
        { key: "PROCESS_FEE_PAID_ON", value: caseDetails?.deliveryChannels?.feePaidDate || "N/A" },
        { key: "SENT_ON", value: reverseToDDMMYYYY(caseDetails?.deliveryChannels?.statusChangeDate) || "N/A" },
        { key: "STATUS", value: rowData?.status },
        { key: "STATUS_UPDATED_ON", value: reverseToDDMMYYYY(caseDetails?.deliveryChannels?.statusChangeDate) || "N/A" },
        { key: "REMARKS", value: caseDetails?.remarks?.remark ? caseDetails?.remarks?.remark : "N/A" },
      ];
    }
  }, [rowData?.taskDetails, rowData?.status, nextHearingDate, orderDetails, compositeItem, orderType]);

  const links = useMemo(() => {
    return [{ text: "View order", link: "" }];
  }, []);

  const documents = useMemo(() => {
    if (rowData?.documents)
      return rowData?.documents?.map((document) => {
        return { ...document, fileName: `${t(rowData?.taskType)} ${t("DOCUMENT_TEXT")}` };
      });
  }, [rowData, orderType]);

  // Detect if a signed document already exists for the selected row
  const hasSignedDoc = useMemo(() => {
    try {
      const sessionSigned = typeof window !== "undefined" && sessionStorage.getItem("SignedFileStoreID");
      const hasDoc = Array.isArray(rowData?.documents) ? rowData.documents.some((d) => d?.documentType === "SIGNED_TASK_DOCUMENT") : false;
      return Boolean(sessionSigned) || hasDoc;
    } catch (e) {
      return false;
    }
  }, [rowData]);

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
      } else if (orderType === "PROCLAMATION") {
        msg = t("SUCCESSFULLY_SIGNED_PROCLAMATION");
      } else if (orderType === "ATTACHMENT") {
        msg = t("SUCCESSFULLY_SIGNED_ATTACHMENT");
      } else {
        msg = t("SUCCESSFULLY_SIGNED_SUMMON");
      }
    } else {
      if (orderType === "NOTICE") {
        msg = t("SENT_NOTICE_VIA");
      } else if (orderType === "WARRANT") {
        msg = t("SENT_WARRANT_VIA");
      } else if (orderType === "PROCLAMATION") {
        msg = t("SENT_PROCLAMATION_VIA");
      } else if (orderType === "ATTACHMENT") {
        msg = t("SENT_ATTACHMENT_VIA");
      } else {
        msg = t("SENT_SUMMONS_VIA");
      }
    }
    return `${msg}${!documents || isViaPolice ? " " + deliveryChannel : ""}`;
  }, [documents, orderType, deliveryChannel]);

  const handleSubmitEsign = useCallback(async () => {
    try {
      let localStorageID = "";
      if (mockESignEnabled) {
        localStorageID = rowData?.documents?.[0]?.fileStore;
      } else {
        localStorageID = sessionStorage.getItem("fileStoreId");
      }
      const documents = Array.isArray(rowData?.documents) ? rowData.documents : [];
      const documentsFile =
        signatureId !== "" || localStorageID
          ? {
              documentType: "SIGNED_TASK_DOCUMENT",
              fileStore: signatureId || localStorageID,
            }
          : null;
      sessionStorage.removeItem("fileStoreId");
      sessionStorage.removeItem("homeActiveTab");
      sessionStorage.setItem("SignedFileStoreID", documentsFile?.fileStore);
      const reqBody = {
        task: {
          ...rowData,
          ...(typeof rowData?.taskDetails === "string" && { taskDetails: JSON.parse(rowData?.taskDetails) }),
          documents: documentsFile ? [...documents, documentsFile] : documents,
          tenantId,
        },
        tenantId,
      };
      setIsLoading(true);
      const response = await taskService.UploadTaskDocument(reqBody, { tenantId });
      if (documentsFile) {
        setRowData((prev) => ({
          ...prev,
          documents: Array.isArray(prev?.documents) ? [...prev.documents, documentsFile] : [documentsFile],
          documentStatus: "SIGNED",
        }));
        setIsSigned(true);
        setActionModalType("SIGNED");
      }
      if (rowData?.taskDetails?.deliveryChannels?.channelCode === "POLICE") {
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
            return { continue: true };
          } finally {
            setIsLoading(false);
          }
        }
      }
      return { continue: true };
    } catch (error) {
      console.error("Error uploading document:", error);
    } finally {
      setIsLoading(false);
    }
  }, [rowData, signatureId, tenantId]);

  const handleBulkSign = useCallback(() => {
    const selectedItems = bulkSignList?.filter((item) => item?.isSelected) || [];
    if (selectedItems.length === 0) {
      setShowErrorToast({ message: t("NO_DOCUMENTS_SELECTED"), error: true });
      setTimeout(() => {
        setShowErrorToast(null);
      }, 5000);
      return;
    }
    if (!(hasSignAttachmentAccess || hasSignProclamationAccess || hasSignSummonsAccess || hasSignWarrantAccess || hasSignNoticeAccess)) {
      setShowErrorToast({
        message: t("YOU_DO_NOT_HAVE_PERMISSION_TO_SIGN"),
        error: true,
      });
      setTimeout(() => {
        setShowErrorToast(null);
      }, 5000);
      return;
    }
    const notAllowedItems = selectedItems.filter((doc) => {
      if (doc.taskType === "SUMMONS" && !hasSignSummonsAccess) return true;
      if (doc.taskType === "WARRANT" && !hasSignWarrantAccess) return true;
      if (doc.taskType === "NOTICE" && !hasSignNoticeAccess) return true;
      if (doc.taskType === "PROCLAMATION" && !hasSignProclamationAccess) return true;
      if (doc.taskType === "ATTACHMENT" && !hasSignAttachmentAccess) return true;
      return false;
    });

    if (notAllowedItems.length > 0) {
      const notAllowedTypes = [...new Set(notAllowedItems.map((doc) => t(doc.taskType)))];
      const msg = t("FOLLOWING_DOCUMENTS_CANNOT_BE_SIGNED") + notAllowedTypes.join(", ");
      setShowErrorToast({
        message: msg,
        error: true,
      });
      setTimeout(() => {
        setShowErrorToast(null);
      }, 5000);
      return;
    }
    setShowBulkSignConfirmModal(true);
  }, [bulkSignList, t, hasSignAttachmentAccess, hasSignProclamationAccess, hasSignSummonsAccess, hasSignWarrantAccess, hasSignNoticeAccess]);
  const handleBulkSend = useCallback(() => {
    const selectedItems = bulkSendList?.filter((item) => item?.isSelected) || [];
    if (selectedItems.length === 0) {
      setShowErrorToast({
        message: t("NO_DOCUMENTS_SELECTED"),
        error: true,
      });
      setTimeout(() => {
        setShowErrorToast(null);
      }, 5000);
      return;
    }
    setShowBulkSendConfirmModal(true);
  }, [bulkSendList, t]);

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

  // XML parsing utility from BulkESignView
  const parseXml = (xmlString, tagName) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "application/xml");
    const element = xmlDoc.getElementsByTagName(tagName)[0];
    return element ? element.textContent.trim() : null;
  };

  const fetchResponseFromXmlRequest = async (orderRequestList) => {
    const bulkSignUrl = window?.globalConfigs?.getConfig("BULK_SIGN_URL") || "http://localhost:1620";
    const responses = [];

    const requests = orderRequestList?.map(async (order) => {
      try {
        const formData = qs.stringify({ response: order?.request });
        const response = await axios.post(bulkSignUrl, formData, {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          },
        });

        const data = response?.data;
        if (parseXml(data, "status") !== "failed") {
          responses.push({
            taskNumber: order?.taskNumber || order?.orderNumber,
            signedTaskData: parseXml(data, "data"),
            signed: true,
            errorMsg: null,
            tenantId: tenantId,
          });
        } else {
          responses.push({
            taskNumber: order?.taskNumber || order?.orderNumber,
            signedTaskData: parseXml(data, "data"),
            signed: false,
            errorMsg: parseXml(data, "error"),
            tenantId: tenantId,
          });
        }
      } catch (error) {
        console.error(`Error fetching order ${order?.orderNumber}:`, error?.message);
      }
    });

    await Promise.allSettled(requests);
    return responses;
  };
  const bulkUploadModalConfig = useMemo(() => {
    return {
      key: "uploadSignature",
      populators: {
        inputs: [
          {
            name: "Signature",
            type: "DragDropComponent",
            uploadGuidelines: "Ensure the image is not blurry and under 5MB.",
            maxFileSize: 5,
            maxFileErrorMessage: "CS_FILE_LIMIT_5_MB",
            fileTypes: ["PDF", "PNG", "JPEG", "JPG"],
            isMultipleUpload: false,
          },
        ],
        validation: {},
      },
    };
  }, []);

  const onBulkSignatureSelect = (key, value) => {
    if (value?.Signature === null) {
      setBulkSignatureData({});
      setIsBulkSigned(false);
    } else {
      setBulkSignatureData((prevData) => ({
        ...prevData,
        [key]: value,
      }));
    }
  };

  const onBulkSignatureSubmit = async () => {
    if (bulkSignatureData?.uploadSignature?.Signature?.length > 0) {
      try {
        const uploadedFileId = await uploadDocuments(bulkSignatureData?.uploadSignature?.Signature, tenantId);
        setBulkSignatureId(uploadedFileId?.[0]?.fileStoreId);
        setIsBulkSigned(true);
        setShowBulkSignatureModal(false);
        handleActualBulkSign();
      } catch (error) {
        setBulkSignatureData({});
        setIsBulkSigned(false);
      }
    }
  };
  const handleActualBulkSign = useCallback(async () => {
    setIsBulkLoading(true);

    let selectedItems = bulkSignList?.filter((item) => item?.isSelected) || [];

    const criteriaList = selectedItems?.map((item) => {
      const fileStoreId = item?.documents?.[0]?.fileStore || "";

      return {
        fileStoreId: fileStoreId,
        taskNumber: item?.taskNumber || item?.id || item?.businessId,
        placeholder: "Signature",
        tenantId: tenantId,
      };
    });

    try {
      const response = await processManagementService.getProcessToSign(
        {
          RequestInfo: {},
          criteria: criteriaList,
        },
        {}
      );
      await fetchResponseFromXmlRequest(response?.taskList || response?.orderList).then(async (responseArray) => {
        const signedTasksPayload = (responseArray || []).map((item) => ({
          taskNumber: item?.taskNumber || item?.orderNumber,
          signedTaskData: item?.signedTaskData || item?.signedOrderData || "",
          signed: item?.signed === true,
          tenantId: item?.tenantId || tenantId,
          errorMsg: item?.errorMsg || null,
        }));
        const signedResponse = await processManagementService.updateSignedProcess(
          {
            RequestInfo: {},
            signedTasks: signedTasksPayload,
          },
          {}
        );
        const signedList = signedResponse?.tasks || signedResponse?.orders;
        selectedItems = selectedItems?.filter((item) => signedList?.some((signed) => signed?.taskNumber === item?.taskNumber));

        if (selectedItems?.length === 0) {
          setShowErrorToast({
            message: t("FAILED_TO_PERFORM_BULK_SIGN"),
            error: true,
          });
          setTimeout(() => {
            setShowErrorToast(null);
          }, 3000);
          return;
        }

        setShowErrorToast({
          message: t("BULK_SIGN_SUCCESS", { count: responseArray?.length || selectedItems.length }),
          error: false,
        });

        setTimeout(() => {
          setShowErrorToast(null);
        }, 3000);

        const policeTasks = selectedItems.filter((item) => item?.taskDetails?.deliveryChannels?.channelCode === "POLICE");

        const nonPoliceTasks = selectedItems.filter((item) => item?.taskDetails?.deliveryChannels?.channelCode !== "POLICE");
        if (policeTasks.length > 0) {
          try {
            await callBulkSendApi(policeTasks);
          } catch (err) {
            console.error("Bulk send for POLICE tasks failed:", err);
          }
        }
        try {
          const preselectedForSend = nonPoliceTasks.map((it) => ({
            ...it,
            isSelected: true,
            documentStatus: "SIGNED",
            documents: it.documents.map((doc) => ({
              ...doc,
              documentType: "SIGNED_TASK_DOCUMENT",
            })),
          }));
          setBulkSendList((prev) => {
            const prevArr = Array.isArray(prev) ? prev : [];
            const map = new Map(prevArr.map((p) => [p?.taskNumber, p]));
            preselectedForSend.forEach((ns) => {
              const existing = map.get(ns?.taskNumber) || {};
              map.set(ns?.taskNumber, { ...existing, ...ns, isSelected: true });
            });
            return Array.from(map.values());
          });

          setBulkSignList((prev) => (Array.isArray(prev) ? prev.filter((p) => !selectedItems.some((s) => s.taskNumber === p.taskNumber)) : []));
          setReload((prev) => prev + 1);
          setShowBulkSignSuccessModal(true);
        } catch (e) {
          console.error("Error preparing bulk send after bulk sign:", e);
        }
      });
    } catch (error) {
      setShowErrorToast({
        message: t("FAILED_TO_PERFORM_BULK_SIGN"),
        error: true,
      });
      setTimeout(() => {
        setShowErrorToast(null);
      }, 5000);
      setBulkSignList([]);
      setReload((prev) => prev + 1);
    } finally {
      setIsBulkLoading(false);
      setShowBulkSignConfirmModal(false);
    }
    const isPolice = bulkSignList?.filter((item) => item?.isSelected)?.every((item) => item?.taskDetails?.deliveryChannels?.channelCode === "POLICE");
    setAllSelectedPolice(isPolice ? true : false);
  }, [bulkSignList, tenantId, t, setShowErrorToast, setIsBulkLoading, fetchResponseFromXmlRequest, callBulkSendApi]);
  const handleBulkDownload = useCallback(async () => {
    try {
      const currentConfig = isJudge ? getJudgeDefaultConfig(courtId)?.[activeTabIndex] : SummonsTabsConfig?.SummonsTabsConfig?.[activeTabIndex];
      const isSignedTab = bulkSendList?.some((item) => item?.isSelected && item?.documentStatus === "SIGNED") || currentConfig?.label === "SIGNED";

      const selectedItems = isSignedTab
        ? bulkSendList?.filter((item) => item?.isSelected) || []
        : bulkSignList?.filter((item) => item?.isSelected) || [];

      if (selectedItems.length === 0) {
        setShowErrorToast({
          message: t("NO_DOCUMENTS_SELECTED_FOR_DOWNLOAD"),
          error: true,
        });
        setTimeout(() => {
          setShowErrorToast(null);
        }, 5000);
        return;
      }
      const downloadPromises = selectedItems.map(async (item, index) => {
        const fileStoreId = isSignedTab
          ? item?.documents?.filter((doc) => doc?.documentType === "SIGNED_TASK_DOCUMENT")?.[0]?.fileStore
          : item?.documents?.[0]?.fileStore;
        if (!fileStoreId) throw new Error("No fileStoreId");
        if (fileStoreId) {
          const rawOrderType = (item?.orderType || item?.taskType || "document").toString();
          const orderTypeName = (() => {
            const s = rawOrderType.trim();
            if (!s) return "document";
            return s.charAt(0) + s.slice(1).toLowerCase();
          })();
          const caseNumber = (
            (item?.isLPRCase ? item?.lprNumber : item?.courtCaseNumber) ||
            item?.courtCaseNumber ||
            item?.cmpNumber ||
            item?.filingNumber ||
            item?.caseId ||
            ""
          ).toString();
          const issueDate = convertToDateInputFormat && item?.createdDate ? convertToDateInputFormat(item?.createdDate) : item?.issueDate || "";

          const sanitize = (s) =>
            (s || "")
              .toString()
              .replace(/\s+/g, "")
              .replace(/[\/\\]/g, "-");
          const fileBase = `${sanitize(orderTypeName)}_${sanitize(caseNumber)}_${sanitize(issueDate)}`.replace(/^_+|_+$/g, "");
          const fileName = fileBase || `Document_${index + 1}`;

          await new Promise((resolve) => setTimeout(resolve, index * 100));
          await downloadPdf(tenantId, fileStoreId, fileName);
          return { success: true, fileName, fileStoreId };
        } else {
          throw new Error("No fileStoreId");
        }
      });

      const results = await Promise.allSettled(downloadPromises);
      const successful = results.filter((r) => r.status === "fulfilled" && r.value?.success).length;
      const failed = results.length - successful;
      setTimeout(() => {
        if (successful > 0 && failed === 0) {
          setShowErrorToast({
            message: t("DOCUMENTS_DOWNLOADED_SUCCESSFULLY", { successful, total: selectedItems.length }),
            error: false,
          });
          setTimeout(() => {
            setShowErrorToast(null);
          }, 3000);
        } else if (successful > 0 && failed > 0) {
          setShowErrorToast({
            message: t("SOME_DOCUMENTS_FAILED_TO_DOWNLOAD", { successful, failed }),
            error: true,
          });
          setTimeout(() => setShowErrorToast(null), 5000);
        } else {
          setShowErrorToast({
            message: t("BULK_DOWNLOAD_FAILED"),
            error: true,
          });
          setTimeout(() => setShowErrorToast(null), 5000);
        }
        // const currentConfig = isJudge ? getJudgeDefaultConfig(courtId)?.[activeTabIndex] : SummonsTabsConfig?.SummonsTabsConfig?.[activeTabIndex];
        // const isSignedTab = currentConfig?.label === "SIGNED";

        // setBulkSignList((prev) => prev?.map((item) => ({ ...item, isSelected: false })) || []);
        // setBulkSendList((prev) => prev?.map((item) => ({ ...item, isSelected: false })) || []);

        // const successfulFileStoreIds = results.filter((r) => r.status === "fulfilled" && r.value?.fileStoreId).map((r) => r.value.fileStoreId);

        // if (isSignedTab) {
        //   setBulkSendList((prev) => prev?.filter((item) => !successfulFileStoreIds.includes(item?.documents?.[0]?.fileStore)) || []);
        // } else {
        //   setBulkSignList((prev) => prev?.filter((item) => !successfulFileStoreIds.includes(item?.documents?.[0]?.fileStore)) || []);
        // }
        // setReload((prev) => prev + 1);
      }, 2000);
    } catch (error) {
      setShowErrorToast({
        message: t("BULK_DOWNLOAD_FAILED"),
        error: true,
      });
      setTimeout(() => {
        setShowErrorToast(null);
      }, 5000);
      const currentConfig = isJudge ? getJudgeDefaultConfig(courtId)?.[activeTabIndex] : SummonsTabsConfig?.SummonsTabsConfig?.[activeTabIndex];
      const isSignedTab = currentConfig?.label === "SIGNED";

      if (isSignedTab) {
        setBulkSendList([]);
      } else {
        setBulkSignList([]);
      }
      setReload((prev) => prev + 1);
    }
  }, [
    bulkSignList,
    bulkSendList,
    tenantId,
    downloadPdf,
    t,
    setShowErrorToast,
    activeTabIndex,
    courtId,
    isJudge,
    setBulkSendList,
    setBulkSignList,
    setReload,
  ]);

  const handleBulkSignConfirm = useCallback(() => {
    handleActualBulkSign();
  }, [handleActualBulkSign]);

  const handleProceedToBulkSend = useCallback(() => {
    setShowBulkSignSuccessModal(false);
    setShowBulkSendConfirmModal(true);
  }, []);

  const unsignedModalConfig = useMemo(() => {
    return {
      handleClose: handleClose,
      heading: { label: `${t("REVIEW_DOCUMENT_TEXT")} ${t(rowData?.taskType)} ${t("DOCUMENT_TEXT")}` },
      actionSaveLabel:
        (rowData?.taskType === "ATTACHMENT" && hasSignAttachmentAccess) ||
        (rowData?.taskType === "PROCLAMATION" && hasSignProclamationAccess) ||
        (rowData?.taskType === "SUMMONS" && hasSignSummonsAccess) ||
        (rowData?.taskType === "WARRANT" && hasSignWarrantAccess) ||
        (rowData?.taskType === "NOTICE" && hasSignNoticeAccess) ||
        isJudge
          ? t("E_SIGN_TEXT")
          : null,
      isStepperModal: true,
      actionSaveOnSubmit: () => {},
      steps: [
        {
          type: "document",
          modalBody: <DocumentViewerWithComment infos={infos} documents={documents} links={links} />,
          actionSaveOnSubmit: () => {},
          hideSubmit:
            isTypist ||
            ((rowData?.taskType === "WARRANT" || rowData?.taskType === "PROCLAMATION" || rowData?.taskType === "ATTACHMENT") &&
              rowData?.documentStatus === "SIGN_PENDING" &&
              !isJudge),
        },
        {
          heading: { label: t("ADD_SIGNATURE") },
          actionSaveLabel:
            deliveryChannel === "Email" ? t("SEND_EMAIL_TEXT") : deliveryChannel === "Police" ? t("CORE_COMMON_SEND") : t("CONFIRM_SIGN"),
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
          isDisabled: !isSigned ? true : false,
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
                      submitButtonText={t("CS_COMMON_CLOSE")}
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
                      submitButtonText={documents && hasEditTaskAccess && deliveryChannel !== "Police" ? t("MARK_AS_SENT") : t("CS_COMMON_CLOSE")}
                      closeButtonText={documents ? t("DOWNLOAD_DOCUMENT") : t("BACK")}
                      closeButtonAction={handleClose}
                      submitButtonAction={hasEditTaskAccess && deliveryChannel !== "Police" ? handleSubmit : handleClose}
                      t={t}
                      submissionData={submissionData}
                      documents={documents}
                      deliveryChannel={deliveryChannel}
                      orderType={orderType}
                      isSubmitting={isSubmitting}
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
      handleClose: handleClose, //() => handleCloseActionModal(),
      heading: { label: t("PRINT_SEND_DOCUMENT") },
      // actionSaveLabel: t("MARK_AS_SENT"),
      isStepperModal: false,
      hideSubmit: isTypist,
      modalBody: (
        <CustomStepperSuccess
          successMessage={successMessage}
          bannerSubText={t("PARTY_NOTIFIED_ABOUT_DOCUMENT")}
          submitButtonText={documents && hasEditTaskAccess && deliveryChannel !== "Police" ? t("MARK_AS_SENT") : t("CS_COMMON_CLOSE")}
          closeButtonText={t("DOWNLOAD_DOCUMENT")}
          closeButtonAction={handleDownload}
          submitButtonAction={hasEditTaskAccess && deliveryChannel !== "Police" ? handleSubmit : handleClose}
          t={t}
          submissionData={submissionData}
          documents={documents}
          deliveryChannel={deliveryChannel}
          orderType={orderType}
          isSubmitting={isSubmitting}
        />
        // <PrintAndSendDocumentComponent
        //   infos={infos}
        //   documents={documents?.filter((docs) => docs.documentType === "SIGNED_TASK_DOCUMENT")}
        //   links={links}
        //   t={t}
        // />
      ),
      actionSaveOnSubmit: handleSubmit,
    };
  }, [documents, handleCloseActionModal, handleSubmit, infos, links, t]);

  const sentModalConfig = useMemo(() => {
    return {
      handleClose: () => handleCloseActionModal(),
      heading: { label: t("DELIVERY_STATUS_AND_DETAILS") },
      actionSaveLabel: hasEditTaskAccess ? t("UPDATE_STATUS") : null,
      actionCancelLabel: t("VIEW_DOCUMENT_TEXT"),
      isStepperModal: false,
      modalBody: (
        <UpdateDeliveryStatusComponent
          infos={sentInfos}
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
      hideSubmit: isTypist,
    };
  }, [handleCloseActionModal, handleDownload, handleUpdateStatus, sentInfos, isDisabled, links, orderType, rowData, selectedDelievery, t]);

  useEffect(() => {
    // if (rowData?.id) getTaskDocuments();
    if (rowData?.filingNumber) getHearingFromCaseId();
    // setSelectedDelievery(
    //   rowData?.status === "NOTICE_SENT" || rowData?.status === "SUMMON_SENT" || rowData?.status === "WARRANT_SENT" || rowData?.status === "DELIVERED"
    //     ? {
    //         key: "DELIVERED",
    //         value: "Delivered",
    //       }
    //     : {}
    // );
  }, [rowData]);

  const handleRowClick = (props) => {
    if (["DELIVERED", "UNDELIVERED", "EXECUTED", "NOT_EXECUTED", "OTHER"].includes(props?.original?.status)) {
      setRowData(props?.original);
      setshowNoticeModal(true);
      return;
    }

    setRemarks("");
    setSelectedDelievery({});
    setRowData(props?.original);
    // If the clicked task matches the one we just signed in this session, open as signed
    const lastSignedTN = typeof window !== "undefined" ? sessionStorage.getItem("LastSignedTaskNumber") : null;
    const isLastSigned = lastSignedTN && props?.original?.taskNumber && props.original.taskNumber === lastSignedTN;
    setActionModalType(isLastSigned ? "SIGNED" : props?.original?.documentStatus);
    setShowActionModal(true);
    setStep(0);
    setIsSigned(isLastSigned ? true : props?.original?.documentStatus === "SIGN_PENDING" ? false : true);
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

  const onFormValueChange = useCallback(
    (form) => {
      const currentConfig = isJudge ? getJudgeDefaultConfig(courtId)?.[activeTabIndex] : SummonsTabsConfig?.SummonsTabsConfig?.[activeTabIndex];
      const isSignedTab = currentConfig?.label === "SIGNED";
      if (Array.isArray(form?.searchResult) && form.searchResult.length > 0) {
        const updatedData = form.searchResult.map((item) => ({
          ...item,
          isSelected: false,
        }));

        if (isSignedTab) {
          setBulkSendList(updatedData);
        } else {
          setBulkSignList(updatedData);
        }
        return;
      }
      if (isSignedTab) {
        setBulkSendList([]);
      } else {
        setBulkSignList([]);
      }
    },
    [activeTabIndex, isJudge, courtId]
  );

  const hasNoSelectedItems = useMemo(() => {
    const currentConfig = isJudge ? getJudgeDefaultConfig(courtId)?.[activeTabIndex] : SummonsTabsConfig?.SummonsTabsConfig?.[activeTabIndex];
    const currentList = currentConfig?.label === "PENDING_SIGN" ? bulkSignList : bulkSendList;
    const selectedItems = currentList?.filter((item) => item?.isSelected) || [];
    const result = !currentList || currentList?.length === 0 || currentList?.every((item) => !item?.isSelected);
    return result;
  }, [bulkSignList, bulkSendList, activeTabIndex, isJudge, courtId]);

  const config = useMemo(() => {
    const updateTaskFunc = (taskData, checked) => {
      const currentConfig = isJudge ? getJudgeDefaultConfig(courtId)?.[activeTabIndex] : SummonsTabsConfig?.SummonsTabsConfig?.[activeTabIndex];
      const isSignedTab = currentConfig?.label === "SIGNED";

      const updateList = (prev) => {
        if (!prev || prev.length === 0) {
          return [{ ...taskData, isSelected: checked }];
        }

        const updated = prev?.map((item) => {
          if (item?.taskNumber !== taskData?.taskNumber) return item;
          return {
            ...item,
            isSelected: checked,
          };
        });
        const hasMatch = prev.some((item) => item?.taskNumber === taskData?.taskNumber);
        if (!hasMatch) {
          updated.push({ ...taskData, isSelected: checked });
        }
        return updated.filter((item) => item.isSelected || item?.taskNumber === taskData?.taskNumber);
      };

      if (isSignedTab) {
        setBulkSendList(updateList);
      } else {
        setBulkSignList(updateList);
      }
    };

    const configArray = isJudge ? getJudgeDefaultConfig(courtId) : SummonsTabsConfig?.SummonsTabsConfig;
    const baseConfig = configArray?.[activeTabIndex];

    if (!baseConfig) return null;

    const updatedFields = baseConfig?.sections?.search?.uiConfig?.fields?.map((field) => {
      if (field.key === "orderType" && field.type === "dropdown") {
        const originalSelect = field.populators.mdmsConfig.select;

        return {
          ...field,
          populators: {
            ...field.populators,
            mdmsConfig: {
              ...field.populators.mdmsConfig,
              select: `(data) => {
              const list = (${originalSelect})(data) || [];
              return list.filter(item => 
                (item.code === "ATTACHMENT" && ${hasViewAttachmentAccess}) ||
                (item.code === "PROCLAMATION" && ${hasViewProclamationAccess}) ||
                (item.code === "SUMMONS" && ${hasViewSummonsAccess}) ||
                (item.code === "WARRANT" && ${hasViewWarrantAccess}) ||
                (item.code === "NOTICE" && ${hasViewNoticeAccess})
              );
            }`,
            },
          },
        };
      }
      return field;
    });

    return {
      ...baseConfig,
      sections: {
        ...baseConfig?.sections,
        search: {
          ...baseConfig?.sections?.search,
          uiConfig: {
            ...baseConfig?.sections?.search?.uiConfig,
            fields: updatedFields,
          },
        },
        searchResult: {
          ...baseConfig?.sections?.searchResult,
          uiConfig: {
            ...baseConfig?.sections?.searchResult?.uiConfig,
            columns: baseConfig?.sections?.searchResult?.uiConfig?.columns?.map((column) => {
              if (column.label === "SELECT") {
                return {
                  ...column,
                  updateOrderFunc: updateTaskFunc,
                };
              }
              if (column.label === "CASE_TITLE") {
                return {
                  ...column,
                  clickFunc: handleRowClick,
                };
              } else {
                return column;
              }
            }),
          },
        },
      },
      additionalDetails: {
        activeTabIndex: activeTabIndex,
      },
    };
  }, [
    isJudge,
    courtId,
    activeTabIndex,
    hasViewAttachmentAccess,
    hasViewProclamationAccess,
    hasViewSummonsAccess,
    hasViewWarrantAccess,
    hasViewNoticeAccess,
  ]);
  return (
    <React.Fragment>
      {isLoading ? (
        <Loader />
      ) : (
        <React.Fragment>
          <div className={`bulk-esign-order-view  ${activeTabIndex === 0 || activeTabIndex === 1 ? "select" : ""}`}>
            <div className="header" style={{ paddingLeft: "0px", paddingBottom: "24px" }}>
              {t("REVIEW_PROCESS")}
            </div>
            <div className="inbox-search-wrapper">
              <InboxSearchComposer
                key={`inbox-composer-${reload}`}
                configs={config}
                defaultValues={defaultValues}
                showTab={true}
                tabData={tabData}
                onTabChange={onTabChange}
                onFormValueChange={onFormValueChange}
                customStyle={sectionsParentStyle}
              ></InboxSearchComposer>
              {/* (actionModalType !== "SIGN_PENDING" ? signedModalConfig : unsignedModalConfig) */}
              {showActionModal && (
                <DocumentModal
                  config={
                    config?.label === "PENDING_SIGN" && actionModalType === "SIGN_PENDING"
                      ? unsignedModalConfig
                      : config?.label === "PENDING_SIGN" && actionModalType !== "SIGN_PENDING"
                      ? signedModalConfig
                      : config?.label === "SIGNED"
                      ? signedModalConfig
                      : config?.label === "SENT"
                      ? sentModalConfig
                      : signedModalConfig
                  }
                  currentStep={step}
                />
              )}
              {showNoticeModal && <ReviewNoticeModal infos={ReviewInfo} rowData={rowData} handleCloseNoticeModal={handleCloseNoticeModal} t={t} />}
            </div>
          </div>
          {config?.label === "PENDING_SIGN" && (
            <div className={"bulk-submit-bar"}>
              <div style={{ justifyContent: "space-between", width: "fit-content", display: "flex", gap: 20 }}>
                <SubmitBar
                  label={t("DOWNLOAD_SELECTED_DOCUMENTS")}
                  onSubmit={handleBulkDownload}
                  disabled={hasNoSelectedItems}
                  style={{ width: "auto" }}
                />
                {canSign && <SubmitBar label={t("SIGN_SELECTED_DOCUMENTS")} onSubmit={handleBulkSign} disabled={hasNoSelectedItems} />}
              </div>
            </div>
          )}
          {config?.label === "SIGNED" && (
            <div className={"bulk-submit-bar"}>
              <div style={{ justifyContent: "space-between", width: "fit-content", display: "flex", gap: 20 }}>
                <SubmitBar
                  label={t("DOWNLOAD_SELECTED_DOCUMENTS")}
                  onSubmit={handleBulkDownload}
                  disabled={hasNoSelectedItems}
                  style={{ width: "auto" }}
                />
                {hasEditTaskAccess && (
                  <SubmitBar label={t("SEND_SELECTED_DOCUMENTS")} onSubmit={handleBulkSend} disabled={hasNoSelectedItems || isBulkSending} />
                )}
              </div>
            </div>
          )}
        </React.Fragment>
      )}
      {/* Modals */}
      {/* {showActionModal && (
        <Modal
          headerBarEnd={<CloseBtn onClick={handleClose} />}
          actionSaveLabel={t("PROCEED_TO_SIGN")}
          actionSaveOnSubmit={handleSubmit}
          actionCancelLabel={t("BACK")}
          actionCancelOnSubmit={handleClose}
          formId="modal-action"
          headerBarMain={<Heading label={t("REVIEW_DOCUMENT")} />}
          className="case-types"
          popupStyles={{ width: "85%" }}
        >
          <div style={{ padding: "20px" }}>
            <DocumentViewerWithComment infos={infos} documents={documents} links={links} />
          </div>
        </Modal>
      )}  */}
      {(isBulkLoading || isBulkSending) && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 11000,
          }}
        >
          <Loader />
        </div>
      )}
      {showBulkSignConfirmModal && (
        <Modal
          headerBarMain={<Heading label={t("CONFIRM_BULK_SIGN")} />}
          headerBarEnd={<CloseBtn onClick={() => setShowBulkSignConfirmModal(false)} />}
          actionCancelLabel={t("CS_BULK_BACK")}
          actionCancelOnSubmit={() => setShowBulkSignConfirmModal(false)}
          actionSaveLabel={t("PROCEED_TO_SIGN")}
          actionSaveOnSubmit={handleBulkSignConfirm}
          style={{ height: "40px", background: "#007E7E" }}
          popupStyles={{ width: "35%" }}
          className={"review-order-modal"}
          children={
            <div className="delete-warning-text">
              <h3 style={{ margin: "12px 24px" }}>{t("CONFIRM_BULK_PROCESS_SIGN_TEXT")}</h3>
            </div>
          }
        />
      )}
      {showBulkSignSuccessModal && (
        <Modal
          headerBarMain={<Heading label="" />}
          headerBarEnd={<CloseBtn onClick={() => setShowBulkSignSuccessModal(false)} />}
          actionCancelLabel={t("DOWNLOAD_DOCUMENTS")}
          actionCancelOnSubmit={handleBulkDownload}
          actionSaveLabel={!allSelectedPolice ? t("MARK_AS_SEND") : t("CS_COMMON_CLOSE")}
          actionSaveOnSubmit={!allSelectedPolice ? handleProceedToBulkSend : handleClose}
          className="process-bulk-success-modal"
        >
          <div style={{ width: "100%", textAlign: "center" }}>
            <Banner
              whichSvg={"tick"}
              successful={true}
              message={`${t("YOU_HAVE_SUCCESSFULLY_SIGNED")} ${bulkSendList?.length} ${t("MARKED_DOCUMENT")}`}
              headerStyles={{ fontSize: "32px" }}
              style={{ minWidth: "100%", marginTop: "0px" }}
            />
          </div>
        </Modal>
      )}
      {showBulkSendConfirmModal && (
        <Modal
          headerBarMain={<Heading label={t("CONFIRM_SEND")} />}
          headerBarEnd={<CloseBtn onClick={() => setShowBulkSendConfirmModal(false)} />}
          actionCancelLabel={t("CS_BULK_BACK")}
          actionCancelOnSubmit={() => setShowBulkSendConfirmModal(false)}
          actionSaveLabel={hasEditTaskAccess ? t("MARK_AS_SENT") : null}
          actionSaveOnSubmit={handleBulkSendConfirm}
          style={{ height: "40px", background: "#007E7E" }}
          popupStyles={{ width: "35%" }}
          className={"review-order-modal"}
          children={
            <div className="delete-warning-text">
              <h3 style={{ margin: "12px 24px" }}>{t("CONFIRM_BULK_SEND_TEXT")}</h3>
            </div>
          }
        />
      )}
      {showBulkSignatureModal && (
        <UploadSignatureModal
          t={t}
          key="bulkSignature"
          name="Signature"
          setOpenUploadSignatureModal={setShowBulkSignatureModal}
          onSelect={onBulkSignatureSelect}
          config={bulkUploadModalConfig}
          formData={bulkSignatureData}
          onSubmit={onBulkSignatureSubmit}
        />
      )}
      {showErrorToast && (
        <Toast error={showErrorToast.error} label={showErrorToast.message} isDleteBtn={true} onClose={() => setShowErrorToast(null)} />
      )}
    </React.Fragment>
  );
};

export default ReviewSummonsNoticeAndWarrant;
