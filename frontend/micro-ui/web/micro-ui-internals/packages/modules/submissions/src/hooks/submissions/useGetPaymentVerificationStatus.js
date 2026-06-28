import { useQuery } from "react-query";
import { submissionService } from "../services";

function useGetPaymentVerificationStatus(consumerCode, tenantId, enabled) {
  const { isLoading, data, isFetching, error } = useQuery(
    `GET_PAYMENT_VERIFICATION_STATUS_${consumerCode}`,
    () => submissionService.getPaymentStatus({}, { consumerCode: consumerCode, tenantId }),
    {
      cacheTime: 2 * 60,
      staleTime: 2 * 60,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      enabled: Boolean(enabled),
    }
  );

  return {
    isLoading,
    isFetching,
    data,
    error,
  };
}

export default useGetPaymentVerificationStatus;
