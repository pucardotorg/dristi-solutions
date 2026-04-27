import React from "react";
import Modal from "../../../dristi/src/components/Modal";
import SelectCustomNote from "../../../dristi/src/components/SelectCustomNote";
import { Banner } from "@egovernments/digit-ui-react-components";
import CustomCopyTextDiv from "../../../dristi/src/components/CustomCopyTextDiv";
import { CloseBtn } from "@egovernments/digit-ui-module-dristi/src/components/ModalComponents";

const customNoteConfig = {
  populators: {
    inputs: [
      {
        infoHeader: "PLEASE_NOTE",
        infoText: "YOU_HAVE_TO_MAKE_PAYMENT",
        // infoTooltipMessage: "CS_NOTE_TOOLTIP",
        showTooltip: true,
      },
    ],
  },
};

const paymentFailedNoteConfig = {
  populators: {
    inputs: [
      {
        infoHeader: "PLEASE_NOTE",
        infoText: "PAYMENT_FAILED",
        showTooltip: true,
      },
    ],
  },
};
function SuccessModal({
  t,
  actionCancelLabel,
  actionCancelOnSubmit,
  isPaymentDone,
  handleCloseSuccessModal,
  applicationNumber,
  createdDate,
  makePayment,
  paymentStatus,
  headerBarEndClose,
  bannerlabel,
}) {
  const submissionData = [
    { key: "SUBMISSION_DATE", value: createdDate, copyData: false },
    { key: "SUBMISSION_ID", value: applicationNumber, copyData: true },
  ];
  return (
    <Modal
      headerBarMain={!makePayment}
      headerBarEnd={!makePayment && <CloseBtn onClick={headerBarEndClose} />}
      headerBarMainStyle={{ padding: "10px 0px" }}
      actionCancelLabel={t(actionCancelLabel)}
      actionCancelOnSubmit={actionCancelOnSubmit}
      actionSaveLabel={makePayment ? t("CS_MAKE_PAYMENT") : t("CS_CLOSE")}
      actionSaveOnSubmit={handleCloseSuccessModal}
      className={"submission-success-modal"}
    >
      <div className="submission-success-modal-body-main">
        <Banner
          whichSvg={"tick"}
          successful={true}
          message={bannerlabel}
          headerStyles={{ fontSize: "32px" }}
          style={{ minWidth: "100%", ...(!headerBarEndClose && { marginTop: "10px" }) }}
        ></Banner>
        {isPaymentDone && <SelectCustomNote t={t} config={customNoteConfig} />}
        {paymentStatus === false && <SelectCustomNote t={t} config={paymentFailedNoteConfig} />}

        <CustomCopyTextDiv
          t={t}
          keyStyle={{ margin: "8px 0px" }}
          valueStyle={{ margin: "8px 0px", fontWeight: 700 }}
          data={submissionData}
          tableDataClassName={"e-filing-table-data-style"}
          tableValueClassName={"e-filing-table-value-style"}
        />
      </div>
    </Modal>
  );
}

export default SuccessModal;
