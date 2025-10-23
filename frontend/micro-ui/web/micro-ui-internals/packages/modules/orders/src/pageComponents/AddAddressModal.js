import React, { useState } from "react";
import { getFullName } from "../../../cases/src/utils/joinCaseUtils";
import { Button, TextInput, CardLabelError, CloseSvg } from "@egovernments/digit-ui-react-components";
import Modal from "@egovernments/digit-ui-module-dristi/src/components/Modal";

const Heading = (props) => {
  return (
    <h1 className="heading-m" style={{ fontSize: "20px" }}>
      {props.label}
    </h1>
  );
};

const CloseBtn = (props) => {
  return (
    <div
      onClick={props?.onClick}
      style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        paddingRight: "20px",
        cursor: "pointer",
        ...(props?.backgroundColor && { backgroundColor: props.backgroundColor }),
      }}
    >
      <CloseSvg />
    </div>
  );
};

const AddAddressModal = ({ t, processCourierData, setShowAddAddressModalLocal, handleDataChange }) => {
  const [newAddress, setNewAddress] = useState({});
  const [addressErrors, setAddressErrors] = useState({});

  // Pattern validation function
  const patternValidation = (key) => {
    switch (key) {
      case "string":
        return /^[^{0-9}$"<>?\\~!@#$%^()+={},/*:;""'']{1,50}$/i;
      case "address":
        return /^[^$"<>?\\~`!@$%^()={},*:;""'']{2,256}$/i;
      case "pincode":
        return /^[1-9][0-9]{5}$/;
      default:
        return /.*/;
    }
  };

  return (
    <Modal
      headerBarMain={<Heading label={t("Add Address")} />}
      headerBarEnd={
        <CloseBtn
          onClick={() => {
            setShowAddAddressModalLocal(false);
          }}
        />
      }
      actionCancelLabel={t("Cancel")}
      actionCancelOnSubmit={() => setShowAddAddressModalLocal(false)}
      actionSaveLabel={t("Add Address")}
      actionSaveOnSubmit={() => {
        const updatedAddresses = [
          ...(processCourierData?.addresses || []),
          {
            addresses: newAddress,
          },
        ];

        handleDataChange({ addresses: updatedAddresses });
        setNewAddress({});
        setAddressErrors({});
        setShowAddAddressModalLocal(false);
      }}
      isDisabled={
        !newAddress ||
        !newAddress.locality ||
        !newAddress.city ||
        !newAddress.pincode ||
        !newAddress.district ||
        !newAddress.state ||
        Object.values(addressErrors).some((error) => error)
      }
      //   popupStyles={{ maxssWidth: "600px", width: "100%", maxHeight: "max-content" }}
      className={"add-address-modal-payment"}
    >
      <div className="address-card-input add-address-modal-inputs">
        <div className="field">
          <div className="heading">{t("CS_RESPONDENT_NAME")}</div>
          <TextInput
            className="field desktop-w-full"
            value={getFullName(" ", processCourierData?.firstName, processCourierData?.middleName, processCourierData?.lastName) || ""}
            onChange={() => {}}
            disabled={true}
          />
        </div>

        <div className="field">
          <div className="heading">{t("ADDRESS")}</div>
          <TextInput
            className="field desktop-w-full"
            value={newAddress.locality || ""}
            onChange={(e) => {
              const value = e.target.value;
              setNewAddress({ ...newAddress, locality: value });

              if (!value || !patternValidation("address").test(value)) {
                setAddressErrors({
                  ...addressErrors,
                  locality: "CORE_COMMON_APPLICANT_ADDRESS_INVALID",
                });
              } else {
                setAddressErrors({ ...addressErrors, locality: null });
              }
            }}
          />
          {addressErrors.locality && <CardLabelError>{t(addressErrors.locality)}</CardLabelError>}
        </div>

        <div className="field">
          <div className="heading">{t("CITY/TOWN")}</div>
          <TextInput
            className="field desktop-w-full"
            value={newAddress.city || ""}
            onChange={(e) => {
              const value = e.target.value;
              setNewAddress({ ...newAddress, city: value });

              if (!value || !patternValidation("string").test(value)) {
                setAddressErrors({
                  ...addressErrors,
                  city: "CORE_COMMON_APPLICANT_CITY_INVALID",
                });
              } else {
                setAddressErrors({ ...addressErrors, city: null });
              }
            }}
          />
          {addressErrors.city && <CardLabelError>{t(addressErrors.city)}</CardLabelError>}
        </div>

        <div className="field">
          <div className="heading">{t("PINCODE")}</div>
          <TextInput
            className="field desktop-w-full"
            value={newAddress.pincode || ""}
            maxlength={6}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, "");
              setNewAddress({ ...newAddress, pincode: value });

              if (!value || !patternValidation("pincode").test(value)) {
                setAddressErrors({
                  ...addressErrors,
                  pincode: "ADDRESS_PINCODE_INVALID",
                });
              } else {
                setAddressErrors({ ...addressErrors, pincode: null });
              }
            }}
          />
          {addressErrors.pincode && <CardLabelError>{t(addressErrors.pincode)}</CardLabelError>}
        </div>

        <div className="field">
          <div className="heading">{t("DISTRICT")}</div>
          <TextInput
            className="field desktop-w-full"
            value={newAddress.district || ""}
            onChange={(e) => {
              const value = e.target.value;
              setNewAddress({ ...newAddress, district: value });

              if (!value || !patternValidation("string").test(value)) {
                setAddressErrors({
                  ...addressErrors,
                  district: "CORE_COMMON_APPLICANT_DISTRICT_INVALID",
                });
              } else {
                setAddressErrors({ ...addressErrors, district: null });
              }
            }}
          />
        </div>

        <div className="field">
          <div className="heading">{t("STATE")}</div>
          <TextInput
            className="field desktop-w-full"
            value={newAddress.state || ""}
            onChange={(e) => {
              const value = e.target.value;
              setNewAddress({ ...newAddress, state: value });

              if (!value || !patternValidation("string").test(value)) {
                setAddressErrors({
                  ...addressErrors,
                  state: "CORE_COMMON_APPLICANT_STATE_INVALID",
                });
              } else {
                setAddressErrors({ ...addressErrors, state: null });
              }
            }}
          />
          {addressErrors.state && <CardLabelError>{t(addressErrors.state)}</CardLabelError>}
        </div>
      </div>
    </Modal>
  );
};

export default AddAddressModal;
