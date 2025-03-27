import { useEffect } from "react";
import { useQuery, useQueryClient } from "react-query";

const usePreHearingModalData = ({ url, params, body, config = {}, plainAccessRequest, state, changeQueryName = "Random" }) => {
  const client = useQueryClient();
  const defaultType = {
    type: "NIA S138",
  };

  const { searchForm } = state;
  const { stage, type = defaultType, caseNameOrId, caseId } = searchForm;
  const tenantId = body?.inbox?.tenantId;

  const idPattern = /^F-C\.\d{4}\.\d{3}-\d{4}-\d{6}$/;

  const updatedRequestCriteria = {
    ...body,
    inbox: {
      ...body?.inbox,
      moduleSearchCriteria: {
        ...body?.inbox?.moduleSearchCriteria,
        ...(caseNameOrId && { caseTitle: caseNameOrId }),
        ...(caseId && { caseNumber: caseId }),
        ...(stage && { subStage: stage?.code }),
      },
    },
  };

  const fetchCombinedData = async () => {
    //need to filter this hearing list response based on slot
    const hearingListData = await Digit.CustomService.getResponse({
      url,
      params,
      body: updatedRequestCriteria,
      plainAccessRequest,
      useCache: false,
      userService: false,
    }).then((response) => ({
      ...response,
    }));

    const hearingListResponse = hearingListData?.items?.map((item) => item.businessObject?.hearingDetails);

    const filingNumberToHearing = new Map();
    const filingNumbers = hearingListResponse?.map((hearing) => {
      const filingNumber = hearing?.filingNumber;
      if (!filingNumberToHearing.has(filingNumber)) {
        filingNumberToHearing.set(filingNumber, []);
      }
      filingNumberToHearing.get(filingNumber).push(hearing);
      return filingNumber;
    });

    const pendingTaskPromises = filingNumbers.map((filingNumber) => {
      return Digit.CustomService.getResponse({
        url: "/inbox/v2/_getFields",
        params: { tenantId: Digit.ULBService.getCurrentTenantId() },
        body: {
          SearchCriteria: {
            tenantId: Digit.ULBService.getCurrentTenantId(),
            moduleName: "Pending Tasks Service",
            moduleSearchCriteria: {
              referenceId: filingNumber,
            },
            limit: 10,
            offset: 0,
          },
        },
        plainAccessRequest,
      }).then((response) => ({ filingNumber, data: response.data }));
    });

    const pendingTaskResponses = await Promise.all(pendingTaskPromises);

    const combinedData = hearingListResponse?.map((hearingData) => {
      const pendingTaskDetail = pendingTaskResponses.find((taskResponse) => taskResponse.filingNumber === hearingData.filingNumber);
      const pendingTasksData = pendingTaskDetail ? pendingTaskDetail.data.length : 0;

      return {
        caseId: hearingData?.caseUuid,
        filingNumber: hearingData?.filingNumber,
        caseName: hearingData?.caseTitle || "",
        cnrNumber: hearingData?.cnrNumber,
        stage: hearingData?.stage || "",
        subStage: hearingData?.subStage || "",
        caseType: "NIA S138",
        caseNumber: hearingData?.caseNumber || "",
        pendingTasks: pendingTasksData || "-",
        hearingId: hearingData?.hearingNumber,
        hearing: hearingData,
        courtId: hearingData?.courtId || "",
        tenantId: tenantId,
      };
    });

    return { items: combinedData, TotalCount: hearingListData.totalCount };
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

export default usePreHearingModalData;
