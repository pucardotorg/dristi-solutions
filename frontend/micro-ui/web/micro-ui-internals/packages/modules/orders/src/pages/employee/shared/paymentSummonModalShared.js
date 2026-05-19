import { useCallback, useEffect, useMemo } from "react";
import { DRISTIService } from "@egovernments/digit-ui-module-dristi/src/services";
import { getAdvocates } from "../../../utils/caseUtils";

/**
 * Shared helpers for summon/notice payment modals (RPAD, post, SMS/email).
 * Extract-only — bill, lock, and redirect logic stay in each modal file.
 */

/** Same string built in both PaymentForRPADModal and PaymentForSummonModal `infos`. */
export const formatRespondentAddressLine = (addressDetails) => {
  if (typeof addressDetails !== "object") return addressDetails;
  return `${addressDetails?.locality || ""}, ${addressDetails?.city || ""}, ${addressDetails?.district || ""}, ${addressDetails?.state || ""}, ${
    addressDetails?.pincode || ""
  }`;
};

export const useIsUserAdvocateOnCase = (caseDetails, authorizedUuid) => {
  const allAdvocates = useMemo(() => getAdvocates(caseDetails), [caseDetails]);
  const advocatesUuids = useMemo(() => {
    if (allAdvocates && typeof allAdvocates === "object") {
      return Object.values(allAdvocates).flat();
    }
    return [];
  }, [allAdvocates]);
  return useMemo(() => advocatesUuids.includes(authorizedUuid), [advocatesUuids, authorizedUuid]);
};

/**
 * Mirrors the original inline `fetchCaseLockStatus` + `useEffect` pair in both modals
 * (including `useCallback` with no dependency list) to avoid any behavior drift.
 */
export const useCaseLockStatusForPaymentModal = (caseDetails, tenantId, t, setIsCaseLocked, setShowToast) => {
  const fetchCaseLockStatus = useCallback(async () => {
    try {
      const status = await DRISTIService.getCaseLockStatus(
        {},
        {
          uniqueId: caseDetails?.filingNumber,
          tenantId: tenantId,
        }
      );
      setIsCaseLocked(status?.Lock?.isLocked);
    } catch (error) {
      console.error("Error fetching case lock status", error);
      const errorId = error?.response?.headers?.["x-correlation-id"] || error?.response?.headers?.["X-Correlation-Id"];
      setShowToast({ label: t("ERROR_FETCHING_CASE_LOCK_STATUS"), error: true, errorId });
    }
  });
  useEffect(() => {
    if (caseDetails?.filingNumber) {
      fetchCaseLockStatus();
    }
  }, [caseDetails?.filingNumber]);
};

/** Same display string as the legacy inline helper in RPAD / post-payment summon modals (15 days ahead, short month name). */
export const getPaymentModalDeliveryNoteDeadlineFormatted = () => {
  const today = new Date();
  today.setDate(today.getDate() + 15);
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dd = String(today.getDate()).padStart(2, "0");
  const mm = monthNames[today.getMonth()];
  const yyyy = today.getFullYear();
  return `${dd} ${mm} ${yyyy}`;
};

/** Same history.push target as both modals' "View order" link. */
export const getViewOrderClickHandler = ({ history, caseData, filingNumber }) => () => {
  history.push(
    `/${window.contextPath}/citizen/dristi/home/view-case?caseId=${caseData?.criteria?.[0]?.responseList?.[0]?.id}&filingNumber=${filingNumber}&tab=Orders`
  );
};
