import { useQuery } from "react-query";
import { DRISTIService } from "../../services";
function useInportalEligibility(data, params, keys, enabled) {
  const { isLoading, data, isFetching, refetch, error } = useQuery(
    `GET_INPORTAL_ELIGIBILITY_${keys}`,
    () => DRISTIService.getInportalEligibility(),
    {
      cacheTime: 0,
      enabled: Boolean(enabled),
      retry: false, // Disable automatic retries to prevent flooding the API with requests
    }
  );
  if (error) {
    console.error("Error geting Inportal Survey Eligibility:", error);
  }
  return {
    isLoading,
    isFetching,
    data,
    refetch,
    error,
  };
}
export default useInportalEligibility;
