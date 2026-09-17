import { useQuery } from "react-query";
import { submissionService } from "../services";

function useGetPaymentVerificationStatus(consumerCode, tenantId, enabled, businessService, key) {
  const statusParams = { consumerCode: consumerCode, tenantId };
  if (businessService) {
    statusParams.businessService = businessService;
  }
  const { isLoading, data, isFetching, error } = useQuery(
    key ? `${key}_${consumerCode}` : `GET_PAYMENT_VERIFICATION_STATUS_${consumerCode}`,
    () => submissionService.getPaymentStatus({}, statusParams),
    {
      cacheTime: 0,
      staleTime: 2 * 60,
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
