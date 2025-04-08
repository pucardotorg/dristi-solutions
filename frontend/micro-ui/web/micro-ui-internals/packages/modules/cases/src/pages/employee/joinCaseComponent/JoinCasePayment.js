import { InfoCard } from "@egovernments/digit-ui-components";
import ButtonSelector from "@egovernments/digit-ui-module-dristi/src/components/ButtonSelector";
import { useToast } from "@egovernments/digit-ui-module-dristi/src/components/Toast/useToast";
import { taskService } from "@egovernments/digit-ui-module-orders/src/hooks/services";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import usePaymentProcess from "../../../../../home/src/hooks/usePaymentProcess";

const JoinCasePayment = ({ filingNumber, taskNumber, setPendingTaskActionModals, refetch, type }) => {
  const { t } = useTranslation();

  const tenantId = useMemo(() => Digit.ULBService.getCurrentTenantId(), []);
  const toast = useToast();
  const [isApiCalled, setIsApiCalled] = useState(false);

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

  const { data: tasksData } = Digit.Hooks.hearings.useGetTaskList(
    {
      criteria: {
        tenantId: tenantId,
        taskNumber: taskNumber,
      },
    },
    {},
    taskNumber,
    Boolean(taskNumber)
  );

  const task = useMemo(() => tasksData?.list?.[0], [tasksData]);

  const caseDetails = useMemo(
    () => ({
      ...caseData?.criteria?.[0]?.responseList?.[0],
    }),
    [caseData]
  );

  const { paymentCalculation, totalAmount } = useMemo(() => {
    if (!task) return { paymentCalculation: [], totalAmount: "0" };
    const breakdown = task?.taskDetails?.paymentBreakdown || [];
    const updatedCalculation = breakdown.map((item) => ({
      key: item?.type,
      value: item?.amount,
      currency: "Rs",
    }));

    const totalAmount = updatedCalculation.reduce((sum, item) => sum + (item.value || 0), 0);

    updatedCalculation.push({
      key: "Total amount",
      value: totalAmount,
      currency: "Rs",
      isTotalFee: true,
    });

    return { paymentCalculation: updatedCalculation, totalAmount };
  }, [task]);

  const { fetchBill, openPaymentPortal, paymentLoader, showPaymentModal, setShowPaymentModal } = usePaymentProcess({
    tenantId,
    consumerCode: taskNumber + `_JOIN_CASE`,
    service: "task-payment",
    path: "",
    caseDetails,
    totalAmount: totalAmount,
    scenario: "join-case",
  });

  return (
    <div
      className="join-case-payment payment-due-wrapper"
      style={{ maxHeight: "550px", display: "flex", flexDirection: "column", margin: "13px 0px", paddingLeft: "24px" }}
    >
      <InfoCard
        variant={"default"}
        label={t("CS_COMMON_NOTE")}
        style={{ backgroundColor: "#ECF3FD", marginBottom: "8px" }}
        additionalElements={[
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span>{t("PLEASE_ALLOW_POPUP_PAYMENT")}</span>
          </div>,
        ]}
        inline
        textStyle={{}}
        className={"adhaar-verification-info-card"}
      />
      <div className="payment-due-text" style={{ fontSize: "18px" }}>
        {`${t("CS_DUE_PAYMENT")} `}
        <span style={{ fontWeight: 700 }}>Rs {totalAmount}/-.</span>
        {` ${t("CS_MANDATORY_STEP_TO_FILE_CASE")}`}
      </div>
      <div className="payment-calculator-wrapper" style={{ display: "flex", flexDirection: "column", maxHeight: "150px", overflowY: "auto" }}>
        {paymentCalculation
          .filter((item) => !item.isTotalFee)
          .map((item) => (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingRight: "16px",
              }}
            >
              <span>{item.key}</span>
              <span>
                {item.currency} {parseFloat(item.value).toFixed(2)}
              </span>
            </div>
          ))}
      </div>
      <div className="payment-calculator-wrapper" style={{ display: "flex", flexDirection: "column" }}>
        {paymentCalculation
          .filter((item) => item.isTotalFee)
          .map((item) => (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "1px solid #BBBBBD",
                fontSize: "16px",
                fontWeight: "700",
                paddingTop: "12px",
                paddingRight: paymentCalculation.length > 6 ? "28px" : "16px",
              }}
            >
              <span>{item.key}</span>
              <span>
                {item.currency} {parseFloat(item.value).toFixed(2)}
              </span>
            </div>
          ))}
      </div>
      <div>
        <InfoCard
          variant={"default"}
          label={t("CS_COMMON_NOTE")}
          style={{ backgroundColor: "#ECF3FD" }}
          additionalElements={[
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span>{t("CS_OFFLINE_PAYMENT_STEP_TEXT")}</span>
            </div>,
          ]}
          inline
          textStyle={{}}
          className={"adhaar-verification-info-card"}
        />
      </div>
      {type !== "join-case-flow" && (
        <div className="advocate-replacement-request-footer" style={{ justifyContent: "flex-end", marginBottom: "0px" }}>
          <ButtonSelector
            label={t("CS_PAY_ONLINE")}
            onSubmit={async () => {
              const bill = await fetchBill(taskNumber + "_JOIN_CASE", tenantId, "task-payment");
              const paymentStatus = await openPaymentPortal(bill, bill?.Bill?.[0]?.totalAmount);
              if (paymentStatus) {
                setPendingTaskActionModals((pendingTaskActionModals) => {
                  const data = pendingTaskActionModals?.data;
                  delete data.filingNumber;
                  delete data.taskNumber;
                  return {
                    ...pendingTaskActionModals,
                    joinCasePaymentModal: false,
                    data: data,
                  };
                });
              }
              refetch();
            }}
            className="advocate-replacement-request-submit-button"
            isDisabled={isApiCalled}
          />
        </div>
      )}
    </div>
  );
};

export default JoinCasePayment;
