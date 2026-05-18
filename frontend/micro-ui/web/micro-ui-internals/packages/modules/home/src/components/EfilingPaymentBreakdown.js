import { Loader } from "@egovernments/digit-ui-react-components";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import useSearchCaseService from "@egovernments/digit-ui-module-dristi/src/hooks/dristi/useSearchCaseService";
import { DRISTIService } from "@egovernments/digit-ui-module-dristi/src/services";
import usePaymentProcess from "../hooks/usePaymentProcess";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom/cjs/react-router-dom.min";
import { Urls } from "@egovernments/digit-ui-module-dristi/src/hooks";
import { getSuffixByBusinessCode } from "../utils";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import { EfilingPaymentModalBody } from "@egovernments/digit-ui-module-dristi/src/components/shared/EfilingPaymentModalBody";
import useDownloadCasePdf from "@egovernments/digit-ui-module-dristi/src/hooks/dristi/useDownloadCasePdf";
import { CloseBtn, Heading } from "@egovernments/digit-ui-module-dristi/src/components/ModalComponents";
function EfilingPaymentBreakdown({ setShowModal, header, subHeader }) {
  const { t } = useTranslation();
  const location = useLocation();
  const history = useHistory();
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const params = location?.state.state.params;
  const caseId = params?.caseId;
  const scenario = "EfillingCase";
  const path = "";
  const [showToast, setShowToast] = useState(null);
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
          const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
          setShowToast({ label: t("CS_PAYMENT_CALCULATION_ERROR"), error: true, errorId });
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
      const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
      setShowToast({ label: t("CS_CASE_LOCK_STATUS_ERROR"), error: true, errorId });
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
        setShowToast({ label: t("CS_NO_PENDING_PAYMENT"), error: false });
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
        setShowToast({ label: t("CS_CASE_LOCKED_BY_ANOTHER_USER"), error: false });
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
      const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
      setShowToast({ label: t("CS_PAYMENT_ERROR"), error: true, errorId });
      console.error(error);
    } finally {
      setLoader(false);
    }
  };

  if (isLoading || ispaymentLoading || isPaymentTypeLoading || loader) {
    return <Loader />;
  }
  return (
    <div className="e-filing-payment">
      <Modal headerBarEnd={<CloseBtn onClick={onCancel} />} formId="modal-action" headerBarMain={<Heading label={t("PENDING_PAYMENT")} />}>
        <EfilingPaymentModalBody
          t={t}
          paymentCalculation={paymentCalculation}
          receiptFilstoreId={receiptFilstoreId}
          retryPayment={retryPayment}
          paymentLoader={paymentLoader}
          isCaseLocked={isCaseLocked}
          onTaskPayOnline={onTaskPayOnline}
          onDownloadReceipt={() => downloadPdf(tenantId, receiptFilstoreId)}
          showToast={showToast}
          setShowToast={setShowToast}
        />
      </Modal>
      {SurveyUI}
    </div>
  );
}

export default EfilingPaymentBreakdown;
