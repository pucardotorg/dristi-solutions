import { Loader, Button } from "@egovernments/digit-ui-react-components";
import React, { useEffect, useMemo, useState } from "react";
import CustomToast from "@egovernments/digit-ui-module-dristi/src/components/CustomToast";
import { DRISTIService } from "@egovernments/digit-ui-module-dristi/src/services";
import usePaymentProcess from "../hooks/usePaymentProcess";
import { useTranslation } from "react-i18next";
import useDownloadCasePdf from "@egovernments/digit-ui-module-dristi/src/hooks/dristi/useDownloadCasePdf";
import { getFormattedName } from "@egovernments/digit-ui-module-orders/src/utils";
import { InfoCard } from "@egovernments/digit-ui-components";
import { PrintIcon } from "@egovernments/digit-ui-module-dristi/src/icons/svgIndex";
import CustomChip from "@egovernments/digit-ui-module-dristi/src/components/CustomChip";

function NoticeSummonPaymentModal({ suffix, setHideCancelButton, formDataKey, taskManagementList, courierOrderDetails, setIsPaymentCompleted }) {
  const { t } = useTranslation();
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const scenario = "EfillingCase";
  const path = "";
  const [showToast, setShowToast] = useState(null);
  const [isCaseLocked, setIsCaseLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [calculationResponse, setCalculationResponse] = useState(null);
  const { downloadPdf } = useDownloadCasePdf();
  const [receiptFilstoreId, setReceiptFilstoreId] = useState(null);
  const [retryPayment, setRetryPayment] = useState(false);

  const taskManagement = useMemo(() => taskManagementList?.find((task) => task?.taskType === courierOrderDetails?.orderType), [
    taskManagementList,
    courierOrderDetails,
  ]);

  const accusedNameList = useMemo(() => {
    const partyList = courierOrderDetails?.additionalDetails?.formdata?.[formDataKey]?.party || [];
    const names = partyList?.map((party) =>
      getFormattedName(party?.data?.firstName, party?.data?.middleName, party?.data?.lastName, party?.data?.witnessDesignation, null)
    );
    return names?.join(", ");
  }, [formDataKey, courierOrderDetails]);

  const nextHearingDate = useMemo(() => {
    const nextHearingDate = courierOrderDetails?.additionalDetails?.formdata?.dateForHearing;
    return new Date(nextHearingDate)?.toLocaleDateString("en-GB")?.replace(/\//g, "-");
  }, [courierOrderDetails]);

  const deliveryChannelsList = useMemo(() => {
    if (!taskManagement?.partyDetails?.length) return [];
    const channelMap = {};
    taskManagement?.partyDetails?.forEach((party) => {
      const person = party?.respondentDetails || party?.witnessDetails || {};
      const fullName = getFormattedName(person?.firstName, person?.middleName, person?.lastName, person?.witnessDesignation, null);

      party?.deliveryChannels?.forEach((channel) => {
        const code = channel?.channelCode;
        if (!code) return;
        if (!channelMap[code]) channelMap[code] = [];
        channelMap[code]?.push(fullName);
      });
    });
    return Object.entries(channelMap).map(([code, names]) => `${t(code)} (${names?.join(", ")})`);
  }, [t, taskManagement]);

  useEffect(() => {
    const fetchCalculation = async () => {
      if (taskManagement?.taskManagementNumber && suffix) {
        setIsLoading(true);
        try {
          const response = await DRISTIService.getTreasuryPaymentBreakup(
            { tenantId: tenantId },
            {
              consumerCode: taskManagement?.taskManagementNumber + `_${suffix}`,
            },
            "dristi",
            true
          );
          setCalculationResponse(response?.TreasuryHeadMapping?.calculation);
        } catch (error) {
          console.error("Error fetching payment calculation:", error);
          const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
          setShowToast({ label: t("CS_PAYMENT_CALCULATION_ERROR"), error: true, errorId });
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchCalculation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, suffix, taskManagement?.taskManagementNumber]);

  const totalAmount = useMemo(() => {
    const totalAmount = calculationResponse?.totalAmount || 0;
    return parseFloat(totalAmount)?.toFixed(2);
  }, [calculationResponse]);

  const paymentCalculation = useMemo(() => {
    const breakdown = calculationResponse?.breakDown || [];
    const updatedCalculation = breakdown?.map((item) => ({
      key: item?.type,
      value: item?.amount,
      currency: "Rs",
    }));

    updatedCalculation?.push({
      key: t("CS_TASK_FEES"),
      value: totalAmount,
      currency: "Rs",
      isTotalFee: true,
    });

    return updatedCalculation;
  }, [t, calculationResponse, totalAmount]);

  const { fetchBill, openPaymentPortal } = usePaymentProcess({
    tenantId,
    consumerCode: taskManagement?.taskManagementNumber + `_${suffix}`,
    service: "task-management-payment",
    path,
    caseDetails: {},
    totalAmount: totalAmount,
    scenario,
  });

  useEffect(() => {
    if (taskManagement?.taskManagementNumber) {
      const fetchCaseLockStatus = async () => {
        try {
          const status = await DRISTIService.getCaseLockStatus(
            {},
            {
              uniqueId: taskManagement?.taskManagementNumber,
              tenantId: tenantId,
            }
          );
          setIsCaseLocked(status?.Lock?.isLocked);
        } catch (error) {
          console.error("Error fetching case lock status", error);
          const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
          setShowToast({ label: t("CS_CASE_LOCK_STATUS_ERROR"), error: true, errorId });
        }
      };
      fetchCaseLockStatus();
    }
  }, [taskManagement, tenantId]);

  const onTaskPayOnline = async () => {
    try {
      setIsLoading(true);
      const bill = await fetchBill(taskManagement?.taskManagementNumber + `_${suffix}`, tenantId, "task-management-payment");
      if (!bill?.Bill?.length) {
        setShowToast({ label: t("CS_NO_PENDING_PAYMENT"), error: false });
        setIsCaseLocked(true);
        return;
      }
      const caseLockStatus = await DRISTIService.getCaseLockStatus(
        {},
        {
          uniqueId: taskManagement?.taskManagementNumber,
          tenantId: tenantId,
        }
      );
      if (caseLockStatus?.Lock?.isLocked) {
        setIsCaseLocked(true);
        setShowToast({ label: t("CS_CASE_LOCKED_BY_ANOTHER_USER"), error: false });
        return;
      }
      await DRISTIService.setCaseLock({ Lock: { uniqueId: taskManagement?.taskManagementNumber, tenantId: tenantId, lockType: "PAYMENT" } }, {});
      const paymentStatus = await openPaymentPortal(bill);
      await DRISTIService.setCaseUnlock({}, { uniqueId: taskManagement?.taskManagementNumber, tenantId: tenantId });
      const success = Boolean(paymentStatus);
      if (success) {
        const response = await DRISTIService.fetchBillFileStoreId({}, { billId: bill?.Bill?.[0]?.id, tenantId });
        const fileStoreId = response?.Document?.fileStore;
        if (fileStoreId) {
          setReceiptFilstoreId(fileStoreId);
          setIsPaymentCompleted(true);
          setHideCancelButton(true);
        }
      } else {
        setRetryPayment(true);
      }
    } catch (error) {
      const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
      setShowToast({ label: t("CS_PAYMENT_ERROR"), error: true, errorId });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="task-payment-loader">
        <Loader />
      </div>
    );
  }

  return (
    <div className="task-payment-due-wrapper">
      <InfoCard
        variant={"default"}
        label={t("CS_IMPORTANT_INFORMATION")}
        additionalElements={[
          <div className="info-card-content">
            <ul style={{ width: "100%" }}>
              <li>
                <span>{t("CS_TASK_ISSUED_TO")}: </span>
                <span>{accusedNameList}</span>
              </li>
              <li>
                <span>{t("CS_TASK_NEXT_HEARING_DATE")}:</span>
                <span>{nextHearingDate}</span>
              </li>
              <li>
                <span>{t("CS_TASK_DELIVERY_CHANNEL")}:</span>
                <span className="delivery-channel-list">
                  {deliveryChannelsList?.map((line, index) => (
                    <p key={index}>{line}</p>
                  ))}
                </span>
              </li>
            </ul>
          </div>,
        ]}
        inline
        className={"adhaar-verification-info-card"}
      />
      <div className="total-payment">
        {paymentCalculation
          ?.filter((item) => item?.isTotalFee)
          ?.map((item) => (
            <div className={`total-payment-item ${paymentCalculation?.length > 6 ? "has-many-items" : ""}`}>
              <span className="total-payment-label">
                {item?.key}{" "}
                <CustomChip
                  text={receiptFilstoreId ? t("CS_TASK_PAYMENT_DONE") : t("CS_TASK_PENDING")}
                  shade={receiptFilstoreId ? "green" : "orange"}
                  style={{ marginLeft: "6px", fontWeight: "500", padding: "5px 15px" }}
                />
              </span>
              <span className="total-payment-amount">
                {item?.currency} {parseFloat(item?.value)?.toFixed(2)}
              </span>
            </div>
          ))}
      </div>
      <div className="breakdown-payment">
        {paymentCalculation
          ?.filter((item) => !item.isTotalFee)
          ?.map((item) => (
            <div className="breakdown-payment-item">
              <span>{item?.key}</span>
              <span>
                {item?.currency} {parseFloat(item?.value)?.toFixed(2)}
              </span>
            </div>
          ))}
      </div>

      <Button
        label={receiptFilstoreId ? t("CS_TASK_DOWNLOAD_RECEIPT") : retryPayment ? t("CS_TASK_RETRY_PAYMENT") : t("CS_TASK_PAY_ONLINE")}
        variation="secondary"
        className={"pay-online-button"}
        icon={receiptFilstoreId && <PrintIcon />}
        onButtonClick={receiptFilstoreId ? () => downloadPdf(tenantId, receiptFilstoreId) : onTaskPayOnline}
        isDisabled={isCaseLocked}
      />
      {showToast && (
        <CustomToast
          error={showToast?.error}
          label={showToast?.label}
          errorId={showToast?.errorId}
          onClose={() => setShowToast(null)}
          duration={showToast?.errorId ? 7000 : 5000}
        />
      )}
    </div>
  );
}

export default NoticeSummonPaymentModal;
