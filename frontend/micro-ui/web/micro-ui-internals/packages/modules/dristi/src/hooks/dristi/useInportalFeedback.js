import { useQuery } from "react-query";
import { DRISTIService } from "../../services";
function useInportalFeedback(data, params, keys, enabled) {
  const { isLoading, data, isFetching, refetch, error } = useQuery(
    `POST_INPORTAL_FEEDBACK_${keys}`,
    () => DRISTIService.postInportalFeedback(data),
    {
      cacheTime: 0,
      enabled: Boolean(enabled),
      retry: false, // Disable automatic retries to prevent flooding the API with requests
    }
  );
  if (error) {
    console.error("Error posting Inportal Feedback:", error);
  }
  return {
    isLoading,
    isFetching,
    data,
    refetch,
    error,
  };
}
export default useInportalFeedback;
