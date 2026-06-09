import { useCallback, useState } from "react";
import { HomeService } from "./services";

function useInboxSearch({ limit = 300, offset = 0 } = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const getTodayRange = () => {
    const currentDate = new Date();
    const fromDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0, 0).getTime();
    const toDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59, 999).getTime();
    return { fromDate, toDate };
  };

  const fetchInbox = useCallback(
    async (filters, setHearingCount) => {
      setLoading(true);
      setError(null);
      try {
        let fromDate, toDate;
        if (filters.date) {
          const dateObj = new Date(filters.date);
          fromDate = new Date(dateObj.setHours(0, 0, 0, 0)).getTime();
          toDate = new Date(dateObj.setHours(23, 59, 59, 999)).getTime();
        } else {
          ({ fromDate, toDate } = getTodayRange());
        }
        const payload = {
          inbox: {
            processSearchCriteria: {
              businessService: ["hearing-default"],
              moduleName: "Hearing Service",
              tenantId: Digit.ULBService.getCurrentTenantId(),
            },
            moduleSearchCriteria: {
              tenantId: Digit.ULBService.getCurrentTenantId(),
              courtId: localStorage.getItem("courtId"),
              ...(fromDate && toDate ? { fromDate, toDate } : {}),
            },
            tenantId: Digit.ULBService.getCurrentTenantId(),
            limit,
            offset,
          },
        };
        if (filters?.status?.code) payload.inbox.moduleSearchCriteria.status = filters?.status?.code;
        if (filters?.purpose) payload.inbox.moduleSearchCriteria.hearingType = filters.purpose?.code;
        if (filters?.caseQuery) payload.inbox.moduleSearchCriteria.searchableFields = filters.caseQuery;

        const res = await HomeService.InboxSearch(payload, { tenantId: Digit.ULBService.getCurrentTenantId() });
        setData(res?.items || []);
        setHearingCount(res?.totalCount || 0);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    [limit, offset]
  );

  return { data, loading, error, fetchInbox };
}

export default useInboxSearch;
