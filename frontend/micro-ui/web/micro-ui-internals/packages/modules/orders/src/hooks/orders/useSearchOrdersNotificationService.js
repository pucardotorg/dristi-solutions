import { useQuery, useQueryClient } from "react-query";
import { ordersService } from "../services";

function useSearchOrdersNotificationService(reqData, params, key, enabled, cacheTime = 5 * 60) {
  const client = useQueryClient();
  const { isLoading, data, isFetching, refetch, error } = useQuery(
    `GET_ORDERS_DETAILS_${key}`,
    () => ordersService.searchOrderNotifications(reqData, params),
    {
      cacheTime: cacheTime,
      enabled: Boolean(enabled),
    }
  );

  return {
    isLoading,
    isFetching,
    data,
    refetch,
    revalidate: () => {
      data && client.invalidateQueries({ queryKey: `GET_ORDERS_DETAILS_${key}` });
    },
    error,
  };
}

export default useSearchOrdersNotificationService;
