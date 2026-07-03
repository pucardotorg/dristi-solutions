import React, { useMemo } from "react";
import Modal from "../../../dristi/src/components/Modal";
import SelectCustomNote from "../../../dristi/src/components/SelectCustomNote";
import { CloseBtn, Heading } from "@egovernments/digit-ui-module-dristi/src/components/ModalComponents";
import useGetPaymentVerificationStatus from "../hooks/submissions/useGetPaymentVerificationStatus";
import { Loader } from "@egovernments/digit-ui-react-components";

const customNoteConfig = {
  populators: {
    inputs: [
      {
        infoHeader: "INFO",
        infoText: "VISIT_NYAYMITRA_FOR_OFFLINE_PAYMENT",
        showTooltip: true,
      },
    ],
  },
};

const verificationPendingNoteConfig = {
  populators: {
    inputs: [
      {
        infoHeader: "WARNING",
        infoText: "PAYMENT_VERIFICATION_PENDING_INFO",
        showTooltip: true,
      },
    ],
  },
};

function PaymentModal({
  t,
  handleClosePaymentModal,
  handleSkipPayment,
  handleMakePayment,
  tenantId,
  consumerCode,
  paymentLoader,
  totalAmount,
  isPostPaymentVerificationPending,
}) {
  const { data: paymentStatusData, isLoading: isPaymentStatusLoading } = useGetPaymentVerificationStatus(
    consumerCode,
    tenantId,
    Boolean(consumerCode)
  );
  console.log("paymentStatusData", paymentStatusData, isPaymentStatusLoading);
  const isVerificationPending = useMemo(() => paymentStatusData && paymentStatusData.PaymentStatus?.status === "VERIFICATION_PENDING", [
    paymentStatusData,
  ]);

  return (
    <Modal
      headerBarMain={<Heading label={t("SUBMISSION_APPLICATION_PAYMENT")} />}
      headerBarEnd={<CloseBtn onClick={handleClosePaymentModal} />}
      actionCancelLabel={isVerificationPending || isPostPaymentVerificationPending ? t("CS_TRY_PAYMENT_AGAIN") : t("SKIP")}
      actionCancelOnSubmit={
        isVerificationPending || isPostPaymentVerificationPending ? () => handleMakePayment(totalAmount) : () => handleSkipPayment()
      }
      actionSaveLabel={isVerificationPending || isPostPaymentVerificationPending ? t("CS_WAIT_AND_CHECK_LATER") : t("CS_MAKE_PAYMENT")}
      actionSaveOnSubmit={() => {
        isVerificationPending || isPostPaymentVerificationPending ? handleClosePaymentModal() : handleMakePayment(totalAmount);
      }}
      isDisabled={paymentLoader}
      className={"submission-payment-modal"}
    >
      <div className="submission-payment-modal-body-main" style={{ height: "auto" }}>
        {(isPaymentStatusLoading || paymentLoader) && (
          <div
            style={{
              width: "100vw",
              height: "100vh",
              zIndex: "999999999999999999",
              position: "fixed",
              right: "0",
              display: "flex",
              top: "0",
              background: "rgb(234 234 245 / 50%)",
              alignItems: "center",
              justifyContent: "center",
            }}
            className="submit-loader"
          >
            <Loader />
          </div>
        )}
        <div className="note-div">
          <SelectCustomNote t={t} config={customNoteConfig} />
          {isVerificationPending && (
            <div style={{ marginTop: "10px" }}>
              <SelectCustomNote t={t} config={verificationPendingNoteConfig} isWarning={true} />
            </div>
          )}
        </div>
        <div className="submission-payment-modal-amount-div">
          <div className="amount-div">
            <div className="keys-div">
              <h2> {t("COURT_FEES")}</h2>
            </div>
            <div className="values-div">
              <h2> {`Rs ${totalAmount}`}</h2>
            </div>
          </div>
          <div className="total-amount-div">
            <h1>{t("TOTAL_FEES")}</h1>
            <h2>{`Rs ${totalAmount}`}</h2>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default PaymentModal;
