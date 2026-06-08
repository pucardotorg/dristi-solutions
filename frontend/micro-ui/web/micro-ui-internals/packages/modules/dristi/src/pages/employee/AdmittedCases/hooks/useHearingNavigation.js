import { useCallback, useMemo } from "react";
import { hearingService } from "@egovernments/digit-ui-module-hearings/src/hooks/services";

/**
 * Hook to handle hearing navigation logic (next hearing, custom next hearing).
 */
const useHearingNavigation = ({ data, dataForNextHearings, history, homeNextHearingFilter, currentInProgressHearing, todayScheduledHearing, userType, isEmployee }) => {

  const hideNextHearingButton = useMemo(() => {
    const validData = dataForNextHearings?.filter((item) =>
      ["SCHEDULED", "PASSED_OVER", "IN_PROGRESS", "COMPLETED"]?.includes(item?.businessObject?.hearingDetails?.status)
    );
    const index = validData?.findIndex((item) => item?.businessObject?.hearingDetails?.hearingNumber === homeNextHearingFilter?.homeHearingNumber);
    return index === -1 || validData?.length <= 1;
  }, [dataForNextHearings, homeNextHearingFilter]);

  const customNextHearing = useCallback(() => {
    if (dataForNextHearings?.length === 0) {
      history.push(`/${window?.contextPath}/employee/home/home-screen`);
    } else {
      const validData = dataForNextHearings?.filter((item) =>
        ["SCHEDULED", "PASSED_OVER", "IN_PROGRESS", "COMPLETED"]?.includes(item?.businessObject?.hearingDetails?.status)
      );
      const index = validData?.findIndex((item) => item?.businessObject?.hearingDetails?.hearingNumber === homeNextHearingFilter?.homeHearingNumber);
      if (index === -1 || validData?.length === 1) {
        history.push(`/${window?.contextPath}/employee/home/home-screen`);
      } else {
        const row = validData[(index + 1) % validData?.length];
        localStorage.setItem(
          "Digit.homeNextHearingFilter",
          JSON.stringify({
            homeFilterDate: row?.businessObject?.hearingDetails?.fromDate,
            homeHearingNumber: row?.businessObject?.hearingDetails?.hearingNumber,
          })
        );
        history.push(
          `/${window?.contextPath}/employee/dristi/home/view-case?caseId=${row?.businessObject?.hearingDetails?.caseUuid}&filingNumber=${row?.businessObject?.hearingDetails?.filingNumber}&tab=Overview`
        );
      }
    }
  }, [dataForNextHearings, history, homeNextHearingFilter]);

  const nextHearing = useCallback(
    (isStartHearing) => {
      if (data?.length === 0) {
        history.push(`/${window?.contextPath}/employee/home/home-screen`);
      } else {
        const validData = data?.filter((item) => ["SCHEDULED", "PASSED_OVER", "IN_PROGRESS"]?.includes(item?.businessObject?.hearingDetails?.status));
        const index = validData?.findIndex(
          (item) => item?.businessObject?.hearingDetails?.hearingNumber === (currentInProgressHearing?.hearingId || todayScheduledHearing?.hearingId)
        );
        if (index === -1 || validData?.length === 1) {
          history.push(`/${window?.contextPath}/employee/home/home-screen`);
        } else {
          const row = validData[(index + 1) % validData?.length];
          if (["SCHEDULED", "PASSED_OVER"].includes(row?.businessObject?.hearingDetails?.status)) {
            if (isStartHearing) {
              hearingService
                .searchHearings(
                  {
                    criteria: {
                      hearingId: row?.businessObject?.hearingDetails?.hearingNumber,
                      tenantId: row?.businessObject?.hearingDetails?.tenantId,
                      ...(row?.businessObject?.hearingDetails?.courtId && isEmployee && { courtId: row?.businessObject?.hearingDetails?.courtId }),
                    },
                  },
                  { tenantId: row?.businessObject?.hearingDetails?.tenantId }
                )
                .then((response) => {
                  hearingService.startHearing({ hearing: response?.HearingList?.[0] }).then(() => {
                    window.location = `/${window.contextPath}/${userType}/dristi/home/view-case?caseId=${row?.businessObject?.hearingDetails?.caseUuid}&filingNumber=${row?.businessObject?.hearingDetails?.filingNumber}&tab=Overview`;
                  });
                })
                .catch((error) => {
                  console.error("Error starting hearing", error);
                  history.push(`/${window?.contextPath}/employee/home/home-screen`);
                });
            } else {
              history.push(
                `/${window?.contextPath}/employee/dristi/home/view-case?caseId=${row?.businessObject?.hearingDetails?.caseUuid}&filingNumber=${row?.businessObject?.hearingDetails?.filingNumber}&tab=Overview`
              );
            }
          } else {
            history.push(
              `/${window?.contextPath}/employee/dristi/home/view-case?caseId=${row?.businessObject?.hearingDetails?.caseUuid}&filingNumber=${row?.businessObject?.hearingDetails?.filingNumber}&tab=Overview`
            );
          }
        }
      }
    },
    [currentInProgressHearing?.hearingId, data, history, todayScheduledHearing?.hearingId, userType, isEmployee]
  );

  return {
    hideNextHearingButton,
    customNextHearing,
    nextHearing,
  };
};

export default useHearingNavigation;
