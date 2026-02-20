import React, { useState, useEffect } from "react";
import { Button, Dropdown } from "@egovernments/digit-ui-react-components";
import _ from "lodash";
import { useTranslation } from "react-i18next";
import GetPoliceStationModal from "./GetPoliceStationModal";
import { formatAddress } from "../utils";

const compareAddressValues = (value1, value2) => {
  const compareValue1 = {
    ...value1,
    geoLocationDetails: value1?.geoLocationDetails ? { ...value1.geoLocationDetails, policeStation: undefined } : { policeStation: undefined },
  };
  const compareValue2 = {
    ...value2,
    geoLocationDetails: value2?.geoLocationDetails ? { ...value2.geoLocationDetails, policeStation: undefined } : { policeStation: undefined },
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
  config,
  setSelectedChannels,
  onSelect,
  formData,
}) => {
  const { t } = useTranslation();
  const [isPoliceStationModalOpen, setIsPoliceStationModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addressId, setAddressId] = useState(null);
  const [enabledAddresses, setEnabledAddresses] = useState([]);

  const { data: policeStationData } = Digit.Hooks.useCustomMDMS(Digit.ULBService.getStateId(), "case", [{ name: "PoliceStation" }]);

  // Map addresses by ID
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

  // Auto-select addresses based on existing partyDetails
  useEffect(() => {
    const autoSelected = [];

    addressList.forEach(({ address }) => {
      const isChecked = partyDetails?.some((detail) => compareAddressValues(detail.value, address));
      if (isChecked) {
        autoSelected.push(address?.id);
      }
    });

    setEnabledAddresses((prev) => _.uniq([...prev, ...autoSelected]));
  }, [partyDetails, deliveryChannels]);

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

  const handleAddressToggle = (address, isChecked) => {
    const id = address?.id;
    if (isChecked) {
      setEnabledAddresses((prev) => _.uniq([...prev, id]));
      const viaPoliceChannel = addressMap?.[id]?.channels?.find((ch) => ch.type === "Via Police");

      const alreadyExists = partyDetails?.some((detail) => detail.type === "Via Police" && compareAddressValues(detail.value, address));
      if (viaPoliceChannel && !alreadyExists) {
        handleCheckboxChange("Via Police", "POLICE", address);
      }
    } else {
      setEnabledAddresses((prev) => prev.filter((addrId) => addrId !== id));

      const currentPartyDetails = partyDetails || [];

      // Filter out all entries related to this address in one operation
      const filteredPartyDetails = currentPartyDetails?.filter((detail) => !compareAddressValues(detail.value, address));

      // Update state in one go rather than multiple calls
      setSelectedChannels(filteredPartyDetails);
      onSelect(config?.key, {
        ...formData[config?.key],
        selectedChannels: filteredPartyDetails,
      });
    }
  };

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

      <div style={{ marginBottom: "1rem", fontSize: "medium", fontWeight: 700 }}>{t("VIA_POLICE_TO")}</div>

      {addressList?.map((entry, index) => {
        const { address, channels } = entry;
        const isEnabled = enabledAddresses.includes(address?.id);

        return (
          <div key={address?.id || index} style={{ marginBottom: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.1rem" }}>
              <input type="checkbox" id={`address-${index}`} checked={isEnabled} onChange={(e) => handleAddressToggle(address, e.target.checked)} />
              <label htmlFor={`address-${index}`} style={{ fontSize: "16px", fontWeight: "700" }}>
                {typeof address === "string" ? address : formatAddress(address)}
              </label>
            </div>

            <div
              style={{
                padding: "1rem",
                opacity: isEnabled ? 1 : 0.5,
                pointerEvents: isEnabled ? "auto" : "none",
              }}
            >
              {channels?.some((ch) => ch.type === "Via Police") && (
                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ marginBottom: "5px" }}>{t("POLICE_STATION")}</div>
                  <Dropdown
                    option={policeStationData?.case?.PoliceStation?.sort((a, b) => t(a?.name)?.localeCompare(t(b?.name))) || []}
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
