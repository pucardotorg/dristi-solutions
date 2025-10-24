import React, { useMemo, useState } from "react";
import { InfoToolTipIcon } from "../../../dristi/src/icons/svgIndex";
import AddAddressModal from "./AddAddressModal";

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

const CourierSelectionPage = ({ t, onNext, noticeData, setNoticeData }) => {
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

  // Handler to toggle courier selection
  const handleCourierChange = (noticeId, courierId) => {
    const updatedNotices = noticeData?.map((notice) => {
      if (notice.id === noticeId) {
        return {
          ...notice,
          courierOptions: notice.courierOptions.map((courier) => {
            if (courier.id === courierId) {
              return { ...courier, selected: !courier.selected };
            }
            return courier;
          }),
        };
      }
      return notice;
    });

    setNoticeData(updatedNotices);
  };

  // Handler to toggle address selection
  const handleAddressChange = (noticeId, addressId) => {
    const updatedNotices = noticeData?.map((notice) => {
      if (notice.id === noticeId) {
        return {
          ...notice,
          addresses: notice.addresses.map((address) => {
            if (address.id === addressId) {
              return { ...address, selected: !address.selected };
            }
            return address;
          }),
        };
      }
      return notice;
    });

    setNoticeData(updatedNotices);
  };

  const handleAddAddress = (noticeId) => {
    setCurrentNoticeId(noticeId);
    setShowAddAddressModalLocal(true);
  };

  // Handler to process data from the address modal
  const handleDataChange = (data) => {
    if (!currentNoticeId || !data.addresses || data.addresses.length === 0) return;

    // Get the new address that was added
    const newAddressData = data.addresses[data.addresses.length - 1];
    if (!newAddressData || !newAddressData.addresses) return;
    // Format the address from the modal data
    const addressObj = newAddressData.addresses;
    const addressText = [addressObj.locality, addressObj.city, addressObj.district, addressObj.state, addressObj.pincode].filter(Boolean).join(", ");

    // Update the notices with the new address
    // TODO : Update Address API need to be called here to persist the new address
    const updatedNotices = noticeData?.map((notice) => {
      if (notice.id === currentNoticeId) {
        // Generate a new ID for the address
        const newAddressId = Math.max(...notice.addresses.map((a) => a.id), 0) + 1; // this might be removed when API is integrated

        return {
          ...notice,
          addresses: [
            ...notice.addresses,
            {
              id: newAddressId,
              text: addressText,
              selected: true,
            },
          ],
        };
      }
      return notice;
    });

    setNoticeData(updatedNotices);
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

            <div className="courier-selection-section">
              <h3>{t("SELECT_COURIER_SERVICES")}</h3>
              <div className="courier-options">
                {notice?.courierOptions?.map((courier) => (
                  <label key={courier.id} className="courier-option">
                    <input type="checkbox" checked={courier.selected} onChange={() => handleCourierChange(notice.id, courier.id)} />
                    <div className="courier-details">
                      <div className="courier-name">
                        {courier.name} ({courier.code})
                      </div>
                      <div className="delivery-time">{courier.deliveryTime}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="address-selection-section">
              <h3>{t("CS_SELECT_ADDRESS_FOR_DELIVERY")}</h3>
              <p className="address-note">{t("CS_SELECT_ADDRESS_FOR_DELIVERY_NOTE")}</p>

              <div className="address-options">
                {notice?.addresses?.map((address) => (
                  <label key={address.id} className="address-option">
                    <input type="checkbox" checked={address.selected} onChange={() => handleAddressChange(notice.id, address.id)} />
                    <div className="address-text">{address.text}</div>
                  </label>
                ))}
              </div>

              <button className="add-more-address" onClick={() => handleAddAddress(notice.id)}>
                <AddIcon /> {t("CS_ADD_MORE_ADDRESS")}
              </button>
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
