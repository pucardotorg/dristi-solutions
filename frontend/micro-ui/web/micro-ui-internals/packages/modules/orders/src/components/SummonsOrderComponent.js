import React, { useCallback, useEffect, useMemo, useState } from "react";
import useSearchCaseService from "../../../dristi/src/hooks/dristi/useSearchCaseService";
import { Button, Dropdown } from "@egovernments/digit-ui-react-components";
import _ from "lodash";
import AddParty from "../../../hearings/src/pages/employee/AddParty";
import { DRISTIService } from "@egovernments/digit-ui-module-dristi/src/services";
import { useTranslation } from "react-i18next";
import { getFormattedName } from "../utils";
import GetPoliceStationModal from "./GetPoliceStationModal";

// Helper function to compare addresses without police station data
const compareAddressValues = (value1, value2) => {
  // Create copies without geoLocationDetails.policeStation
  const compareValue1 = {
    ...value1,
    geoLocationDetails: value1?.geoLocationDetails
      ? {
          ...value1.geoLocationDetails,
          policeStation: undefined,
        }
      : undefined,
  };
  const compareValue2 = {
    ...value2,
    geoLocationDetails: value2?.geoLocationDetails
      ? {
          ...value2.geoLocationDetails,
          policeStation: undefined,
        }
      : undefined,
  };
  return JSON.stringify(compareValue1) === JSON.stringify(compareValue2);
};

const getUserOptions = (userList, t, displayPartyType) => {
  return userList?.map((user) => {
    const { firstName, middleName, lastName, partyType, witnessDesignation } = user?.data || {};
    const isWitness = partyType?.toLowerCase() === "witness";

    const partyTypeLabel = partyType ? `(${t(displayPartyType[partyType.toLowerCase()])})` : "";

    // Witness formatting logic
    let label = "";
    if (isWitness) {
      label = getFormattedName(firstName, middleName, witnessDesignation, partyTypeLabel);
    } else {
      // Default formatting for non-witness users
      label = getFormattedName(firstName, middleName, lastName, null, partyTypeLabel);
    }

    return { label, value: user };
  });
};

const RenderDeliveryChannels = ({ partyDetails, deliveryChannels, handleCheckboxChange, handlePoliceStationChange }) => {
  const { t } = useTranslation();
  const [isPoliceStationModalOpen, setIsPoliceStationModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const { data: policeStationData } = Digit.Hooks.useCustomMDMS(Digit.ULBService.getStateId(), "case", [{ name: "PoliceStation" }]);

  const handlePoliceStationSelect = (station, address) => {
    const updatedPartyDetails = partyDetails.map((detail) => {
      if (detail.type === "Via Police" && compareAddressValues(detail.value, address)) {
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
    handlePoliceStationChange(updatedPartyDetails);
  };

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", height: 32 }}>
        <h1>{t("SELECT_DELIVERY_CHANNELS")}</h1>
        <p>
          {partyDetails?.length || 0} of {deliveryChannels.reduce((acc, channel) => acc + (channel.values?.length || 0), 0)} {t("SELECTED")}
        </p>
      </div>
      <form>
        {deliveryChannels.map((channel) => (
          <div key={channel?.type}>
            {Array.isArray(channel?.values) && channel?.values?.length > 0 && channel?.values[0] != null && (
              <div>
                <h2>
                  <strong>{t(channel.label)} to </strong>
                </h2>

                {Array.isArray(channel?.values) &&
                  channel?.values?.map((value, index) => (
                    <div key={`${channel.type}-${index}`} style={{ marginBottom: "16px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start" }}>
                        <input
                          type="checkbox"
                          id={`${channel.type}-${index}`}
                          checked={
                            Array.isArray(partyDetails) &&
                            partyDetails.some((data) => data.type === channel.type && compareAddressValues(value, data.value))
                          }
                          onChange={() => handleCheckboxChange(channel.type, channel.code, value)}
                          style={{ marginTop: "4px" }}
                        />
                        <div style={{ marginLeft: "12px", flex: 1 }}>
                          <label htmlFor={`${channel.type}-${index}`} style={{ fontSize: "16px", color: "#0B0C0C" }}>
                            {channel.type === "e-Post" || channel.type === "Via Police" || channel.type === "Registered Post"
                              ? typeof value.address === "string"
                                ? value.address
                                : `${value.locality}, ${value.city}, ${value.district}, ${value.pincode}`
                              : value}
                          </label>
                          {channel.type === "Via Police" && (
                            <div style={{ marginTop: "16px" }}>
                              <div style={{ marginBottom: "8px" }}>
                                <Dropdown
                                  option={policeStationData?.case?.PoliceStation || []}
                                  optionKey="name"
                                  selected={
                                    value?.geoLocationDetails?.policeStation ||
                                    partyDetails?.find((detail) => detail.type === "Via Police" && compareAddressValues(detail.value, value))?.value
                                      ?.geoLocationDetails?.policeStation
                                  }
                                  select={(station) => handlePoliceStationSelect(station, value)}
                                  t={t}
                                  placeholder={t("SELECT_POLICE_STATION")}
                                  className="police-station-dropdown"
                                />
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <div style={{ color: "#505A5F", fontSize: "14px" }}>{t("TO_IDENTIFY_POLICE_STATION_FROM_LAT_LONG")}</div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setSelectedAddress(value);
                                    setIsPoliceStationModalOpen(true);
                                  }}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    color: "#1DB4AE",
                                    padding: 0,
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    textDecoration: "underline",
                                  }}
                                >
                                  {t("CLICK_HERE")}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        ))}
      </form>
      {isPoliceStationModalOpen && (
        <GetPoliceStationModal
          isOpen={isPoliceStationModalOpen}
          onClose={() => setIsPoliceStationModalOpen(false)}
          onPoliceStationSelect={(station) => {
            handlePoliceStationSelect(station, selectedAddress);
            setIsPoliceStationModalOpen(false);
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

const SummonsOrderComponent = ({ t, config, formData, onSelect, clearErrors }) => {
  const urlParams = new URLSearchParams(window.location.search);
  const filingNumber = urlParams.get("filingNumber");
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const [selectedChannels, setSelectedChannels] = useState(formData[config.key]?.["selectedChannels"] || []);
  const inputs = useMemo(() => config?.populators?.inputs || [], [config?.populators?.inputs]);
  const orderType = useMemo(() => formData?.orderType?.code, [formData?.orderType?.code]);
  const [userList, setUserList] = useState([]);
  const [deliveryChannels, setDeliveryChannels] = useState([
    { label: "SMS", type: "SMS", code: "SMS", values: [] },
    { label: "EMAIL", type: "E-mail", code: "EMAIL", values: [] },
    {
      label: "EPOST",
      type: "e-Post",
      code: "EPOST",
      values: [],
    },
    {
      label: "REGISTERED_POST",
      type: "Registered Post",
      code: "RPAD",
      values: [],
    },
    orderType === "SUMMONS" && { label: "VIA_POLICE", type: "Via Police", code: "POLICE", values: [] },
  ]);

  const { data: caseData, refetch } = useSearchCaseService(
    {
      criteria: [{ filingNumber: filingNumber }],
      tenantId,
    },
    {},
    `dristi-${filingNumber}`,
    filingNumber,
    Boolean(filingNumber)
  );
  const caseDetails = useMemo(
    () => ({
      ...caseData?.criteria?.[0]?.responseList?.[0],
    }),
    [caseData]
  );
  // caseDetails?.litigants
  // ?.filter((item) => item?.partyType?.includes("respondent"))
  // .map((item) => {
  //   return {
  //     code: item?.additionalDetails?.fullName,
  //     name: item?.additionalDetails?.fullName,
  //     uuid: allAdvocates[item?.additionalDetails?.uuid],
  //   };
  // }) || []

  const mapAddressDetails = (addressDetails, isIndividualData = false) => {
    return addressDetails?.map((address) => ({
      locality: address?.addressDetails?.locality || address?.street || "",
      city: address?.addressDetails?.city || address?.city || "",
      district: address?.addressDetails?.district || address?.addressLine2 || "",
      pincode: address?.addressDetails?.pincode || address?.pincode || "",
      address: isIndividualData ? undefined : address?.addressDetails,
      id: address?.id,
      ...(address?.geoLocationDetails && { geoLocationDetails: address.geoLocationDetails }),
    }));
  };

  useEffect(() => {
    const fetchUsers = async () => {
      let users = [];
      if (caseDetails?.additionalDetails) {
        const respondentData = caseDetails?.additionalDetails?.respondentDetails?.formdata || [];
        const witnessData = caseDetails?.additionalDetails?.witnessDetails?.formdata || [];
        const updatedRespondentData1 = await Promise.all(
          respondentData.map(async (item, index) => {
            const individualId = item?.data?.respondentVerification?.individualDetails?.individualId;
            let individualData = undefined;
            if (individualId) {
              try {
                const response = await window?.Digit.DRISTIService.searchIndividualUser(
                  {
                    Individual: {
                      individualId: individualId,
                    },
                  },
                  { tenantId, limit: 1000, offset: 0 }
                );
                individualData = response?.Individual?.[0];
              } catch (error) {
                console.error("error :>> ", error);
              }
            }
            return {
              ...item,
              data: {
                ...item?.data,
                firstName: individualData ? individualData?.name?.givenName : item?.data?.respondentFirstName || "",
                lastName: individualData ? individualData?.name?.familyName : item?.data?.respondentLastName || "",
                middleName: individualData ? individualData?.name?.otherNames : item?.data?.respondentMiddleName || "",
                ...(individualData && {
                  respondentFirstName: individualData?.name.givenName,
                  respondentMiddleName: individualData?.name?.otherNames,
                  respondentLastName: individualData?.name?.familyName,
                }),
                address: mapAddressDetails(item?.data?.addressDetails),
                partyType: "Respondent",
                phone_numbers: (individualData ? [individualData?.mobileNumber] : [])
                  .concat(item?.data?.phonenumbers?.mobileNumber || [])
                  .filter(Boolean),
                email: (individualData ? [individualData?.email] : []).concat(item?.data?.emails?.emailId || []).filter(Boolean),
                uuid: individualData && individualData?.userUuid,
                partyIndex: `Respondent_${index}`,
              },
            };
          })
        );

        const updatedRespondentData = respondentData.map((item, index) => ({
          ...item,
          data: {
            ...item?.data,
            firstName: item?.data?.respondentFirstName || "",
            lastName: item?.data?.respondentLastName || "",
            middleName: item?.data?.respondentMiddleName || "",
            respondentFirstName: item?.data?.respondentFirstName || "",
            respondentMiddleName: item?.data?.respondentMiddleName || "",
            respondentLastName: item?.data?.respondentLastName || "",
            address: mapAddressDetails(item?.data?.addressDetails),
            partyType: "Respondent",
            phone_numbers: item?.data?.phonenumbers?.mobileNumber || [],
            email: item?.data?.emails?.emailId || [],
            uuid: item?.data?.uuid,
            partyIndex: `Respondent_${index}`,
            uniqueId: item?.uniqueId,
          },
        }));
        const updatedWitnessData = witnessData.map((item, index) => ({
          ...item,
          data: {
            ...item?.data,
            firstName: item?.data?.firstName,
            lastName: item?.data?.lastName,
            witnessDesignation: item?.data?.witnessDesignation,
            address: mapAddressDetails(item?.data?.addressDetails),
            partyType: "Witness",
            phone_numbers: item?.data?.phonenumbers?.mobileNumber || [],
            email: item?.data?.emails?.emailId || [],
            uuid: item?.data?.uuid,
            partyIndex: `Witness_${index}`,
          },
        }));
        users = [...updatedRespondentData, ...updatedWitnessData];
      }
      setUserList(users);
    };

    fetchUsers();
  }, [caseDetails?.additionalDetails, tenantId]);

  const handleDropdownChange = (selectedOption) => {
    clearErrors(config?.key);
    const isEqual = _.isEqual(selectedOption.value.data, formData?.[config.key]?.party?.data);
    if (!isEqual) {
      setSelectedChannels([]);
      onSelect(config.key, { ...formData[config.key], party: selectedOption.value, selectedChannels: [] });
    }
  };

  const handleCheckboxChange = (channelType, code, value) => {
    const partyDetails = selectedChannels.length === 0 ? formData[config.key]?.selectedChannels : selectedChannels;
    const isPresent =
      Array.isArray(partyDetails) &&
      partyDetails.some((data) => {
        // Use compareAddressValues for Via Police type, otherwise use direct comparison
        if (channelType === "Via Police") {
          return data.type === channelType && compareAddressValues(value, data.value);
        }
        return data.type === channelType && JSON.stringify(value) === JSON.stringify(data.value);
      });

    let updatedSelectedChannels;

    if (isPresent) {
      updatedSelectedChannels = partyDetails.filter((channel) => {
        // Use compareAddressValues for Via Police type, otherwise use direct comparison
        if (channelType === "Via Police") {
          return !(channel.type === channelType && compareAddressValues(value, channel.value));
        }
        return !(channel.type === channelType && JSON.stringify(value) === JSON.stringify(channel.value));
      });
    } else {
      updatedSelectedChannels = Array.isArray(partyDetails)
        ? [...partyDetails, { type: channelType, code: code, value: value }]
        : [{ type: channelType, code: code, value: value }];

      // Auto-select police station if geoLocationDetails.policeStation is present
      if (channelType === "Via Police" && value?.geoLocationDetails?.policeStation) {
        const policeStation = value?.geoLocationDetails?.policeStation;
        if (policeStation) {
          handlePoliceStationChange(updatedSelectedChannels);
        }
      }
    }
    setSelectedChannels(updatedSelectedChannels);
    onSelect(config.key, { ...formData[config.key], selectedChannels: updatedSelectedChannels });
  };

  const handlePoliceStationChange = (updatedPartyDetails) => {
    setSelectedChannels(updatedPartyDetails);
    onSelect(config.key, { ...formData[config.key], selectedChannels: updatedPartyDetails });
  };

  const displayPartyType = {
    complainant: "COMPLAINANT_ATTENDEE",
    respondent: "RESPONDENT_ATTENDEE",
    witness: "WITNESS_ATTENDEE",
    advocate: "ADVOCATE_ATTENDEE",
  };

  const selectedParty = useMemo(() => {
    const partyData = formData?.[config.key]?.party?.data || {};
    const { firstName = "", middleName = "", lastName = "", partyType, witnessDesignation = "" } = partyData;
    const partyTypeLabel = partyType ? `(${t(displayPartyType[partyType.toLowerCase()])})` : "";
    const label = getFormattedName(firstName, middleName, lastName, witnessDesignation, partyTypeLabel);
    return formData[config.key]?.party
      ? {
          label,
          value: formData[config.key]?.party,
        }
      : null;
  }, [config.key, formData]);

  const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);
  const party = useMemo(() => formData[config.key]?.party, [config.key, formData]);
  const partyDetails = selectedChannels.length === 0 ? formData[config.key]?.selectedChannels : selectedChannels;
  const { address, phone_numbers, email } = useMemo(() => party?.data || {}, [party?.data]);

  const getRespondentPincodeDetails = useCallback(
    async (pincode) => {
      const pincodeData = await DRISTIService.getrepondentPincodeDetails(
        {
          Criteria: {
            pincode: [pincode],
          },

          tenantId,
        },
        {}
      );
      if (pincodeData?.PostalHubs && Array.isArray(pincodeData.PostalHubs) && Boolean(pincodeData.PostalHubs.length)) {
        return pincodeData.PostalHubs?.[0];
      }
      return null;
    },
    [tenantId]
  );

  const getEPostAddress = useCallback(
    async (address = []) => {
      const addressList = await Promise.all(
        address.map(async (item) => {
          if (item?.pincode) {
            const verifiedPincode = await getRespondentPincodeDetails(item.pincode);
            if (Boolean(verifiedPincode)) {
              return item;
            }
            return null;
          }
          return null;
        })
      );
      const ePostAddresses = addressList?.filter((item) => Boolean(item));
      setDeliveryChannels(
        [
          { label: "SMS", type: "SMS", code: "SMS", values: [...new Set(phone_numbers || [])] },
          { label: "EMAIL", type: "E-mail", code: "EMAIL", values: [...new Set(email || [])] },
          {
            label: "EPOST",
            type: "e-Post",
            code: "EPOST",
            values: ePostAddresses,
          },
          {
            label: "REGISTERED_POST",
            type: "Registered Post",
            code: "RPAD",
            values: address || [],
          },
          orderType === "SUMMONS" && { label: "VIA_POLICE", type: "Via Police", code: "POLICE", values: address || [] },
        ]
          .filter((item) => Boolean(item))
          .map((item) => item)
      );
    },
    [email, getRespondentPincodeDetails, orderType, phone_numbers]
  );

  // const summonsPincode = useMemo(() => filteredTasks?.[0]?.taskDetails?.respondentDetails?.address?.pincode, [filteredTasks]);

  // const { data: respondentPincodeDetails, isLoading: isRespondentPincodeLoading } = Digit.Hooks.dristi.useRepondentPincodeDetails(
  //   {
  //     Criteria: [
  //       {
  //         pincode: [summonsPincode],
  //       },
  //     ],
  //   },
  //   {},
  //   "dristi",
  //   Boolean(filteredTasks)
  // );

  useEffect(() => {
    if (address && Array.isArray(address)) {
      getEPostAddress(address);
    }
  }, [address, email, getEPostAddress, orderType, phone_numbers]);

  const handleAddParty = (e) => {
    e?.stopPropagation();
    e?.preventDefault();
    setIsPartyModalOpen(!isPartyModalOpen);
  };

  return (
    <div className="summons-order-component">
      {inputs.map((input, index) => (
        <div key={index}>
          {input.type === "dropdown" && (
            <div>
              <Dropdown
                t={t}
                option={getUserOptions(userList, t, displayPartyType)}
                optionKey="label"
                selected={selectedParty}
                select={handleDropdownChange}
                style={{ maxWidth: "100%", marginBottom: 8 }}
                className="party-dropdown"
              />
              {
                <Button
                  onButtonClick={handleAddParty}
                  className="add-party-btn"
                  style={{
                    backgroundColor: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    WebkitBoxShadow: "none",
                    boxShadow: "none",
                    height: "auto",
                  }}
                  textStyles={{
                    marginTop: 0,
                    fontFamily: "Roboto",
                    fontSize: "16px",
                    fontWeight: 700,
                    lineHeight: "18.75px",
                    textAlign: "center",
                    color: "#007E7E",
                  }}
                  label={t("+ Add new witness")}
                />
              }
            </div>
          )}
          {input.type !== "dropdown" && selectedParty && (
            <RenderDeliveryChannels
              deliveryChannels={deliveryChannels}
              handleCheckboxChange={handleCheckboxChange}
              partyDetails={partyDetails}
              handlePoliceStationChange={handlePoliceStationChange}
            />
          )}
        </div>
      ))}
      {isPartyModalOpen && (
        <AddParty
          onCancel={handleAddParty}
          onDismiss={handleAddParty}
          tenantId={tenantId}
          caseData={caseData}
          onAddSuccess={() => {
            handleAddParty();
            refetch();
          }}
        ></AddParty>
      )}
    </div>
  );
};

export default SummonsOrderComponent;
