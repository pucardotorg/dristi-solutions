import { useQuery, useQueryClient } from "react-query";
import { DRISTIService } from "../../services";

function useCaseDetailSearchService(reqData, params, moduleCode, caseId, enabled, isCacheTimeEnabled = true) {
  const client = useQueryClient();
  const { isLoading, data, isFetching, refetch, error } = useQuery(
    `GET_CASE_DETAILS_${moduleCode}_${caseId}`,
    () =>
      DRISTIService.caseDetailSearchService(reqData, params)
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
