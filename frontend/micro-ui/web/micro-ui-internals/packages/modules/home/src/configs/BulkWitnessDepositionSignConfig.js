import { buildBulkInboxCaseTitleSearchConfig } from "./shared/bulkInboxSearchConfig";

export const bulkWitnessDepositionSignConfig = buildBulkInboxCaseTitleSearchConfig({
  label: "CS_HOME_BULK_WITNESS_DEPOSITION_SIGN",
  moduleName: "bulkWitnessDepositionSignConfig",
  limitSessionKey: "bulkWitnessDepositionSignlimit",
  offsetSessionKey: "bulkWitnessDepositionSignoffset",
  moduleSearchCriteria: {
    courtId: localStorage.getItem("courtId"),
    status: "PENDING_REVIEW",
  },
  businessService: ["evidence-default"],
  processModuleName: "Evidence Service",
  columns: [
    {
      label: "SELECT",
      additionalCustomization: true,
    },
    {
      label: "CASE_TITLE",
      jsonPath: "businessObject.artifactDetails.caseTitle",
      additionalCustomization: true,
    },
    {
      label: "CS_WITNESS_CASE_NUMBER",
      jsonPath: "businessObject.artifactDetails.caseNumber",
      additionalCustomization: true,
    },
    {
      label: "WITNESS_NAME",
      jsonPath: "businessObject.artifactDetails.sourceName",
      additionalCustomization: true,
    },
    {
      label: "DATE_OF_DEPOSITION",
      jsonPath: "businessObject.artifactDetails.createdDate",
      additionalCustomization: true,
    },
    {
      label: "ADVOCATES",
      jsonPath: "businessObject.artifactDetails.advocate",
      additionalCustomization: true,
    },
  ],
});
