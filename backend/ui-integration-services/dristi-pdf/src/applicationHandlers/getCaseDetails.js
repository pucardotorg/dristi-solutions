const { getStringAddressDetails } = require("../utils/addressUtils");

function getComplaintAndAccusedList(courtCase) {
  const litigants = courtCase?.litigants?.map((litigant) => ({
    ...litigant,
    representatives:
      courtCase?.representatives?.filter((rep) =>
        rep?.representing?.some(
          (complainant) => complainant?.individualId === litigant?.individualId
        )
      ) || [],
  }));

  const complainants =
    litigants?.filter((litigant) =>
      litigant.partyType.includes("complainant")
    ) || [];

  const complainantList = complainants?.map((complainant) => {
    const complainantInAdditionalDetails =
      courtCase?.additionalDetails?.complainantDetails?.formdata?.find(
        (comp) =>
          comp?.data?.complainantVerification?.individualDetails
            ?.individualId === complainant?.individualId
      );
    const address = getStringAddressDetails(
      complainantInAdditionalDetails?.data?.addressDetails
    );
    return {
      name: complainant?.additionalDetails?.fullName,
      address: address,
      listOfAdvocatesRepresenting: complainant?.representatives
        ?.map((rep) => rep?.additionalDetails?.advocateName)
        ?.join(", "),
    };
  });

  const joinedAccuseds = litigants
    ?.filter((litigant) => litigant.partyType.includes("respondent"))
    ?.map((accused) => {
      const accusedInAdditionalDetails =
        courtCase?.additionalDetails?.respondentDetails?.formdata?.find(
          (comp) =>
            comp?.data?.respondentVerification?.individualDetails
              ?.individualId === accused?.individualId
        );
      const addresses = (
        accusedInAdditionalDetails?.data?.addressDetails || []
      )?.map((addressDetail) => {
        return getStringAddressDetails(addressDetail.addressDetails);
      });
      return {
        displayIndex: accusedInAdditionalDetails?.displayindex + 1 ?? null,
        individualId: accused?.individualId,
        name: accused?.additionalDetails?.fullName,
        address: addresses?.join(", ") || "",
        listOfAdvocatesRepresenting: accused?.representatives
          ?.map((rep) => rep?.additionalDetails?.advocateName)
          ?.join(", "),
      };
    });

  const unJoinedAccuseds =
    courtCase.additionalDetails.respondentDetails.formdata
      ?.map((formData) => {
        const data = formData?.data;
        const firstName = data?.respondentFirstName || "";
        const middleName = data?.respondentMiddleName || "";
        const lastName = data?.respondentLastName || "";
        const addresses = data?.addressDetails?.map((addressDetail) => {
          return getStringAddressDetails(addressDetail?.addressDetails);
        });
        return {
          displayIndex: formData?.displayindex + 1 || null,
          individualId:
            data?.respondentVerification?.individualDetails?.individualId ||
            null,
          name: `${firstName} ${middleName} ${lastName}` || "",
          address: addresses?.join(", ") || "",
          listOfAdvocatesRepresenting: [],
        };
      })
      ?.filter(
        (unJoined) =>
          !joinedAccuseds.some(
            (joined) =>
              joined?.individualId &&
              unJoined?.individualId &&
              joined?.individualId === unJoined?.individualId
          )
      ) || [];

  const accusedList = [...joinedAccuseds, ...unJoinedAccuseds]
    .sort((a, b) => (a.displayIndex ?? Infinity) - (b.displayIndex ?? Infinity))
    .map(({ displayIndex, ...rest }) => rest);

  return { complainantList, accusedList };
}

function getNameByUuid(uuid, courtCase ) {
    const litigants = courtCase?.litigants || [];
    const representatives = courtCase?.representatives || [];
    const poa = courtCase?.poaHolders || [];

    if (!uuid) return null;
  
    const litigantMatch = litigants.find(
      (lit) => lit?.additionalDetails?.uuid === uuid
    );
  
    if (litigantMatch) {
      return litigantMatch?.additionalDetails?.fullName || null;
    }
  
    const representativeMatch = representatives.find(
      (rep) => rep?.additionalDetails?.uuid === uuid
    );
  
    if (representativeMatch) {
      return representativeMatch?.additionalDetails?.advocateName || null;
    }
  
    const poaMatch = poa.find(
      (p) => p?.additionalDetails?.uuid === uuid
    );
  
    if (poaMatch) {
      return poaMatch?.name || null;
    }
  
    return null;
  }

module.exports = { getComplaintAndAccusedList, getNameByUuid };
