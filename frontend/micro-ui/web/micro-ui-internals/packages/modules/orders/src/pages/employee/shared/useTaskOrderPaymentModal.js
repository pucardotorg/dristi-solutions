import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import usePaymentProcess from "../../../../../home/src/hooks/usePaymentProcess";
import { DRISTIService } from "@egovernments/digit-ui-module-dristi/src/services";
import { ordersService } from "../../../hooks/services";
import { Urls } from "../../../hooks/services/Urls";
import { paymentType } from "../../../utils/paymentType";
import { DateUtils, extractFeeMedium, getAuthorizedUuid, getTaskType } from "@egovernments/digit-ui-module-dristi/src/Utils";
import { getPartyNameForInfos } from "../../../utils";
import { CaseWorkflowState } from "@egovernments/digit-ui-module-dristi/src/Utils/caseWorkflow";
import { ORDER_TYPES } from "../../../utils/constants";
import {
  formatRespondentAddressLine,
  getViewOrderClickHandler,
  PaymentSummonFeeSelectionComponent,
  useCaseLockStatusForPaymentModal,
  useIsUserAdvocateOnCase,
} from "./paymentSummonModalShared";
import { submitModalInfoPostPayment, submitModalInfoRpadPayment } from "./paymentSummonPostReceiptDefaults";

const buildPostPaymentReceiptInfo = (isCaseAdmitted) =>
  isCaseAdmitted
    ? submitModalInfoPostPayment
    : {
        ...submitModalInfoPostPayment,
        header: "CS_HEADER_FOR_NOTICE_POST",
        subHeader: "CS_SUBHEADER_TEXT_FOR_NOTICE_POST",
      };

const buildRpadPaymentReceiptInfo = (isCaseAdmitted) =>
  isCaseAdmitted
    ? submitModalInfoRpadPayment
    : {
        ...submitModalInfoRpadPayment,
        header: "CS_HEADER_FOR_NOTICE_RPAD",
        subHeader: "CS_SUBHEADER_TEXT_FOR_NOTICE_RPAD",
      };

const buildPostPaymentScreenState = ({ mockSubmitModalInfo, caseDetails, orderNumber, taskNumber, orderType, fileStoreId }) => ({
  state: {
    success: Boolean(fileStoreId),
    receiptData: {
      ...mockSubmitModalInfo,
      caseInfo: [
        {
          key: "Case Name & ID",
          value: caseDetails?.caseTitle + "," + caseDetails?.filingNumber,
          copyData: false,
        },
        {
          key: "ORDER ID",
          value: orderNumber,
          copyData: false,
        },
        {
          key: "Transaction ID",
          value: taskNumber,
          copyData: true,
        },
      ],
      isArrow: false,
      showTable: true,
      showCopytext: true,
      orderType: orderType,
    },
    fileStoreId: fileStoreId || "",
  },
});

const runPostChannelPayOnline = async ({
  refetchBill,
  courtBillResponse,
  caseDetails,
  tenantId,
  setIsCaseLocked,
  setPayOnlineButtonTitle,
  openPaymentPortal,
  orderType,
  taskNumber,
  filingNumber,
  filteredTasks,
  mockSubmitModalInfo,
  orderNumber,
  history,
  pendingTaskName,
  pendingStatus,
}) => {
  const { data: freshBillResponse } = await refetchBill();
  if (!courtBillResponse?.Bill?.length) {
    return null;
  }
  if (freshBillResponse?.Bill?.[0]?.status === "PAID") {
    setIsCaseLocked(courtBillResponse?.Bill?.[0]?.status === "PAID" ? true : false);
    setPayOnlineButtonTitle(courtBillResponse?.Bill?.[0]?.status === "PAID" ? "CS_BUTTON_PAY_ONLINE_NO_PENDING_PAYMENT" : "");
    return;
  }
  const caseLockStatus = await DRISTIService.getCaseLockStatus(
    {},
    {
      uniqueId: caseDetails?.filingNumber,
      tenantId: tenantId,
    }
  );
  if (caseLockStatus?.Lock?.isLocked) {
    setIsCaseLocked(true);
    setPayOnlineButtonTitle("CS_BUTTON_PAY_ONLINE_SOMEONE_PAYING");
    return;
  }
  await DRISTIService.setCaseLock({ Lock: { uniqueId: caseDetails?.filingNumber, tenantId: tenantId, lockType: "PAYMENT" } }, {});
  const billPaymentStatus = await openPaymentPortal(freshBillResponse, freshBillResponse?.Bill?.[0]?.totalAmount);
  await DRISTIService.setCaseUnlock({}, { uniqueId: caseDetails?.filingNumber, tenantId: tenantId });
  if (!billPaymentStatus) {
    return null;
  }
  const resfileStoreId = await DRISTIService.fetchBillFileStoreId({}, { billId: courtBillResponse?.Bill?.[0]?.id, tenantId });
  const fileStoreId = resfileStoreId?.Document?.fileStore;
  if (fileStoreId) {
    await Promise.all([
      ordersService.customApiService(Urls.orders.pendingTask, {
        pendingTask: {
          name: pendingTaskName,
          entityType: paymentType.ASYNC_ORDER_SUBMISSION_MANAGELIFECYCLE,
          referenceId: `MANUAL_${taskNumber}`,
          status: pendingStatus,
          assignedTo: [],
          assignedRole: [],
          cnrNumber: filteredTasks?.[0]?.cnrNumber,
          filingNumber: filingNumber,
          caseId: caseDetails?.id,
          caseTitle: caseDetails?.caseTitle,
          isCompleted: true,
          stateSla: "",
          additionalDetails: {},
          tenantId,
        },
      }),
    ]);
  }
  history.push(
    `/${window?.contextPath}/citizen/home/post-payment-screen`,
    buildPostPaymentScreenState({ mockSubmitModalInfo, caseDetails, orderNumber, taskNumber, orderType, fileStoreId })
  );
};

const runRpadPayOnline = async ({
  refetchBill,
  courtBillResponse,
  caseDetails,
  tenantId,
  setIsCaseLocked,
  setPayOnlineButtonTitle,
  openPaymentPortal,
  orderType,
  taskNumber,
  filingNumber,
  filteredTasks,
  mockSubmitModalInfo,
  orderNumber,
  history,
  pendingTaskName,
  pendingStatus,
  setShowToast,
  t,
}) => {
  try {
    const { data: freshBillResponse } = await refetchBill();
    if (!courtBillResponse?.Bill?.length) {
      console.error("Bill not found");
      return;
    }
    if (freshBillResponse?.Bill?.[0]?.status === "PAID") {
      setIsCaseLocked(true);
      setPayOnlineButtonTitle("CS_BUTTON_PAY_ONLINE_NO_PENDING_PAYMENT");
      return;
    }
    const caseLockStatus = await DRISTIService.getCaseLockStatus(
      {},
      {
        uniqueId: caseDetails?.filingNumber,
        tenantId: tenantId,
      }
    );
    if (caseLockStatus?.Lock?.isLocked) {
      setIsCaseLocked(true);
      setPayOnlineButtonTitle("CS_BUTTON_PAY_ONLINE_SOMEONE_PAYING");
      return;
    }
    await DRISTIService.setCaseLock({ Lock: { uniqueId: caseDetails?.filingNumber, tenantId: tenantId, lockType: "PAYMENT" } }, {});
    const billPaymentStatus = await openPaymentPortal(courtBillResponse);
    await DRISTIService.setCaseUnlock({}, { uniqueId: caseDetails?.filingNumber, tenantId: tenantId });

    if (!billPaymentStatus) {
      console.error("Payment canceled or failed", taskNumber);
      return null;
    }
    const resfileStoreId = await DRISTIService.fetchBillFileStoreId({}, { billId: courtBillResponse?.Bill?.[0]?.id, tenantId });
    const fileStoreId = resfileStoreId?.Document?.fileStore;
    const postPaymenScreenObj = buildPostPaymentScreenState({
      mockSubmitModalInfo,
      caseDetails,
      orderNumber,
      taskNumber,
      orderType,
      fileStoreId,
    });

    if (fileStoreId) {
      await Promise.all([
        ordersService.customApiService(Urls.orders.pendingTask, {
          pendingTask: {
            name: pendingTaskName,
            entityType: paymentType.ASYNC_ORDER_SUBMISSION_MANAGELIFECYCLE,
            referenceId: `MANUAL_${taskNumber}`,
            status: pendingStatus,
            assignedTo: [],
            assignedRole: [],
            cnrNumber: filteredTasks?.[0]?.cnrNumber,
            filingNumber: filingNumber,
            caseId: caseDetails?.id,
            caseTitle: caseDetails?.caseTitle,
            isCompleted: true,
            stateSla: "",
            additionalDetails: {},
            tenantId,
          },
        }),
      ]);
    }

    history.push(`/${window?.contextPath}/citizen/home/post-payment-screen`, postPaymenScreenObj);
  } catch (error) {
    console.error("Error in onPayOnline function:", error);
    const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
    setShowToast({ label: t("ERROR_PROCESSING_PAYMENT"), error: true, errorId });
  }
};

/**
 * Shared data + payment flow for PaymentForSummonModal (post) and PaymentForRPADModal.
 * Variant-specific bill consumer codes, fee tables, and pay handlers stay isolated here.
 */
export const useTaskOrderPaymentModal = (variant) => {
  const history = useHistory();
  const { t } = useTranslation();
  const userInfo = Digit.UserService.getUser()?.info;
  const userUuid = userInfo?.uuid;
  const authorizedUuid = getAuthorizedUuid(userUuid);
  const { filingNumber, taskNumber } = Digit.Hooks.useQueryParams();
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const [isCaseLocked, setIsCaseLocked] = useState(false);
  const [payOnlineButtonTitle, setPayOnlineButtonTitle] = useState("CS_BUTTON_PAY_ONLINE_SOMEONE_PAYING");
  const [showToast, setShowToast] = useState(null);

  const isPostChannel = variant === "POST";

  const { data: caseData } = Digit.Hooks.dristi.useSearchCaseService(
    {
      criteria: [{ filingNumber: filingNumber }],
      tenantId,
    },
    {},
    isPostChannel ? `case-details-${filingNumber}` : `dristi-${filingNumber}`,
    filingNumber,
    Boolean(filingNumber)
  );

  const isCaseAdmitted = useMemo(() => caseData?.criteria?.[0]?.responseList?.[0]?.status === CaseWorkflowState.CASE_ADMITTED, [caseData]);

  const caseDetails = useMemo(() => caseData?.criteria?.[0]?.responseList?.[0], [caseData]);
  const caseCourtId = useMemo(() => caseDetails?.courtId, [caseDetails]);

  useCaseLockStatusForPaymentModal(caseDetails, tenantId, t, setIsCaseLocked, setShowToast);

  const isUserAdv = useIsUserAdvocateOnCase(caseDetails, authorizedUuid);

  const todayDate = new Date().getTime();
  const dayInMillisecond = 24 * 3600 * 1000;

  const { data: tasksData, isLoading: isTaskLoading } = Digit.Hooks.hearings.useGetTaskList(
    {
      criteria: {
        tenantId: tenantId,
        taskNumber: taskNumber,
        ...(caseCourtId && { courtId: caseCourtId }),
      },
    },
    {},
    filingNumber,
    Boolean(filingNumber && caseCourtId)
  );

  const filteredTasks = useMemo(() => tasksData?.list, [tasksData]);

  const { data: orderData, isLoading: isOrdersLoading } = Digit.Hooks.orders.useSearchOrdersService(
    { tenantId, criteria: { id: filteredTasks?.[0]?.orderId, ...(caseCourtId && { courtId: caseCourtId }) } },
    { tenantId },
    filteredTasks?.[0]?.orderId,
    Boolean(filteredTasks?.[0]?.orderId && caseCourtId)
  );

  const orderDetails = useMemo(() => orderData?.list?.[0] || {}, [orderData]);

  const compositeItem = useMemo(
    () =>
      isPostChannel
        ? orderData?.list?.[0]?.compositeItems?.find((item) => item?.id === filteredTasks?.[0]?.additionalDetails?.itemId)
        : orderDetails?.compositeItems?.find((item) => item?.id === filteredTasks?.[0]?.additionalDetails?.itemId),
    [isPostChannel, orderData, orderDetails, filteredTasks]
  );

  const orderType = useMemo(
    () =>
      isPostChannel
        ? orderData?.list?.[0]?.orderCategory === "COMPOSITE"
          ? compositeItem?.orderType
          : orderData?.list?.[0]?.orderType
        : orderDetails?.orderCategory === "COMPOSITE"
        ? compositeItem?.orderType
        : orderDetails?.orderType,
    [isPostChannel, orderData, orderDetails, compositeItem]
  );

  const hearingId = isPostChannel
    ? orderData?.list?.[0]?.scheduledHearingNumber || orderData?.list?.[0]?.hearingNumber
    : orderDetails?.scheduledHearingNumber || orderDetails?.hearingNumber;

  const { data: hearingsData, isLoading: isHearingLoading } = Digit.Hooks.hearings.useGetHearings(
    {
      hearing: { tenantId },
      criteria: {
        tenantID: tenantId,
        filingNumber: filingNumber,
        hearingId: hearingId,
        ...(caseCourtId && { courtId: caseCourtId }),
      },
    },
    { applicationNumber: "", cnrNumber: "" },
    hearingId,
    Boolean(hearingId && caseCourtId)
  );

  const consumerCodeSuffix = isPostChannel ? "_POST_PROCESS_COURT" : "_EPOST_COURT";
  const consumerCode = useMemo(() => (taskNumber ? `${taskNumber}${consumerCodeSuffix}` : undefined), [taskNumber, consumerCodeSuffix]);

  const service = useMemo(() => (orderType === ORDER_TYPES.SUMMONS ? paymentType.TASK_SUMMON : paymentType.TASK_NOTICE), [orderType]);
  const taskType = useMemo(() => getTaskType(service), [service]);

  const billSearchKey = isPostChannel ? `${taskNumber}_POST_PROCESS_COURT_${service}` : `courtBillResponse-${service}${taskNumber}`;
  const billSearchEnabled = isPostChannel ? Boolean(taskNumber && orderType) : Boolean(taskNumber);

  const { data: courtBillResponse, isLoading: isCourtBillLoading, refetch: refetchBill } = Digit.Hooks.dristi.useBillSearch(
    {},
    {
      tenantId,
      consumerCode: `${taskNumber}${consumerCodeSuffix}`,
      service: service,
    },
    billSearchKey,
    billSearchEnabled
  );

  const summonsPincode = useMemo(() => filteredTasks?.[0]?.taskDetails?.respondentDetails?.address?.pincode, [filteredTasks]);
  const channelId = useMemo(() => extractFeeMedium(filteredTasks?.[0]?.taskDetails?.deliveryChannels?.channelName || ""), [filteredTasks]);

  const breakupEnabled = isPostChannel
    ? Boolean(filteredTasks && channelId && orderType && taskNumber)
    : Boolean(filteredTasks && channelId && taskType && taskNumber);

  const { data: breakupResponse, isLoading: isSummonsBreakUpLoading } = Digit.Hooks.dristi.useSummonsPaymentBreakUp(
    {
      Criteria: [
        {
          channelId: channelId,
          receiverPincode: summonsPincode,
          tenantId: tenantId,
          Id: taskNumber,
          taskType: taskType,
        },
      ],
    },
    {},
    `breakup-response-${summonsPincode}${channelId}${taskNumber}${taskType}`,
    breakupEnabled
  );

  const courtFeeAmount = useMemo(() => breakupResponse?.Calculation?.[0]?.breakDown?.find((data) => data?.type === "Court Fee")?.amount, [
    breakupResponse,
  ]);

  const { openPaymentPortal, paymentLoader } = usePaymentProcess({
    tenantId,
    consumerCode: consumerCode,
    service: service,
    caseDetails,
    totalAmount: courtFeeAmount,
  });

  const mockSubmitModalInfo = useMemo(
    () => (isPostChannel ? buildPostPaymentReceiptInfo(isCaseAdmitted) : buildRpadPaymentReceiptInfo(isCaseAdmitted)),
    [isCaseAdmitted, isPostChannel]
  );

  const orderNumber = isPostChannel ? orderData?.list?.[0]?.orderNumber : orderDetails?.orderNumber;

  const pendingTaskName = useMemo(() => {
    const isSummons = orderType === ORDER_TYPES.SUMMONS;
    if (isPostChannel) {
      return isSummons ? "MAKE_PAYMENT_FOR_SUMMONS_POST" : "MAKE_PAYMENT_FOR_NOTICE_POST";
    }
    return isSummons ? "MAKE_PAYMENT_FOR_SUMMONS_RPAD" : "MAKE_PAYMENT_FOR_NOTICE_RPAD";
  }, [isPostChannel, orderType]);

  const pendingStatus = isPostChannel ? paymentType.PAYMENT_PENDING_POST : paymentType.PAYMENT_PENDING_RPAD;

  const feeOptions = useMemo(() => {
    const taskAmount = filteredTasks?.[0]?.amount?.amount || 0;

    const payContext = {
      refetchBill,
      courtBillResponse,
      caseDetails,
      tenantId,
      setIsCaseLocked,
      setPayOnlineButtonTitle,
      openPaymentPortal,
      orderType,
      taskNumber,
      filingNumber,
      filteredTasks,
      mockSubmitModalInfo,
      orderNumber,
      history,
      pendingTaskName,
      pendingStatus,
      setShowToast,
      t,
    };

    const onPayOnline = () => {
      if (isPostChannel) {
        return runPostChannelPayOnline(payContext).catch((error) => console.error(error));
      }
      return runRpadPayOnline(payContext);
    };

    if (isPostChannel) {
      return {
        "e-post": [
          { label: "Fee Type", amount: "Amount", action: "Actions" },
          {
            label: "E-post Fee",
            amount: courtBillResponse?.Bill?.[0]?.totalAmount,
            isCompleted: courtBillResponse?.Bill?.[0]?.status === "PAID",
            action: "Pay Online",
            onClick: onPayOnline,
          },
        ],
        "registered-post": [
          { label: "Fee Type", amount: "Amount", action: "Actions" },
          { label: "Court Fees", amount: courtFeeAmount, action: "Pay Online", onClick: onPayOnline },
          { label: "Delivery Partner Fee", amount: taskAmount, action: "offline-process", onClick: onPayOnline },
        ],
      };
    }

    return {
      "registered-post": [
        { label: "Fee Type", amount: "Amount", action: "Actions" },
        { label: "Court Fees", amount: courtFeeAmount, action: "Pay Online", onClick: onPayOnline },
        { label: "Delivery Partner Fee", amount: taskAmount, action: "offline-process", onClick: onPayOnline },
      ],
    };
  }, [
    isPostChannel,
    filteredTasks,
    courtFeeAmount,
    courtBillResponse,
    openPaymentPortal,
    tenantId,
    mockSubmitModalInfo,
    caseDetails,
    orderNumber,
    taskNumber,
    history,
    orderType,
    hearingsData?.HearingList,
    hearingsData?.list,
    filingNumber,
    dayInMillisecond,
    todayDate,
    service,
    pendingTaskName,
    pendingStatus,
    refetchBill,
    t,
  ]);

  const deliveryChannelPrefix = isPostChannel ? "Post" : "RPAD";

  const infos = useMemo(() => {
    const addressDetails = filteredTasks?.[0]?.taskDetails?.respondentDetails?.address;
    const formattedAddress = formatRespondentAddressLine(addressDetails);
    return [
      { key: "Issued to", value: getPartyNameForInfos(orderDetails, compositeItem, orderType) },
      { key: "Next Hearing Date", value: DateUtils.getFormattedDate(new Date(hearingsData?.HearingList?.[0]?.startTime), "DD-MM-YYYY") },
      {
        key: "Delivery Channel",
        value: `${deliveryChannelPrefix} (${formattedAddress})`,
      },
    ];
  }, [compositeItem, filteredTasks, hearingsData?.HearingList, orderDetails, orderType, deliveryChannelPrefix]);

  const links = useMemo(() => {
    return [{ text: "View order", link: "", onClick: getViewOrderClickHandler({ history, caseData, filingNumber }) }];
  }, [caseData, caseData?.criteria, filingNumber, history]);

  const modeOptions = isPostChannel ? [{ label: "E-Post (3-5 days)", value: "e-post" }] : [{ label: "Registered Post (10-15 days)", value: "registered-post" }];

  const paymentForSummonModalConfig = useMemo(() => {
    const handleClose = () => {
      if (paymentLoader === false) {
        history.goBack();
      }
    };

    const headingLabel = isPostChannel
      ? `Payment for ${orderType === ORDER_TYPES.SUMMONS ? "Summons" : "Notice"} via post`
      : `Payment for ${orderType === ORDER_TYPES.SUMMONS ? "Summons" : "Notice"} via RPAD`;

    return {
      handleClose: handleClose,
      heading: { label: headingLabel },
      isStepperModal: false,
      isCaseLocked: isCaseLocked,
      payOnlineButtonTitle: payOnlineButtonTitle,
      className: "payment-modal",
      modalBody: (
        <PaymentSummonFeeSelectionComponent
          infos={infos}
          links={links}
          feeOptions={feeOptions}
          paymentLoader={paymentLoader}
          orderType={orderType}
          isUserAdv={isUserAdv}
          isCaseLocked={isCaseLocked}
          payOnlineButtonTitle={payOnlineButtonTitle}
          modeOptions={modeOptions}
          modeSelectionLabelKey={isPostChannel ? "Select preferred mode of post to pay" : "Select preferred mode of RPAD to pay"}
          showOfflinePaymentInfoCardLabel={isPostChannel}
          offlineHelpVariant={isPostChannel ? "epost-simple" : "rpad-tooltips"}
        />
      ),
    };
  }, [feeOptions, history, infos, links, orderType, paymentLoader, isUserAdv, isCaseLocked, payOnlineButtonTitle, isPostChannel, modeOptions]);

  const isLoading = isOrdersLoading || !orderData || isSummonsBreakUpLoading || isCourtBillLoading || isTaskLoading || isHearingLoading;

  return {
    isLoading,
    paymentForSummonModalConfig,
    showToast,
    setShowToast,
  };
};
