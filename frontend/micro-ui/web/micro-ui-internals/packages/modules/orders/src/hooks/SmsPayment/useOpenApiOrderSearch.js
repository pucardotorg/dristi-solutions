import { useQuery } from "react-query";
import { openApiService } from "../services";

function useOpenApiOrderSearch(data, params, keys, enabled) {
  const { isLoading, data: orderDetails, isFetching, refetch, error } = useQuery(
    `GET_OPENAPI_ORDER_DETAILS_SEARCH_${keys}`,
    () => openApiService.searchOpenApiOrders(data, params),
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
    data: orderDetails,
    refetch,
    error,
  };
}

export default useOpenApiOrderSearch;
