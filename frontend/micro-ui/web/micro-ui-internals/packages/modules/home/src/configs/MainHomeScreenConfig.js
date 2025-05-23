import { homeHearingsConfig } from "./HearingsConfig";
import { pendingTaskConfig } from "./PendingTaskConfig";

const defaultSearchValues = {
  owner: {},
  parties: {},
  hearingType: {},
  orderType: {},
  status: {},
  orderNumber: "",
  applicationType: {},
  applicationCMPNumber: "",
  artifactType: {},
  artifactNumber: "",
};

export const labelToConfigMapping = [
  {
    config: homeHearingsConfig,
    label: "HEARINGS_TAB",
  },
  {
    config: pendingTaskConfig,
    label: "PENDING_TASKS_TAB",
  },
];
