import { removeInvalidNameParts } from "../../../../Utils";
import { getFormattedName } from "@egovernments/digit-ui-module-hearings/src/utils";
import { constructFullName } from "@egovernments/digit-ui-module-orders/src/utils";

export { removeInvalidNameParts, getFormattedName, constructFullName };

/**
 * Extracts and formats litigant data from case details.
 */
export const getLitigants = (caseDetails) => (caseDetails?.litigants?.length > 0 ? caseDetails?.litigants : []);

export const getFinalLitigantsData = (litigants) =>
  litigants?.map((litigant) => ({
    ...litigant,
    name: removeInvalidNameParts(litigant.additionalDetails?.fullName),
  }));

/**
 * Extracts and formats representative data.
 */
export const getRepresentatives = (caseDetails) => (caseDetails?.representatives?.length > 0 ? caseDetails?.representatives : []);

export const getFinalRepresentativesData = (reps) =>
  reps.map((rep) => ({
    ...rep,
    name: removeInvalidNameParts(rep.additionalDetails?.advocateName),
    partyType: `Advocate (for ${rep.representing?.map((client) => removeInvalidNameParts(client?.additionalDetails?.fullName))?.join(", ")})`,
  }));

/**
 * Extracts and formats witness data.
 */
export const getWitnesses = (caseDetails) =>
  caseDetails?.witnessDetails?.map((data) => {
    const fullName = getFormattedName(data?.firstName, data?.middleName, data?.lastName, data?.witnessDesignation, null);
    return {
      ...data,
      name: fullName,
      partyType: "witness",
    };
  }) || [];

/**
 * Extracts unjoined litigant respondents.
 */
export const getUnJoinedLitigants = (caseDetails) =>
  caseDetails?.additionalDetails?.respondentDetails?.formdata
    ?.filter((data) => !data?.data?.respondentVerification?.individualDetails?.individualId)
    ?.map((data) => {
      const fullName = constructFullName(data?.data?.respondentFirstName, data?.data?.respondentMiddleName, data?.data?.respondentLastName);
      return {
        ...data,
        name: `${fullName} (Accused)`,
        code: fullName,
        partyType: "respondent",
        uniqueId: data?.uniqueId,
      };
    }) || [];

/**
 * Builds the complainants list from case details.
 */
export const getComplainants = (caseDetails, allAdvocates) => {
  return (
    caseDetails?.litigants
      ?.filter((item) => item?.partyType?.includes("complainant"))
      ?.map((item) => {
        const fullName = removeInvalidNameParts(item?.additionalDetails?.fullName);
        const poaHolder = caseDetails?.poaHolders?.find((poa) => poa?.individualId === item?.individualId);
        const complainantDetails = caseDetails?.additionalDetails?.complainantDetails?.formdata?.find(
          (obj) => obj?.data?.complainantVerification?.individualDetails?.individualId === item?.individualId
        )?.data;
        if (poaHolder) {
          return {
            additionalDetails: item?.additionalDetails,
            code: fullName,
            name: `${fullName} (Complainant, PoA Holder)`,
            uuid: allAdvocates[item?.additionalDetails?.uuid],
            partyUuid: item?.additionalDetails?.uuid,
            individualId: item?.individualId,
            isJoined: true,
            partyType: "complainant",
            representingLitigants: poaHolder?.representingLitigants?.map((lit) => lit?.individualId),
          };
        }
        return {
          additionalDetails: item?.additionalDetails,
          code: fullName,
          name: `${fullName} (Complainant)`,
          uuid: allAdvocates[item?.additionalDetails?.uuid],
          partyUuid: item?.additionalDetails?.uuid,
          individualId: item?.individualId,
          isJoined: true,
          partyType: "complainant",
          poaUuid: complainantDetails?.poaVerification?.individualDetails?.userUuid,
        };
      }) || []
  );
};

/**
 * Builds the respondents list from case details.
 */
export const getRespondents = (caseDetails, allAdvocates) => {
  return (
    caseDetails?.litigants
      ?.filter((item) => item?.partyType?.includes("respondent"))
      .map((item) => {
        const fullName = removeInvalidNameParts(item?.additionalDetails?.fullName);
        const respondentDetails = caseDetails?.additionalDetails?.respondentDetails?.formdata?.find(
          (obj) => obj?.data?.respondentVerification?.individualDetails?.individualId === item?.individualId
        );
        const respondentPoaDetails = respondentDetails?.data?.poaVerification?.individualDetails?.userUuid;
        return {
          additionalDetails: item?.additionalDetails,
          code: fullName,
          name: `${fullName} (Accused)`,
          uuid: allAdvocates[item?.additionalDetails?.uuid],
          partyUuid: item?.additionalDetails?.uuid,
          individualId: item?.individualId,
          isJoined: true,
          partyType: "respondent",
          uniqueId: respondentDetails?.uniqueId,
          poaUuid: respondentPoaDetails,
        };
      }) || []
  );
};

/**
 * Returns complainants who are not represented by any advocate (Party In Person).
 */
export const getPipComplainants = (caseDetails) => {
  return caseDetails?.litigants
    ?.filter((litigant) => litigant.partyType.includes("complainant"))
    ?.filter(
      (litigant) =>
        !caseDetails?.representatives?.some((representative) =>
          representative?.representing?.some((rep) => rep?.individualId === litigant?.individualId)
        )
    );
};

/**
 * Returns accused who are not represented by any advocate (Party In Person).
 */
export const getPipAccuseds = (caseDetails) => {
  return caseDetails?.litigants
    ?.filter((litigant) => litigant.partyType.includes("respondent"))
    ?.filter(
      (litigant) =>
        !caseDetails?.representatives?.some((representative) =>
          representative?.representing?.some((rep) => rep?.individualId === litigant?.individualId)
        )
    );
};

/**
 * Builds the complainants list for bail bond / citizen actions.
 */
export const getComplainantsList = (caseDetails, pipComplainants, pipAccuseds, authorizedUuid) => {
  const loggedinUserUuid = authorizedUuid;
  const isAdvocateLoggedIn = caseDetails?.representatives?.find((rep) => rep?.additionalDetails?.uuid === loggedinUserUuid);
  const isPipLoggedIn = pipComplainants?.find((p) => p?.additionalDetails?.uuid === loggedinUserUuid);
  const accusedLoggedIn = pipAccuseds?.find((p) => p?.additionalDetails?.uuid === loggedinUserUuid);

  if (isAdvocateLoggedIn) {
    return isAdvocateLoggedIn?.representing?.map((r) => ({
      code: r?.additionalDetails?.fullName,
      name: r?.additionalDetails?.fullName,
      uuid: r?.additionalDetails?.uuid,
    }));
  } else if (isPipLoggedIn) {
    return [
      {
        code: isPipLoggedIn?.additionalDetails?.fullName,
        name: isPipLoggedIn?.additionalDetails?.fullName,
        uuid: isPipLoggedIn?.additionalDetails?.uuid,
      },
    ];
  } else if (accusedLoggedIn) {
    return [
      {
        code: accusedLoggedIn?.additionalDetails?.fullName,
        name: accusedLoggedIn?.additionalDetails?.fullName,
        uuid: accusedLoggedIn?.additionalDetails?.uuid,
      },
    ];
  }
  return [];
};
