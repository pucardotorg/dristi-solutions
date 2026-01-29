import { useQuery } from "react-query";
import { HomeService } from "@egovernments/digit-ui-module-home/src/hooks/services";

function useSearchMiscellaneousTemplate(data, params, keys, enabled) {
  const { isLoading, data: templateResponse, isFetching, refetch, error } = useQuery(
    `SEARCH_MISCELLANEOUS_TEMPLATE_${keys}`,
    () => HomeService.searchTemaplate(data, params),
    {
      cacheTime: 0,
      enabled: Boolean(enabled),
      retry: false, // Disable automatic retries to prevent flooding the API with requests
    }
  );

  if (error) {
    console.error("Error Updating Epost:", error);
  }

  return {
    isLoading,
    isFetching,
    data: templateResponse,
    refetch,
    error,
  };
}

export default useSearchMiscellaneousTemplate;
