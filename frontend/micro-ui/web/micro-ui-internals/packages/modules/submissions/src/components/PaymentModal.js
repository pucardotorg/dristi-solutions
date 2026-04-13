import React from "react";
import Modal from "../../../dristi/src/components/Modal";
import SelectCustomNote from "../../../dristi/src/components/SelectCustomNote";
import { CloseBtn, Heading } from "@egovernments/digit-ui-module-dristi/src/components/ModalComponents";

const customNoteConfig = {
  populators: {
    inputs: [
      {
        infoHeader: "INFO",
        infoText: "VISIT_NYAYMITRA_FOR_OFFLINE_PAYMENT",
        // infoTooltipMessage: "CS_NOTE_TOOLTIP",
        showTooltip: true,
      },
    ],
  },
};

function PaymentModal({ t, handleClosePaymentModal, handleSkipPayment, handleMakePayment, tenantId, consumerCode, paymentLoader, totalAmount }) {
  
  return (
    <Modal
      popupStyles={{
        height: "300px",
      }}
      headerBarMain={<Heading label={t("SUBMISSION_APPLICATION_PAYMENT")} />}
      headerBarEnd={<CloseBtn onClick={handleClosePaymentModal} />}
      actionCancelLabel={t("SKIP")}
      actionCancelOnSubmit={() => handleSkipPayment()}
      actionSaveLabel={t("CS_MAKE_PAYMENT")}
      actionSaveOnSubmit={() => {
        handleMakePayment(totalAmount);
      }}
      isDisabled={paymentLoader}
      className={"submission-payment-modal"}
    >
      <div className="submission-payment-modal-body-main" style={{ maxHeight: "180px" }}>
        <div className="note-div">
          <SelectCustomNote t={t} config={customNoteConfig}></SelectCustomNote>
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
