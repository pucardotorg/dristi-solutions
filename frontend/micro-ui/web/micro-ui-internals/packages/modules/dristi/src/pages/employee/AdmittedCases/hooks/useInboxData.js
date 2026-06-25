import { useState, useCallback, useEffect, useMemo } from "react";
import { HomeService } from "@egovernments/digit-ui-module-home/src/hooks/services";

/**
 * Hook to fetch inbox data for hearings and bail bond pending tasks.
 */
const useInboxData = ({ tenantId, filingNumber, courtId, roles, isEmployee }) => {
  const [data, setData] = useState([]);
  const [dataForNextHearings, setDataForNextHearings] = useState([]);
  const [isBailBondTaskExists, setIsBailBondTaskExists] = useState(false);

  const homeNextHearingFilter = useMemo(() => JSON.parse(localStorage.getItem("Digit.homeNextHearingFilter")), []);

  const fetchInbox = useCallback(async () => {
    try {
      const now = new Date();
      const fromDate = new Date(now.setHours(0, 0, 0, 0)).getTime();
      const toDate = new Date(now.setHours(23, 59, 59, 999)).getTime();

      const payload = {
        inbox: {
          processSearchCriteria: {
            businessService: ["hearing-default"],
            moduleName: "Hearing Service",
            tenantId: "kl",
          },
          moduleSearchCriteria: {
            tenantId: "kl",
            ...(fromDate && toDate ? { fromDate, toDate } : {}),
          },
          tenantId: "kl",
          limit: 300,
          offset: 0,
        },
      };

      const res = await HomeService.InboxSearch(payload, { tenantId: "kl" });
      setData(res?.items || []);
    } catch (err) {
      console.error("error", err);
    }
  }, []);

  // Fetch inbox data for next hearing navigation
  useEffect(() => {
    const fetchInboxForNextHearingData = async () => {
      try {
        const buildPayload = (fromDate, toDate) => ({
          inbox: {
            processSearchCriteria: {
              businessService: ["hearing-default"],
              moduleName: "Hearing Service",
              tenantId: "kl",
            },
            moduleSearchCriteria: {
              tenantId: "kl",
              ...(fromDate && toDate ? { fromDate, toDate } : {}),
            },
            tenantId: "kl",
            limit: 300,
            offset: 0,
          },
        });

        if (homeNextHearingFilter) {
          const fromDateForNextHearings = new Date(homeNextHearingFilter.homeFilterDate).setHours(0, 0, 0, 0);
          const toDateForNextHearings = new Date(homeNextHearingFilter.homeFilterDate).setHours(23, 59, 59, 999);

          const resForNextHearings = await HomeService.InboxSearch(buildPayload(fromDateForNextHearings, toDateForNextHearings), { tenantId: "kl" });
          setDataForNextHearings(resForNextHearings?.items || []);
        }
      } catch (err) {
        console.error("error", err);
      }
    };
    fetchInboxForNextHearingData();
  }, [homeNextHearingFilter]);

  // Fetch inbox for today and check bail bond pending tasks
  useEffect(() => {
    fetchInbox();
    const checkBailBondPendingTask = async () => {
      try {
        const bailBondPendingTask = await HomeService.getPendingTaskService(
          {
            SearchCriteria: {
              tenantId,
              moduleName: "Pending Tasks Service",
              moduleSearchCriteria: {
                isCompleted: false,
                assignedRole: [...roles],
                filingNumber: filingNumber,
                courtId: courtId,
                entityType: "bail bond",
              },
              limit: 10000,
              offset: 0,
            },
          },
          { tenantId }
        );
        if (bailBondPendingTask?.data?.length > 0) {
          setIsBailBondTaskExists(true);
        }
      } catch (err) {
        console.error(err);
      }
    };
    if (isEmployee) checkBailBondPendingTask();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmployee]);

  return {
    data,
    dataForNextHearings,
    isBailBondTaskExists,
    setIsBailBondTaskExists,
    homeNextHearingFilter,
    fetchInbox,
  };
};

export default useInboxData;
