import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import { Banner } from "@egovernments/digit-ui-react-components";
import React from "react";

const SuccessBannerModal = ({ t, handleCloseSuccessModal, headerBarEndClose, message }) => {
  return (
    <Modal
      actionSaveLabel={t("CS_CLOSE")}
      actionSaveOnSubmit={handleCloseSuccessModal}
      className={"submission-success-modal responsive-signature-modal centered-success-modal"}
      popupStyles={{ width: "700px", borderRadius: "4px" }}
      style={{ width: "100%" }}
    >
      <div className="submission-success-modal-body-main">
        <Banner
          whichSvg={"tick"}
          successful={true}
          message={t(message)}
          headerStyles={{ fontSize: "32px" }}
          style={{ minWidth: "100%", ...(!headerBarEndClose && { marginTop: "10px" }) }}
        ></Banner>
      </div>
    </Modal>
  );
};

export default SuccessBannerModal;
