import { useMemo } from "react";
import { getAuthorizedUuid } from "../../../../Utils";

/**
 * Hook to derive user context: roles, permissions, user type, etc.
 */
const useUserContext = () => {
  const userInfo = useMemo(() => JSON.parse(window.localStorage.getItem("user-info")), []);
  const userUuid = userInfo?.uuid;
  const authorizedUuid = getAuthorizedUuid(userUuid);
  const roles = useMemo(() => userInfo?.roles, [userInfo]);
  const userRoles = useMemo(() => roles.map((role) => role.code), [roles]);
  const isEpostUser = useMemo(() => roles?.some((role) => role?.code === "POST_MANAGER"), [roles]);
  const userType = useMemo(() => (userInfo?.type === "CITIZEN" ? "citizen" : "employee"), [userInfo?.type]);
  const isEmployee = useMemo(() => userType === "employee", [userType]);
  const isCitizen = userRoles?.includes("CITIZEN");
  const isJudge = userRoles?.includes("JUDGE_ROLE");
  const isAdvocateOrClerk = useMemo(() => userRoles?.includes("ADVOCATE_ROLE") || userRoles?.includes("ADVOCATE_CLERK_ROLE"), [userRoles]);
  const hasHearingPriorityView = useMemo(() => roles?.some((role) => role?.code === "HEARING_PRIORITY_VIEW") && isEmployee, [roles, isEmployee]);
  const hasHearingEditAccess = useMemo(() => roles?.some((role) => role?.code === "HEARING_APPROVER"), [roles]);

  const tenantId = window?.Digit.ULBService.getCurrentTenantId();
  const courtId = localStorage.getItem("courtId");

  let homePath = `/${window?.contextPath}/${userType}/home/home-pending-task`;
  if (!isEpostUser && !isCitizen) homePath = `/${window?.contextPath}/${userType}/home/home-screen`;

  return {
    userInfo,
    userUuid,
    authorizedUuid,
    roles,
    userRoles,
    isEpostUser,
    userType,
    isEmployee,
    isCitizen,
    isJudge,
    isAdvocateOrClerk,
    hasHearingPriorityView,
    hasHearingEditAccess,
    tenantId,
    courtId,
    homePath,
  };
};

export default useUserContext;
