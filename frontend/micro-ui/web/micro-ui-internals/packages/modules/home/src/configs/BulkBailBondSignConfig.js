import { buildBulkInboxCaseTitleSearchConfig } from "./shared/bulkInboxSearchConfig";

export const bulkBailBondSignConfig = buildBulkInboxCaseTitleSearchConfig({
  label: "CS_HOME_BULK_BAIL_BOND_SIGN",
  moduleName: "bulkBailBondSignConfig",
  limitSessionKey: "bulkBailBondSignlimit",
  offsetSessionKey: "bulkBailBondSignoffset",
  moduleSearchCriteria: {
    courtId: localStorage.getItem("courtId"),
    status: "PENDING_REVIEW",
  },
  businessService: ["bail-bond-default"],
  processModuleName: "Bail Bond Service",
  columns: [
    {
      label: "SELECT",
      additionalCustomization: true,
    },
    {
      label: "CASE_TITLE",
      jsonPath: "businessObject.bailDetails.caseTitle",
      additionalCustomization: true,
    },
    {
      label: "CS_CASE_NUMBER_HOME",
      jsonPath: "businessObject.bailDetails.caseNumber",
      additionalCustomization: true,
    },
    {
      label: "LITIGANT",
      jsonPath: "businessObject.bailDetails.litigantName",
      additionalCustomization: true,
    },
  ],
});
