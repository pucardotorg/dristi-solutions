/**
 * Config for Assign Cases section on Manage Office Member page.
 * Uses case/v1/_search for case search.
 */
export const assignCasesConfig = {
  label: "ASSIGN_CASES",
  type: "inbox",
  apiDetails: {
    serviceName: "/case/v1/_search",
    requestParam: {},
    requestBody: {
      criteria: [{}],
    },
    minParametersForSearchForm: 0,
    masterName: "commonUiConfig",
    moduleName: "assignCasesConfig",
    searchFormJsonPath: "requestBody.criteria[0]",
    tableFormJsonPath: "requestBody.inbox",
  },
  sections: {
    search: {
      uiConfig: {
        headerStyle: null,
        type: "registration-requests-table-search",
        primaryLabel: "ES_COMMON_SEARCH",
        secondaryLabel: "ES_COMMON_CLEAR_SEARCH",
        minReqFields: 0,
        defaultValues: {
          filingNumber: "",
        },
        fields: [
          {
            label: "SEARCH_CASE_NAME_OR_NUMBER",
            type: "text",
            isMandatory: false,
            disable: false,
            populators: {
              name: "filingNumber",
              error: "BR_PATTERN_ERR_MSG",
              validation: {
                pattern: {},
                minlength: 0,
              },
            },
          },
        ],
      },
      label: "ASSIGN_CASES",
      children: {},
      show: true,
    },
    searchResult: {
      label: "",
      uiConfig: {
        columns: [
          {
            label: "CASE_NAME",
            jsonPath: "caseTitle",
            additionalCustomization: true,
          },
          {
            label: "CASE_NUMBER",
            jsonPath: "filingNumber",
            additionalCustomization: true,
          },
        ],
        enableGlobalSearch: false,
        enableColumnSort: true,
        resultsJsonPath: "criteria[0].responseList",
      },
      children: {},
      show: true,
    },
  },
  additionalSections: {},
  additionalDetails: "filingNumber",
};
