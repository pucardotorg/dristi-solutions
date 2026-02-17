/**
 * Config for Assign Cases section on Manage Office Member page.
 * Uses case/v1/_search for case search.
 */
export const assignCasesConfig = () => {
  return {
    type: "search",
    apiDetails: {
      serviceName: "/case/v1/_search",
      requestParam: {
        tenantId: Digit.ULBService.getCurrentTenantId(),
      },
      requestBody: {
        tenantId: Digit.ULBService.getCurrentTenantId(),
        criteria: [],
      },
      masterName: "commonUiConfig",
      moduleName: "assignCasesConfig",
      minParametersForSearchForm: 1,
      tableFormJsonPath: "requestParam",
      filterFormJsonPath: "requestBody.criteria.[0]",
      searchFormJsonPath: "requestBody.criteria.[0]",
    },
    sections: {
      search: {
        uiConfig: {
          formClassName: "custom-both-clear-search",
          primaryLabel: "ES_COMMON_SEARCH",
          secondaryLabel: "ES_COMMON_CLEAR_SEARCH",
          minReqFields: 0,
          defaultValues: {
            assignAll: "ASSIGN_ALL",
            filingNumber: "",
          },
          fields: [
            {
              label: "ASSIGN",
              isMandatory: false,
              key: "assignAll",
              type: "dropdown",
              populators: {
                name: "assignAll",
                optionsKey: "name",
                error: "Should not be empty",
                options: [{ code: "ASSIGN_ALL", name: "Assign All" }],
              },
            },
            {
              label: "SEARCH_CASE_NAME_OR_NUMBER",
              isMandatory: false,
              key: "filingNumber",
              type: "text",
              populators: {
                name: "filingNumber",
                error: "Should not be empty",
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
              label: "CASE_NAME",
              jsonPath: "caseTitle",
            },
            {
              label: "CASE_NUMBER",
              jsonPath: "filingNumber",
            },
          ],
          enableColumnSort: true,
          resultsJsonPath: "criteria.[0].responseList",
        },
        show: true,
      },
    },
  };
};
