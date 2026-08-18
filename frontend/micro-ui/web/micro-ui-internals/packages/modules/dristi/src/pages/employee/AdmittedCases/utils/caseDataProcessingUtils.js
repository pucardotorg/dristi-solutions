import { CaseWorkflowState } from "../../../../Utils/caseWorkflow";
import { removeInvalidNameParts, getFormattedName, constructFullName } from "./partyUtils";

// Helper function to get statute abbreviation from case details
export const getStatue = (caseDetails) => {
  const statutesAndSections = caseDetails?.statutesAndSections;
  if (!statutesAndSections?.length) return "";
  const section = statutesAndSections?.[0]?.sections?.[0];
  const subsection = statutesAndSections?.[0]?.subsections?.[0];

  if (!section || !subsection) return "";

  return section && subsection
    ? `${section
        ?.split(" ")
        ?.map((splitString) => splitString.charAt(0))
        ?.join("")} S${subsection}`
    : "";
};

// Helper function to get litigants from case details
export const getLitigants = (caseDetails) => {
  return caseDetails?.litigants?.length > 0 ? caseDetails?.litigants : [];
};

// Helper function to get formatted litigants data
export const getFinalLitigantsData = (litigants) => {
  return litigants?.map((litigant) => {
    return {
      ...litigant,
      name: removeInvalidNameParts(litigant.additionalDetails?.fullName),
    };
  });
};

// Helper function to get representatives from case details
export const getReps = (caseDetails) => {
  return caseDetails?.representatives?.length > 0 ? caseDetails?.representatives : [];
};

// Helper function to get formatted representatives data
export const getFinalRepresentativesData = (reps) => {
  return reps.map((rep) => {
    return {
      ...rep,
      name: removeInvalidNameParts(rep.additionalDetails?.advocateName),
      partyType: `Advocate (for ${rep.representing?.map((client) => removeInvalidNameParts(client?.additionalDetails?.fullName))?.join(", ")})`,
    };
  });
};

// Helper function to get witnesses from case details
export const getWitnesses = (caseDetails) => {
  return (
    caseDetails?.witnessDetails?.map((data) => {
      const fullName = getFormattedName(data?.firstName, data?.middleName, data?.lastName, data?.witnessDesignation, null);
      return {
        ...data,
        name: fullName,
        partyType: "witness",
      };
    }) || []
  );
};

// Helper function to get unjoined litigants from case details
export const getUnJoinedLitigant = (caseDetails) => {
  return (
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
      }) || []
  );
};

// Helper function to get complainants from case details
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

// Helper function to get respondents from case details
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

// Helper function to determine if make submission button should be shown
export const getShowMakeSubmission = (isAdvocatePresent, userRoles, caseStatus) => {
  return (
    isAdvocatePresent &&
    userRoles?.includes("SUBMISSION_CREATOR") &&
    [
      CaseWorkflowState.PENDING_ADMISSION_HEARING,
      CaseWorkflowState.PENDING_NOTICE,
      CaseWorkflowState.PENDING_RESPONSE,
      CaseWorkflowState.PENDING_ADMISSION,
      CaseWorkflowState.CASE_ADMITTED,
    ].includes(caseStatus)
  );
};
