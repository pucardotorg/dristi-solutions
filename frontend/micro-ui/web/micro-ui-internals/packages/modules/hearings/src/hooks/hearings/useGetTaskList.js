import { useQuery } from "react-query";
import { hearingService } from "../services";
import { Urls } from "../services/Urls";

/**
 * @param {string} keys
 * @param {boolean} enabled
 * @param {number} refetchInterval
 * @returns data
 */
function useGetTaskList(data, params, keys, enabled, refetchInterval = false) {
  // Add courtId to criteria if it exists
  const { isLoading, data: taskResponse, isFetching, refetch, error } = useQuery(
    `GET_TASK_${keys}`,
    () =>
      hearingService
        .customApiService(Urls.hearing.searchTasks, 
          {...data,criteria: {...data?.criteria,courtId: window?.globalConfigs?.getConfig("COURT_ID") || 'KLKM52'}}, 
          params)
        .then((data) => data)
        .catch(() => null),
    {
      cacheTime: 0,
      enabled: Boolean(enabled),
      retry: false, // Disable automatic retries to prevent flooding the API with requests
      refetchInterval,
    }
  );

  if (error) {
    console.error("Error fetching hearings:", error);
  }

  return {
    isLoading,
    isFetching,
    data: taskResponse,
    refetch,
    error,
  };
}

export default useGetTaskList;
