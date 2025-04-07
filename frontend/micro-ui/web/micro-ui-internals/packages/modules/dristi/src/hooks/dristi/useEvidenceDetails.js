import { useEffect } from "react";
import { useQuery, useQueryClient } from "react-query";
import useGetSubmissions from "./useGetSubmissions";
import { DRISTIService } from "../../services";

const useEvidenceDetails = ({ url, params, body, config = {}, plainAccessRequest, state, changeQueryName = "Random" }) => {
  const client = useQueryClient();

  const { searchForm } = state;
  const { stage, type, caseNameOrId } = searchForm;
  const tenant = Digit.ULBService.getCurrentTenantId();

  const getOwnerName = async (artifact) => {
    if (artifact?.sourceType === "COURT") {
      if (!artifact.sourceID) {
        return "";
      }
      const owner = await Digit.UserService.userSearch(tenant, { uuid: [artifact?.sourceID] }, {});
      if (owner?.user?.length > 1) return "";
      return `${owner?.user?.[0]?.name}`.trim();
    } else {
      if (!artifact.sourceID) {
        return "";
      }
      const owner = await DRISTIService.searchIndividualUser(
        {
          Individual: {
            individualId: artifact?.sourceID,
          },
        },
        { ...params, limit: 1000, offset: 0 },
        plainAccessRequest,
        true
      );
      if(owner?.Employees?.length > 1) return ""; 
      return `${owner?.Individual[0]?.name?.givenName} ${owner[0]?.Individual[0]?.name?.familyName || ""}`.trim();
    }
  };

  const fetchCombinedData = async () => {
    //need to filter this hearing list response based on slot
    const res = await DRISTIService.searchEvidence(body, params, plainAccessRequest, true);
    return {
      ...res,
      artifacts: await Promise.all(
        res.artifacts.map(async (artifact) => {
          const owner = await getOwnerName(artifact);

          return {
            ...artifact,
            owner: owner,
          };
        })
      ),
    };
  };

  const { isLoading, data, isFetching, refetch, error } = useQuery("GET_PRE_HEARING_DATA", fetchCombinedData, {
    cacheTime: 0,
    enabled: state.searchForm && (state.searchForm.stage || state.searchForm.type || state.searchForm.filingNumber),
    ...config,
  });

  useEffect(() => {
    refetch();
  }, [state]);

  return {
    isLoading,
    isFetching,
    data,
    revalidate: () => {
      data && client.invalidateQueries({ queryKey: [url, changeQueryName] });
    },
    refetch,
    error,
  };
};

export default useEvidenceDetails;
