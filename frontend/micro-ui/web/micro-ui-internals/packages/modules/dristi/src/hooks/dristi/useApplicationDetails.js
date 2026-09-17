import { useEffect } from "react";
import { useQuery, useQueryClient } from "react-query";
import { DRISTIService } from "../../services";
import { getNameByUuid } from "../../Utils";
import { getUserInfoFromUuids } from "../../../../submissions/src/utils";

const useApplicationDetails = ({ url, params, body, config = {}, plainAccessRequest, state, changeQueryName = "Random" }) => {
  const client = useQueryClient();

  const fetchCombinedData = async () => {
    //need to filter this hearing list response based on slot
    const { caseDetails, ...searchBody } = body || {};
    const res = await DRISTIService.searchSubmissions(searchBody, params, plainAccessRequest, true);

    const namesByUuid = new Map();
    const unresolvedUuids = new Set();
    res.applicationList.forEach((application) => {
      const uuid = application.auditDetails.createdBy;
      if (!uuid || namesByUuid.has(uuid)) return;
      const nameByUuid = getNameByUuid(uuid, caseDetails);
      if (nameByUuid) {
        namesByUuid.set(uuid, nameByUuid);
      } else {
        unresolvedUuids.add(uuid);
      }
    });

    if (unresolvedUuids.size > 0) {
      const userInfo = await getUserInfoFromUuids([...unresolvedUuids]);
      userInfo?.forEach((user) => {
        if (user?.userUuid) namesByUuid.set(user.userUuid, user?.fullName || "");
      });
    }

    const applicationList = res.applicationList.map((application) => ({
      ...application,
      owner: namesByUuid.get(application.auditDetails.createdBy) || "",
    }));

    return {
      ...res,
      applicationList,
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

export default useApplicationDetails;
