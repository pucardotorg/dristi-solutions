export const getFormattedName = (firstName, middleName, lastName, designation, partyTypeLabel) => {
  const nameParts = [firstName, middleName, lastName]
    ?.map((part) => part?.trim())
    ?.filter(Boolean)
    ?.join(" ")
    ?.trim();

  const nameWithDesignation = designation && nameParts ? `${nameParts} - ${designation}` : designation || nameParts;

  return partyTypeLabel ? `${nameWithDesignation} ${partyTypeLabel}` : nameWithDesignation;
};

export { getAllAssignees, getAdvocates } from "./caseUtils";
