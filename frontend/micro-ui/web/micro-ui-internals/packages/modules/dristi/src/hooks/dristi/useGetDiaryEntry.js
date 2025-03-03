import { useQuery } from "react-query";
import { DRISTIService } from "../../services";

function useGetDiaryEntry(data, params, keys, enabled) {
  const { isLoading, data: diaryResponse, isFetching, refetch, error } = useQuery(
    `GET_DIARY_ENTRY_${keys}`,
    () => DRISTIService.aDiaryEntrySearch(data, params),
    {
      cacheTime: 0,
      enabled: Boolean(enabled),
      retry: false, // Disable automatic retries to prevent flooding the API with requests
    }
  );

  if (error) {
    console.error("Error fetching diary entry:", error);
  }

  return {
    isLoading,
    isFetching,
    data: diaryResponse,
    refetch,
    error,
  };
}

export default useGetDiaryEntry;
