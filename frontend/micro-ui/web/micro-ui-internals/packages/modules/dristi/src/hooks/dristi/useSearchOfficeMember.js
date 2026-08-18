import { useQuery, useQueryClient } from "react-query";
import { DRISTIService } from "../../services";

function useSearchOfficeMember(reqData, params, officeAdvocateId, enabled, cacheTime = 0) {
  const client = useQueryClient();
  const { isLoading, data, isFetching, refetch, error } = useQuery(
    `SEARCH_OFFICE_MEMBER_${officeAdvocateId}`,
    () =>
      DRISTIService.searchOfficeMember(reqData, params)
        .then((data) => data)
        .catch(() => ({})),
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
      data && client.invalidateQueries({ queryKey: `SEARCH_OFFICE_MEMBER_${officeAdvocateId}` });
    },
    error,
  };
}

export default useSearchOfficeMember;
