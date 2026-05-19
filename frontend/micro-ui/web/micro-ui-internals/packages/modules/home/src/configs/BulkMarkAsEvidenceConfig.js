import { buildBulkInboxCaseTitleSearchConfig } from "./shared/bulkInboxSearchConfig";

export const bulkMarkAsEvidenceConfig = buildBulkInboxCaseTitleSearchConfig({
  label: "CS_HOME_BULK_MARK_AS_EVIDENCE",
  moduleName: "BulkMarkAsEvidenceConfig",
  limitSessionKey: "bulkMarkAsEvidenceLimit",
  offsetSessionKey: "bulkMarkAsEvidenceOffset",
  moduleSearchCriteria: {
    courtId: localStorage.getItem("courtId"),
    evidenceMarkedStatus: "PENDING_BULK_E-SIGN",
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
      label: "CASE_ID",
      jsonPath: "businessObject.artifactDetails.caseNumber",
      additionalCustomization: true,
    },
    {
      label: "DOCUMENT_HEADING",
      jsonPath: "businessObject.artifactDetails.artifactType",
      additionalCustomization: true,
    },
    {
      label: "EVIDENCE_NUMBER",
      jsonPath: "businessObject.artifactDetails.evidenceNumber",
      additionalCustomization: true,
    },
  ],
});
