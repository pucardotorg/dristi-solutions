import React, { useMemo, useState } from "react";
import { Button, Loader } from "@egovernments/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import ApplicationInfoComponent from "../../components/ApplicationInfoComponent";
import DocumentModal from "../../components/DocumentModal";
import { formatDate } from "../../../../hearings/src/utils";
import usePaymentProcess from "../../../../home/src/hooks/usePaymentProcess";
import { DRISTIService } from "@egovernments/digit-ui-module-dristi/src/services";
import { ordersService, taskService } from "../../hooks/services";
import { Urls } from "../../hooks/services/Urls";
import { useEffect } from "react";
import { paymentType } from "../../utils/paymentType";
import { useLocation } from "react-router-dom/cjs/react-router-dom.min";

const WarrantPaymentModal = ({ path }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const location = useLocation();
  const { filingNumber, taskNumber } = Digit.Hooks.useQueryParams();
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const [caseId, setCaseId] = useState();
  const [channelId, setChannelId] = useState(null);

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
    "dristi",
    filingNumber,
    Boolean(filingNumber)
  );

  const { data: breakupResponse, isLoading: isSummonsBreakUpLoading } = Digit.Hooks.dristi.useSummonsPaymentBreakUp(
    {
      Criteria: [
        {
          channelId: "POLICE",
          tenantId: tenantId,
          Id: "hello",
          taskType: "WARRANT",
        },
      ],
    },
    {},
    "dristi",
    true
  );

  useEffect(() => {
    const pathname = location?.pathname;
    const channel = pathname.split("/")[5].split("-")[0];
    setChannelId(channel);
  }, [location]);

  useEffect(() => {
    if (caseData) {
      const id = caseData?.criteria?.[0]?.responseList?.[0]?.id;
      if (id) {
        setCaseId(id); // Set the caseId in state
      } else {
        console.error("caseId is undefined or not available");
      }
    }
  }, [caseData]);

  const caseDetails = useMemo(() => {
    return caseData?.criteria?.[0]?.responseList?.[0];
  }, [caseData]);

  const { data: tasksData } = Digit.Hooks.hearings.useGetTaskList(
    {
      criteria: {
        tenantId: tenantId,
        taskNumber: taskNumber,
      },
    },
    {},
    filingNumber,
    Boolean(filingNumber)
  );

  const filteredTasks = useMemo(() => tasksData?.list, [tasksData]);

  const { data: orderData, isloading: isOrdersLoading } = Digit.Hooks.orders.useSearchOrdersService(
    { tenantId, criteria: { id: filteredTasks?.[0]?.orderId } },
    { tenantId },
    filteredTasks?.[0]?.orderId,
    Boolean(filteredTasks?.[0]?.orderId)
  );

  const orderType = useMemo(() => orderData?.list?.[0]?.orderType, [orderData]);

  const { data: hearingsData } = Digit.Hooks.hearings.useGetHearings(
    {
      hearing: { tenantId },
      criteria: {
        tenantID: tenantId,
        filingNumber: filingNumber,
        hearingId: orderData?.list?.[0]?.hearingNumber,
      },
    },
    { applicationNumber: "", cnrNumber: "" },
    orderData?.list?.[0]?.hearingNumber,
    Boolean(orderData?.list?.[0]?.hearingNumber)
  );

  const { data: paymentTypeData, isLoading: isPaymentTypeLoading } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getStateId(),
    "payment",
    [{ name: "paymentType" }],
    {
      select: (data) => {
        return data?.payment?.paymentType || [];
      },
    }
  );
  const { data: taxPeriodData, isLoading: taxPeriodLoading } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getStateId(),
    "BillingService",
    [{ name: "TaxPeriod" }],
    {
      select: (data) => {
        return data?.BillingService?.TaxPeriod || [];
      },
    }
  );
  const suffix = useMemo(() => {
    if (!paymentTypeData) return [];
    const data = paymentTypeData;
    const requiredChannel =
      channelId === "sms" ? "SMS" : channelId === "email" ? "Email" : channelId ? channelId.charAt(0).toUpperCase() + channelId.slice(1) : "";
    return data.filter(
      (item) =>
        item?.deliveryChannel === requiredChannel &&
        item?.businessService &&
        item?.businessService?.some((service) => service?.businessCode === "task-warrant")
    );
  }, paymentTypeData);
  const taxPeriodSummon = useMemo(() => {
    if (!taxPeriodData) return [];
    const data = taxPeriodData;
    return data.filter((item) => item?.service === "task-summons");
  }, taxPeriodData);

  const { fetchBill, openPaymentPortal, paymentLoader, showPaymentModal, setShowPaymentModal, billPaymentStatus } = usePaymentProcess({
    tenantId,
    consumerCode: `${filteredTasks?.[0]?.taskNumber}_${suffix}`,
    service: paymentType.TASK_WARRANT,
    caseDetails,
    totalAmount: "4",
  });

  const status = useMemo(() => {
    if (channelId === "sms") {
      return paymentType.PAYMENT_PENDING_SMS;
    } else if (channelId === "email") {
      return paymentType.PAYMENT_PENDING_EMAIL;
    } else {
      return paymentType.PAYMENT_PENDING_POST;
    }
  });
  const referenceId = "Icops";
  const receiptData = {
    caseInfo: [
      {
        key: "Case Name & ID",
        value: `${caseDetails?.caseTitle}, ${caseDetails?.filingNumber}`,
        copyData: false,
      },
    ],
    isArrow: false,
    showTable: true,
    showCopytext: true,
  };
  // const { data: billResponse, isLoading: isBillLoading } = Digit.Hooks.dristi.useBillSearch(
  //   {},
  //   { tenantId, consumerCode: `${filteredTasks?.[0]?.taskNumber}_${suffix}`, service: paymentType.TASK_WARRANT },
  //   "dristi",
  //   Boolean(filteredTasks?.[0]?.taskNumber)
  // );
  // const orderType = useMemo(() => orderData?.list?.[0]?.orderType, [orderData]);
  const onPayOnline = async () => {
    try {
      // if (billResponse?.Bill?.length === 0) {
      //   await DRISTIService.createDemand({
      //     Demands: [
      //       {
      //         tenantId,
      //         consumerCode: `${filteredTasks?.[0]?.taskNumber}_${suffix}`,
      //         consumerType: paymentType.TASK_WARRANT,
      //         businessService: paymentType.TASK_WARRANT,
      //         taxPeriodFrom: Date.now().toString(),
      //         taxPeriodTo: Date.now().toString(),
      //         demandDetails: [
      //           {
      //             taxHeadMasterCode: paymentType.TASK_SUMMON_ADVANCE_CARRYFORWARD,
      //             taxAmount: 4,
      //             collectionAmount: 0,
      //           },
      //         ],
      //       },
      //     ],
      //   });
      // }
      // const bill = await fetchBill(`${filteredTasks?.[0]?.taskNumber}_${suffix}`, tenantId, paymentType.TASK_SUMMON);
      // if (bill?.Bill?.length) {
      //   const billPaymentStatus = await openPaymentPortal(bill);
      //   const billId = bill?.Bill?.[0]?.id;

      //   const receiptData = {
      //     caseInfo: [
      //       {
      //         key: "Case Name & ID",
      //         value: `${caseDetails?.caseTitle}, ${caseDetails?.filingNumber}`,
      //         copyData: false,
      //       },
      //       {
      //         key: "ORDER ID",
      //         value: orderData?.list?.[0]?.orderNumber,
      //         copyData: false,
      //       },
      //       {
      //         key: "Transaction ID",
      //         value: filteredTasks?.[0]?.taskNumber,
      //         copyData: true,
      //       },
      //     ],
      //     isArrow: false,
      //     showTable: true,
      //     showCopytext: true,
      //   };
      const updatedTask = {
        ...filteredTasks?.[0],
        taskType: "WARRANT",
        workflow: {
          action: "MAKE_PAYMENT",
        },
      };

      // await taskService
      //   .updateTask(
      //     {
      //       task: updatedTask,
      //       tenantId: tenantId,
      //     },
      //     {}
      //   )
      //   .then(() => {
      //     return
      await ordersService.customApiService(Urls.orders.pendingTask, {
        pendingTask: {
          name: `PAYMENT_PENDING_FOR_WARRANT`,
          entityType: paymentType.ASYNC_ORDER_SUBMISSION_MANAGELIFECYCLE,
          referenceId: `MANUAL_${taskNumber}`,
          status: status,
          assignedTo: [],
          assignedRole: [],
          cnrNumber: filteredTasks?.[0]?.cnrNumber,
          filingNumber: filingNumber,
          isCompleted: true,
          stateSla: "",
          additionalDetails: {},
          tenantId,
        },
      });
      // }),
      // if (billPaymentStatus) {
      // const fileStoreId = await DRISTIService.fetchBillFileStoreId({}, { billId, tenantId });
      history.push(`/${window?.contextPath}/citizen/home/post-payment-screen`, {
        state: {
          success: true,
          receiptData,
          amount: "Rs 11/-",
        },
      });
      // } else {
      //   history.push(`/${window?.contextPath}/citizen/home/post-payment-screen`, {
      //     state: {
      //       success: false,
      //       receiptData,
      //       caseId: caseDetails?.filingNumber,
      //     },
      //   });
      // }
      // }
    } catch (error) {
      console.error(error);
    }
  };
  const feeOptions = useMemo(() => {
    if (breakupResponse) {
      const icops = [
        {
          label: "Fee Type",
          amount: "Amount",
          action: "Actions",
        },
        ...breakupResponse?.Calculation[0]?.breakDown?.map((item) => ({
          label: item?.type,
          amount: item?.amount,
          action: "Pay Online",
          onClick: onPayOnline,
        })),
      ];

      return {
        icops,
      };
    }
    return [];
  }, [breakupResponse, filteredTasks, onPayOnline]);

  const handleClose = () => {
    if (paymentLoader === false) {
      history.goBack();
    }
  };
  const infos = useMemo(() => {
    const name = orderData?.list?.[0]?.additionalDetails?.formdata?.warrantFor;
    const task = filteredTasks?.[0];
    const taskDetails = task?.taskDetails;

    return [
      { key: "Issued to", value: name },
      { key: "Next Hearing Date", value: formatDate(new Date(hearingsData?.HearingList?.[0]?.startTime)) },
      {
        key: "Delivery Channel",
        value: channelId,
      },
    ];
  }, [hearingsData?.HearingList, filteredTasks, orderData?.list]);

  const paymentForWarrantModalConfig = useMemo(() => {
    const formattedChannelId = channelId ? channelId.charAt(0).toUpperCase() + channelId.slice(1) : "";
    return {
      handleClose: handleClose,
      heading: {
        label: `${t("PAYMENT_WARRANT")} ${formattedChannelId}`,
      },

      isStepperModal: false,
      modalBody: (
        <div className="payment-for-summon">
          <p style={{ marginTop: "0px", marginBottom: "0px" }}>
            {t("MAKE_WARRANT_PAYMENT_TEXT")} {formattedChannelId}.
          </p>
          <ApplicationInfoComponent infos={infos} />
          {channelId && feeOptions[channelId]?.length > 0 && (
            <div className="summon-payment-action-table">
              {feeOptions[channelId]?.map((action, index) => (
                <div className={`${index === 0 ? "header-row" : "action-row"}`} key={index}>
                  <div className="payment-label">{t(action?.label)}</div>
                  <div className="payment-amount">{action?.action !== "offline-process" && action?.amount ? `Rs. ${action?.amount}/-` : "-"}</div>
                  <div className="payment-action">
                    {index === 0 ? (
                      t(action?.action)
                    ) : action?.action !== "offline-process" ? (
                      <Button label={t(action.action)} onButtonClick={action.onClick} isDisabled={paymentLoader} />
                    ) : (
                      t(action?.action)
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    };
  }, [feeOptions, infos]);
  if (isOrdersLoading && isSummonsBreakUpLoading) {
    return <Loader />;
  }
  return <DocumentModal config={paymentForWarrantModalConfig} />;
};

export default WarrantPaymentModal;
