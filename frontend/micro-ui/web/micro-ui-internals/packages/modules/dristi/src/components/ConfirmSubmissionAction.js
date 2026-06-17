import React from "react";
import PropTypes from "prop-types";
import Modal from "./Modal";
import { TextArea } from "@egovernments/digit-ui-react-components";
import { sanitizeData } from "../Utils";
import { CloseBtn } from "./ModalComponents";

const SubmissionHeading = ({ label }) => (
  <div className="evidence-title">
    <h1 className="heading-m">{label}</h1>
  </div>
);

SubmissionHeading.propTypes = {
  label: PropTypes.string,
};

const getActionSaveLabel = (generateOrder, type, t) => {
  if (generateOrder) {
    return type === "reject" ? t("GENERATE_REJECTION_ORDER") : t("GENERATE_ACCEPTANCE_ORDER");
  }
  return type === "reject" ? t("REJECT_SUBMISSION") : t("ACCEPT_SUBMISSION");
};

function ConfirmSubmissionAction({
  t,
  type,
  setShowConfirmationModal,
  handleAction,
  disableCheckBox,
  setReasonOfApplication,
  reasonOfApplication,
  handleBack,
  applicationType,
}) {
  const generateOrder = true;

  return (
    <Modal
      headerBarEnd={<CloseBtn onClick={handleBack} />}
      headerBarMain={<SubmissionHeading label={`${t("ADD")} ${t(applicationType)} ${t("DETAILS")}`} />}
      actionCancelLabel={t("CS_COMMON_BACK")}
      actionSaveLabel={t("CONFIRM")}
      actionCancelOnSubmit={handleBack}
      actionSaveOnSubmit={() => {
        handleAction(generateOrder, type);
      }}
      popupStyles={{ borderRadius: "4px" }}
      isDisabled={!reasonOfApplication}
    >
      <div>
        <div style={{ padding: "10px 0px" }}>
          <h3 style={{ margin: "10px 0px 6px 0px" }}>{type === "reject" ? t("REASON_FOR_REJECTION_APPLICATION") : t("REASON_FOR_ACCEPTANCE")}</h3>
          <TextArea
            style={{ marginTop: "0px", height: "120px" }}
            placeholder={t("")}
            name={type === "reject" ? "reasonForRejection" : "reasonForAcceptance"}
            value={reasonOfApplication}
            onChange={(e) => setReasonOfApplication(sanitizeData(e.target.value))}
          />
        </div>
      </div>
    </Modal>
  );
}

ConfirmSubmissionAction.propTypes = {
  t: PropTypes.func,
  type: PropTypes.string,
  setShowConfirmationModal: PropTypes.func,
  handleAction: PropTypes.func,
  disableCheckBox: PropTypes.bool,
  setReasonOfApplication: PropTypes.func,
  reasonOfApplication: PropTypes.string,
  handleBack: PropTypes.func,
  applicationType: PropTypes.string,
};

export default ConfirmSubmissionAction;
