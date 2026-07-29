import { useEffect } from "react";
import { useQuery, useQueryClient } from "react-query";
import { DRISTIService } from "../../services";
import { getNameByUuid } from "../../Utils";
import { getFullName } from "../../../../cases/src/utils/joinCaseUtils";

const useEvidenceDetails = ({ url, params, body, config = {}, plainAccessRequest, state, changeQueryName = "Random" }) => {
  const client = useQueryClient();
  const tenant = Digit.ULBService.getCurrentTenantId();

  const getOwnerName = async (artifact, caseDetails) => {
    if (!artifact.sourceID) {
      return "";
    }
    const owner = await Digit.UserService.userSearch(tenant, { uuid: [artifact?.sourceID] }, {});
    if (owner?.user?.length > 1) return "";
    return `${owner?.user?.[0]?.name}`.trim();
  };

  const fetchCombinedData = async () => {
    //need to filter this hearing list response based on slot
    const { caseDetails, ...searchBody } = body || {};
    const res = await DRISTIService.searchEvidence(searchBody, params, plainAccessRequest, true);
    const uniqueArtifactsMap = new Map();
    res?.artifacts?.forEach((artifact) => {
      if (!uniqueArtifactsMap.has(artifact.sourceID)) {
        uniqueArtifactsMap.set(artifact.sourceID, artifact);
      }
    });
    const uniqueArtifacts = Array.from(uniqueArtifactsMap.values());

    const nonCourtSourceIDs = [
      ...new Set(uniqueArtifacts?.filter((artifact) => artifact?.sourceType !== "COURT" && artifact?.sourceID).map((artifact) => artifact.sourceID)),
    ];

    const individualNamesBySourceID = new Map();
    if (nonCourtSourceIDs.length > 0) {
      const individualResponse = await DRISTIService.searchIndividualUser(
        { Individual: { individualId: nonCourtSourceIDs } },
        { tenantId: tenant, limit: 1000, offset: 0 }
      );
      individualResponse?.Individual?.forEach((individual) => {
        const individualName = getFullName(" ", individual?.name?.givenName, individual?.name?.otherNames, individual?.name?.familyName);
        const nameFromCase = getNameByUuid(individual?.userUuid, caseDetails);
        individualNamesBySourceID.set(individual?.individualId, nameFromCase || individualName || "");
      });
    }

    const ownerNames = await Promise.all(
      uniqueArtifacts?.map(async (artifact) => {
        if (artifact?.sourceType === "COURT") {
          const name = await getOwnerName(artifact, caseDetails);
          return { owner: name, fullName: name, sourceID: artifact.sourceID };
        }
        const name = individualNamesBySourceID.get(artifact?.sourceID) || "";
        return { owner: name, fullName: name, sourceID: artifact.sourceID };
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
