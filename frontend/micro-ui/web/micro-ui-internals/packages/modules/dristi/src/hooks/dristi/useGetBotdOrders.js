import { useQuery } from "react-query";
import { DRISTIService } from "../../services";

function useGetBotdOrders(data, params, keys, enabled) {
  const { isLoading, data: botdOrdersResponse, isFetching, refetch, error } = useQuery(
    `GET_BOTD_ORDERS_${keys}`,
    () => DRISTIService.searchBotdOrders(data, params),
    {
      cacheTime: 0,
      enabled: Boolean(enabled),
      retry: false, // Disable automatic retries to prevent flooding the API with requests
    }
  );

  if (error) {
    console.error("Error fetching BOTD ORDERS:", error);
  }

  return {
    isLoading,
    isFetching,
    data: botdOrdersResponse,
    refetch,
    error,
  };
}

export default useGetBotdOrders;
