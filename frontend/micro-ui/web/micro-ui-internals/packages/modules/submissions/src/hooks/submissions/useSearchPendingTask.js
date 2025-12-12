import { useQuery, useQueryClient } from "react-query";
import { submissionService } from "../services";

function useSearchPendingTask(reqData, params, key, enabled) {
  const client = useQueryClient();
  const { isLoading, data, isFetching, refetch, error } = useQuery(
    `GET_BAIL_BOND_DETAILS_PENDING_TASK_${key}`,
    () => submissionService.getPendingTask(reqData, params),
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
      data && client.invalidateQueries({ queryKey: `GET_BAIL_BOND_DETAILS_${key}` });
    },
    error,
  };
}

export default useSearchPendingTask;