import { useMemo } from "react";
import get from "lodash/get";
import useSearchOrdersService from "./orders/useSearchOrdersService";
import { OrderWorkflowState } from "../utils/orderWorkflow";

/**
 * Aggregates all remote data-fetching hooks required by GenerateOrdersV2.
 * Receives primitive/stable params and returns all data + loading + refetch values.
 */
const useGenerateOrdersData = ({
  tenantId,
  filingNumber,
  caseCourtId,
  orderNumber,
  orderType,
  showAddOrderModal,
  cnrNumber,
  isApproveRejectLitigantDetailsChange,
  isJudgementOrder,
}) => {
  // ── Police Stations ──────────────────────────────────────────────────────────
  const { data: policeStationData } = Digit.Hooks.useCustomMDMS(Digit.ULBService.getStateId(), "case", [{ name: "PoliceStation" }]);

  const sortedPoliceStations = useMemo(() => {
    const stations = policeStationData?.case?.PoliceStation || [];
    const updatedStationData = stations?.map((data) => {
      const { code, ...rest } = data;
      return { ...rest, uniqueId: code };
    });
    return [...updatedStationData].sort((a, b) => {
      const nameA = (a?.name || "").toUpperCase();
      const nameB = (b?.name || "").toUpperCase();
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      return 0;
    });
  }, [policeStationData]);

  // ── Miscellaneous Template ───────────────────────────────────────────────────
  // Imported dynamically to avoid circular deps — caller must pass the hook result.
  // (Kept in main component since it depends on showAddOrderModal state)

  // ── Draft Orders ─────────────────────────────────────────────────────────────
  const { data: ordersData, refetch: refetchOrdersData, isLoading: isOrdersLoading, isFetching: isOrdersFetching } = useSearchOrdersService(
    {
      tenantId,
      criteria: {
        filingNumber,
        applicationNumber: "",
        orderNumber: orderNumber,
        status: OrderWorkflowState.DRAFT_IN_PROGRESS,
        ...(caseCourtId && { courtId: caseCourtId }),
      },
      pagination: { limit: 1000, offset: 0 },
    },
    { tenantId },
    filingNumber + OrderWorkflowState.DRAFT_IN_PROGRESS,
    Boolean(filingNumber && caseCourtId)
  );

  // ── Submissions / Applications ────────────────────────────────────────────────
  const { data: applicationData, isLoading: isApplicationDetailsLoading } = Digit.Hooks.submissions.useSearchSubmissionService(
    {
      criteria: {
        filingNumber: filingNumber,
        tenantId: tenantId,
        ...(caseCourtId && { courtId: caseCourtId }),
      },
      tenantId,
    },
    {},
    filingNumber,
    Boolean(filingNumber && caseCourtId)
  );

  // ── Hearings ─────────────────────────────────────────────────────────────────
  // hearingId dependency must be resolved in the calling component; pass a merged value.
  const { data: hearingsData, isFetching: isHearingFetching, refetch: refetchHearing } = Digit.Hooks.hearings.useGetHearings(
    {
      hearing: { tenantId },
      criteria: {
        tenantID: tenantId,
        filingNumber: filingNumber,
        ...(caseCourtId && { courtId: caseCourtId }),
      },
    },
    {},
    filingNumber,
    Boolean(filingNumber && caseCourtId)
  );

  // ── Order Types (MDMS) ───────────────────────────────────────────────────────
  const { data: orderTypeData, isLoading: isOrderTypeLoading } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getStateId(),
    "Order",
    [{ name: "OrderType" }],
    {
      select: (data) =>
        get(data, "Order.OrderType", [])
          .filter((opt) => (opt?.hasOwnProperty("isactive") ? opt.isactive : true))
          .sort((a, b) => a.code.localeCompare(b.code))
          .map((opt) => ({ ...opt, name: `ORDER_TYPE_${opt.code}` })),
    }
  );

  // ── Bail Types (MDMS) ─────────────────────────────────────────────────────────
  const { data: bailTypeData, isLoading: isBailTypeLoading } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getStateId(),
    "Order",
    [{ name: "BailType" }],
    {
      select: (data) =>
        get(data, "Order.BailType", [])
          .filter((opt) => (opt?.hasOwnProperty("isactive") ? opt.isactive : true))
          .map((item) => {
            if (item.type === "BAIL_BOND") {
              return { ...item, code: item.type, name: "PERSONAL" };
            }
            return { ...item, code: item.type, name: item.type };
          }),
    }
  );

  // ── Purpose of Hearing (MDMS) ─────────────────────────────────────────────────
  const { data: purposeOfHearingData, isLoading: isPurposeOfHearingLoading } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getStateId(),
    "Hearing",
    [{ name: "HearingType" }],
    {
      select: (data) =>
        get(data, "Hearing.HearingType", [])
          .filter((opt) => (opt?.hasOwnProperty("isactive") ? opt.isactive : true))
          ?.sort((a, b) => a.code.localeCompare(b.code))
          .map((opt) => ({ ...opt })),
    }
  );

  // ── Court Rooms (statute section) ─────────────────────────────────────────────
  const { data: courtRoomDetails, isLoading: isCourtIdsLoading } = Digit.Hooks.dristi.useGetStatuteSection("common-masters", [
    { name: "Court_Rooms" },
  ]);

  // ── Warrant Sub-type (MDMS) ───────────────────────────────────────────────────
  const { data: warrantSubType, isLoading: isWarrantSubType } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getStateId(),
    "Order",
    [{ name: "warrantSubType" }],
    {
      select: (data) => data?.Order?.warrantSubType || [],
    }
  );

  // ── Court Room Data (MDMS) ────────────────────────────────────────────────────
  const { data: courtRoomData } = Digit.Hooks.useCustomMDMS(Digit.ULBService.getStateId(), "common-masters", [{ name: "Court_Rooms" }], {
    select: (data) => {
      let newData = {};
      [{ name: "Court_Rooms" }]?.forEach((master) => {
        const optionsData = get(data, `${"common-masters"}.${master?.name}`, []);
        newData = {
          ...newData,
          [master.name]: optionsData.filter((opt) => (opt?.hasOwnProperty("active") ? opt.active : true)).map((opt) => ({ ...opt })),
        };
      });
      return newData;
    },
  });

  // ── Published Litigant Details Change Orders ──────────────────────────────────
  const { data: approveRejectLitigantDetailsChangeOrderData } = useSearchOrdersService(
    {
      tenantId,
      criteria: {
        filingNumber,
        applicationNumber: "",
        orderType: "APPROVAL_REJECTION_LITIGANT_DETAILS_CHANGE",
        status: OrderWorkflowState.PUBLISHED,
        ...(caseCourtId && { courtId: caseCourtId }),
      },
      pagination: { limit: 1000, offset: 0 },
    },
    { tenantId },
    filingNumber + OrderWorkflowState.PUBLISHED + "APPROVAL_REJECTION_LITIGANT_DETAILS_CHANGE",
    Boolean(filingNumber && cnrNumber && isApproveRejectLitigantDetailsChange && caseCourtId)
  );

  // ── Published Bail Orders ─────────────────────────────────────────────────────
  const { data: publishedBailOrdersData, isLoading: isPublishedOrdersLoading } = useSearchOrdersService(
    {
      tenantId,
      criteria: {
        filingNumber,
        applicationNumber: "",
        status: OrderWorkflowState.PUBLISHED,
        orderType: "ACCEPT_BAIL",
        ...(caseCourtId && { courtId: caseCourtId }),
      },
      pagination: { limit: 1000, offset: 0 },
    },
    { tenantId },
    filingNumber + OrderWorkflowState.PUBLISHED + "ACCEPT_BAIL",
    Boolean(filingNumber && cnrNumber && isJudgementOrder && caseCourtId)
  );

  // ── Bail Pending Task Expiry (MDMS) ───────────────────────────────────────────
  const { data: bailPendingTaskExpiry } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getStateId(),
    "common-masters",
    [{ name: "pendingTaskExpiry" }],
    {
      select: (data) => data?.["common-masters"]?.pendingTaskExpiry || [],
    }
  );

  return {
    // Police stations
    sortedPoliceStations,
    // Orders
    ordersData,
    refetchOrdersData,
    isOrdersLoading,
    isOrdersFetching,
    // Applications
    applicationData,
    isApplicationDetailsLoading,
    // Hearings
    hearingsData,
    isHearingFetching,
    refetchHearing,
    // Order type MDMS
    orderTypeData,
    isOrderTypeLoading,
    // Bail type MDMS
    bailTypeData,
    isBailTypeLoading,
    // Hearing purpose MDMS
    purposeOfHearingData,
    isPurposeOfHearingLoading,
    // Court rooms
    courtRoomDetails,
    isCourtIdsLoading,
    courtRoomData,
    // Warrant sub-type
    warrantSubType,
    isWarrantSubType,
    // Litigant change orders
    approveRejectLitigantDetailsChangeOrderData,
    // Bail orders
    publishedBailOrdersData,
    isPublishedOrdersLoading,
    // Pending task expiry
    bailPendingTaskExpiry,
  };
};

export default useGenerateOrdersData;
