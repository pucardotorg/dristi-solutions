import { Button, CloseSvg, Loader, Toast } from "@egovernments/digit-ui-react-components";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { InfoCard } from "@egovernments/digit-ui-components";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import useSearchCaseService from "@egovernments/digit-ui-module-dristi/src/hooks/dristi/useSearchCaseService";
import { useToast } from "@egovernments/digit-ui-module-dristi/src/components/Toast/useToast";
import { DRISTIService } from "@egovernments/digit-ui-module-dristi/src/services";
import usePaymentProcess from "../hooks/usePaymentProcess";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom/cjs/react-router-dom.min";
import { Urls } from "@egovernments/digit-ui-module-dristi/src/hooks";
import { getSuffixByBusinessCode } from "../utils";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import CustomChip from "@egovernments/digit-ui-module-dristi/src/components/CustomChip";
import useDownloadCasePdf from "@egovernments/digit-ui-module-dristi/src/hooks/dristi/useDownloadCasePdf";
import { PrintIcon } from "@egovernments/digit-ui-module-dristi/src/icons/svgIndex";
const CloseBtn = (props) => {
  return (
    <div onClick={props?.onClick} style={{ height: "100%", display: "flex", alignItems: "center", paddingRight: "20px", cursor: "pointer" }}>
      <CloseSvg />
    </div>
  );
};

const Heading = (props) => {
  return <h1 className="heading-m">{props.label}</h1>;
};

function EfilingPaymentBreakdown({ setShowModal, header, subHeader }) {
  const { t } = useTranslation();
  const location = useLocation();
  const history = useHistory();
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const params = location?.state.state.params;
  const caseId = params?.caseId;
  const toast = useToast();
  const scenario = "EfillingCase";
  const path = "";
  const [toastMsg, setToastMsg] = useState(null);
  const [isCaseLocked, setIsCaseLocked] = useState(false);
  const { downloadPdf } = useDownloadCasePdf();
  const [receiptFilstoreId, setReceiptFilstoreId] = useState(null);
  const [retryPayment, setRetryPayment] = useState(false);
  const [loader, setLoader] = useState(false);
  const { triggerSurvey, SurveyUI } = Digit.Hooks.dristi.useSurveyManager({ tenantId: tenantId });
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

  const { data: caseData, isLoading } = useSearchCaseService(
    {
      criteria: [
        {
          caseId: caseId,
        },
      ],
      tenantId,
    },
    {},
    `dristi-${caseId}`,
    caseId,
    Boolean(caseId)
  );

  const caseDetails = useMemo(
    () => ({
      ...caseData?.criteria?.[0]?.responseList?.[0],
    }),
    [caseData]
  );

  const suffix = useMemo(() => getSuffixByBusinessCode(paymentTypeData, "case-default"), [paymentTypeData]);
  const [calculationResponse, setCalculationResponse] = useState(null);
  const [ispaymentLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCalculation = async () => {
      if (caseDetails?.filingNumber && suffix) {
        setIsLoading(true);
        try {
          const response = await DRISTIService.getTreasuryPaymentBreakup(
            { tenantId: tenantId },
            {
              consumerCode: caseDetails?.additionalDetails?.lastSubmissionConsumerCode
                ? caseDetails?.additionalDetails?.lastSubmissionConsumerCode
                : caseDetails?.filingNumber + `_${suffix}`,
            },
            "dristi",
            true
          );
          setCalculationResponse({ Calculation: [response?.TreasuryHeadMapping?.calculation] });
        } catch (error) {
          console.error("Error fetching payment calculation:", error);
          toast.error(t("CS_PAYMENT_CALCULATION_ERROR"));
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchCalculation();
  }, [tenantId, caseDetails, suffix]);

  const totalAmount = useMemo(() => {
    const totalAmount = calculationResponse?.Calculation?.[0]?.totalAmount || 0;
    return parseFloat(totalAmount).toFixed(2);
  }, [calculationResponse?.Calculation]);

  const paymentCalculation = useMemo(() => {
    const breakdown = calculationResponse?.Calculation?.[0]?.breakDown || [];
    const updatedCalculation = breakdown.map((item) => ({
      key: item?.type,
      value: item?.amount,
      currency: "Rs",
    }));

    updatedCalculation.push({
      key: "Total amount",
      value: totalAmount,
      currency: "Rs",
      isTotalFee: true,
    });

    return updatedCalculation;
  }, [calculationResponse?.Calculation, totalAmount]);

  const { fetchBill, openPaymentPortal, paymentLoader, setShowPaymentModal } = usePaymentProcess({
    tenantId,
    consumerCode: caseDetails?.additionalDetails?.lastSubmissionConsumerCode
      ? caseDetails?.additionalDetails?.lastSubmissionConsumerCode
      : caseDetails?.filingNumber + `_${suffix}`,
    service: "case-default",
    path,
    caseDetails,
    totalAmount: totalAmount,
    scenario,
  });

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

  const triggerSurveyContext = caseDetails?.status === "PENDING_PAYMENT" ? "FILING_PAYMENT" : "DEFECT_CORRECTION_PAYMENT";
  const onCancel = () => {
    if (!paymentLoader) {
      if (receiptFilstoreId) {
        triggerSurvey(triggerSurveyContext, () => {
          history.goBack();
          setShowPaymentModal(false);
        });
      } else {
        history.goBack();
        setShowPaymentModal(false);
      }
    }
  };

  useEffect(() => {
    if (caseDetails?.filingNumber) {
      fetchCaseLockStatus();
    }
  }, [caseDetails?.filingNumber]);

  const onTaskPayOnline = async () => {
    try {
      setLoader(true);
      const bill = await fetchBill(
        caseDetails?.additionalDetails?.lastSubmissionConsumerCode
          ? caseDetails?.additionalDetails?.lastSubmissionConsumerCode
          : caseDetails?.filingNumber + `_${suffix}`,
        tenantId,
        "case-default"
      );
      if (!bill?.Bill?.length) {
        showToast("success", t("CS_NO_PENDING_PAYMENT"), 5000);
        setIsCaseLocked(true);
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
        showToast("success", t("CS_CASE_LOCKED_BY_ANOTHER_USER"), 5000);
        return;
      }

      await DRISTIService.setCaseLock({ Lock: { uniqueId: caseDetails?.filingNumber, tenantId: tenantId, lockType: "PAYMENT" } }, {});

      const paymentStatus = await openPaymentPortal(bill);
      await DRISTIService.setCaseUnlock({}, { uniqueId: caseDetails?.filingNumber, tenantId: tenantId });
      const success = Boolean(paymentStatus);

      if (success) {
        await DRISTIService.customApiService(Urls.dristi.pendingTask, {
          pendingTask: {
            name: "Pending Payment",
            entityType: "case-default",
            referenceId: `MANUAL_${caseDetails?.filingNumber}`,
            status: "PENDING_PAYMENT",
            cnrNumber: caseDetails?.cnrNumber,
            filingNumber: caseDetails?.filingNumber,
            caseId: caseDetails?.id,
            caseTitle: caseDetails?.caseTitle,
            isCompleted: true,
            stateSla: null,
            additionalDetails: {},
            tenantId,
          },
        });
        const response = await DRISTIService.fetchBillFileStoreId({}, { billId: bill?.Bill?.[0]?.id, tenantId });
        const fileStoreId = response?.Document?.fileStore;
        if (fileStoreId) {
          setReceiptFilstoreId(fileStoreId);
        }
      } else {
        setRetryPayment(true);
      }
    } catch (error) {
      toast.error(t("CS_PAYMENT_ERROR"));
      console.error(error);
    } finally {
      setLoader(false);
    }
  };

  if (isLoading || ispaymentLoading || isPaymentTypeLoading || loader) {
    return <Loader />;
  }
  const showToast = (type, message, duration = 5000) => {
    setToastMsg({ key: type, action: message });
    setTimeout(() => {
      setToastMsg(null);
    }, duration);
  };
  return (
    <div className="e-filing-payment">
      <Modal headerBarEnd={<CloseBtn onClick={onCancel} />} formId="modal-action" headerBarMain={<Heading label={t("PENDING_PAYMENT")} />}>
        <div className="payment-wrapper">
          <InfoCard
            variant={"default"}
            label={t("CS_IMPORTANT_INFORMATION")}
            additionalElements={[
              <div className="info-card-content">
                <ul style={{ width: "100%" }}>
                  <li>
                    <span>{t("PLEASE_ALLOW_POPUP_PAYMENT")}</span>
                  </li>
                  <li>
                    <span>{t("CS_OFFLINE_PAYMENT_STEP_TEXT")}</span>
                  </li>
                  <li>
                    <span>{t("COURIER_RPAD_NOTE")}</span>
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
            isDisabled={paymentLoader || isCaseLocked}
          />
        </div>
        {toastMsg && (
          <Toast error={toastMsg.key === "error"} label={t(toastMsg.action)} onClose={() => setToastMsg(null)} style={{ maxWidth: "500px" }} />
        )}
      </Modal>
      {SurveyUI}
    </div>
  );
}

export default EfilingPaymentBreakdown;
