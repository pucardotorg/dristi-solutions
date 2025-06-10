import React, { useMemo, useState, useCallback } from "react";
import { Button, RadioButtons, CardLabel, LabelFieldPair } from "@egovernments/digit-ui-react-components";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { InfoCard, Loader } from "@egovernments/digit-ui-components";
import ApplicationInfoComponent from "../../components/ApplicationInfoComponent";
import DocumentModal from "../../components/DocumentModal";
import { formatDate } from "../../../../hearings/src/utils";
import usePaymentProcess from "../../../../home/src/hooks/usePaymentProcess";
import { DRISTIService } from "@egovernments/digit-ui-module-dristi/src/services";
import { ordersService } from "../../hooks/services";
import { Urls } from "../../hooks/services/Urls";
import { useEffect } from "react";
import { paymentType } from "../../utils/paymentType";
import { extractFeeMedium, getTaskType } from "@egovernments/digit-ui-module-dristi/src/Utils";
import { getAdvocates } from "../../utils/caseUtils";
import ButtonSelector from "@egovernments/digit-ui-module-dristi/src/components/ButtonSelector";

const modeOptions = [{ label: "E-Post (3-5 days)", value: "e-post" }];

const submitModalInfo = {
  header: "CS_HEADER_FOR_SUMMON_POST",
  subHeader: "CS_SUBHEADER_TEXT_FOR_Summon_POST",
  caseInfo: [
    {
      key: "Case Number",
      value: "FSM-2019-04-23-898898",
    },
  ],
  isArrow: false,
  showTable: true,
};

const PaymentForSummonComponent = ({
  infos,
  links,
  feeOptions,
  orderDate,
  paymentLoader,
  orderType,
  isUserAdv,
  isCaseLocked = false,
  payOnlineButtonTitle = null,
}) => {
  const { t } = useTranslation();
  const CustomErrorTooltip = window?.Digit?.ComponentRegistryService?.getComponent("CustomErrorTooltip");

  const [selectedOption, setSelectedOption] = useState(modeOptions[0]);

  const getDateWithMonthName = (orderDate) => {
    let today = new Date();
    today.setDate(today.getDate() + 15);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let dd = String(today.getDate()).padStart(2, "0");
    let mm = monthNames[today.getMonth()];
    let yyyy = today.getFullYear();
    let formattedDate = `${dd} ${mm} ${yyyy}`;
    return formattedDate; // Output: formatted date 15 days from now with month name
  };

  return (
    <div className="payment-for-summon">
      <InfoCard
        variant={"warning"}
        label={"Complete in 2 days"}
        additionalElements={[
          <p>
            {t(orderType === "SUMMONS" ? "SUMMON_DELIVERY_NOTE" : "NOTICE_DELIVERY_NOTE")}{" "}
            <span style={{ fontWeight: "bold" }}>{getDateWithMonthName(orderDate)}</span> {t("ON_TIME_DELIVERY")}
          </p>,
        ]}
        inline
        textStyle={{}}
        className={`custom-info-card warning`}
      />
      <CardLabel className="case-input-label">{t("OFFLINE_PAYMENT_INFO")}</CardLabel>
      <ApplicationInfoComponent infos={infos} links={links} />
      <LabelFieldPair className="case-label-field-pair">
        <div className="join-case-tooltip-wrapper">
          <CardLabel className="case-input-label">{t("Select preferred mode of post to pay")}</CardLabel>
          <CustomErrorTooltip message={t("Select date")} showTooltip={true} icon />
        </div>
        <RadioButtons
          additionalWrapperClass="mode-of-post-pay"
          options={modeOptions}
          selectedOption={selectedOption}
          optionsKey={"label"}
          onSelect={(value) => setSelectedOption(value)}
          disabled={paymentLoader}
        />
      </LabelFieldPair>
      {selectedOption?.value && (
        <div className="summon-payment-action-table">
          {feeOptions[selectedOption?.value]?.map((action, index) => (
            <div className={`${index === 0 ? "header-row" : "action-row"}`}>
              <div className="payment-label">{t(action?.label)}</div>
              <div className="payment-amount">{action?.action !== "offline-process" && action?.amount ? `Rs. ${action?.amount}/-` : "-"}</div>
              {isUserAdv && (
                <div className="payment-action">
                  {index === 0 ? (
                    t(action?.action)
                  ) : action?.isCompleted ? (
                    <p style={{ color: "green" }}>{t("PAYMENT_COMPLETED")}</p>
                  ) : action?.action !== "offline-process" ? (
                    <ButtonSelector
                      style={{ border: "1px solid" }}
                      label={t(action.action)}
                      onSubmit={action.onClick}
                      isDisabled={paymentLoader || isCaseLocked}
                      title={isCaseLocked ? t(payOnlineButtonTitle) : ""}
                      textStyles={{ margin: "0px" }}
                    />
                  ) : (
                    <p className="offline-process-text">
                      {t("THIS_OFFLINE_TEXT")} <span className="learn-more-text">{t("LEARN_MORE")}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const PaymentForSummonModal = ({ path }) => {
  const history = useHistory();
  const userInfo = Digit.UserService.getUser()?.info;
  const { filingNumber, taskNumber } = Digit.Hooks.useQueryParams();
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const [caseId, setCaseId] = useState();
  const [isCaseLocked, setIsCaseLocked] = useState(false);
  const [payOnlineButtonTitle, setPayOnlineButtonTitle] = useState("CS_BUTTON_PAY_ONLINE_SOMEONE_PAYING");

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
    `case-details-${filingNumber}`,
    filingNumber,
    Boolean(filingNumber)
  );

  const isCaseAdmitted = useMemo(() => caseData?.criteria?.[0]?.responseList?.[0]?.status === "CASE_ADMITTED", [caseData]);

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

  const caseCourtId = useMemo(() => caseDetails?.courtId, [caseDetails]);
  const fetchCaseLockStatus = useCallback(async () => {
    try {
      const status = await DRISTIService.getCaseLockStatus(
        {},
        {
          uniqueId: caseDetails?.filingNumber,
          tenantId: tenantId,
        }
      );
      setIsCaseLocked(status?.Lock?.isLocked);
    } catch (error) {
      console.error("Error fetching case lock status", error);
    }
  });
  useEffect(() => {
    if (caseDetails?.filingNumber) {
      fetchCaseLockStatus();
    }
  }, [caseDetails?.filingNumber]);

  const allAdvocates = useMemo(() => getAdvocates(caseDetails), [caseDetails]);
  const advocatesUuids = useMemo(() => {
    if (allAdvocates && typeof allAdvocates === "object") {
      return Object.values(allAdvocates).flat();
    }
    return [];
  }, [allAdvocates]);
  const isUserAdv = useMemo(() => advocatesUuids.includes(userInfo.uuid), [advocatesUuids, userInfo.uuid]);

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

  const { data: orderData, isloading: isOrdersLoading } = Digit.Hooks.orders.useSearchOrdersService(
    { tenantId, criteria: { id: filteredTasks?.[0]?.orderId, ...(caseCourtId && { courtId: caseCourtId }) } },
    { tenantId },
    filteredTasks?.[0]?.orderId,
    Boolean(filteredTasks?.[0]?.orderId && caseCourtId)
  );

  const compositeItem = useMemo(
    () => orderData?.list?.[0]?.compositeItems?.find((item) => item?.id === filteredTasks?.[0]?.additionalDetails?.itemId),
    [orderData, filteredTasks]
  );

  const orderType = useMemo(
    () => (orderData?.list?.[0]?.orderCategory === "COMPOSITE" ? compositeItem?.orderType : orderData?.list?.[0]?.orderType),
    [orderData, compositeItem]
  );

  const partyIndex = useMemo(
    () =>
      orderData?.list?.[0]?.orderCategory === "COMPOSITE"
        ? compositeItem?.orderSchema?.additionalDetails?.formdata?.noticeOrder?.party?.data?.partyIndex
        : orderData?.list?.[0]?.additionalDetails?.formdata?.noticeOrder?.party?.data?.partyIndex,
    [orderData, compositeItem]
  );

  const { data: hearingsData, isLoading: isHearingLoading } = Digit.Hooks.hearings.useGetHearings(
    {
      hearing: { tenantId },
      criteria: {
        tenantID: tenantId,
        filingNumber: filingNumber,
        hearingId: orderData?.list?.[0]?.hearingNumber,
        ...(caseCourtId && { courtId: caseCourtId }),
      },
    },
    { applicationNumber: "", cnrNumber: "" },
    orderData?.list?.[0]?.hearingNumber,
    Boolean(orderData?.list?.[0]?.hearingNumber && caseCourtId)
  );

  const consumerCode = useMemo(() => {
    return taskNumber ? `${taskNumber}_POST_COURT` : undefined;
  }, [taskNumber]);
  const service = useMemo(() => (orderType === "SUMMONS" ? paymentType.TASK_SUMMON : paymentType.TASK_NOTICE), [orderType]);
  const taskType = useMemo(() => getTaskType(service), [service]);
  const { data: courtBillResponse, isLoading: isCourtBillLoading, refetch: refetchBill } = Digit.Hooks.dristi.useBillSearch(
    {},
    {
      tenantId,
      consumerCode: `${taskNumber}_POST_COURT`,
      service: service,
    },
    `${taskNumber}_POST_COURT_${service}`,
    Boolean(taskNumber && orderType)
  );
  const { data: ePostBillResponse, isLoading: isEPOSTBillLoading } = Digit.Hooks.dristi.useBillSearch(
    {},
    {
      tenantId,
      consumerCode: `${taskNumber}_POST_PROCESS`,
      service: service,
    },
    `${taskNumber}_POST_PROCESS_${service}`,
    Boolean(taskNumber && orderType)
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
    Boolean(filteredTasks && channelId && orderType && taskNumber)
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

  const deliveryPartnerFeeAmount = useMemo(() => breakupResponse?.Calculation?.[0]?.breakDown?.find((data) => data?.type === "E Post")?.amount, [
    breakupResponse,
  ]);

  const mockSubmitModalInfo = useMemo(
    () =>
      isCaseAdmitted
        ? submitModalInfo
        : {
            ...submitModalInfo,
            header: "CS_HEADER_FOR_NOTICE_POST",
            subHeader: "CS_SUBHEADER_TEXT_FOR_NOTICE_POST",
          },
    [isCaseAdmitted]
  );

  const feeOptions = useMemo(() => {
    const taskAmount = filteredTasks?.[0]?.amount?.amount || 0;

    const onPayOnline = async () => {
      try {
        const { data: freshBillResponse } = await refetchBill();
        if (!courtBillResponse?.Bill?.length) {
          console.log("Bill not found");
          return null;
        }
        if (freshBillResponse?.Bill?.[0]?.status === "PAID") {
          setIsCaseLocked(ePostBillResponse?.Bill?.[0]?.status === "PAID" ? true : false);
          setPayOnlineButtonTitle(ePostBillResponse?.Bill?.[0]?.status === "PAID" ? "CS_BUTTON_PAY_ONLINE_NO_PENDING_PAYMENT" : "");
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
          console.log("Payment canceled or failed", taskNumber);
          return null;
        }
        const resfileStoreId = await DRISTIService.fetchBillFileStoreId({}, { billId: courtBillResponse?.Bill?.[0]?.id, tenantId });
        const fileStoreId = resfileStoreId?.Document?.fileStore;
        if (fileStoreId && ePostBillResponse?.Bill?.[0]?.status === "PAID") {
          await Promise.all([
            ordersService.customApiService(Urls.orders.pendingTask, {
              pendingTask: {
                name: orderType === "SUMMONS" ? "Show Summon-Warrant Status" : "Show Notice Status",
                entityType: paymentType.ORDER_MANAGELIFECYCLE,
                referenceId: hearingsData?.HearingList?.[0]?.hearingId,
                status: orderType === "SUMMONS" ? paymentType.SUMMON_WARRANT_STATUS : paymentType.NOTICE_STATUS,
                assignedTo: [],
                assignedRole: ["JUDGE_ROLE"],
                cnrNumber: filteredTasks?.[0]?.cnrNumber,
                filingNumber: filingNumber,
                caseId: caseDetails?.id,
                caseTitle: caseDetails?.caseTitle,
                isCompleted: false,
                stateSla: 3 * dayInMillisecond + todayDate,
                additionalDetails: {
                  hearingId: hearingsData?.list?.[0]?.hearingId,
                  partyIndex: orderType === "NOTICE" ? partyIndex : "",
                },
                tenantId,
              },
            }),
            ordersService.customApiService(Urls.orders.pendingTask, {
              pendingTask: {
                name: orderType === "SUMMONS" ? `MAKE_PAYMENT_FOR_SUMMONS_POST` : `MAKE_PAYMENT_FOR_NOTICE_POST`,
                entityType: paymentType.ASYNC_ORDER_SUBMISSION_MANAGELIFECYCLE,
                referenceId: `MANUAL_${taskNumber}`,
                status: paymentType.PAYMENT_PENDING_POST,
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
                  value: orderData?.list?.[0]?.orderNumber,
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

        history.push(`/${window?.contextPath}/citizen/home/post-payment-screen`, postPaymenScreenObj);
      } catch (error) {
        console.error(error);
      }
    };

    const onPayOnlineSBI = async () => {
      try {
        history.push(`/${window?.contextPath}/citizen/home/sbi-epost-payment`, {
          state: {
            billData: ePostBillResponse,
            serviceNumber: taskNumber,
            businessService: service,
            caseDetails: caseDetails,
            consumerCode: `${taskNumber}_POST_PROCESS`,
            orderData: orderData,
            partyIndex: partyIndex,
            filteredTasks: filteredTasks,
            filingNumber: filingNumber,
            isCourtBillPaid: courtBillResponse?.Bill?.[0]?.status === "PAID",
            hearingId: orderData?.list?.[0]?.hearingNumber,
            orderType: orderType,
          },
        });
      } catch (error) {
        console.error(error);
      }
    };
    return {
      "e-post": [
        {
          label: "Fee Type",
          amount: "Amount",
          action: "Actions",
        },
        {
          label: "Court Fees",
          amount: courtFeeAmount,
          isCompleted: courtBillResponse?.Bill?.[0]?.status === "PAID",
          action: "Pay Online",
          onClick: onPayOnline,
        },
        {
          label: "Delivery Partner Fee",
          amount: deliveryPartnerFeeAmount,
          isCompleted: ePostBillResponse?.Bill?.[0]?.status === "PAID",
          action: "Pay Online",
          onClick: onPayOnlineSBI,
        },
      ],
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
    filteredTasks,
    courtFeeAmount,
    courtBillResponse,
    deliveryPartnerFeeAmount,
    ePostBillResponse,
    openPaymentPortal,
    tenantId,
    mockSubmitModalInfo,
    caseDetails,
    orderData,
    taskNumber,
    history,
    orderType,
    hearingsData?.HearingList,
    hearingsData?.list,
    filingNumber,
    dayInMillisecond,
    todayDate,
    service,
  ]);

  const infos = useMemo(() => {
    const name = filteredTasks?.[0]?.taskDetails?.respondentDetails?.name;
    const addressDetails = filteredTasks?.[0]?.taskDetails?.respondentDetails?.address;
    const formattedAddress =
      typeof addressDetails === "object"
        ? `${addressDetails?.locality || ""}, ${addressDetails?.city || ""}, ${addressDetails?.district || ""}, ${addressDetails?.state || ""}, ${
            addressDetails?.pincode || ""
          }`
        : addressDetails;
    return [
      { key: "Issued to", value: name },
      { key: "Next Hearing Date", value: formatDate(new Date(hearingsData?.HearingList?.[0]?.startTime), "DD-MM-YYYY") },
      {
        key: "Delivery Channel",
        value: `Post (${formattedAddress})`,
      },
    ];
  }, [filteredTasks, hearingsData?.HearingList]);

  const orderDate = useMemo(() => {
    return hearingsData?.HearingList?.[0]?.startTime;
  }, [hearingsData?.HearingList]);

  const links = useMemo(() => {
    const onViewOrderClick = () => {
      history.push(
        `/${window.contextPath}/citizen/dristi/home/view-case?caseId=${caseData?.criteria?.[0]?.responseList?.[0]?.id}&filingNumber=${filingNumber}&tab=Orders`
      );
    };
    return [{ text: "View order", link: "", onClick: onViewOrderClick }];
  }, [caseData?.criteria, filingNumber, history]);

  const paymentForSummonModalConfig = useMemo(() => {
    const handleClose = () => {
      if (paymentLoader === false) {
        history.goBack();
      }
    };

    return {
      handleClose: handleClose,
      heading: { label: `Payment for ${orderType === "SUMMONS" ? "Summons" : "Notice"} via post` },
      isStepperModal: false,
      isCaseLocked: isCaseLocked,
      payOnlineButtonTitle: payOnlineButtonTitle,
      modalBody: (
        <PaymentForSummonComponent
          infos={infos}
          links={links}
          feeOptions={feeOptions}
          orderDate={orderDate}
          paymentLoader={paymentLoader}
          isCaseAdmitted={isCaseAdmitted}
          orderType={orderType}
          isUserAdv={isUserAdv}
          isCaseLocked={isCaseLocked}
          payOnlineButtonTitle={payOnlineButtonTitle}
        />
      ),
    };
  }, [feeOptions, history, infos, isCaseAdmitted, links, orderDate, orderType, paymentLoader, isUserAdv]);

  if (isOrdersLoading || isSummonsBreakUpLoading || isCourtBillLoading || isEPOSTBillLoading || isTaskLoading || isHearingLoading) {
    return <Loader />;
  }

  return <DocumentModal config={paymentForSummonModalConfig} />;
};

export default PaymentForSummonModal;
