import React, { useEffect, useState } from "react";
import isEqual from "lodash/isEqual";
import CourierService from "./CourierService";
import Modal from "./Modal";
import { CloseSvg } from "@egovernments/digit-ui-react-components";
import { DRISTIService } from "../services";

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
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [summonsActive, setSummonsActive] = useState(false);
  const [noticeActive, setNoticeActive] = useState(false);
  const [checked, setChecked] = useState(false);
  const urlParams = new URLSearchParams(window.location.search);
  const caseId = urlParams.get("caseId");
  const tenantId = Digit.ULBService.getCurrentTenantId();

  const handleDataChange = (data) => {
    const updatedData = {
      ...processCourierData,
      ...data,
    };

    setProcessCourierData(updatedData);
    onSelect(config?.key, updatedData);
  };

  const handleAddressSelection = (addressId, isSelected) => {
    const updatedAddresses = processCourierData?.addressDetails?.map((addr) => {
      if (addr?.id === addressId) {
        return { ...addr, checked: isSelected };
      }
      return addr;
    });
    if (updatedAddresses?.every((addr) => !addr?.checked)) {
      handleDataChange({ addressDetails: updatedAddresses, noticeCourierService: [], summonsCourierService: [] });
    } else {
      handleDataChange({ addressDetails: updatedAddresses });
    }
  };

  const handleCourierServiceChange = (value, type) => {
    if (type === "notice") {
      handleDataChange({ noticeCourierService: value });
    } else if (type === "summons") {
      handleDataChange({ summonsCourierService: value });
    }
  };

  const handleAddAddress = async (newAddress, accusedData) => {
    const addressPayload = {
      tenantId,
      caseId,
      partyAddresses: [{ addresses: [newAddress], partyType: accusedData?.partyType, uniqueId: accusedData?.uniqueId }],
    };
    const response = await DRISTIService.addAddress(addressPayload, {});
    const updatedAddresses = [
      ...(processCourierData?.addressDetails || []),
      {
        addressDetails: newAddress,
        checked: true,
      },
    ];
  };

  useEffect(() => {
    if (formData?.[config?.key] && !isEqual(processCourierData, formData?.[config?.key])) {
      setProcessCourierData(formData?.[config?.key]);
    }
  }, [formData, config?.key, processCourierData]);

  return (
    <React.Fragment>
      <CourierService
        t={t}
        errors={errors}
        processCourierData={processCourierData}
        handleCourierServiceChange={handleCourierServiceChange}
        handleAddressSelection={handleAddressSelection}
        summonsActive={summonsActive}
        setSummonsActive={setSummonsActive}
        noticeActive={noticeActive}
        setNoticeActive={setNoticeActive}
        setChecked={setChecked}
        setShowConfirmationModal={setShowConfirmationModal}
        handleAddAddress={handleAddAddress}
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
            setChecked(false);
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
