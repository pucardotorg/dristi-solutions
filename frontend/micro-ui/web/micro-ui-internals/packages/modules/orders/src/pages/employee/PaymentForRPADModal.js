import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import CustomToast from "@egovernments/digit-ui-module-dristi/src/components/CustomToast";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { Loader } from "@egovernments/digit-ui-components";
import DocumentModal from "../../components/DocumentModal";
import usePaymentProcess from "../../../../home/src/hooks/usePaymentProcess";
import { ordersService } from "../../hooks/services";
import { Urls } from "../../hooks/services/Urls";
import { paymentType } from "../../utils/paymentType";
import { DateUtils, extractFeeMedium, getAuthorizedUuid, getTaskType } from "@egovernments/digit-ui-module-dristi/src/Utils";
import { DRISTIService } from "@egovernments/digit-ui-module-dristi/src/services";
import {
  formatRespondentAddressLine,
  getViewOrderClickHandler,
  PaymentSummonFeeSelectionComponent,
  useCaseLockStatusForPaymentModal,
  useIsUserAdvocateOnCase,
} from "./shared/paymentSummonModalShared";
import { getPartyNameForInfos } from "../../utils";
import { CaseWorkflowState } from "@egovernments/digit-ui-module-dristi/src/Utils/caseWorkflow";
import { ORDER_TYPES } from "../../utils/constants";
const modeOptions = [{ label: "Registered Post (10-15 days)", value: "registered-post" }];

const submitModalInfo = {
  header: "CS_HEADER_FOR_SUMMON_RPAD",
  subHeader: "CS_SUBHEADER_TEXT_FOR_Summon_RPAD",
  caseInfo: [
    {
      key: "Case Number",
      value: "FSM-2019-04-23-898898",
    },
  ],
  isArrow: false,
  showTable: true,
};

const PaymentForRPADModal = ({ path }) => {
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

  const { data: caseData } = Digit.Hooks.dristi.useSearchCaseService(
    {
      criteria: [
        {
          filingNumber: filingNumber,
        },
      ],
      tenantId,
    },
    {},
    `dristi-${filingNumber}`,
    filingNumber,
    Boolean(filingNumber)
  );

  const isCaseAdmitted = useMemo(() => caseData?.criteria?.[0]?.responseList?.[0]?.status === CaseWorkflowState.CASE_ADMITTED, [caseData]);

  const caseDetails = useMemo(() => {
    return caseData?.criteria?.[0]?.responseList?.[0];
  }, [caseData]);

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

  const compositeItem = useMemo(() => orderDetails?.compositeItems?.find((item) => item?.id === filteredTasks?.[0]?.additionalDetails?.itemId), [
    orderDetails,
    filteredTasks,
  ]);

  const orderType = useMemo(() => (orderDetails?.orderCategory === "COMPOSITE" ? compositeItem?.orderType : orderDetails?.orderType), [
    orderDetails,
    compositeItem,
  ]);

  const { data: hearingsData, isLoading: isHearingLoading } = Digit.Hooks.hearings.useGetHearings(
    {
      hearing: { tenantId },
      criteria: {
        tenantID: tenantId,
        filingNumber: filingNumber,
        hearingId: orderDetails?.scheduledHearingNumber || orderDetails?.hearingNumber,
        ...(caseCourtId && { courtId: caseCourtId }),
      },
    },
    { applicationNumber: "", cnrNumber: "" },
    orderDetails?.hearingNumber || orderDetails?.scheduledHearingNumber,
    Boolean((orderDetails?.hearingNumber || orderDetails?.scheduledHearingNumber) && caseCourtId)
  );

  const consumerCode = useMemo(() => {
    return taskNumber ? `${taskNumber}_EPOST_COURT` : undefined;
  }, [taskNumber]);

  const service = useMemo(() => (orderType === ORDER_TYPES.SUMMONS ? paymentType.TASK_SUMMON : paymentType.TASK_NOTICE), [orderType]);
  const taskType = useMemo(() => getTaskType(service), [service]);
  const { data: courtBillResponse, isLoading: isCourtBillLoading, refetch: refetchBill } = Digit.Hooks.dristi.useBillSearch(
    {},
    {
      tenantId,
      consumerCode: `${taskNumber}_EPOST_COURT`,
      service: service,
    },
    `courtBillResponse-${service}${taskNumber}`,
    Boolean(taskNumber)
  );

  const summonsPincode = useMemo(() => filteredTasks?.[0]?.taskDetails?.respondentDetails?.address?.pincode, [filteredTasks]);
  const channelId = useMemo(() => extractFeeMedium(filteredTasks?.[0]?.taskDetails?.deliveryChannels?.channelName || ""), [filteredTasks]);

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
    Boolean(filteredTasks && channelId && taskType && taskNumber)
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
    () =>
      isCaseAdmitted
        ? submitModalInfo
        : {
            ...submitModalInfo,
            header: "CS_HEADER_FOR_NOTICE_RPAD",
            subHeader: "CS_SUBHEADER_TEXT_FOR_NOTICE_RPAD",
          },
    [isCaseAdmitted]
  );

  const feeOptions = useMemo(() => {
    const taskAmount = filteredTasks?.[0]?.amount?.amount || 0;

    const onPayOnline = async () => {
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
        const postPaymenScreenObj = {
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
                  value: orderDetails?.orderNumber,
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
        };

        if (fileStoreId) {
          await Promise.all([
            ordersService.customApiService(Urls.orders.pendingTask, {
              pendingTask: {
                name: orderType === ORDER_TYPES.SUMMONS ? `MAKE_PAYMENT_FOR_SUMMONS_RPAD` : `MAKE_PAYMENT_FOR_NOTICE_RPAD`,
                entityType: paymentType.ASYNC_ORDER_SUBMISSION_MANAGELIFECYCLE,
                referenceId: `MANUAL_${taskNumber}`,
                status: paymentType.PAYMENT_PENDING_RPAD,
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

    return {
      "registered-post": [
        {
          label: "Fee Type",
          amount: "Amount",
          action: "Actions",
        },
        {
          label: "Court Fees",
          amount: courtFeeAmount,
          action: "Pay Online",
          onClick: onPayOnline,
        },
        { label: "Delivery Partner Fee", amount: taskAmount, action: "offline-process", onClick: onPayOnline },
      ],
    };
  }, [
    caseDetails?.caseTitle,
    caseDetails?.filingNumber,
    courtBillResponse,
    courtFeeAmount,
    dayInMillisecond,
    filingNumber,
    filteredTasks,
    hearingsData?.HearingList,
    hearingsData?.list,
    history,
    mockSubmitModalInfo,
    openPaymentPortal,
    orderDetails?.orderNumber,
    orderType,
    taskNumber,
    tenantId,
    todayDate,
  ]);

  const infos = useMemo(() => {
    const addressDetails = filteredTasks?.[0]?.taskDetails?.respondentDetails?.address;
    const formattedAddress = formatRespondentAddressLine(addressDetails);
    return [
      { key: "Issued to", value: getPartyNameForInfos(orderDetails, compositeItem, orderType) },
      { key: "Next Hearing Date", value: DateUtils.getFormattedDate(new Date(hearingsData?.HearingList?.[0]?.startTime), "DD-MM-YYYY") },
      {
        key: "Delivery Channel",
        value: `RPAD (${formattedAddress})`,
      },
    ];
  }, [compositeItem, filteredTasks, hearingsData?.HearingList, orderDetails, orderType]);

  const links = useMemo(() => {
    return [{ text: "View order", link: "", onClick: getViewOrderClickHandler({ history, caseData, filingNumber }) }];
  }, [caseData]);

  const paymentForSummonModalConfig = useMemo(() => {
    const handleClose = () => {
      if (paymentLoader === false) {
        history.goBack();
      }
    };

    return {
      handleClose: handleClose,
      heading: { label: `Payment for ${orderType === ORDER_TYPES.SUMMONS ? "Summons" : "Notice"} via RPAD` },
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
          modeSelectionLabelKey="Select preferred mode of RPAD to pay"
          showOfflinePaymentInfoCardLabel={false}
          offlineHelpVariant="rpad-tooltips"
        />
      ),
    };
  }, [orderType, infos, links, feeOptions, paymentLoader, isUserAdv, isCaseLocked, payOnlineButtonTitle, history]);

  if (isOrdersLoading || !orderData || isSummonsBreakUpLoading || isCourtBillLoading || isTaskLoading || isHearingLoading) {
    return <Loader />;
  }

  return (
    <React.Fragment>
      <DocumentModal config={paymentForSummonModalConfig} />
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

export default PaymentForRPADModal;
