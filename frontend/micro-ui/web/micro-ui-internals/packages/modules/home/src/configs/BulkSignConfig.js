import { OrderWorkflowState } from "@egovernments/digit-ui-module-dristi/src/Utils/orderWorkflow";

const defaultSearchValues = {
  status: { type: OrderWorkflowState.PENDING_BULK_E_SIGN },
  caseTitle: "",
  startOfTheDay: "",
  endOfTheDay: "",
};

export const bulkESignOrderConfig = {
  type: "search",
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
    moduleName: "bulkESignOrderConfig",
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
            label: "STATUS",
            isMandatory: false,
            key: "status",
            type: "dropdown",
            populators: {
              name: "status",
              optionsKey: "type",
              mdmsConfig: {
                masterName: "OrderStatus",
                moduleName: "Order",
                select:
                  "(data) => {return data['Order'].OrderStatus?.filter((item)=>[`PENDING_BULK_E-SIGN`, `DRAFT_IN_PROGRESS`].includes(item.type)).sort((a, b) => a.type.localeCompare(b.type));}",
              },
            },
          },
          {
            label: "DATE",
            isMandatory: false,
            key: "startOfTheDay",
            type: "date",
            disable: false,
            populators: {
              name: "startOfTheDay",
            },
          },
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
        // customDefaultPagination: {
        //   limit: 15,
        //   offset: 0,
        // },
        // customPageSizesArray: [15, 30, 45, 60, 75],
        columns: [
          {
            label: "SELECT",
            additionalCustomization: true,
          },
          {
            label: "CASE_NAME_AND_NUMBER",
            jsonPath: "businessObject.orderNotification.caseTitle",
          },
          {
            label: "TITLE",
            jsonPath: "businessObject.orderNotification.title",
            additionalCustomization: true,
          },
          {
            label: "STATUS",
            jsonPath: "businessObject.orderNotification.status",
            additionalCustomization: true,
          },
          {
            label: "DATE_ADDED",
            jsonPath: "businessObject.orderNotification.createdTime",
            additionalCustomization: true,
          },
          {
            label: "CS_ACTIONS",
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
