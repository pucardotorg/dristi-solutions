export const temaplateOrConfigurationConfig = {
  label: "ES_COMMON_INBOX",
  type: "search",
  // TODO: Update the service name
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
    moduleName: "templateOrConfigurationHomeConfig",
    searchFormJsonPath: "requestBody.inbox.moduleSearchCriteria",
    filterFormJsonPath: "requestBody.inbox.moduleSearchCriteria",
    tableFormJsonPath: "requestBody.inbox",
  },
  sections: {
    search: {
      uiConfig: {
        headerStyle: null,
        formClassName: "custom-both-clear-search",
        primaryLabel: "ES_COMMON_SEARCH",
        secondaryLabel: "ES_COMMON_CLEAR_SEARCH",
        minReqFields: 1,
        defaultValues: {
          process: "",
        },
        fields: [
          {
            label: "Search Process",
            type: "text",
            isMandatory: false,
            disable: false,
            populators: {
              name: "process",
              error: "BR_PATTERN_ERR_MSG",
              validation: {
                pattern: {},
                minlength: 2,
              },
            },
          },
        ],
      },
      children: {},
      show: true,
    },
    searchResult: {
      label: "",
      uiConfig: {
        columns: [
          {
            label: "SERIAL_NO",
            jsonPath: "srNo",
          },
          {
            label: "TEMPLATE_OR_PROCESS_TITLE",
            jsonPath: "title",
            additionalCustomization: true
          },
          {
            label: "DATE_CREATED",
            jsonPath: "dateCreated",
          },
          {
            label: "CS_ACTIONS",
            jsonPath: "action",
            additionalCustomization: true
          },
        ],
        enableGlobalSearch: false,
        enableColumnSort: true,
        resultsJsonPath: "data",
      },
      children: {},
      show: true,
    },
  },
};