import React, { useCallback, useEffect, useMemo, useState } from "react";
import useSearchCaseService from "../../../dristi/src/hooks/dristi/useSearchCaseService";
import { Button, Dropdown } from "@egovernments/digit-ui-react-components";
import _ from "lodash";
import { DRISTIService } from "@egovernments/digit-ui-module-dristi/src/services";
import { getFormattedName } from "../utils";
import WarrantRenderDeliveryChannels from "./WarrantRenderDeliveryChannels";
import AddWitnessModal from "@egovernments/digit-ui-module-hearings/src/pages/employee/AddWitnessModal";
import { Toast } from "@egovernments/digit-ui-components";

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

const WarrantOrderComponent = ({ t, config, formData, onSelect, clearErrors }) => {
  const urlParams = new URLSearchParams(window.location.search);
  const filingNumber = urlParams.get("filingNumber");
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const [selectedChannels, setSelectedChannels] = useState(formData[config.key]?.["selectedChannels"] || []);
  const inputs = useMemo(() => config?.populators?.inputs || [], [config?.populators?.inputs]);
  const orderType = useMemo(() => formData?.orderType?.code, [formData?.orderType?.code]);
  const [userList, setUserList] = useState([]);
  const [policeStationIdMapping, setPoliceStationIdMapping] = useState([]);
  const [showErrorToast, setShowErrorToast] = useState(null);
  const courtId = localStorage.getItem("courtId");
  const [deliveryChannels, setDeliveryChannels] = useState([
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
    (orderType === "WARRANT" || orderType === "PROCLAMATION" || orderType === "ATTACHMENT") && {
      label: "VIA_POLICE",
      type: "Via Police",
      code: "POLICE",
      values: [],
    },
  ]);

  const { data: caseData, refetch } = useSearchCaseService(
    {
      criteria: [{ filingNumber: filingNumber, ...(courtId && { courtId }) }],
      tenantId,
    },
    {},
    `dristi-${filingNumber}`,
    filingNumber,
    Boolean(filingNumber && courtId)
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
  const closeToast = () => {
    setShowErrorToast(null);
  };

  useEffect(() => {
    if (showErrorToast) {
      const timer = setTimeout(() => {
        setShowErrorToast(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showErrorToast]);

  useEffect(() => {
    const fetchUsers = async () => {
      let users = [];
      if (caseDetails?.additionalDetails) {
        const respondentData = caseDetails?.additionalDetails?.respondentDetails?.formdata || [];
        const witnessData = caseDetails?.witnessDetails || [];

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
          data: {
            ...item,
            firstName: item?.firstName,
            lastName: item?.lastName,
            witnessDesignation: item?.witnessDesignation,
            address: mapAddressDetails(item?.addressDetails),
            partyType: "Witness",
            phone_numbers: item?.phonenumbers?.mobileNumber || [],
            email: item?.emails?.emailId || [],
            uuid: item?.uuid,
            partyIndex: `Witness_${index}`,
            uniqueId: item?.uniqueId,
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
    const partyDetails = selectedChannels?.length === 0 ? formData[config?.key]?.selectedChannels || [] : selectedChannels;

    const isPresent = partyDetails.some((data) => {
      return data?.type === channelType && compareAddressValues(value, data?.value);
    });

    let updatedSelectedChannels;

    if (isPresent) {
      // Remove the existing selection
      updatedSelectedChannels = partyDetails?.filter((data) => {
        return !(data?.type === channelType && compareAddressValues(value, data?.value));
      });
    } else {
      // Add the selection
      updatedSelectedChannels = [...partyDetails, { type: channelType, code, value }];

      // If police station is already available, reflect that in the state
      if (value?.geoLocationDetails?.policeStation) {
        handlePoliceStationChange(updatedSelectedChannels);
      }
    }

    // Enrich Via Police addresses with latest selected police station
    const updatedSelectedChannelsWithPolice = updatedSelectedChannels?.map((item) => {
      const policeDetails = policeStationIdMapping?.find((p) => p?.id === item?.value?.id);
      if (policeDetails) {
        return {
          ...item,
          value: {
            ...item.value,
            geoLocationDetails: {
              ...item.value.geoLocationDetails,
              policeStation: policeDetails.policeStation,
            },
          },
        };
      }
      return item;
    });

    setSelectedChannels(updatedSelectedChannelsWithPolice);
    onSelect(config.key, {
      ...formData[config.key],
      selectedChannels: updatedSelectedChannelsWithPolice,
    });
  };

  const handlePoliceStationChange = (updatedPartyDetails, policeStationIdMap) => {
    if (!Array.isArray(updatedPartyDetails)) return;

    let updatedPartyDetailsNew = [...updatedPartyDetails];

    if (policeStationIdMap) {
      setPoliceStationIdMapping(policeStationIdMap);

      updatedPartyDetailsNew = updatedPartyDetails?.map((item) => {
        const foundObj = policeStationIdMap?.find((obj) => obj?.id === item?.value?.id);
        if (foundObj) {
          return {
            ...item,
            value: {
              ...item.value,
              geoLocationDetails: {
                ...item.value.geoLocationDetails,
                policeStation: foundObj.policeStation,
              },
            },
          };
        }
        return item;
      });
    }

    setSelectedChannels(updatedPartyDetailsNew);
    onSelect(config.key, {
      ...formData[config.key],
      selectedChannels: updatedPartyDetailsNew,
    });
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
      const policeStationIdMapping = [];
      const addressList = await Promise.all(
        address.map(async (item) => {
          const policeStationInOrderSaved = formData?.[config?.key]?.selectedChannels?.find((channel, index) => channel?.value?.id === item?.id)
            ?.value?.geoLocationDetails?.policeStation;
          policeStationIdMapping.push({ id: item?.id, policeStation: policeStationInOrderSaved || item?.geoLocationDetails?.policeStation });
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
      setPoliceStationIdMapping(policeStationIdMapping);
      setDeliveryChannels(
        [
          // {
          //   label: "EPOST",
          //   type: "e-Post",
          //   code: "EPOST",
          //   values: ePostAddresses,
          // },
          {
            label: "SEND_VIA_POST",
            type: "Registered Post",
            code: "RPAD",
            values: address || [],
          },
          (orderType === "WARRANT" || orderType === "PROCLAMATION" || orderType === "ATTACHMENT") && {
            label: "SEND_ICOPS",
            type: "Via Police",
            code: "POLICE",
            values: address || [],
          },
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
            </div>
          )}
          {input.type !== "dropdown" && selectedParty && (
            <WarrantRenderDeliveryChannels
              config={config}
              onSelect={onSelect}
              setSelectedChannels={setSelectedChannels}
              formData={formData}
              deliveryChannels={deliveryChannels}
              handleCheckboxChange={handleCheckboxChange}
              partyDetails={partyDetails}
              handlePoliceStationChange={handlePoliceStationChange}
              policeStationIdMapping={policeStationIdMapping}
              setPoliceStationIdMapping={setPoliceStationIdMapping}
            />
          )}
        </div>
      ))}
      {isPartyModalOpen && (
        <AddWitnessModal
          tenantId={tenantId}
          onCancel={handleAddParty}
          caseDetails={caseDetails}
          isEmployee={true}
          onAddSuccess={() => {
            handleAddParty();
            refetch();
          }}
          showToast={setShowErrorToast}
        ></AddWitnessModal>
      )}
      {showErrorToast && <Toast error={showErrorToast?.error} label={showErrorToast?.message} isDleteBtn={true} onClose={closeToast} />}
    </div>
  );
};

export default WarrantOrderComponent;
