import { CloseSvg, Loader, Toast } from "@egovernments/digit-ui-react-components";
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

function GeneratePaymentDemandBreakdown({ setShowModal, header, subHeader }) {
  const { t } = useTranslation();
  const location = useLocation();
  const history = useHistory();
  const onCancel = () => {
    if (!paymentLoader) {
      history.goBack();
      setShowPaymentModal(false);
    }
  };
  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const courtId = localStorage.getItem("courtId");

  const params = location?.state.state.params;
  const taskNumber = params?.referenceId;

  const caseId = params?.caseId;
  const filingNumber = params?.filingNumber;
  const toast = useToast();
  const scenario = "EfillingCase"; //what is this
  const path = "";
  const [toastMsg, setToastMsg] = useState(null);
  const [isCaseLocked, setIsCaseLocked] = useState(false);
  const [payOnlineButtonTitle, setPayOnlineButtonTitle] = useState("CS_BUTTON_PAY_ONLINE_SOMEONE_PAYING");
  const [paymentBreakDown, setPaymentBreakDown] = useState([]);
  const [consumerCode, setConsumerCode] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [comments, setComments] = useState("");
  const [caseLockLoader, setLockLoader] = useState(false);
  const [taskLoader, setTaskloader] = useState(null);
  // const { data: paymentTypeData, isLoading: isPaymentTypeLoading } = Digit.Hooks.useCustomMDMS(
  //   Digit.ULBService.getStateId(),
  //   "payment",
  //   [{ name: "paymentType" }],
  //   {
  //     select: (data) => {
  //       return data?.payment?.paymentType || [];
  //     },
  //   }
  // );
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

  // const suffix = useMemo(() => getSuffixByBusinessCode(paymentTypeData, "task-generic"), [paymentTypeData]);

  const { fetchBill, openPaymentPortal, paymentLoader, showPaymentModal, setShowPaymentModal } = usePaymentProcess({
    tenantId,
    consumerCode: consumerCode, //taskNumber + `_${suffix}`,
    service: "task-generic",
    path,
    caseDetails,
    totalAmount: totalAmount,
    scenario,
  });

  const fetchCaseLockStatus = useCallback(async () => {
    try {
      setLockLoader(true);
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
    } finally {
      setLockLoader(false);
    }
  });
  useEffect(() => {
    if (caseDetails?.filingNumber) {
      fetchCaseLockStatus();
    }
  }, [caseDetails?.filingNumber]);

  const fetchTask = useCallback(async () => {
    try {
      setTaskloader(true);
      const task = await DRISTIService.customApiService(Urls.case.searchTasks, {
        criteria: {
          tenantId: tenantId,
          taskNumber: taskNumber,
          courtId: courtId || "KLKM52",
        },
      });
      const taskData = task?.list?.[0];

      const breakdown = taskData?.taskDetails?.genericTaskDetails?.feeBreakDown?.breakDown || [];
      const totalAmount = taskData?.taskDetails?.genericTaskDetails?.feeBreakDown?.totalAmount || 0;

      const updatedBreakdown = breakdown.map((item) => ({
        key: item?.code,
        value: item?.amount,
        currency: "Rs",
      }));
      setConsumerCode(task?.list?.[0]?.taskDetails?.genericTaskDetails?.consumerCode);
      setTotalAmount(totalAmount);

      updatedBreakdown.push({
        key: "Total amount",
        value: totalAmount,
        currency: "Rs",
        isTotalFee: true,
      });
      setComments(taskData?.taskDescription);

      setPaymentBreakDown(updatedBreakdown);
    } catch (error) {
      console.error("Error fetching task data", error);
    } finally {
      setTaskloader(false);
    }
  }, [taskNumber]);

  useEffect(() => {
    if (taskNumber) {
      fetchTask();
    }
  }, [fetchTask, taskNumber]);

  const onSubmitCase = async () => {
    try {
      const bill = await fetchBill(consumerCode, tenantId, "task-generic");
      if (!bill?.Bill?.length) {
        showToast("success", t("CS_NO_PENDING_PAYMENT"), 50000);
        setIsCaseLocked(true);
        setPayOnlineButtonTitle("CS_BUTTON_PAY_ONLINE_NO_PENDING_PAYMENT");
        return;
      }

      const caseLockStatus = await DRISTIService.getCaseLockStatus(
        {},
        {
          uniqueId: filingNumber,
          tenantId: tenantId,
        }
      );
      if (caseLockStatus?.Lock?.isLocked) {
        setIsCaseLocked(true);
        showToast("success", t("CS_CASE_LOCKED_BY_ANOTHER_USER"), 50000);
        setPayOnlineButtonTitle("CS_BUTTON_PAY_ONLINE_SOMEONE_PAYING");
        return;
      }

      await DRISTIService.setCaseLock({ Lock: { uniqueId: filingNumber, tenantId: tenantId, lockType: "PAYMENT" } }, {});

      const paymentStatus = await openPaymentPortal(bill, totalAmount);
      await DRISTIService.setCaseUnlock({}, { uniqueId: filingNumber, tenantId: tenantId });
      const success = Boolean(paymentStatus);

      const receiptData = {
        header: "CS_HEADER_FOR_E_FILING_PAYMENT",
        subHeader: "CS_SUBHEADER_TEXT_FOR_E_FILING_PAYMENT",
        isArrow: false,
        showTable: true,
        caseInfo: [
          { key: "Mode of Payment", value: "Online", copyData: false },
          { key: "Amount", value: totalAmount, copyData: false },
          { key: "Transaction ID", value: caseDetails?.filingNumber, copyData: true },
        ],
        showCopytext: true,
      };

      if (success) {
        const fileStoreId = await DRISTIService.fetchBillFileStoreId({}, { billId: bill?.Bill?.[0]?.id, tenantId });
        if (fileStoreId) {
          history.push(`e-filing-payment-response`, {
            state: { success: true, receiptData, fileStoreId: fileStoreId?.Document?.fileStore },
          });
        }
      } else {
        history.push(`e-filing-payment-response`, {
          state: { success: false, receiptData, caseId },
        });
      }
    } catch (error) {
      toast.error(t("CS_PAYMENT_ERROR"));
      console.error(error);
    }
  };

  // if (isPaymentTypeLoading) {
  //   return <Loader />;
  // }
  const showToast = (type, message, duration = 5000) => {
    setToastMsg({ key: type, action: message });
    setTimeout(() => {
      setToastMsg(null);
    }, duration);
  };
  return (
    <div className="e-filing-payment">
      <style>{`.tooltip {
  position: relative;
  display: inline-block;
  cursor: pointer;
}

.tooltip-text {
  visibility: hidden;
  width: auto; 
  max-width: 300px;
  background-color: rgba(0, 0, 0, 0.75);
  color: #fff;
  text-align: center;
  border-radius: 5px;
  padding: 5px;
  position: absolute;
  z-index: 1;
  bottom: 125%; 
  margin-left: 0px;
  opacity: 0;
  transition: opacity 0.3s;
}

.tooltip:hover .tooltip-text {
  visibility: visible;
  opacity: 1;
}`}</style>
      <Modal
        headerBarEnd={<CloseBtn onClick={onCancel} />}
        actionSaveLabel={t("CS_PAY_ONLINE")}
        formId="modal-action"
        actionSaveOnSubmit={() => onSubmitCase()}
        titleSaveButton={isCaseLocked ? t(payOnlineButtonTitle) : ""}
        isDisabled={paymentLoader || isCaseLocked || taskLoader || caseLockLoader || isLoading}
        headerBarMain={<Heading label={t("CS_PAY_TO_FILE_CASE")} />}
      >
        <React.Fragment>
          {isLoading || taskLoader || caseLockLoader ? (
            <Loader />
          ) : (
            <React.Fragment>
              {" "}
              <div className="payment-due-wrapper" style={{ maxHeight: "550px", display: "flex", flexDirection: "column", margin: "13px 0px" }}>
                <div className="payment-due-text" style={{ fontSize: "18px" }}>
                  {`${t("CS_DUE_PAYMENT")} `}
                  <span style={{ fontWeight: 700 }}>Rs {totalAmount}/-.</span>
                  {comments && <p style={{ margin: 0 }}> {` ${t("PAYMENT_ADDITIONAL_INFO")}: ${comments}`}</p>}
                </div>
                <div
                  className="payment-calculator-wrapper"
                  style={{ display: "flex", flexDirection: "column", maxHeight: "150px", overflowY: "auto" }}
                >
                  {paymentBreakDown
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
                        <span>{t(item.key)}</span>
                        <span>
                          {item.currency} {parseFloat(item.value).toFixed(2)}
                        </span>
                      </div>
                    ))}
                </div>
                <div className="payment-calculator-wrapper" style={{ display: "flex", flexDirection: "column" }}>
                  {paymentBreakDown
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
                          paddingRight: paymentBreakDown.length > 6 ? "28px" : "16px",
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
                    label={t("CS_PAYMENT_NOTE")}
                    style={{ backgroundColor: "#ECF3FD" }}
                    additionalElements={[
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span className="learn-more-text" style={{ color: "#3D3C3C" }}>
                          {t("PAYMENT_SUBTEXT")}{" "}
                          {/* <span class="tooltip">
                            <span style={{ textDecoration: "underline", fontWeight: "bold" }}>{t("LEARN_MORE")}</span>
                            <span
                              class="tooltip-text"
                              style={{ maxWidth: "400px", wordWrap: "break-word", padding: "5px 10px", width: "max-content", marginLeft: "-60px" }}
                            >
                              {t("PAYMENT_SUBTEXT_TOOLTIP")}
                            </span>
                          </span> */}
                        </span>
                      </div>,
                    ]}
                    inline
                    textStyle={{}}
                    className={"adhaar-verification-info-card"}
                  />
                </div>
              </div>
              {toastMsg && (
                <Toast error={toastMsg.key === "error"} label={t(toastMsg.action)} onClose={() => setToastMsg(null)} style={{ maxWidth: "500px" }} />
              )}{" "}
            </React.Fragment>
          )}
        </React.Fragment>
      </Modal>
    </div>
  );
}

export default GeneratePaymentDemandBreakdown;
