import { useQuery, useQueryClient } from "react-query";
import { DRISTIService } from "../../services";

function useCaseDetailSearchService(reqData, params, moduleCode, caseId, enabled, isCacheTimeEnabled = true) {
  const advocateOfficeMapping = JSON.parse(localStorage.getItem("advocateOfficeMapping"));
  //TODO: remove this extraCriteria dependency once back end changes are done.
  const { loggedInMemberId = null, officeAdvocateId = null, officeAdvocateUuid = null } = advocateOfficeMapping || {};
  const extraCriteria = officeAdvocateId
    ? officeAdvocateId === loggedInMemberId
      ? { advocateId: officeAdvocateId }
      : { officeAdvocateId: officeAdvocateId, memberid: loggedInMemberId }
    : {};
  const reqDataUpdated = { ...reqData, criteria: { ...reqData.criteria, ...extraCriteria } };
  const client = useQueryClient();
  const { isLoading, data, isFetching, refetch, error } = useQuery(
    `GET_CASE_DETAILS_${moduleCode}_${caseId}`,
    () =>
      DRISTIService.caseDetailSearchService(reqDataUpdated, params)
        .then((data) => data)
        .catch(() => ({})),
    {
      ...(isCacheTimeEnabled && { cacheTime: 0 }),
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

export default useCaseDetailSearchService;
