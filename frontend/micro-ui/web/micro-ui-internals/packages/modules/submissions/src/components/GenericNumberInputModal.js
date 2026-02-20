import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import { CloseSvg } from "@egovernments/digit-ui-react-components";
import React, { useState } from "react";

const CloseBtn = (props) => {
  return (
    <div onClick={props?.onClick} style={{ height: "100%", display: "flex", alignItems: "center", paddingRight: "20px", cursor: "pointer" }}>
      <CloseSvg />
    </div>
  );
};
const Heading = (props) => {
  return <h1 className="heading-m">{props.label}</h1>;
};

const GenericNumberInputModal = ({ t, handleClose, handleSubmit, mobileNumber, setMobileNumber, error, setError, header }) => {
  const handleMobileNumberChange = (e) => {
    const value = e.target.value;

    // Allow only numeric input and limit to 10 characters
    if (/^[0-9]*$/.test(value) && value.length <= 10) {
      setMobileNumber(value);

      // Clear error when user starts typing valid input
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
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "16px",
                fontWeight: "400",
                color: "#0B0C0C",
              }}
            >
              Phone Number
            </label>
            <div
              style={{
                display: "flex",
                border: "1px solid #D6D5D4",
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  backgroundColor: "#F6F6F6",
                  padding: "12px 16px",
                  borderRight: "1px solid #D6D5D4",
                  display: "flex",
                  alignItems: "center",
                  fontSize: "16px",
                  color: "#0B0C0C",
                  justifyContent: "center",
                }}
              >
                +91
              </div>
              <input
                type="tel"
                value={mobileNumber}
                onChange={handleMobileNumberChange}
                placeholder="Ex. 1234567890"
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  border: "none",
                  outline: "none",
                  fontSize: "16px",
                  color: "#0B0C0C",
                }}
                maxLength={10}
              />
            </div>
            {error && (
              <div
                style={{
                  marginTop: "8px",
                  fontSize: "14px",
                  color: "#D4351C",
                  fontWeight: "400",
                }}
              >
                {t(error)}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </React.Fragment>
  );
};

export default GenericNumberInputModal;
