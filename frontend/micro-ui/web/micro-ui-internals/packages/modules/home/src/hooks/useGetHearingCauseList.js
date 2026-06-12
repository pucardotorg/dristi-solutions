import { useCallback, useState } from "react";
import { HomeService } from "./services";

function useGetHearingCauseList({ limit = 300, offset = 0 } = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const parseAdvocate = (advocate) => {
    if (!advocate) return {};
    if (typeof advocate === "object") return advocate;
    try {
      return JSON.parse(advocate);
    } catch (e) {
      return {};
    }
  };

  const fetchCauseList = useCallback(
    async (filters, setHearingCount) => {
      setLoading(true);
      setError(null);
      try {
        const tenantId = Digit.ULBService.getCurrentTenantId();
        const payload = {
          tenantId,
          courtId: localStorage.getItem("courtId"),
          date: filters?.date,
        };
        const res = await HomeService.getHearingCauseList(payload, { tenantId });
        let hearings = Array.isArray(res?.hearings) ? res.hearings : [];
        if (filters?.status?.code) hearings = hearings.filter((hearing) => hearing?.status === filters.status.code);
        if (filters?.purpose) hearings = hearings.filter((hearing) => hearing?.hearingType === filters.purpose?.code);
        if (filters?.caseQuery) {
          const query = filters.caseQuery.trim().toLowerCase();
          hearings = hearings.filter(
            (hearing) => hearing?.caseTitle?.toLowerCase()?.includes(query) || hearing?.caseNumber?.toLowerCase()?.includes(query)
          );
        }
        const items = hearings.slice(offset, offset + limit).map((hearing) => ({
          businessObject: {
            hearingDetails: { ...hearing, advocate: parseAdvocate(hearing?.advocate) },
          },
        }));
        setData(items);
        setHearingCount(hearings.length);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    [limit, offset]
  );

  return { data, loading, error, fetchCauseList };
}

export default useGetHearingCauseList;
