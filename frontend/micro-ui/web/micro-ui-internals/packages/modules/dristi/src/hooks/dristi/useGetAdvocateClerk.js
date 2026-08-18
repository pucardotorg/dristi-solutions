import { useQuery } from "react-query";
import { DRISTIService } from "../../services";

function useGetAdvocateClerk(data, params, keys, enabled, url) {
  return useQuery(
    `GET_ADVOCATE_CLERK_${keys}`,
    () => DRISTIService.searchAdvocateClerk(url, data, params).then((data) => data),
    {
      enabled: Boolean(enabled),
      cacheTime: 0,
    }
  );
}

export default useGetAdvocateClerk;
