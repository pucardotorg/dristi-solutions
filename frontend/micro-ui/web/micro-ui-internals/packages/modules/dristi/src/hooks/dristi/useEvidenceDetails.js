import { useEffect } from "react";
import { useQuery, useQueryClient } from "react-query";
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
      if (owner?.Employees?.length > 1) return "";

      return {
        name: `${owner?.Individual?.[0]?.name?.givenName} ${owner?.Individual?.[0]?.name?.familyName || ""}`.trim(),
        fullname: `${owner?.Individual?.[0]?.name?.givenName} ${owner?.Individual?.[0]?.name?.otherNames || ""} ${
          owner?.Individual?.[0]?.name?.familyName || ""
        }`.trim(),
      };
    }
  };

  const fetchCombinedData = async () => {
    //need to filter this hearing list response based on slot
    const res = await DRISTIService.searchEvidence(body, params, plainAccessRequest, true);
    const uniqueArtifactsMap = new Map();
    res?.artifacts?.forEach((artifact) => {
      if (!uniqueArtifactsMap.has(artifact.sourceID)) {
        uniqueArtifactsMap.set(artifact.sourceID, artifact);
      }
    });
    const uniqueArtifacts = Array.from(uniqueArtifactsMap.values());

    const ownerNames = await Promise.all(
      uniqueArtifacts?.map(async (artifact) => {
        const names = await getOwnerName(artifact);
        const ownerName = names?.name || names || "";
        const fullName = names?.fullname || names || "";
        return { owner: ownerName, fullName: fullName, sourceID: artifact.sourceID };
      })
    );
    const artifacts = res?.artifacts?.map((artifact) => {
      const ownerName = ownerNames?.find((item) => item.sourceID === artifact.sourceID)?.owner;
      const ownerFullName = ownerNames?.find((item) => item.sourceID === artifact.sourceID)?.fullName;
      return { ...artifact, owner: ownerName, ownerFullName: ownerFullName };
    });

    return {
      ...res,
      artifacts,
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
