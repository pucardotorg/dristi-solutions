import { useMemo } from "react";
import { getAdvocates } from "../../../citizen/FileCase/EfilingValidationUtils";
import {
  getLitigants,
  getFinalLitigantsData,
  getRepresentatives,
  getFinalRepresentativesData,
  getWitnesses,
  getUnJoinedLitigants,
  getComplainants,
  getRespondents,
  getPipComplainants,
  getPipAccuseds,
  getComplainantsList,
} from "../utils/partyUtils";

/**
 * Hook to derive all party-related data from case details.
 */
const useCaseParties = (caseDetails, authorizedUuid) => {
  const allAdvocates = useMemo(() => getAdvocates(caseDetails), [caseDetails]);

  const litigants = useMemo(() => getLitigants(caseDetails), [caseDetails]);
  const finalLitigantsData = useMemo(() => getFinalLitigantsData(litigants), [litigants]);

  const reps = useMemo(() => getRepresentatives(caseDetails), [caseDetails]);
  const finalRepresentativesData = useMemo(() => getFinalRepresentativesData(reps), [reps]);

  const witnesses = useMemo(() => getWitnesses(caseDetails), [caseDetails]);
  const unJoinedLitigant = useMemo(() => getUnJoinedLitigants(caseDetails), [caseDetails]);

  const complainants = useMemo(() => getComplainants(caseDetails, allAdvocates), [caseDetails, allAdvocates]);
  const respondents = useMemo(() => getRespondents(caseDetails, allAdvocates), [caseDetails, allAdvocates]);

  const listAllAdvocates = useMemo(() => Object.values(allAdvocates || {}).flat(), [allAdvocates]);
  const isAdvocatePresent = useMemo(() => listAllAdvocates?.includes(authorizedUuid), [listAllAdvocates, authorizedUuid]);

  const onBehalfOfuuid = useMemo(() => Object.keys(allAdvocates)?.find((key) => allAdvocates[key].includes(authorizedUuid)), [
    allAdvocates,
    authorizedUuid,
  ]);

  const pipComplainants = useMemo(() => getPipComplainants(caseDetails), [caseDetails]);
  const pipAccuseds = useMemo(() => getPipAccuseds(caseDetails), [caseDetails]);
  const complainantsList = useMemo(() => getComplainantsList(caseDetails, pipComplainants, pipAccuseds, authorizedUuid), [
    caseDetails,
    pipComplainants,
    pipAccuseds,
    authorizedUuid,
  ]);

  return {
    allAdvocates,
    litigants,
    finalLitigantsData,
    reps,
    finalRepresentativesData,
    witnesses,
    unJoinedLitigant,
    complainants,
    respondents,
    listAllAdvocates,
    isAdvocatePresent,
    onBehalfOfuuid,
    pipComplainants,
    pipAccuseds,
    complainantsList,
  };
};

export default useCaseParties;
