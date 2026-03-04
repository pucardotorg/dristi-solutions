import React, { useState } from "react";
import Modal from "./Modal";
import { CheckBox, CloseSvg, TextArea } from "@egovernments/digit-ui-react-components";
import { sanitizeData } from "../Utils";

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
  const [generateOrder, setGenerateOrder] = useState(true);
  const CloseBtn = (props) => {
    return (
      <div onClick={props?.onClick} style={{ height: "100%", display: "flex", alignItems: "center", paddingRight: "20px", cursor: "pointer" }}>
        <CloseSvg />
      </div>
    );
  };
  const Heading = (props) => {
    return (
      <div className="evidence-title">
        <h1 className="heading-m">{props.label}</h1>
      </div>
    );
  };

  const checkBoxLabel = type === "reject" ? t("GENERATE_ORDER_FOR_REJECTION") : t("GENERATE_ORDER_FOR_ACCEPTANCE");
  const header = type === "reject" ? t("REJECT_SUBMISSION_HEADER") : t("ACCEPT_SUBMISSION_HEADER");
  const actionSaveLabel = generateOrder
    ? type === "reject"
      ? t("GENERATE_REJECTION_ORDER")
      : t("GENERATE_ACCEPTANCE_ORDER")
    : type === "reject"
    ? t("REJECT_SUBMISSION")
    : t("ACCEPT_SUBMISSION");

  return (
    <Modal
      headerBarEnd={<CloseBtn onClick={handleBack} />}
      headerBarMain={<Heading label={`${t("ADD")} ${t(applicationType)} ${t("DETAILS")}`} />}
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
        {/* <div style={{ marginTop: 10 }}>{t("REJECT_ACCEPT_SUBMISSION_TEXT")}</div>
        {!generateOrder && type === "reject" && <h1 style={{ margin: "10px 0px 3px 0px" }}>{t("PURPOSE_OF_REJECTION")}</h1>}
        {!generateOrder && type === "reject" && (
          <TextArea style={{ marginTop: "0px" }} placeholder={t("TYPE_HERE_PLACEHOLDER")} name={t("PURPOSE_OF_REJECTION")} />
        )}
        <div className="confirm-submission-checkbox">
          <CheckBox
            onChange={() => {
              setGenerateOrder((prev) => !prev);
            }}
            label={checkBoxLabel}
            checked={generateOrder}
            disable={disableCheckBox}
          />
        </div> */}

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

export default ConfirmSubmissionAction;
