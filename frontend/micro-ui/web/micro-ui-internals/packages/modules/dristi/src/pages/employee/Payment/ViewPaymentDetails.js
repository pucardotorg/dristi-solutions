import { Loader, SubmitBar, ActionBar, CustomDropdown, CardLabel, LabelFieldPair, TextInput } from "@egovernments/digit-ui-react-components";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { useToast } from "../../../components/Toast/useToast";
import { DRISTIService } from "../../../services";
import { Urls } from "../../../hooks";
import CustomCopyTextDiv from "../../../components/CustomCopyTextDiv";
import { extractFeeMedium, getFilteredPaymentData, getTaskType } from "../../../Utils";

const paymentTaskType = {
  TASK_SUMMON: "task-summons",
  TASK_NOTICE: "task-notice",
  TASK_WARRANT: "task-warrant",
  TASK_SUMMON_ADVANCE_CARRYFORWARD: "TASK_SUMMON_ADVANCE_CARRYFORWARD",
  TASK_NOTICE_ADVANCE_CARRYFORWARD: "TASK_NOTICE_ADVANCE_CARRYFORWARD",
  ORDER_MANAGELIFECYCLE: "order-default",
  SUMMON_WARRANT_STATUS: "SUMMON_WARRANT_STATUS",
  NOTICE_STATUS: "NOTICE_STATUS",
  ASYNC_ORDER_SUBMISSION_MANAGELIFECYCLE: "application-order-submission-default",
  PAYMENT_PENDING_POST: "PAYMENT_PENDING_POST",
  PAYMENT_PENDING_EMAIL: "PAYMENT_PENDING_EMAIL",
  PAYMENT_PENDING_SMS: "PAYMENT_PENDING_SMS",
};

const paymentOptionConfig = {
  label: "CS_MODE_OF_PAYMENT",
  type: "dropdown",
  name: "selectIdTypeType",
  optionsKey: "name",
  validation: {},
  isMandatory: true,
  mdmsConfig: {
    masterName: "OfflinePaymentMode",
    moduleName: "case",
    select: "(data) => { return data['case'].OfflinePaymentMode?.sort((a,b)=>a.name.localeCompare(b.name)).map(item => item); }",
  },
  styles: {
    width: "100%",
    maxWidth: "100%",
  },
};

const handleTaskSearch = async (businessService, consumerCodeWithoutSuffix, tenantId, courtId) => {
  if (["task-summons", "task-notice", "task-warrant", "task-payment", "task-generic"].includes(businessService)) {
    const {
      list: [tasksData],
    } = await Digit.HearingService.searchTaskList({
      criteria: {
        tenantId: tenantId,
        taskNumber: consumerCodeWithoutSuffix,
        courtId: courtId,
      },
    });
    return { tasksData };
  }
  return {};
};

const ViewPaymentDetails = ({ location, match }) => {
  const { t } = useTranslation();
  const todayDate = new Date().getTime();
  const dayInMillisecond = 24 * 3600 * 1000;
  const history = useHistory();
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const [payer, setPayer] = useState("");
  const [modeOfPayment, setModeOfPayment] = useState(null);
  const [additionDetails, setAdditionalDetails] = useState("");
  const toast = useToast();
  const [isDisabled, setIsDisabled] = useState(false);
  const {
    caseId,
    caseTitle,
    cmpNumber,
    courtCaseNumber,
    filingNumber,
    consumerCode,
    businessService,
    paymentType,
    courtId,
  } = window?.Digit.Hooks.useQueryParams();
  const ordersService = Digit.ComponentRegistryService.getComponent("OrdersService") || {};

  const consumerCodeWithoutSuffix = consumerCode.split("_")[0];
  const [tasksData, setTasksData] = useState(null);
  const [genericTaskData, setGenericTaskData] = useState(null);
  const userInfo = window?.Digit?.UserService?.getUser()?.info;
  const roles = useMemo(() => userInfo?.roles, [userInfo]);
  const hasViewCollectOfflinePaymentsAccess = useMemo(() => roles?.some((role) => role?.code === "PAYMENT_COLLECTOR"), [roles]);
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo]);
  const isEpostUser = useMemo(() => roles?.some((role) => role?.code === "POST_MANAGER"), [roles]);
  let homePath = `/${window?.contextPath}/${userType}/home/home-pending-task`;
  if (!isEpostUser && userType === "employee") homePath = `/${window?.contextPath}/${userType}/home/home-screen`;

  useEffect(() => {
    const fetchTaskData = async () => {
      const { tasksData = {} } = await handleTaskSearch(businessService, consumerCodeWithoutSuffix, tenantId, courtId);
      if (businessService === "task-generic") setGenericTaskData(tasksData);
      else setTasksData(tasksData);
    };

    fetchTaskData();
  }, [businessService, consumerCode, consumerCodeWithoutSuffix, tenantId, courtId]);
  const summonsPincode = useMemo(() => tasksData?.taskDetails?.respondentDetails?.address?.pincode, [tasksData]);
  const channelId = useMemo(() => extractFeeMedium(tasksData?.taskDetails?.deliveryChannels?.channelName || ""), [tasksData]);

  const { data: paymentDetails, isLoading: isFetchBillLoading } = Digit.Hooks.useFetchBillsForBuissnessService(
    {
      tenantId: tenantId,
      consumerCode: consumerCode,
      businessService: businessService,
    },
    {
      enabled: Boolean(tenantId && consumerCode),
    }
  );
  const { data: BillResponse, isLoading: isBillLoading } = Digit.Hooks.dristi.useBillSearch(
    {},
    {
      tenantId,
      consumerCode,
      service: businessService,
    },
    `summons-warrant-notice-bill-${consumerCodeWithoutSuffix}-${paymentDetails?.Bill?.[0]?.billNumber}`,
    Boolean(businessService && consumerCode)
  );

  const demandBill = useMemo(() => BillResponse?.Bill?.[0]?.billDetails?.[0], [BillResponse]);

  const currentBillDetails = useMemo(() => BillResponse?.Bill?.[0], [BillResponse]);

  // Now Epost aslo have only one delivery partner bill so using the same code ( removed sbi payment then  no need to check for delivery partner bill )
  // const { data: ePostBillResponse, isLoading: isEPOSTBillLoading, refetch: epostBillRefetch } = Digit.Hooks.dristi.useBillSearch(
  //   {},
  //   {
  //     tenantId,
  //     consumerCode: `${consumerCodeWithoutSuffix}_POST_PROCESS_COURT`,
  //     service: businessService,
  //   },
  //   `${consumerCodeWithoutSuffix}_POST_PROCESS_COURT`,
  //   Boolean(consumerCodeWithoutSuffix && businessService)
  // );

  // const isDeliveryPartnerPaid = useMemo(() => (ePostBillResponse?.Bill?.[0]?.status ? ePostBillResponse?.Bill?.[0]?.status === "PAID" : true), [
  //   ePostBillResponse,
  // ]);

  // const { data: calculationResponse, isLoading: isPaymentLoading } = Digit.Hooks.dristi.usePaymentCalculator(
  //   {
  //     EFillingCalculationCriteria: [
  //       {
  //         checkAmount: demandBill?.additionalDetails?.chequeDetails?.totalAmount,
  //         numberOfApplication: 1,
  //         tenantId: tenantId,
  //         caseId: caseId,
  //         filingNumber: filingNumber,
  //         isDelayCondonation: !demandBill?.additionalDetails?.delayCondonation
  //           ? demandBill?.additionalDetails?.isDelayCondonation
  //           : Boolean(demandBill?.additionalDetails?.delayCondonation > 31 * 24 * 60 * 60 * 1000),
  //       },
  //     ],
  //   },
  //   {},
  //   "dristi",
  //   Boolean(
  //     demandBill?.additionalDetails?.chequeDetails?.totalAmount &&
  //       demandBill?.additionalDetails?.chequeDetails.totalAmount !== "0" &&
  //       paymentType?.toLowerCase()?.includes("case")
  //   )
  // );

  const [calculationResponse, setCalculationResponse] = useState(null);
  const [isPaymentLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCalculation = async () => {
      setIsLoading(true);
      if (
        consumerCode &&
        ((demandBill?.additionalDetails?.chequeDetails?.totalAmount &&
          demandBill?.additionalDetails?.chequeDetails?.totalAmount !== "0" &&
          paymentType?.toLowerCase()?.includes("case")) ||
          (paymentType?.toLowerCase()?.includes("task") && businessService === "task-management-payment"))
      ) {
        try {
          const response = await DRISTIService.getTreasuryPaymentBreakup(
            { tenantId: tenantId },
            {
              consumerCode: consumerCode,
            },
            "dristi",
            true
          );
          setCalculationResponse({ Calculation: [response?.TreasuryHeadMapping?.calculation] });
        } catch (error) {
          console.error("Error fetching payment calculation:", error);
          toast.error(t("CS_PAYMENT_CALCULATION_ERROR"));
        }
      }
      setIsLoading(false);
    };

    fetchCalculation();
  }, [consumerCode, demandBill?.additionalDetails?.chequeDetails?.totalAmount, paymentType, tenantId]);

  const { data: breakupResponse, isLoading: isSummonsBreakUpLoading } = Digit.Hooks.dristi.useSummonsPaymentBreakUp(
    {
      Criteria: [
        {
          channelId: channelId,
          receiverPincode: summonsPincode,
          tenantId: tenantId,
          Id: consumerCodeWithoutSuffix,
          taskType: getTaskType(businessService),
        },
      ],
    },
    {},
    "dristi" + channelId,
    Boolean(!paymentType?.toLowerCase()?.includes("application") && !paymentType?.toLowerCase()?.includes("case") && tasksData && channelId)
  );
  // const courtFeeBreakup = useMemo(() => breakupResponse?.Calculation?.[0]?.breakDown?.filter((data) => data?.type === "Court Fee"), [
  //   breakupResponse?.Calculation,
  // ]);
  // const processFeeBreakup = useMemo(() => breakupResponse?.Calculation?.[0]?.breakDown?.filter((data) => data?.type !== "Court Fee"), [
  //   breakupResponse?.Calculation,
  // ]);

  const feeBreakUpResponse = useMemo(() => breakupResponse?.Calculation?.[0]?.breakDown, [breakupResponse?.Calculation]);
  const totalAmount = useMemo(() => {
    const totalAmount = calculationResponse?.Calculation?.[0]?.totalAmount || currentBillDetails?.totalAmount || 0;
    return parseFloat(totalAmount).toFixed(2);
  }, [calculationResponse?.Calculation, currentBillDetails]);

  const paymentCalculation = useMemo(() => {
    if (paymentType === "Join Case Advocate Fee" && !tasksData?.taskDetails?.paymentBreakdown) return [];
    if (paymentType === "Generic Task Fees" && !genericTaskData?.taskDetails?.genericTaskDetails?.feeBreakDown?.breakDown) return [];
    const breakdown =
      paymentType === "Generic Task Fees"
        ? genericTaskData?.taskDetails?.genericTaskDetails?.feeBreakDown?.breakDown || []
        : paymentType === "Join Case Advocate Fee"
        ? tasksData?.taskDetails?.paymentBreakdown
        : calculationResponse?.Calculation?.[0]?.breakDown || feeBreakUpResponse || [];
    const updatedCalculation = breakdown?.map((item) => ({
      key: item?.type || item?.code,
      value: item?.amount,
      currency: "Rs",
    }));

    updatedCalculation.push({
      key: "TOTAL_AMOUNT",
      value: totalAmount,
      currency: "Rs",
      isTotalFee: true,
    });

    return updatedCalculation;
  }, [
    calculationResponse?.Calculation,
    paymentType,
    feeBreakUpResponse,
    tasksData?.taskDetails?.paymentBreakdown,
    totalAmount,
    genericTaskData?.taskDetails?.genericTaskDetails?.feeBreakDown,
  ]);
  const payerName = useMemo(() => demandBill?.additionalDetails?.payer, [demandBill?.additionalDetails?.payer]);
  const bill = paymentDetails?.Bill ? paymentDetails?.Bill[0] : null;

  const onSubmitCase = async () => {
    const consumerCodeWithoutSuffix = consumerCode.split("_")[0];
    let taskFilingNumber = "";
    let taskHearingNumber = "";
    let taskOrderType = "";
    let taskPartyIndex = "";
    if (["task-notice", "task-summons", "task-warrant"].includes(businessService)) {
      const {
        list: [orderDetails],
      } = await ordersService.searchOrder({
        criteria: {
          tenantId: tenantId,
          id: tasksData?.orderId,
          courtId: tasksData?.courtId,
        },
      });

      taskHearingNumber = orderDetails?.scheduledHearingNumber || orderDetails?.hearingNumber || "";
      const compositeItem = orderDetails?.compositeItems?.find((item) => item?.id === tasksData?.additionalDetails?.itemId) || {};
      taskOrderType = compositeItem?.orderType || orderDetails?.orderType || "";
      // if (taskOrderType === "NOTICE") {
      //   const noticeOrder =
      //     orderDetails?.orderCategory === "COMPOSITE"
      //       ? compositeItem?.orderSchema?.additionalDetails?.formdata?.noticeOrder
      //       : orderDetails?.additionalDetails?.formdata?.noticeOrder;
      //   taskPartyIndex = noticeOrder?.party?.data?.partyIndex;
      // }
      taskFilingNumber = tasksData?.filingNumber || demandBill?.additionalDetails?.filingNumber;
    }

    const referenceId = consumerCodeWithoutSuffix;
    setIsDisabled(true);
    const regenerateBill = await DRISTIService.callFetchBill({}, { consumerCode: consumerCode, tenantId, businessService: businessService });
    const billFetched = regenerateBill?.Bill ? regenerateBill?.Bill[0] : {};
    if (!Object.keys(bill || regenerateBill || {}).length) {
      toast.error(t("CS_BILL_NOT_AVAILABLE"));
      return;
    }
    try {
      const receiptData = await window?.Digit.PaymentService.createReciept(tenantId, {
        Payment: {
          paymentDetails: [
            {
              businessService: businessService,
              billId: billFetched.id,
              totalDue: billFetched.totalAmount,
              totalAmountPaid: billFetched.totalAmount,
            },
          ],
          tenantId,
          paymentMode: modeOfPayment.code,
          paidBy: "PAY_BY_OWNER",
          mobileNumber: demandBill?.additionalDetails?.payerMobileNo || "",
          payerName: payer || payerName,
          totalAmountPaid: billFetched.totalAmount || totalAmount,
          instrumentNumber: additionDetails,
          instrumentDate: new Date().getTime(),
        },
      });

      // remove additional condition (isDeliveryPartnerPaid && businessService !== "task-generic" ) as now epost also have only one delivery partner bill
      if (businessService !== "task-generic") {
        await DRISTIService.customApiService(Urls.dristi.pendingTask, {
          pendingTask: {
            name: "Pending Payment",
            entityType: businessService,
            referenceId: `MANUAL_${referenceId}`,
            status: "PENDING_PAYMENT",
            cnrNumber: demandBill?.additionalDetails?.cnrNumber,
            filingNumber: demandBill?.additionalDetails?.filingNumber || taskFilingNumber,
            caseId: caseId,
            caseTitle: caseTitle,
            isCompleted: true,
            stateSla: null,
            additionalDetails: {},
            tenantId,
          },
        });
      }

      // removal of additional condition (["task-notice", "task-summons", "task-warrant"].includes(businessService) && isDeliveryPartnerPaid ) as now epost also have only one delivery partner bill
      if (["task-notice", "task-summons", "task-warrant"].includes(businessService)) {
        await DRISTIService.customApiService(Urls.dristi.pendingTask, {
          pendingTask: {
            name: taskOrderType === "SUMMONS" ? "Show Summon-Warrant Status" : "Show Notice Status",
            entityType: paymentTaskType.ORDER_MANAGELIFECYCLE,
            referenceId: taskHearingNumber,
            status: taskOrderType === "SUMMONS" ? paymentTaskType.SUMMON_WARRANT_STATUS : paymentTaskType.NOTICE_STATUS,
            assignedTo: [],
            assignedRole: [taskOrderType === "SUMMONS" ? "PENDING_TASK_SHOW_SUMMON_WARRANT" : "PENDING_TASK_SHOW_NOTICE_STATUS"],
            cnrNumber: demandBill?.additionalDetails?.cnrNumber,
            filingNumber: filingNumber,
            caseId: caseId,
            caseTitle: caseTitle,
            isCompleted: false,
            stateSla: 3 * dayInMillisecond + todayDate,
            additionalDetails: {
              hearingId: taskHearingNumber,
              partyIndex: taskPartyIndex,
            },
            tenantId,
          },
        });
      }
      history.push(`/${window?.contextPath}/employee/dristi/pending-payment-inbox/response`, {
        state: {
          success: true,
          receiptData: {
            caseInfo: [
              {
                key: "Mode of Payment",
                value: receiptData?.Payments?.[0]?.paymentMode,
                copyData: false,
              },
              {
                key: "Amount",
                value: receiptData?.Payments?.[0]?.totalAmountPaid,
                copyData: false,
              },
              {
                key: "Transaction ID",
                value: receiptData?.Payments?.[0]?.transactionNumber,
                copyData: true,
              },
            ],
            isArrow: false,
            showTable: true,
            showCopytext: true,
          },
          amount: totalAmount,
          fileStoreId: "c162c182-103f-463e-99b6-18654ed7a5b1",
        },
      });
      setIsDisabled(false);
    } catch (err) {
      history.push(`/${window?.contextPath}/employee/dristi/pending-payment-inbox/response`, {
        state: { success: false, amount: totalAmount },
      });
      setIsDisabled(false);
    }
  };

  const isValidValue = (value) => value !== null && value !== undefined && value !== "" && value !== "null" && value !== "undefined";

  const orderModalInfo = useMemo(
    () => ({
      caseInfo: [
        {
          key: t("CASE_NUMBER"),
          value: isValidValue(courtCaseNumber) ? courtCaseNumber : isValidValue(cmpNumber) ? cmpNumber : filingNumber,
          copyData: false,
        },
        {
          key: t("CASE_TITLE_PAYMENT"),
          value: caseTitle,
          copyData: false,
        },
        {
          key: t("NYAY_PAYMENT_TYPE"),
          value: paymentType,
          copyData: false,
        },
      ],
    }),
    [caseTitle, cmpNumber, courtCaseNumber, filingNumber, paymentType, t]
  );

  if (!hasViewCollectOfflinePaymentsAccess) {
    history.push(homePath);
  }

  if (isFetchBillLoading || isPaymentLoading || isBillLoading || isSummonsBreakUpLoading) {
    return <Loader />;
  }
  return (
    <React.Fragment>
      <div className="home-screen-wrapper" style={{ minHeight: "calc(100vh - 90px)", width: "100%", padding: "30px" }}>
        <div className="header-class" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div className="header">{t("CS_RECORD_PAYMENT_HEADER_TEXT")}</div>
          <div className="sub-header">{t("CS_RECORD_PAYMENT_SUBHEADER_TEXT")}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "row-reverse", gap: 40, justifyContent: "space-between", width: "100%" }}>
          <div className="payment-calculator-wrapper" style={{ width: "33%" }}>
            {getFilteredPaymentData(paymentType, paymentCalculation, bill)?.map((item) => (
              <div
                key={item.key}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderTop: item.isTotalFee && "1px solid #BBBBBD",
                  paddingTop: item.isTotalFee && "20px",
                }}
              >
                <span>{t(item.key)}</span>
                <span>
                  {item.currency} {parseFloat(item.value).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div style={{ width: "63%" }}>
            <div>
              {/* {`${t("CS_CASE_ID")}: ${caseDetails?.filingNumber}`} */}
              <CustomCopyTextDiv
                t={t}
                keyStyle={{ margin: "8px 0px" }}
                valueStyle={{ margin: "8px 0px", fontWeight: 700 }}
                data={orderModalInfo?.caseInfo}
              />
            </div>
            <div className="payment-case-detail-wrapper" style={{ maxHeight: "350px" }}>
              <LabelFieldPair>
                <CardLabel>{`${t("CORE_COMMON_PAYER")}`}</CardLabel>
                <TextInput
                  t={t}
                  style={{ width: "100%" }}
                  textInputStyle={{ width: "100%", maxWidth: "100%" }}
                  type={"text"}
                  isMandatory={false}
                  name="name"
                  disable={true}
                  value={payerName}
                  onChange={(e) => {
                    const { value } = e.target;
                    let updatedValue = value
                      .replace(/[^a-zA-Z\s]/g, "")
                      .trimStart()
                      .replace(/ +/g, " ")
                      .toLowerCase()
                      .replace(/\b\w/g, (char) => char.toUpperCase());
                    setPayer(updatedValue);
                  }}
                />
              </LabelFieldPair>
              <LabelFieldPair style={{ alignItems: "flex-start", fontSize: "16px", fontWeight: 400 }}>
                <CardLabel>{t(paymentOptionConfig.label)}</CardLabel>
                <CustomDropdown
                  label={paymentOptionConfig.label}
                  t={t}
                  onChange={(e) => {
                    setModeOfPayment(e);
                    setAdditionalDetails("");
                  }}
                  value={modeOfPayment}
                  config={paymentOptionConfig}
                ></CustomDropdown>
              </LabelFieldPair>
              {(modeOfPayment?.code === "CHEQUE" || modeOfPayment?.code === "DD") && (
                <LabelFieldPair style={{ alignItems: "flex-start", fontSize: "16px", fontWeight: 400 }}>
                  <CardLabel>{t(modeOfPayment?.code === "CHEQUE" ? t("Cheque number") : t("Demand Draft number"))}</CardLabel>
                  <TextInput
                    t={t}
                    style={{ width: "50%" }}
                    type={"text"}
                    isMandatory={false}
                    name="name"
                    value={additionDetails}
                    onChange={(e) => {
                      const { value } = e.target;

                      let updatedValue = value?.replace(/\D/g, "");
                      if (updatedValue?.length > 6) {
                        updatedValue = updatedValue?.substring(0, 6);
                      }

                      setAdditionalDetails(updatedValue);
                    }}
                  />
                </LabelFieldPair>
              )}
            </div>
          </div>
        </div>
        <ActionBar>
          <SubmitBar
            label={t("CS_GENERATE_RECEIPT")}
            disabled={
              Object.keys(!modeOfPayment ? {} : modeOfPayment).length === 0 ||
              (["CHEQUE", "DD"].includes(modeOfPayment?.code) ? additionDetails.length !== 6 : false) ||
              isDisabled
            }
            onSubmit={() => {
              onSubmitCase();
            }}
          />
        </ActionBar>
      </div>
    </React.Fragment>
  );
};

export default ViewPaymentDetails;
