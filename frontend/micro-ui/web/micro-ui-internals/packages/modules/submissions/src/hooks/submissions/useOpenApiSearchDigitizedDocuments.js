import { useQuery, useQueryClient } from "react-query";
import { submissionService } from "../services";

function useOpenApiSearchDigitizedDocuments(reqData, params, key, enabled) {
  const client = useQueryClient();
  const { isLoading, data, isFetching, refetch, error } = useQuery(
    `GET_DIGITIZED_DOCUMENTS_DETAILS_${key}`,
    () => submissionService.searchOpenApiDigitizedDocument(reqData, params),
    {
      cacheTime: 0,
      enabled: Boolean(enabled),
    }
  );

  return {
    isLoading,
    isFetching,
    data,
    refetch,
    revalidate: () => {
      data && client.invalidateQueries({ queryKey: `GET_DIGITIZED_DOCUMENTS_DETAILS_${key}` });
    },
    error,
  };
}

export default useOpenApiSearchDigitizedDocuments;
