import { useQuery, useQueryClient } from "react-query";
import { submissionService } from "../services";

function useSearchDigitalization(reqData, params, key, enabled, cacheTime = 0) {
  const client = useQueryClient();
  const { isLoading, data, isFetching, refetch, error } = useQuery(
    `GET_DIGITALIZATION_${key}`,
    () => submissionService.searchDigitalization(reqData, params),
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
      data && client.invalidateQueries({ queryKey: `GET_DIGITALIZATION_${key}` });
    },
    error,
  };
}

export default useSearchDigitalization;
