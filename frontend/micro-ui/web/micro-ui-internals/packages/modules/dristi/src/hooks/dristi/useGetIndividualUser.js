import { useQuery, useQueryClient } from "react-query";
import { DRISTIService } from "../../services";

function useGetIndividualUser(reqData, params, moduleCode, individualId, enabled, cacheTime = 0) {
  const client = useQueryClient();
  const { isLoading, data, isFetching, refetch, error } = useQuery(
    `GET_INDIVIDUAL_USER_${moduleCode}_${individualId}`,
    () =>
      DRISTIService.searchIndividualUser(reqData, params)
        .then((data) => data)
        .catch(() => ({})),
    {
      cacheTime: cacheTime,
      enabled: Boolean(enabled),
    }
  );

  return {
    isLoading,
    isFetching,
    data,
    refetch,
    revalidate: () => {
      data && client.invalidateQueries({ queryKey: `GET_INDIVIDUAL_USER_${moduleCode}_${individualId}` });
    },
    error,
  };
}

export default useGetIndividualUser;
