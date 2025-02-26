import { useQuery, useQueryClient } from "react-query";
import { DRISTIService } from "../../services";

function useSearchCaseService(reqData, params, moduleCode, caseId, enabled, isCacheTimeEnabled = true, refetchOnWindowFocus = true) {
  const client = useQueryClient();
  const { isLoading, data, isFetching, refetch, error } = useQuery(
    `GET_CASE_DETAILS_${moduleCode}_${caseId}`,
    () =>
      DRISTIService.searchCaseService(reqData, params)
        .then((data) => data)
        .catch(() => ({})),
    {
      ...(isCacheTimeEnabled && { cacheTime: 0 }),
      enabled: Boolean(enabled),
      refetchOnWindowFocus: Boolean(refetchOnWindowFocus),
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
