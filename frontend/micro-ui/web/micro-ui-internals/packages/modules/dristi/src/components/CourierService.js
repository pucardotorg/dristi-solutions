import { Button, TextInput, CardLabelError, CloseSvg, Loader } from "@egovernments/digit-ui-react-components";
import React, { useEffect, useMemo, useState, useRef } from "react";
import { CustomAddIcon } from "../icons/svgIndex";
import ReactTooltip from "react-tooltip";
import { CustomMultiSelectDropdown } from "./CustomMultiSelectDropdown";
import Modal from "./Modal";
import SelectCustomNote from "./SelectCustomNote";
import { getFormattedName } from "@egovernments/digit-ui-module-orders/src/utils";

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

function CourierService({
  t,
  isDelayCondonation,
  isLoading = false,
  processCourierData,
  handleCourierServiceChange,
  handleAddressSelection,
  summonsActive,
  setSummonsActive,
  noticeActive,
  setNoticeActive,
  setShowConfirmationModal,
  handleAddAddress,
  orderType,
  isDisableAllFields = false,
}) {
  const [newAddress, setNewAddress] = useState({});
  const [addressErrors, setAddressErrors] = useState({});
  const [showAddAddressModal, setShowAddAddressModalLocal] = useState(false);
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const hasSetInitialDefaults = useRef(false);

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

  const paymentCriteriaList = useMemo(() => {
    if (!processCourierData?.addressDetails?.length) return [];

    // add "EPOST" when it is needed
    const channels = ["RPAD"];
    const taskTypes = orderType ? [orderType] : ["NOTICE", "SUMMONS"];

    return processCourierData?.addressDetails?.flatMap((addr) =>
      taskTypes?.flatMap((taskType) =>
        channels?.map((channelId) => ({
          channelId,
          receiverPincode: addr?.addressDetails?.pincode,
          tenantId,
          id: `${taskType}_${channelId}_${addr?.id}`,
          taskType,
        }))
      )
    );
  }, [processCourierData, tenantId, orderType]);

  const { data: breakupResponse, isLoading: isBreakUpLoading } = window?.Digit?.Hooks?.dristi?.useSummonsPaymentBreakUp(
    {
      Criteria: paymentCriteriaList,
    },
    {},
    `PAYMENT-${processCourierData?.uniqueId}-${processCourierData?.addressDetails?.length}-${paymentCriteriaList?.length > 0}`,
    Boolean(paymentCriteriaList?.length > 0)
  );

  const courierOptions = useMemo(() => {
    if (!breakupResponse?.Calculation?.length) return [];

    const checkedAddressIds = processCourierData?.addressDetails?.filter((addr) => addr?.checked)?.map((addr) => addr?.id) || [];

    const grouped = breakupResponse?.Calculation?.reduce((acc, item) => {
      const [taskType, channelId, addressId] = item?.applicationId?.split("_");
      const key = `${taskType}_${channelId}`;

      const isAddressChecked = checkedAddressIds?.includes(addressId);

      if (!acc[key]) {
        acc[key] = {
          channelId: channelId,
          taskType,
          fees: 0,
          channelCode: channelId === "RPAD" ? "REGISTERED_POST" : "E_POST",
          channelDeliveryTime: channelId === "RPAD" ? "RPAD_DELIVERY_TIME" : "EPOST_DELIVERY_TIME",
        };
      }

      if (isAddressChecked) {
        acc[key].fees += item?.totalAmount || 0;
      }

      return acc;
    }, {});

    const options = Object?.values(grouped)?.map((item) => ({
      ...item,
      deliveryChannelName: `${t(item?.channelCode)} (INR ${item?.fees}) • ${t(item?.channelDeliveryTime)}`,
    }));

    if (Array.isArray(processCourierData?.noticeCourierService) && processCourierData?.noticeCourierService?.length > 0) {
      const noticeOptions = options?.filter((opt) => opt?.taskType === "NOTICE");
      const needsUpdate = processCourierData?.noticeCourierService?.some((selected) => {
        const updatedOption = noticeOptions?.find((opt) => opt?.channelId === selected?.channelId);
        return updatedOption && updatedOption?.fees !== selected?.fees;
      });
      if (needsUpdate) {
        const updatedSelections = processCourierData?.noticeCourierService?.map((selected) => {
          const updatedOption = noticeOptions?.find((opt) => opt?.channelId === selected?.channelId);
          return updatedOption || selected;
        });
        handleCourierServiceChange(updatedSelections, "notice");
      }
    }

    if (Array.isArray(processCourierData?.summonsCourierService) && processCourierData?.summonsCourierService?.length > 0) {
      const summonsOptions = options?.filter((opt) => opt?.taskType === "SUMMONS");
      const needsUpdate = processCourierData?.summonsCourierService?.some((selected) => {
        const updatedOption = summonsOptions?.find((opt) => opt?.channelId === selected?.channelId);
        return updatedOption && updatedOption?.fees !== selected?.fees;
      });
      if (needsUpdate) {
        const updatedSelections = processCourierData?.summonsCourierService.map((selected) => {
          const updatedOption = summonsOptions?.find((opt) => opt?.channelId === selected?.channelId);
          return updatedOption || selected;
        });
        handleCourierServiceChange(updatedSelections, "summons");
      }
    }

    return options;
  }, [breakupResponse, processCourierData, t, handleCourierServiceChange]);

  useEffect(() => {
    if (courierOptions?.length > 0 && !hasSetInitialDefaults.current) {
      if (
        (orderType === "NOTICE" || isDelayCondonation) &&
        (!processCourierData?.noticeCourierService || processCourierData?.noticeCourierService?.length === 0)
      ) {
        const rpadNoticeOption = courierOptions?.find((option) => option?.channelId === "RPAD" && option?.taskType === "NOTICE");
        if (rpadNoticeOption) {
          handleCourierServiceChange([rpadNoticeOption], "notice");
        }
      }

      if (
        (orderType === "SUMMONS" || (!orderType && !isDelayCondonation)) &&
        (!processCourierData?.summonsCourierService || processCourierData?.summonsCourierService?.length === 0)
      ) {
        const rpadSummonsOption = courierOptions?.find((option) => option?.channelId === "RPAD" && option?.taskType === "SUMMONS");
        if (rpadSummonsOption) {
          handleCourierServiceChange([rpadSummonsOption], "summons");
        }
      }

      hasSetInitialDefaults.current = true;
    }
  }, [courierOptions, orderType, isDelayCondonation, handleCourierServiceChange, processCourierData]);

  if (isBreakUpLoading || isLoading) {
    return (
      <div style={{ height: "500px", alignContent: "center" }}>
        <Loader />
      </div>
    );
  }

  return (
    <div className="accused-process-courier">
      {!orderType && (
        <span className="header">{`${processCourierData?.index + 1}. ${t("CS_PROCESS_ACCUSED")} ${processCourierData?.index + 1}`}</span>
      )}
      {orderType && (
        <SelectCustomNote
          t={t}
          config={{
            populators: {
              inputs: [
                {
                  infoHeader: "CS_COMMON_NOTE",
                  infoText: "CS_TAKE_COURIER_NOTE",
                  infoTooltipMessage: "CS_TAKE_COURIER_NOTE",
                  type: "InfoComponent",
                },
              ],
            },
          }}
        />
      )}
      <div className="process-courier-container">
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
                  checked={address?.checked}
                  disabled={isDisableAllFields}
                  onChange={(e) => handleAddressSelection(address?.id, e.target.checked)}
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
            onButtonClick={() => setShowAddAddressModalLocal(true)}
            className="add-address-btn"
            icon={<CustomAddIcon />}
            label={t("CS_ADD_MORE_ADDRESS")}
            isDisabled={isDisableAllFields}
          ></Button>
        </div>

        <div className="header-row" style={orderType ? {} : { marginTop: "12px" }}>
          <div className="process-section">{orderType ? t("CS_TAKE_STEPS") : t("CS_PROCESS")}</div>
          <div className="courier-section">{orderType ? t("CS_COURIER_SERVICE") : t("CS_COURIER_SERVICES")}</div>
        </div>

        {(orderType === "NOTICE" || isDelayCondonation) && (
          <div className="row" style={orderType ? { marginBottom: "24px" } : {}}>
            <div className="label-container">
              <div className="label">{t("CS_NOTICE_COURIER")}</div>
              {!orderType && (
                <div className="info-icon">
                  <span style={{ position: "relative" }} data-tip data-for="notice-tooltip">
                    <InfoIcon />
                  </span>
                  <ReactTooltip id="notice-tooltip" place="bottom" content={t("CS_NOTICE_COURIER_TOOLTIP")}>
                    {t("CS_NOTICE_COURIER_TOOLTIP")}
                  </ReactTooltip>
                </div>
              )}
            </div>
            <div className="dropdown-container">
              <CustomMultiSelectDropdown
                t={t}
                defaultLabel={t("SELECT_COURIER_SERVICES")}
                options={courierOptions?.filter((option) => option?.taskType === "NOTICE")}
                selected={processCourierData?.noticeCourierService}
                onSelect={(value) => handleCourierServiceChange(value, "notice")}
                optionsKey="deliveryChannelName"
                displayKey="channelCode"
                filterKey="deliveryChannelName"
                disable={isDisableAllFields || processCourierData?.addressDetails?.filter((addr) => addr?.checked)?.length === 0}
                active={noticeActive}
                setActive={setNoticeActive}
              />
            </div>
          </div>
        )}

        {(orderType === "SUMMONS" || !orderType) && (
          <div className="row" style={orderType ? { marginBottom: "24px" } : {}}>
            <div className="label-container">
              <div className="label">{t("CS_SUMMONS_COURIER")}</div>
              {!orderType &&
                (isDelayCondonation ? (
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
                ))}
            </div>
            <div
              className="dropdown-container"
              onClick={() => {
                if (!summonsActive && isDelayCondonation && processCourierData?.summonsCourierService?.length === 0) {
                  setShowConfirmationModal(true);
                }
              }}
            >
              <CustomMultiSelectDropdown
                t={t}
                defaultLabel={t("SELECT_COURIER_SERVICES")}
                options={courierOptions?.filter((option) => option?.taskType === "SUMMONS")}
                selected={processCourierData?.summonsCourierService}
                onSelect={(value) => {
                  handleCourierServiceChange(value, "summons");
                }}
                optionsKey="deliveryChannelName"
                displayKey="channelCode"
                filterKey="deliveryChannelName"
                disable={
                  isDisableAllFields ||
                  processCourierData?.addressDetails?.filter((addr) => addr?.checked)?.length === 0 ||
                  (!summonsActive && isDelayCondonation && processCourierData?.summonsCourierService?.length === 0)
                }
                active={summonsActive}
                setActive={setSummonsActive}
              />
            </div>
          </div>
        )}
      </div>

      {showAddAddressModal && (
        <Modal
          headerBarMain={<Heading label={t("CS_ADD_ADDRESS")} />}
          headerBarEnd={
            <CloseBtn
              onClick={() => {
                if (isAddressLoading) return;
                setShowAddAddressModalLocal(false);
              }}
            />
          }
          actionCancelLabel={t("CS_ADDRESS_CANCEL")}
          actionCancelOnSubmit={() => {
            if (isAddressLoading) return;
            setShowAddAddressModalLocal(false);
          }}
          actionSaveLabel={t("CS_ADDRESS_CONFIRM")}
          actionSaveOnSubmit={async () => {
            try {
              setIsAddressLoading(true);
              await handleAddAddress(newAddress, processCourierData);
              setNewAddress({});
              setAddressErrors({});
              setShowAddAddressModalLocal(false);
            } catch (error) {
              console.error(error);
            } finally {
              setIsAddressLoading(false);
            }
          }}
          isDisabled={
            isAddressLoading ||
            !newAddress ||
            !newAddress.locality ||
            !newAddress.city ||
            !newAddress.pincode ||
            !newAddress.district ||
            !newAddress.state ||
            Object.values(addressErrors).some((error) => error)
          }
          className="add-address-modal"
          popupStyles={{ maxWidth: "600px", width: "100%" }}
        >
          {isAddressLoading ? (
            <Loader />
          ) : (
            <div className="address-card-input">
              <div className="field">
                <div className="heading">{orderType ? t("TASK_ADDRESS_RECIPIENT_NAME") : t("CS_RESPONDENT_NAME")}</div>
                <TextInput
                  className="field desktop-w-full"
                  value={
                    getFormattedName(
                      processCourierData?.firstName,
                      processCourierData?.middleName,
                      processCourierData?.lastName,
                      processCourierData?.witnessDesignation,
                      ""
                    ) || ""
                  }
                  onChange={() => {}}
                  disabled={true}
                />
              </div>
              <div className="field">
                <div className="heading">{t("ADDRESS")}</div>
                <TextInput
                  className="field desktop-w-full"
                  value={newAddress.locality || ""}
                  placeholder={t("CS_TASK_ADDRESS_PLACEHOLDER")}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNewAddress({ ...newAddress, locality: value });

                    if (!value || !patternValidation("address").test(value)) {
                      setAddressErrors({ ...addressErrors, locality: "CORE_COMMON_APPLICANT_ADDRESS_INVALID" });
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
                  placeholder={t("CS_TASK_CITY_PLACEHOLDER")}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNewAddress({ ...newAddress, city: value });

                    if (!value || !patternValidation("string").test(value)) {
                      setAddressErrors({ ...addressErrors, city: "CORE_COMMON_APPLICANT_CITY_INVALID" });
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
                  placeholder={t("CS_TASK_PINCODE_PLACEHOLDER")}
                  maxlength={6}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, "");
                    setNewAddress({ ...newAddress, pincode: value });

                    if (!value || !patternValidation("pincode").test(value)) {
                      setAddressErrors({ ...addressErrors, pincode: "ADDRESS_PINCODE_INVALID" });
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
                  placeholder={t("CS_TASK_DISTRICT_PLACEHOLDER")}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNewAddress({ ...newAddress, district: value });

                    if (!value || !patternValidation("string").test(value)) {
                      setAddressErrors({ ...addressErrors, district: "CORE_COMMON_APPLICANT_DISTRICT_INVALID" });
                    } else {
                      setAddressErrors({ ...addressErrors, district: null });
                    }
                  }}
                />
                {addressErrors.district && <CardLabelError>{t(addressErrors.district)}</CardLabelError>}
              </div>
              <div className="field">
                <div className="heading">{t("STATE")}</div>
                <TextInput
                  className="field desktop-w-full"
                  value={newAddress.state || ""}
                  placeholder={t("CS_TASK_STATE_PLACEHOLDER")}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNewAddress({ ...newAddress, state: value });

                    if (!value || !patternValidation("string").test(value)) {
                      setAddressErrors({ ...addressErrors, state: "CORE_COMMON_APPLICANT_STATE_INVALID" });
                    } else {
                      setAddressErrors({ ...addressErrors, state: null });
                    }
                  }}
                />
                {addressErrors.state && <CardLabelError>{t(addressErrors.state)}</CardLabelError>}
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
export default CourierService;
