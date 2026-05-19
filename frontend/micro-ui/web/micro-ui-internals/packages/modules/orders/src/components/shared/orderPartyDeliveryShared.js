import { DRISTIService } from "@egovernments/digit-ui-module-dristi/src/services";
import { getFormattedName } from "../../utils";

/** Compare addresses ignoring `geoLocationDetails.policeStation` (summons / warrant channel logic). */
export const compareAddressValuesForOrderChannels = (value1, value2) => {
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

export const orderPartyDisplayTypeLabels = {
  complainant: "COMPLAINANT_ATTENDEE",
  respondent: "RESPONDENT_ATTENDEE",
  witness: "WITNESS_ATTENDEE",
  advocate: "ADVOCATE_ATTENDEE",
};

export const getOrderPartyUserOptions = (userList, t, displayPartyType = orderPartyDisplayTypeLabels) => {
  return userList?.map((user) => {
    const { firstName, middleName, lastName, partyType, witnessDesignation } = user?.data || {};
    const isWitness = partyType?.toLowerCase() === "witness";

    const partyTypeLabel = partyType ? `(${t(displayPartyType[partyType.toLowerCase()])})` : "";

    let label = "";
    if (isWitness) {
      label = getFormattedName(firstName, middleName, witnessDesignation, partyTypeLabel);
    } else {
      label = getFormattedName(firstName, middleName, lastName, null, partyTypeLabel);
    }

    return { label, value: user };
  });
};

/**
 * Normalise respondent / witness address lists for party channel UIs.
 * Includes `state` (summons path) for both consumers — harmless for warrant.
 */
export const mapAddressDetailsForPartyChannels = (addressDetails, isIndividualData = false) => {
  return addressDetails?.map((address) => ({
    locality: address?.addressDetails?.locality || address?.street || "",
    city: address?.addressDetails?.city || address?.city || "",
    district: address?.addressDetails?.district || address?.addressLine2 || "",
    pincode: address?.addressDetails?.pincode || address?.pincode || "",
    state: address?.addressDetails?.state || address?.state || "",
    address: isIndividualData ? undefined : address?.addressDetails,
    id: address?.id,
    ...(address?.geoLocationDetails && { geoLocationDetails: address.geoLocationDetails }),
  }));
};

export const fetchRespondentPincodeHubForOrder = async (tenantId, pincode) => {
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
};
