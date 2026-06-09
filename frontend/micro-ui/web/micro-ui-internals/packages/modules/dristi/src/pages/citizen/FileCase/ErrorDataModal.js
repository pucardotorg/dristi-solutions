import { Modal } from "@egovernments/digit-ui-react-components";
import React, { useMemo } from "react";
import { CloseBtn, Heading } from "../../../components/ModalComponents";
function ErrorDataModal({ t, setIsSubmitDisabled, showErrorDataModal, setShowErrorDataModal }) {
  const handleOnClose = () => {
    setShowErrorDataModal({ ...showErrorDataModal, show: false, errorData: [] });
  };

  return (
    <Modal
      headerBarMain={<Heading style={{ marginLeft: "24px" }} label={t("PLEASE_ENTER_THESE_REMAINING_DETAILS")} />}
      headerBarEnd={<CloseBtn onClick={handleOnClose} />}
      actionSaveLabel={t("CS_CLOSE")}
      actionSaveOnSubmit={handleOnClose}
      popUpStyleMain={{ zIndex: "1000" }}
    >
      <div>
        {showErrorDataModal?.errorData?.map((data) => {
          return <h1>{`${data?.type || "Complainant"} ${data?.complainant} : ${data?.errorKeys?.join(", ")}`}</h1>;
        })}
      </div>
    </Modal>
  );
}

export default ErrorDataModal;
