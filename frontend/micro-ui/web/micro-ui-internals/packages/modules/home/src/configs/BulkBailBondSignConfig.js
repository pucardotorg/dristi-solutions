import { OrderWorkflowState } from "@egovernments/digit-ui-module-dristi/src/Utils/orderWorkflow";

const defaultSearchValues = {
  status: { type: OrderWorkflowState.PENDING_BULK_E_SIGN },
  caseTitle: "",
  startOfTheDay: "",
  endOfTheDay: "",
};

export const bulkBailBondSignConfig = {
  label: "CS_HOME_BULK_BAIL_BOND_SIGN",
  type: "inbox",
  preProcess: {
    data: (data) => {
      // Process the data to mark items as selected based on your criteria
      return data.map(item => ({
        ...item,
        selected: item.businessObject?.pendingActions === "SIGN_BAIL_BOND",
      }));
    }
  },
  apiDetails: {
    serviceName: "/inbox/v2/index/_search",
    requestParam: {},
    requestBody: {
      inbox: {
        processSearchCriteria: {
          businessService: ["notification"],
          moduleName: "Transformer service",
        },
        tenantId: Digit.ULBService.getCurrentTenantId(),
      },
    },
    minParametersForSearchForm: 0,
    masterName: "commonUiConfig",
    moduleName: "bulkBailBondSignConfig",
    searchFormJsonPath: "requestBody.inbox.moduleSearchCriteria",
    filterFormJsonPath: "requestBody.inbox.moduleSearchCriteria",
    tableFormJsonPath: "requestBody.inbox",
  },
  sections: {
    search: {
      uiConfig: {
        formClassName: "custom-both-clear-search",
        primaryLabel: "ES_COMMON_SEARCH",
        secondaryLabel: "ES_COMMON_CLEAR_SEARCH",
        minReqFields: 0,
        defaultValues: defaultSearchValues,
        fields: [
          {
            label: "CS_CASE_NAME_ID",
            type: "text",
            isMandatory: false,
            disable: false,
            populators: {
              name: "caseTitle",
              error: "BR_PATTERN_ERR_MSG",
              style: { maxWidth: "250px", minWidth: "200px", width: "220px" },
              validation: {
                pattern: {},
                minlength: 2,
              },
            },
          },
        ],
      },

      show: true,
    },
    searchResult: {
      tenantId: Digit.ULBService.getCurrentTenantId(),
      uiConfig: {
        columns: [
          {
            label: "CASE_NAME_AND_NUMBER",
            jsonPath: "businessObject.orderNotification.caseTitle",
            additionalCustomization: true,
          },
          {
            label: "NUMBER",
            jsonPath: "businessObject.orderNotification.bailBondAmount",
            additionalCustomization: true,
          },
          {
            label: "LITIGANT",
            jsonPath: "businessObject.orderNotification.title",
            additionalCustomization: true,
          },
          {
            label: "SELECT",
            additionalCustomization: true,
          },
        ],
        resultsJsonPath: "items",
        enableColumnSort: true,
      },
      show: true,
    },
  },
};
