import React, { useState } from "react";
import { Button, Dropdown } from "@egovernments/digit-ui-react-components";
import _ from "lodash";
import { useTranslation } from "react-i18next";
import GetPoliceStationModal from "./GetPoliceStationModal";

const compareAddressValues = (value1, value2) => {
  // Create copies without geoLocationDetails.policeStation
  const compareValue1 = {
    ...value1,
    geoLocationDetails: value1?.geoLocationDetails
      ? {
          ...value1.geoLocationDetails,
          policeStation: undefined,
        }
      : {
          policeStation: undefined,
        },
  };
  const compareValue2 = {
    ...value2,
    geoLocationDetails: value2?.geoLocationDetails
      ? {
          ...value2.geoLocationDetails,
          policeStation: undefined,
        }
      : {
          policeStation: undefined,
        },
  };
  return JSON.stringify(compareValue1) === JSON.stringify(compareValue2);
};

const WarrantRenderDeliveryChannels = ({
  partyDetails,
  deliveryChannels,
  handleCheckboxChange,
  handlePoliceStationChange,
  policeStationIdMapping,
  setPoliceStationIdMapping,
}) => {
  const { t } = useTranslation();
  const [isPoliceStationModalOpen, setIsPoliceStationModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addressId, setAddressId] = useState(null);
  const { data: policeStationData } = Digit.Hooks.useCustomMDMS(Digit.ULBService.getStateId(), "case", [{ name: "PoliceStation" }]);

  const handlePoliceStationSelect = (station, address, fromModal = false) => {
    const updatedPartyDetails = partyDetails?.map((detail) => {
      const changeFromModal = fromModal && detail.value?.id === addressId;
      if (compareAddressValues(detail.value, address) || changeFromModal) {
        return {
          ...detail,
          value: {
            ...detail.value,
            geoLocationDetails: {
              ...detail.value.geoLocationDetails,
              policeStation: station,
            },
          },
        };
      }
      return detail;
    });

    let updatedMapping = [...(policeStationIdMapping || [])];
    const existingIndex = updatedMapping?.findIndex((item) => item?.id === address?.id);

    if (existingIndex > -1) {
      updatedMapping[existingIndex] = {
        ...updatedMapping[existingIndex],
        policeStation: station,
      };
    } else {
      updatedMapping.push({
        id: address?.id,
        policeStation: station,
      });
    }

    handlePoliceStationChange(updatedPartyDetails, updatedMapping);
  };

  const addressMap = {};
  deliveryChannels?.forEach((channel) => {
    channel?.values?.forEach((value) => {
      const key = value?.id;
      if (!addressMap[key]) {
        addressMap[key] = {
          address: value,
          channels: [],
        };
      }
      addressMap[key]?.channels?.push({ ...channel, value });
    });
  });

  const addressList = Object.values(addressMap);

  return (
    <div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          height: 32,
          marginBottom: "1rem",
          marginTop: "1rem",
        }}
      >
        <h1>{t("SELECT_DELIVERY_CHANNELS")}</h1>
        <p>
          {partyDetails?.length || 0} of {deliveryChannels?.reduce((acc, channel) => acc + (channel.values?.length || 0), 0)} {t("SELECTED")}
        </p>
      </div>

      {addressList?.map((entry, index) => {
        const { address, channels } = entry;
        return (
          <div key={address?.id || index}>
            <label style={{ fontSize: "16px", color: "#0B0C0C", marginBottom: "1rem", fontWeight: "700" }}>
              {`${index + 1}. ${
                typeof address === "string" ? address : `${address?.locality}, ${address?.city}, ${address?.district}, ${address?.pincode}`
              }`}
            </label>

            <div style={{ padding: "1rem" }}>
              {channels?.some((ch) => ch.type === "Via Police") && (
                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ marginBottom: "5px" }}>{t("POLICE_STATION")}</div>
                  <Dropdown
                    option={policeStationData?.case?.PoliceStation || []}
                    optionKey="name"
                    selected={policeStationIdMapping?.find((item) => item?.id === address?.id)?.policeStation || {}}
                    select={(station) => handlePoliceStationSelect(station, address)}
                    t={t}
                    className="police-station-dropdown"
                  />
                  <div style={{ display: "flex", alignItems: "center", marginTop: "6px" }}>
                    <div>{t("TO_IDENTIFY_POLICE_STATION_FROM_LAT_LONG")}</div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAddress(address);
                        setAddressId(address?.id);
                        setIsPoliceStationModalOpen(true);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#007E7E",
                        padding: 0,
                        cursor: "pointer",
                        fontSize: "16px",
                        marginLeft: "10px",
                        fontWeight: "700",
                      }}
                    >
                      {t("CLICK_HERE_POLICE_STATION")}
                    </button>
                  </div>
                </div>
              )}

              <div style={{ paddingLeft: "1rem" }}>
                {channels?.map((ch, i) => {
                  const isChecked = partyDetails?.some((data) => data.type === ch.type && compareAddressValues(address, data.value));

                  return (
                    <div key={`${ch.type}-${index}-${i}`} style={{ display: "flex", alignItems: "center", marginTop: "10px" }}>
                      <input
                        type="checkbox"
                        id={`${ch.type}-${index}-${i}`}
                        checked={isChecked}
                        onChange={() => handleCheckboxChange(ch.type, ch.code, address)}
                        style={{ marginRight: "8px" }}
                      />
                      <label htmlFor={`${ch.type}-${index}-${i}`}>{t(ch.label)}</label>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}

      {isPoliceStationModalOpen && (
        <GetPoliceStationModal
          isOpen={isPoliceStationModalOpen}
          onClose={() => {
            setIsPoliceStationModalOpen(false);
            setAddressId(null);
          }}
          onPoliceStationSelect={(station) => {
            handlePoliceStationSelect(station, selectedAddress, true);
            setIsPoliceStationModalOpen(false);
            setAddressId(null);
          }}
          address={
            typeof selectedAddress === "string"
              ? selectedAddress
              : `${selectedAddress?.locality}, ${selectedAddress?.city}, ${selectedAddress?.district}, ${selectedAddress?.pincode}`
          }
        />
      )}
    </div>
  );
};

export default WarrantRenderDeliveryChannels;
