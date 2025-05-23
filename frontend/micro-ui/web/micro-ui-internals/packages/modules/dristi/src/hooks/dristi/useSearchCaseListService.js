import { useQuery, useQueryClient } from "react-query";
import { DRISTIService } from "../../services";

function useSearchCaseListService(reqData, params, moduleCode, caseId, enabled, isCacheTimeEnabled = true, cacheTime = 0) {
  const client = useQueryClient();
  const { isLoading, data, isFetching, refetch, error } = useQuery(
    `GET_CASE_LIST_${moduleCode}_${caseId}`,
    () =>
      DRISTIService.caseListSearchService(reqData, params)
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
      data && client.invalidateQueries({ queryKey: `GET_CASE_LIST_${moduleCode}_${caseId}` });
    },
    error,
  };
}

export default useSearchCaseListService;
