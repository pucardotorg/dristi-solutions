export const temaplateOrConfigurationConfig = {
  label: "ES_COMMON_INBOX",
  type: "search",
  apiDetails: {
    serviceName: "/template-configuration/v1/search",
    requestParam: {},
    requestBody: {
      criteria: {
        tenantId: Digit.ULBService.getCurrentTenantId(),
      },
      pagination: {
        limit: 10,
        offSet: 0,
      },
    },
    minParametersForSearchForm: 0,
    masterName: "commonUiConfig",
    moduleName: "templateOrConfigurationHomeConfig",
    searchFormJsonPath: "requestBody",
    filterFormJsonPath: "requestBody",
    tableFormJsonPath: "requestBody",
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
      label: "",
      uiConfig: {
        columns: [
          {
            label: "SERIAL_NO",
            jsonPath: "srNo",
          },
          {
            label: "TEMPLATE_OR_PROCESS_TITLE",
            jsonPath: "processTitle",
            additionalCustomization: true,
          },
          {
            label: "DATE_CREATED",
            jsonPath: "dateCreated",
            additionalCustomization: true,
          },
          {
            label: "CS_ACTIONS",
            jsonPath: "action",
            additionalCustomization: true,
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
