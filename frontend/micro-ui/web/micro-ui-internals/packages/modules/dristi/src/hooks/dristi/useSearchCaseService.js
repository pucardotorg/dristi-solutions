import { useQuery, useQueryClient } from "react-query";
import { DRISTIService } from "../../services";

function useSearchCaseService(reqData, params, moduleCode, caseId, enabled, isCacheTimeEnabled = true, cacheTime = 0) {
  //TODO: remove this extraCriteria dependency once back end changes are done.

  const advocateOfficeMapping = JSON.parse(localStorage.getItem("advocateOfficeMapping"));
  const { loggedInMemberId = null, officeAdvocateId = null, officeAdvocateUuid = null } = advocateOfficeMapping || {};
  const extraCriteria = officeAdvocateId
    ? officeAdvocateId === loggedInMemberId
      ? { advocateId: officeAdvocateId }
      : { officeAdvocateId: officeAdvocateId, memberid: loggedInMemberId }
    : {};
  const reqDataUpdated = { ...reqData, criteria: [{ ...reqData.criteria[0], ...extraCriteria }] };
  const client = useQueryClient();
  const { isLoading, data, isFetching, refetch, error } = useQuery(
    `GET_CASE_DETAILS_${moduleCode}_${caseId}`,
    () =>
      DRISTIService.searchCaseService(reqDataUpdated, params)
        .then((data) => data)
        .catch(() => ({})),
    {
      ...(isCacheTimeEnabled && { cacheTime }),
      enabled: Boolean(enabled),
    }
  );

  return {
    isLoading,
    isFetching,
    data,
    refetch,
    revalidate: () => {
      data && client.invalidateQueries({ queryKey: `GET_CASE_DETAILS_${moduleCode}_${caseId}` });
    },
    error,
  };
}

export default useSearchCaseService;
