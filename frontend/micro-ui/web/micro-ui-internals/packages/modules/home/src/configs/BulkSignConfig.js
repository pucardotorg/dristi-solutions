import { OrderWorkflowState } from "@egovernments/digit-ui-module-dristi/src/Utils/orderWorkflow";
import { buildBulkInboxGenericSearchConfig } from "./shared/bulkInboxGenericSearchConfig";
import {
  bulkInboxCaseTitleTextField,
  bulkInboxDateField,
  bulkInboxOrderStatusField,
} from "./shared/bulkInboxSharedFields";

export const bulkESignOrderConfig = buildBulkInboxGenericSearchConfig({
  moduleName: "bulkESignOrderConfig",
  defaultValues: {
    status: { type: OrderWorkflowState.PENDING_BULK_E_SIGN },
    caseTitle: "",
    startOfTheDay: "",
    endOfTheDay: "",
  },
  fields: [bulkInboxOrderStatusField, bulkInboxDateField, bulkInboxCaseTitleTextField],
  processSearchCriteria: {
    businessService: ["notification"],
    moduleName: "Transformer service",
  },
  columns: [
    { label: "SELECT", additionalCustomization: true },
    { label: "CASE_NAME_AND_NUMBER", jsonPath: "businessObject.orderNotification.caseTitle" },
    { label: "TITLE", jsonPath: "businessObject.orderNotification.title", additionalCustomization: true },
    { label: "STATUS", jsonPath: "businessObject.orderNotification.status", additionalCustomization: true },
    { label: "DATE_ADDED", jsonPath: "businessObject.orderNotification.createdTime", additionalCustomization: true },
    { label: "CS_ACTIONS", additionalCustomization: true },
  ],
});
