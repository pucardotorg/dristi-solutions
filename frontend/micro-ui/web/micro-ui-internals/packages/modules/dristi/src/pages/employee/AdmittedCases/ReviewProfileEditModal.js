import { CloseSvg, Modal } from "@egovernments/digit-ui-react-components";
import React from "react";

const Heading = (props) => {
  return (
    <h1 className="heading-m" style={{ marginLeft: "24px" }}>
      {props.label}
    </h1>
  );
};

const CloseBtn = (props) => {
  return (
    <div onClick={props?.onClick} style={{ height: "100%", display: "flex", alignItems: "center", paddingRight: "20px", cursor: "pointer" }}>
      <CloseSvg />
    </div>
  );
};

function ReviewProfileEditModal({ t, handleSubmitOnModal, showApproveRejectRequestModal, setShowApproveRejectRequestModal }) {
  const handleOnClose = () => {
    setShowApproveRejectRequestModal({ show: false, action: "" });
  };

  return (
    <Modal
      headerBarMain={<Heading label={showApproveRejectRequestModal?.action === "ACCEPT" ? t("CONFIRM_APPROVAL") : t("CONFIRM_REJECTION")} />}
      headerBarEnd={<CloseBtn onClick={handleOnClose} />}
      actionSaveLabel={t(showApproveRejectRequestModal?.action)}
      actionSaveOnSubmit={handleSubmitOnModal}
      actionCancelOnSubmit={handleOnClose}
      actionCancelLabel={t("CS_BACK")}
      popUpStyleMain={{ zIndex: "1000" }}
      popmoduleClassName={
        showApproveRejectRequestModal?.action === "ACCEPT" ? "review-profile-editing-modal-accept" : "review-profile-editing-modal-reject"
      }
    >
      <div>
        <h2>
          {showApproveRejectRequestModal?.action === "ACCEPT"
            ? t("THIS_WILL_CHANGE_THE_DETAILS_WITHIN_THE_CASE")
            : t("THIS_ACTION_CAN_NOT_BE_REVERSED")}
        </h2>
      </div>
    </Modal>
  );
}

export default ReviewProfileEditModal;
