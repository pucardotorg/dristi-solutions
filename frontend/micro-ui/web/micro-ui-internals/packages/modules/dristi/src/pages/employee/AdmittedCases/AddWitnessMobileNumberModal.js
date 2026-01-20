import React, { useState } from "react";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";
import { CloseSvg, TextInput } from "@egovernments/digit-ui-react-components";

function AddWitnessMobileNumberModal({
  t,
  handleClose,
  allParties,
  submit,
  witnesMobileNumber,
  setWitnessMobileNumber,
  mainHeader,
  selectedPartyId,
}) {
  const [mobileNumber, setMobileNumber] = useState(witnesMobileNumber || "");
  const [error, setError] = useState("");

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

  const validateMobileNumber = (number) => {
    // Check if the number contains only digits
    const isNumeric = /^[0-9]+$/.test(number);

    if (!number) {
      return "Mobile number is required";
    }

    if (!isNumeric) {
      return "Mobile number should contain only digits";
    }

    if (number.length !== 10) {
      return "Mobile number should be exactly 10 digits";
    }

    return "";
  };

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

  const handlesubmit = () => {
    const validationError = validateMobileNumber(mobileNumber);

    if (validationError) {
      setError(validationError);
      return;
    }

    // Check if mobile number already exists in any other party's MobileNumbers array
    const isDuplicateMobile = allParties?.some(
      (party) => !(party?.uniqueId === selectedPartyId || party?.uuid === selectedPartyId) && party?.mobileNumbers?.includes(mobileNumber)
    );

    if (isDuplicateMobile) {
      setError("THIS_NUMBER_ALREADY_EXISTS");
      return;
    }

    setError("");
    setWitnessMobileNumber(mobileNumber);
    submit(mobileNumber);
  };

  return (
    <React.Fragment>
      <Modal
        // className={""}
        // popupStyles={{ width: "700px", borderRadius: "4px" }}
        // style={{ width: "100%" }}

        actionCancelLabel={t("BACK")}
        actionCancelOnSubmit={handleClose}
        actionSaveOnSubmit={handlesubmit}
        actionSaveLabel={t("CS_COMMON_SUBMIT")}
        formId="modal-action"
        headerBarMain={<Heading label={t(mainHeader)} />}
        headerBarEnd={<CloseBtn onClick={handleClose} />}
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
}

export default AddWitnessMobileNumberModal;
