import { buildBulkInboxGenericSearchConfig } from "./shared/bulkInboxGenericSearchConfig";
import {
  bulkInboxCaseTitleTextField,
  bulkInboxDateField,
  bulkInboxProcessTypeField,
} from "./shared/bulkInboxSharedFields";

export const bulkSignFormsConfig = buildBulkInboxGenericSearchConfig({
  moduleName: "bulkSignFormsConfig",
  defaultValues: {
    caseTitle: "",
    startOfTheDay: "",
    endOfTheDay: "",
    type: {},
  },
  fields: [bulkInboxProcessTypeField, bulkInboxDateField, bulkInboxCaseTitleTextField],
  processSearchCriteria: {
    businessService: [
      "digitalized-document-examination",
      "digitalized-document-mediation",
      "digitalized-document-plea",
    ],
    moduleName: "Digitalized Document Service",
  },
  columns: [
    { label: "SELECT", additionalCustomization: true },
    { label: "CASE_TITLE", jsonPath: "businessObject.digitalizedDocumentDetails.caseName", additionalCustomization: true },
    { label: "CS_CASE_NUMBER_HOME", jsonPath: "businessObject.digitalizedDocumentDetails.caseNumber" },
    { label: "PROCESS_TYPE", jsonPath: "businessObject.digitalizedDocumentDetails.type", additionalCustomization: true },
    { label: "DATE_CREATED", jsonPath: "businessObject.digitalizedDocumentDetails.createdTime", additionalCustomization: true },
  ],
});
