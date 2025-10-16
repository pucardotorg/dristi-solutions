import { useQuery } from "react-query";
import { DRISTIService } from "../../services";
function useInportalRemindMeLater(data, params, keys, enabled) {
  const { isLoading, data, isFetching, refetch, error } = useQuery(
    `POST_INPORTAL_REMIND_ME_LATER_${keys}`,
    () => DRISTIService.postInportalRemindMeLater(),
    {
      cacheTime: 0,
      enabled: Boolean(enabled),
      retry: false, // Disable automatic retries to prevent flooding the API with requests
    }
  );
  if (error) {
    console.error("Error posting RemindMeLater: ", error);
  }
  return {
    isLoading,
    isFetching,
    data,
    refetch,
    error,
  };
}
export default useInportalRemindMeLater;
