import { useQuery, useQueryClient } from "react-query";
import { DRISTIService } from "../../services";

function useSearchTaskMangementService(reqData, params, key, enabled, cacheTime = 0) {
  const client = useQueryClient();
  const { isLoading, data, isFetching, refetch, error } = useQuery(
    `GET_TASK_MANAGEMENT_DETAILS_${key}`,
    () => DRISTIService.searchTaskManagementService(reqData, params),
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
      data && client.invalidateQueries({ queryKey: `GET_TASK_MANAGEMENT_DETAILS_${key}` });
    },
    error,
  };
}

export default useSearchTaskMangementService;
