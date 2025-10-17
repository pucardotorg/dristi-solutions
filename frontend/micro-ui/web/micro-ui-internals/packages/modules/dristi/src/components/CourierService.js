import { Button, Dropdown, CardLabelError } from "@egovernments/digit-ui-react-components";
import React, { useState } from "react";
import { CustomAddIcon } from "../icons/svgIndex";
import ReactTooltip from "react-tooltip";
import { CustomMultiSelectDropdown } from "./CustomMultiSelectDropdown";
import Modal from "./Modal";

const InfoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M7.99984 2.00033C4.68613 2.00033 1.99984 4.68662 1.99984 8.00033C1.99984 11.314 4.68613 14.0003 7.99984 14.0003C11.3135 14.0003 13.9998 11.314 13.9998 8.00033C13.9998 4.68662 11.3135 2.00033 7.99984 2.00033ZM0.666504 8.00033C0.666504 3.95024 3.94975 0.666992 7.99984 0.666992C12.0499 0.666992 15.3332 3.95024 15.3332 8.00033C15.3332 12.0504 12.0499 15.3337 7.99984 15.3337C3.94975 15.3337 0.666504 12.0504 0.666504 8.00033ZM7.33317 5.33366C7.33317 4.96547 7.63165 4.66699 7.99984 4.66699H8.0065C8.37469 4.66699 8.67317 4.96547 8.67317 5.33366C8.67317 5.70185 8.37469 6.00033 8.0065 6.00033H7.99984C7.63165 6.00033 7.33317 5.70185 7.33317 5.33366ZM7.99984 7.33366C8.36803 7.33366 8.6665 7.63213 8.6665 8.00033V10.667C8.6665 11.0352 8.36803 11.3337 7.99984 11.3337C7.63165 11.3337 7.33317 11.0352 7.33317 10.667V8.00033C7.33317 7.63213 7.63165 7.33366 7.99984 7.33366Z"
      fill="#334155"
    />
  </svg>
);
function CourierService({
  t,
  config,
  processCourierData,
  courierOptions,
  handleCourierServiceChange,
  selectedAddresses,
  handleAddressSelection,
  active,
  setActive,
  checked,
  setChecked,
  setShowConfirmationModal,
}) {
  const formatAddress = (address) => {
    if (typeof address === "string") return address;

    if (address && typeof address === "object") {
      // Handle nested addressDetails structure
      const addressObj = address.addressDetails || address;
      const { pincode, city, district, locality, state } = addressObj;
      return [locality, city, district, state, pincode].filter(Boolean).join(", ");
    }

    return "";
  };

  return (
    <div className="accused-process-courier">
      <span className="header">{`${processCourierData?.index + 1}. ${t("CS_PROCESS_ACCUSED")} ${processCourierData?.index + 1}`}</span>

      <div className="process-courier-container">
        <div className="header-row">
          <div className="process-section">{t("CS_PROCESS")}</div>
          <div className="courier-section">{t("CS_COURIER_SERVICES")}</div>
        </div>

        {processCourierData?.isDelayCondonation && (
          <div className="row">
            <div className="label-container">
              <div className="label">{t("CS_NOTICE_COURIER")}</div>
              <div className="info-icon">
                <span style={{ position: "relative" }} data-tip data-for="notice-tooltip">
                  <InfoIcon />
                </span>
                <ReactTooltip id="notice-tooltip" place="bottom" content={t("CS_NOTICE_COURIER_TOOLTIP")}>
                  {t("CS_NOTICE_COURIER_TOOLTIP")}
                </ReactTooltip>
              </div>
            </div>
            <div className="dropdown-container">
              <CustomMultiSelectDropdown
                t={t}
                defaultLabel={t("SELECT_COURIER_SERVICES")}
                options={courierOptions}
                selected={processCourierData?.noticeCourierService}
                onSelect={(value) => handleCourierServiceChange(value, "notice")}
                optionsKey="name"
                disable={selectedAddresses?.length === 0}
              />
              {/* <Dropdown
                t={t}
                placeholder={t("SELECT_COURIER_SERVICES")}
                option={courierOptions}
                selected={processCourierData?.noticeCourierService}
                select={(value) => handleCourierServiceChange(value, "notice")}
                optionKey="name"
                disable={selectedAddresses?.length === 0}
              /> */}
            </div>
          </div>
        )}

        <div className="row">
          <div className="label-container">
            <div className="label">{t("CS_SUMMONS_COURIER")}</div>
            {processCourierData?.isDelayCondonation ? (
              <div className="optional">{t("CS_IS_OPTIONAL")}</div>
            ) : (
              <div className="info-icon">
                <span style={{ position: "relative" }} data-tip data-for="summons-tooltip">
                  <InfoIcon />
                </span>
                <ReactTooltip id="summons-tooltip" place="bottom" content={t("CS_SUMMONS_COURIER_TOOLTIP")}>
                  {t("CS_SUMMONS_COURIER_TOOLTIP")}
                </ReactTooltip>
              </div>
            )}
          </div>
          <div
            className="dropdown-container"
            onClick={() => {
              if (!active && processCourierData?.isDelayCondonation && processCourierData?.summonsCourierService?.length === 0) {
                setShowConfirmationModal(true);
              }
            }}
          >
            <CustomMultiSelectDropdown
              t={t}
              defaultLabel={t("SELECT_COURIER_SERVICES")}
              options={courierOptions}
              selected={processCourierData?.summonsCourierService}
              onSelect={(value) => {
                handleCourierServiceChange(value, "summons");
              }}
              optionsKey="name"
              disable={
                selectedAddresses?.length === 0 ||
                (!active && processCourierData?.isDelayCondonation && processCourierData?.summonsCourierService?.length === 0)
              }
              active={active}
              setActive={setActive}
            />
            {/* <Dropdown
              t={t}
              placeholder={t("SELECT_COURIER_SERVICES")}
              option={courierOptions}
              selected={processCourierData?.summonsCourierService}
              select={(value) => handleCourierServiceChange(value, "summons")}
              optionKey="name"
              disable={selectedAddresses?.length === 0}
            /> */}
          </div>
        </div>

        <div className="address-section">
          <div className="address-header">
            <div className="address-title">{t("CS_SELECT_ADDRESS_FOR_DELIVERY")}</div>
            <div className="address-note">{t("CS_SELECT_ADDRESS_FOR_DELIVERY_NOTE")}</div>
          </div>

          <div className="address-list">
            {processCourierData?.addressDetails?.map((address, idx) => (
              <div key={address.id || idx} className="address-item">
                <input
                  type="checkbox"
                  className="custom-checkbox"
                  id={`address-${address.id || idx}`}
                  checked={selectedAddresses?.some((selectedAddr) =>
                    selectedAddr.id && address.id
                      ? selectedAddr.id === address.id
                      : typeof selectedAddr?.addressDetails === "object" && typeof address?.addressDetails === "object"
                      ? JSON?.stringify(selectedAddr?.addressDetails) === JSON?.stringify(address?.addressDetails)
                      : selectedAddr?.addressDetails === address?.addressDetails
                  )}
                  onChange={(e) => handleAddressSelection(address?.addressDetails, address?.id, e.target.checked)}
                />
                <label htmlFor={`address-${address.id || idx}`}>{formatAddress(address)}</label>
              </div>
            ))}
            {(!processCourierData?.addressDetails || processCourierData?.addressDetails?.length === 0) && (
              <div className="no-addresses">{t("CS_NO_ADDRESS_AVAILABLE")}</div>
            )}
          </div>
          <Button
            variation="secondary"
            // onButtonClick={handleAddForm}
            className="add-address-btn"
            icon={<CustomAddIcon />}
            label={t("CS_ADD_MORE_ADDRESS")}
          ></Button>
        </div>
      </div>
    </div>
  );
}
export default CourierService;
