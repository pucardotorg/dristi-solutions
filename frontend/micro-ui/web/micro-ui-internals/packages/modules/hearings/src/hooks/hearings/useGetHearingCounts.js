import { useQuery } from "react-query";
import { hearingService } from "../services";

function useGetHearingsCounts(data, params, keys, enabled, refetchInterval = false, attendeeIndividualId = "", cacheTime = 0) {
  const { isLoading, data: hearingCountResponse, isFetching, refetch, error } = useQuery(
    ["GET_HEARING_COUNT", keys, data?.criteria?.fromDate, data?.criteria?.toDate],
    () =>
      hearingService
        .searchHearingCount(
          {
            ...data,
            criteria: {
              ...data?.criteria,
              attendeeIndividualId: attendeeIndividualId || undefined,
            },
          },
          params
        )
        .then((data) => data)
        .catch(() => null),
    {
      cacheTime: cacheTime,
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
    data: hearingCountResponse,
    refetch,
    error,
  };
}

export default useGetHearingsCounts;
