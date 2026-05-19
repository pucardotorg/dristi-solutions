import React from "react";
import { Button } from "@egovernments/digit-ui-react-components";
import { InfoCard } from "@egovernments/digit-ui-components";
import CustomChip from "../CustomChip";
import { PrintIcon } from "../../icons/svgIndex";
import CustomToast from "../CustomToast";

/** Shared e-filing payment breakdown UI (home pending-task + citizen FileCase). */
export const EfilingPaymentModalBody = ({
  t,
  paymentCalculation,
  receiptFilstoreId,
  retryPayment,
  paymentLoader,
  isCaseLocked,
  onTaskPayOnline,
  onDownloadReceipt,
  showToast,
  setShowToast,
}) => (
  <div className="payment-wrapper">
    <InfoCard
      variant={"default"}
      label={t("CS_IMPORTANT_INFORMATION")}
      additionalElements={[
        <div className="info-card-content" key="payment-info">
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
          <div key={item?.key} className={`total-payment-item ${paymentCalculation?.length > 6 ? "has-many-items" : ""}`}>
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
          <div key={item?.key} className="breakdown-payment-item">
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
      onButtonClick={receiptFilstoreId ? onDownloadReceipt : onTaskPayOnline}
      isDisabled={paymentLoader || isCaseLocked}
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
