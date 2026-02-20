import { Banner, CardLabel, CloseSvg, Loader, Toast } from "@egovernments/digit-ui-react-components";
import React, { useMemo, useState, useEffect, useCallback } from "react";
import Button from "../../../components/Button";
import { InfoCard } from "@egovernments/digit-ui-components";
import { useHistory, useLocation } from "react-router-dom/cjs/react-router-dom.min";
import CustomCaseInfoDiv from "../../../components/CustomCaseInfoDiv";
import useSearchCaseService from "../../../hooks/dristi/useSearchCaseService";
import { useToast } from "../../../components/Toast/useToast";
import { DRISTIService } from "../../../services";
import { Urls } from "../../../hooks";
import usePaymentProcess from "../../../../../home/src/hooks/usePaymentProcess";
import { getSuffixByBusinessCode } from "../../../Utils";
import useDownloadCasePdf from "../../../hooks/dristi/useDownloadCasePdf";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import CustomChip from "../../../components/CustomChip";
import { PrintIcon } from "../../../icons/svgIndex";

const mockSubmitModalInfo = {
  header: "CS_HEADER_FOR_E_FILING_PAYMENT",
  subHeader: "CS_SUBHEADER_TEXT_FOR_E_FILING_PAYMENT",
  caseInfo: [
    {
      key: "Case Number",
      value: "FSM-2019-04-23-898898",
    },
  ],
  isArrow: false,
  showTable: true,
};

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

function EFilingPayment({ t, submitModalInfo = mockSubmitModalInfo, path }) {
  const history = useHistory();
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const { caseId } = window?.Digit.Hooks.useQueryParams();
  const toast = useToast();
  const scenario = "EfillingCase";
  const fileStoreId = sessionStorage.getItem("fileStoreId");
  const location = useLocation();
  const calculationResponse = location.state.state.calculationResponse;
  const [toastMsg, setToastMsg] = useState(null);
  const [isCaseLocked, setIsCaseLocked] = useState(false);
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
    if (!paymentLoader && receiptFilstoreId) {
      triggerSurvey(triggerSurveyContext, () => {
        history.replace(`/${window?.contextPath}/citizen/dristi/home`);
      });
    }
    setShowPaymentModal(false);
  };

  useEffect(() => {
    if (caseDetails?.filingNumber) {
      fetchCaseLockStatus();
    }
  }, [caseDetails?.filingNumber]);

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

  const submitInfoData = useMemo(() => {
    return {
      ...mockSubmitModalInfo,
      caseInfo: [
        {
          key: "CS_CASE_NUMBER",
          value: caseDetails?.filingNumber,
          copyData: true,
        },
      ],
      isArrow: false,
      showTable: true,
      showCopytext: true,
    };
  }, [caseDetails?.filingNumber]);

  const suffix = useMemo(() => getSuffixByBusinessCode(paymentTypeData, "case-default"), [paymentTypeData]);

  const { fetchBill, openPaymentPortal, paymentLoader, showPaymentModal, setShowPaymentModal } = usePaymentProcess({
    tenantId,
    consumerCode: caseDetails?.additionalDetails?.lastSubmissionConsumerCode
      ? caseDetails?.additionalDetails?.lastSubmissionConsumerCode
      : caseDetails?.filingNumber + `_${suffix}`,
    service: "case-default",
    path,
    caseDetails,
    totalAmount: totalAmount,
    mockSubmitModalInfo,
    scenario,
  });
  const { downloadPdf } = useDownloadCasePdf();

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
      if (bill?.Bill?.length) {
        const paymentStatus = await openPaymentPortal(bill);
        await DRISTIService.setCaseUnlock({}, { uniqueId: caseDetails?.filingNumber, tenantId: tenantId });

        if (paymentStatus) {
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
      }
    } catch (error) {
      toast.error(t("CS_PAYMENT_ERROR"));
      console.error(error);
    } finally {
      setLoader(false);
    }
  };

  if (isLoading || paymentLoader || isPaymentTypeLoading || loader) {
    return <Loader />;
  }
  const showToast = (type, message, duration = 5000) => {
    setToastMsg({ key: type, action: message });
    setTimeout(() => {
      setToastMsg(null);
    }, duration);
  };

  const fileStoreIdToUse = caseDetails?.additionalDetails?.signedCaseDocument || fileStoreId;

  return (
    <div className=" user-registration">
      <div className="e-filing-payment" style={{ height: "580px" }}>
        <Banner
          whichSvg={"tick"}
          successful={true}
          message={t(submitModalInfo?.header)}
          headerStyles={{ fontSize: "32px" }}
          style={{ minWidth: "100%" }}
        ></Banner>
        {submitInfoData?.subHeader && <CardLabel className={"e-filing-card-label"}>{t(submitInfoData?.subHeader)}</CardLabel>}
        {submitInfoData?.showTable && (
          <CustomCaseInfoDiv
            t={t}
            data={submitInfoData?.caseInfo}
            tableDataClassName={"e-filing-table-data-style"}
            tableValueClassName={"e-filing-table-value-style"}
            column={1}
          />
        )}
        <div className="button-field">
          {/* <Button
            variation={"secondary"}
            className={"secondary-button-selector"}
            label={t("CS_GO_TO_HOME")}
            labelClassName={"secondary-label-selector"}
            style={{ minWidth: "30%" }}
            onButtonClick={() => {
              history.push(`/${window?.contextPath}/citizen/dristi/home`);
            }}
          /> */}
          <Button
            variation={"secondary"}
            className={"secondary-button-selector"}
            label={t("CS_GO_TO_HOME")}
            labelClassName={"secondary-label-selector"}
            style={{ minWidth: "30%" }}
            onButtonClick={() => {
              history.push(`/${window?.contextPath}/citizen/dristi/home`);
            }}
          />
          <Button
            variation={"secondary"}
            className={"secondary-button-selector"}
            label={t("CS_PRINT_CASE_FILE")}
            labelClassName={"secondary-label-selector"}
            style={{ minWidth: "30%" }}
            onButtonClick={() => {
              downloadPdf(tenantId, fileStoreIdToUse);
              sessionStorage.removeItem("fileStoreId");
            }}
          />
          <Button
            className={"tertiary-button-selector"}
            label={t("CS_MAKE_PAYMENT")}
            labelClassName={"tertiary-label-selector"}
            style={{ minWidth: "30%" }}
            onButtonClick={() => {
              setShowPaymentModal(true);
            }}
          />
        </div>
        {showPaymentModal && (
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
              <Toast error={toastMsg.key === "error"} label={t(toastMsg.action)} onClose={() => setToastMsg(null)} style={{ maxWidth: "670px" }} />
            )}
          </Modal>
        )}
        {SurveyUI}
      </div>
    </div>
  );
}

export default EFilingPayment;
