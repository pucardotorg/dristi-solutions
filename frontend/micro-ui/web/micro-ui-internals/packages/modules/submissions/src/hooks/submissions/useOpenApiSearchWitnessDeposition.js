import { useQuery, useQueryClient } from "react-query";
import { submissionService } from "../services";

function useOpenApiSearchWitnessDeposition(reqData, params, key, enabled) {
  const client = useQueryClient();
  const { isLoading, data, isFetching, refetch, error } = useQuery(
    `GET_WITNESS_DEPOSITION_DETAILS_${key}`,
    () => submissionService.searchOpenApiWitnessDeposition(reqData, params),
    {
      cacheTime: 0,
      enabled: Boolean(enabled),
    }
  );

  return {
    isLoading,
    isFetching,
    data,
    refetch,
    revalidate: () => {
      data && client.invalidateQueries({ queryKey: `GET_WITNESS_DEPOSITION_DETAILS_${key}` });
    },
    error,
  };
}

export default useOpenApiSearchWitnessDeposition;
