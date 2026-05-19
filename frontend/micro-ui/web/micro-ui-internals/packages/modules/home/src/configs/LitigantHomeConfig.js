import { userTypeOptions } from "./shared/employeeHomeSearchDefaults";
import { buildLitigantHomeTabs } from "./shared/litigantCaseSearchTabConfig";

export { userTypeOptions };

export const CaseWorkflowState = {
  CASE_REASSIGNED: "CASE_REASSIGNED",
  DRAFT_IN_PROGRESS: "DRAFT_IN_PROGRESS",
  UNDER_SCRUTINY: "UNDER_SCRUTINY",
  CASE_ADMITTED: "CASE_ADMITTED",
  PENDING_ADMISSION: "PENDING_ADMISSION",
};

export const TabLitigantSearchConfig = {
  tenantId: "pg",
  moduleName: "homeLitigantUiConfig",
  showTab: true,
  TabSearchConfig: buildLitigantHomeTabs(),
};
