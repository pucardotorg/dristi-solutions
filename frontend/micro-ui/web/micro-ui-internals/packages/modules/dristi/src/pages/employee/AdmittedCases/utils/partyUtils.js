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

// All roles a single user holds on a case (dual-role aware).
export const getUserCaseRoles = (caseDetails, userUuid) => {
  const litigants = caseDetails?.litigants || [];
  const reps = caseDetails?.representatives || [];
  const asLitigant = litigants.filter((l) => l?.additionalDetails?.uuid === userUuid);
  const myReps = reps.filter((r) => r?.additionalDetails?.uuid === userUuid);
  const isRepresentedIndId = (indId) => reps.some((r) => r?.representing?.some((p) => p?.individualId === indId));
  return {
    asLitigant,
    representing: myReps.flatMap((r) => r?.representing || []),
    isComplainant: asLitigant.some((l) => l?.partyType?.includes("complainant")),
    isRespondent: asLitigant.some((l) => l?.partyType?.includes("respondent")),
    isAdvocate: myReps.length > 0,
    isPOA: (caseDetails?.poaHolders || []).some((p) => p?.additionalDetails?.uuid === userUuid),
    isPIPFor: asLitigant.filter((l) => !isRepresentedIndId(l?.individualId)),
  };
};

/**
 * Builds the complainants list for bail bond / citizen actions.
 */
export const getComplainantsList = (caseDetails, pipComplainants, pipAccuseds, authorizedUuid) => {
  const seen = new Set();
  const out = [];
  const push = (p) => {
    const uuid = p?.additionalDetails?.uuid;
    if (uuid && !seen.has(uuid)) {
      seen.add(uuid);
      out.push({ code: p?.additionalDetails?.fullName, name: p?.additionalDetails?.fullName, uuid });
    }
  };
  // 1) parties this user represents as an advocate (may be multiple mappings)
  (caseDetails?.representatives || [])
    .filter((rep) => rep?.additionalDetails?.uuid === authorizedUuid)
    .forEach((rep) => (rep?.representing || []).forEach(push));
  // 2) the user themselves when they are a PIP complainant / accused
  [...(pipComplainants || []), ...(pipAccuseds || [])].filter((p) => p?.additionalDetails?.uuid === authorizedUuid).forEach(push);
  return out;
};

export const mergePartiesByUuid = (parties) => {
  const byUuid = new Map();
  const passthrough = [];
  (parties || []).forEach((p) => {
    const uuid = p?.partyUuid || p?.additionalDetails?.uuid;
    if (!uuid) return passthrough.push(p);
    if (!byUuid.has(uuid)) byUuid.set(uuid, { ...p });
    else {
      const ex = byUuid.get(uuid);
      ex.partyType = [ex.partyType, p.partyType].filter(Boolean).join(", ");
    }
  });
  return [...byUuid.values(), ...passthrough];
};
