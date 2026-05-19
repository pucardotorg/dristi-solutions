import { buildScrutinyPendingTaskApiDetails, buildScrutinyPendingTaskSections } from "./shared/scrutinyPendingTaskShared";

export const scrutinyPendingTaskConfig = [
  {
    label: "CS_SCRUTINY_DUE",
    type: "search",
    apiDetails: buildScrutinyPendingTaskApiDetails(["UNDER_SCRUTINY"]),
    sections: buildScrutinyPendingTaskSections(),
  },
  {
    label: "CS_SCRUTINY_CASE_REASSIGNED",
    type: "search",
    apiDetails: buildScrutinyPendingTaskApiDetails(["CASE_REASSIGNED"]),
    sections: buildScrutinyPendingTaskSections(),
  },
];
