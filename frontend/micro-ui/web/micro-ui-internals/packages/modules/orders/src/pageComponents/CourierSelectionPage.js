import React, { useMemo, useState } from "react";
import { InfoToolTipIcon } from "../../../dristi/src/icons/svgIndex";
import AddAddressModal from "./AddAddressModal";
import { openApiService } from "../hooks/services";
import { formatAddress } from "../utils/PaymentUtitls";

const AddIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8 0C8.55228 0 9 0.447715 9 1V7H15C15.5523 7 16 7.44772 16 8C16 8.55228 15.5523 9 15 9H9V15C9 15.5523 8.55228 16 8 16C7.44772 16 7 15.5523 7 15V9H1C0.447715 9 0 8.55228 0 8C0 7.44772 0.447715 7 1 7H7V1C7 0.447715 7.44772 0 8 0Z"
      fill="#007E7E"
    />
  </svg>
);

const CourierSelectionPage = ({ t, onNext, noticeData, setNoticeData, breakupResponse, tenantId, filingNumber, setShowErrorToast }) => {
  // Mock data structure for notices - this would come from props or API in a real implementation
  const [showAddAddressModal, setShowAddAddressModalLocal] = useState(false);
  const [currentNoticeId, setCurrentNoticeId] = useState(null);

  const isFormValid = useMemo(() => {
    return noticeData?.every((notice) => {
      const hasCourier = notice.courierOptions?.some((courier) => courier?.selected);
      const hasAddress = notice.addresses?.some((address) => address?.selected);
      return hasCourier && hasAddress;
    });
  }, [noticeData]);

  const recalculateCourierFees = (breakupResponse, noticeData) => {
    if (!breakupResponse?.Calculation?.length || !Array.isArray(noticeData)) return noticeData;

    const calculationList = breakupResponse?.Calculation;

    const data = noticeData?.map((notice) => {
      const selectedAddresses = notice?.addresses?.filter((addr) => addr?.selected) || [];

      // Case 1️⃣: No address selected → all channels off
      if (selectedAddresses.length === 0) {
        return {
          ...notice,
          courierOptions: (notice?.courierOptions || []).map((opt) => ({
            ...opt,
            fees: 0,
            selected: false,
          })),
        };
      }

      // Case 2️⃣: Some addresses selected → compute total fees per channel
      const newCourierMap = {};

      calculationList.forEach((calc) => {
        const [taskType, channelId, addressId] = calc?.applicationId?.split("_") || [];

        // Match only if this calculation belongs to this notice
        if (taskType !== notice?.orderType) return;

        const isAddressSelected = selectedAddresses?.some((a) => a?.id === addressId);
        if (!isAddressSelected) return;

        const key = channelId;
        if (!newCourierMap[key]) {
          newCourierMap[key] = {
            channelId,
            name: channelId === "RPAD" ? "REGISTERED_POST" : "E_POST",
            deliveryTime: channelId === "RPAD" ? "RPAD_DELIVERY_TIME" : "EPOST_DELIVERY_TIME",
            fees: 0,
            addressIds: [],
            selected: true, // auto-select when any address has it
          };
        }

        newCourierMap[key].fees += calc?.totalAmount || 0;
        newCourierMap[key].addressIds.push(addressId);
      });

      // Merge with existing courierOptions if already had them (retain selected flags)
      const mergedCourierOptions = Object.values(newCourierMap).map((opt) => {
        const existing = notice?.courierOptions?.find((c) => c?.channelId === opt?.channelId);
        return {
          ...opt,
          selected: existing ? existing.selected : opt.selected,
        };
      });

      return {
        ...notice,
        courierOptions: mergedCourierOptions,
      };
    });
    return data;
  };

  // Handler to toggle courier option selection
  const handleCourierChange = (noticeId, channelId) => {
    setNoticeData((prevNotices) =>
      prevNotices?.map((notice) => {
        if (notice?.id === noticeId) {
          const updatedCourierOptions = notice?.courierOptions?.map((courier) =>
            courier?.channelId === channelId ? { ...courier, selected: !courier?.selected } : courier
          );

          return { ...notice, courierOptions: updatedCourierOptions };
        }
        return notice;
      })
    );
  };

  // Handler to toggle address selection
  const handleAddressChange = (noticeId, addressId) => {
    setNoticeData((prevNotices) => {
      // Step 1: Toggle address selection
      const updatedNotices = prevNotices?.map((notice) => {
        if (notice?.id === noticeId) {
          const updatedAddresses = notice?.addresses?.map((addr) => (addr?.id === addressId ? { ...addr, selected: !addr?.selected } : addr));
          return { ...notice, addresses: updatedAddresses };
        }
        return notice;
      });

      // Step 2: Recalculate courier fees and selections
      const recalculatedNotices = recalculateCourierFees(breakupResponse, updatedNotices);

      // Step 3: Return updated notices
      return recalculatedNotices;
    });
  };

  const handleAddAddress = (noticeId) => {
    setCurrentNoticeId(noticeId);
    setShowAddAddressModalLocal(true);
  };

  // Handler to process data from the address modal
  const handleDataChange = async (data) => {
    if (!currentNoticeId || !data.address) return;
    try {
      // Format the address from the modal data
      const addressObj = data.address;
      const currentSelectedUserNotice = noticeData?.find((notice) => notice.id === currentNoticeId);

      const payload = {
        tenantId: tenantId,
        filingNumber: filingNumber,
        partyAddresses: [
          {
            addresses: [addressObj],
            partyType: ["Accused", "Respondent"]?.includes(currentSelectedUserNotice?.partyType) ? "Accused" : "Witness",
            uniqueId: currentSelectedUserNotice?.partyUniqueId,
          },
        ],
      };
      const addressResponse = await openApiService.addAddress(payload, {});

      const partyResponse = addressResponse?.partyAddressList?.[0];
      if (!partyResponse) return;

      const { uniqueId, addresses = [] } = partyResponse;
      const newAddr = addresses[0];
      if (!newAddr) return;

      const updatedNotices = noticeData?.map((notice) => {
        if (notice.id === currentNoticeId) {
          return {
            ...notice,
            addresses: [
              ...notice.addresses,
              {
                id: newAddr?.id,
                text: formatAddress(newAddr),
                addressDetails: { addressDetails: newAddr, id: newAddr?.id },
                selected: true,
              },
            ],
          };
        }
        return notice;
      });

      setNoticeData(updatedNotices);
      setShowAddAddressModalLocal(false);
    } catch (err) {
      console.error("Error while adding address", err);
      setShowErrorToast({ label: t("SOMETHING_WENT_WRONG"), error: true });
      throw err;
    }
  };

  return (
    <React.Fragment>
      <div className="sms-payment-courier-page">
        <div className="info-section">
          <div className="info-header">
            <InfoToolTipIcon />
            <h3>{t("CS_COMMON_NOTE")}</h3>
          </div>
          <div className="info-content">
            <p>{t("CS_TAKE_COURIER_NOTE")}</p>
          </div>
        </div>

        {noticeData?.map((notice) => (
          <div key={notice.id} className="notice-section">
            <div className="notice-header">
              {notice?.title && <div className="notice-text">{notice.title}</div>}
              {notice?.subtitle && <div className="notice-subtitle">{notice.subtitle}</div>}
            </div>

            <div className="address-selection-section">
              <h3>{t("CS_SELECT_ADDRESS_FOR_DELIVERY")}</h3>
              <p className="address-note">{t("CS_SELECT_ADDRESS_FOR_DELIVERY_NOTE")}</p>

              <div className="address-options">
                {notice?.addresses?.map((address) => (
                  <label key={address.id} className="address-option">
                    <input type="checkbox" checked={address.selected} onChange={() => handleAddressChange(notice.id, address.id)} />
                    <div className="address-text">{address?.text}</div>
                  </label>
                ))}
              </div>

              <button className="add-more-address" onClick={() => handleAddAddress(notice.id)}>
                <AddIcon /> {t("CS_ADD_MORE_ADDRESS")}
              </button>
            </div>

            <div className="courier-selection-section">
              <h3>{t("SELECT_COURIER_SERVICES")}</h3>
              <div className="courier-options">
                {notice?.courierOptions?.map((courier) => (
                  <label key={courier.id} className="courier-option">
                    <input type="checkbox" checked={courier.selected} onChange={() => handleCourierChange(notice.id, courier.channelId)} />
                    <div className="courier-details">
                      <div className="courier-name">
                        {t(courier?.name)} {courier?.fees ? `(INR ${courier.fees})` : ""}
                      </div>
                      <div className="delivery-time">{t(courier?.deliveryTime)}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="navigation-buttons">
        <button className={`next-button ${!isFormValid ? "disabled" : ""}`} onClick={isFormValid ? onNext : undefined} disabled={!isFormValid}>
          {t("CS_COMMONS_NEXT")}
        </button>
      </div>

      {showAddAddressModal && (
        <AddAddressModal
          t={t}
          processCourierData={noticeData?.find((notice) => notice.id === currentNoticeId) || {}}
          setShowAddAddressModalLocal={setShowAddAddressModalLocal}
          handleDataChange={handleDataChange}
        />
      )}
    </React.Fragment>
  );
};

export default CourierSelectionPage;
