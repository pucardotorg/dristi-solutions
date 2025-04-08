import { useQuery } from "react-query";
import { DRISTIService } from "../../services";

function useEtreasuryCreateDemand(data, params, keys, enabled) {
  const { isLoading, data: demandResponse, isFetching, refetch, error } = useQuery(
    `GET_DEMAND_${keys}`,
    () => DRISTIService.etreasuryCreateDemand(data, params),
    {
      cacheTime: 0,
      enabled: Boolean(enabled),
      retry: false, // Disable automatic retries to prevent flooding the API with requests
    }
  );

  if (error) {
    console.error("Error fetching payment:", error);
  }

  return {
    isLoading,
    isFetching,
    data: demandResponse,
    refetch,
    error,
  };
}

export default useEtreasuryCreateDemand;
