import React, { useEffect, useState } from "react";
import isEqual from "lodash/isEqual";
import CourierService from "./CourierService";
import Modal from "./Modal";
import { CloseSvg } from "@egovernments/digit-ui-react-components";

const Heading = (props) => {
  return <h1 className="main-heading">{props.label}</h1>;
};

const CloseBtn = (props) => {
  return (
    <div onClick={props?.onClick} style={{ height: "100%", display: "flex", alignItems: "center", paddingRight: "20px", cursor: "pointer" }}>
      <CloseSvg />
    </div>
  );
};

function ProcessCourierService({ t, config, onSelect, formData, errors, setError, clearErrors }) {
  // Initialize state based on formData or default values
  const [processCourierData, setProcessCourierData] = useState(formData?.[config?.key] || {});
  const [selectedAddresses, setSelectedAddresses] = useState(processCourierData?.addressDetails || []);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [summonsActive, setSummonsActive] = useState(false);
  const [noticeActive, setNoticeActive] = useState(false);
  const [checked, setChecked] = useState(false);

  const handleDataChange = (data) => {
    const updatedData = {
      ...processCourierData,
      ...data,
    };

    setProcessCourierData(updatedData);
    onSelect(config?.key, updatedData);
  };

  const handleAddressSelection = (address, addressId, isSelected) => {
    const updatedAddresses = isSelected
      ? [...selectedAddresses, { addressDetails: address, id: addressId }]
      : selectedAddresses.filter((addr) => addr.id !== addressId);
    setSelectedAddresses(updatedAddresses);
  };

  const handleCourierServiceChange = (value, type) => {
    if (type === "notice") {
      handleDataChange({ noticeCourierService: value });
    } else if (type === "summons") {
      handleDataChange({ summonsCourierService: value });
    }
  };

  useEffect(() => {
    if (formData?.[config?.key] && !isEqual(processCourierData, formData?.[config?.key])) {
      setProcessCourierData(formData?.[config?.key]);
    }
  }, [formData, config?.key, processCourierData]);

  useEffect(() => {
    if (processCourierData) {
      if (processCourierData.addressDetails) {
        setSelectedAddresses(processCourierData.addressDetails);
      }
    }
  }, [processCourierData]);

  const courierOptions = config?.populators?.inputs?.find((input) => input.type === "courierOptions")?.options || [
    { code: "Registered Post", name: "Registered Post (INR 40) • 10-15 days delivery" },
    { code: "E-Post", name: "E-Post (INR 50) • 3-5 days delivery" },
  ];

  return (
    <React.Fragment>
      <CourierService
        t={t}
        errors={errors}
        processCourierData={processCourierData}
        courierOptions={courierOptions}
        handleCourierServiceChange={handleCourierServiceChange}
        selectedAddresses={selectedAddresses}
        handleAddressSelection={handleAddressSelection}
        summonsActive={summonsActive}
        setSummonsActive={setSummonsActive}
        noticeActive={noticeActive}
        setNoticeActive={setNoticeActive}
        setChecked={setChecked}
        setShowConfirmationModal={setShowConfirmationModal}
        handleDataChange={handleDataChange}
      />
      {showConfirmationModal && (
        <Modal
          headerBarMain={<Heading label={t("CONSENT_FOR_SUMMON")} />}
          headerBarEnd={
            <CloseBtn
              onClick={() => {
                setShowConfirmationModal(false);
              }}
            />
          }
          actionCancelLabel={t("CS_SUMMON_CANCEL")}
          actionCancelOnSubmit={() => setShowConfirmationModal(false)}
          actionSaveLabel={t("CS_SUMMON_CONFIRM")}
          actionSaveOnSubmit={() => {
            setSummonsActive(true);
            setShowConfirmationModal(false);
          }}
          isDisabled={!checked}
        >
          <div className="confirmation-modal-content">
            <h3 className="consent-title" style={{ color: "#0B0C0C", marginBottom: "16px" }}>
              {t("CS_SUMMON_PLEASE_CONFIRM")} <span style={{ color: "red" }}>*</span>
            </h3>
            <div className="consent-checkbox-container" style={{ display: "flex", alignItems: "flex-start", marginBottom: "16px" }}>
              <input
                type="checkbox"
                id="consent-checkbox"
                checked={checked}
                readOnly
                style={{ marginRight: "8px", marginTop: "4px" }}
                onChange={() => setChecked(!checked)}
              />
              <label htmlFor="consent-checkbox" style={{ color: "#0B0C0C", fontSize: "16px" }}>
                {t("CS_SUMMON_PLEASE_CONFIRM_TEXT")}
              </label>
            </div>
          </div>
        </Modal>
      )}
    </React.Fragment>
  );
}

export default ProcessCourierService;
