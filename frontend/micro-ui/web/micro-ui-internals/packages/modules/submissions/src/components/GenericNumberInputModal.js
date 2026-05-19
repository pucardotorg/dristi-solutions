import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import React from "react";
import { CloseBtn, Heading } from "@egovernments/digit-ui-module-dristi/src/components/ModalComponents";
import { ModalIndiaPhoneInputRow } from "./IndiaPhoneInputRow";

const GenericNumberInputModal = ({ t, handleClose, handleSubmit, mobileNumber, setMobileNumber, error, setError, header }) => {
  const handleMobileNumberChange = (e) => {
    const value = e.target.value;

    if (/^[0-9]*$/.test(value) && value.length <= 10) {
      setMobileNumber(value);

      if (error) {
        setError("");
      }
    }
  };

  return (
    <React.Fragment>
      <Modal
        actionCancelLabel={t("BACK")}
        actionCancelOnSubmit={handleClose}
        actionSaveOnSubmit={handleSubmit}
        actionSaveLabel={t("CS_COMMON_SUBMIT")}
        formId="modal-action"
        headerBarMain={<Heading label={t(header)} />}
        headerBarEnd={<CloseBtn onClick={handleClose} />}
        popupStyles={{ borderRadius: "4px" }}
      >
        <div style={{ padding: "20px 0" }}>
          <ModalIndiaPhoneInputRow
            mobileNumber={mobileNumber}
            onMobileNumberChange={handleMobileNumberChange}
            error={error}
            errorMessage={error ? t(error) : null}
          />
        </div>
      </Modal>
    </React.Fragment>
  );
};

export default GenericNumberInputModal;
