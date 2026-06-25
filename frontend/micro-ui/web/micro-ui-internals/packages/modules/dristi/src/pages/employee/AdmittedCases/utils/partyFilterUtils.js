// Helper function to get party-in-person (PIP) complainants
// These are complainants who are not represented by any advocate
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

// Helper function to get party-in-person (PIP) accused/respondents
// These are respondents who are not represented by any advocate
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

// Helper function to get complainants list based on logged-in user
// Returns list of parties that the logged-in user represents or is part of
export const getComplainantsList = (caseDetails, pipComplainants, pipAccuseds, authorizedUuid) => {
  const loggedinUserUuid = authorizedUuid;
  
  // If logged in person is an advocate/jr. adv/clerk (office member of senior advocate)
  const isAdvocateLoggedIn = caseDetails?.representatives?.find((rep) => rep?.additionalDetails?.uuid === loggedinUserUuid);
  const isPipLoggedIn = pipComplainants?.find((p) => p?.additionalDetails?.uuid === loggedinUserUuid);
  const accusedLoggedIn = pipAccuseds?.find((p) => p?.additionalDetails?.uuid === loggedinUserUuid);

  if (isAdvocateLoggedIn) {
    return isAdvocateLoggedIn?.representing?.map((r) => {
      return {
        code: r?.additionalDetails?.fullName,
        name: r?.additionalDetails?.fullName,
        uuid: r?.additionalDetails?.uuid,
      };
    });
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
