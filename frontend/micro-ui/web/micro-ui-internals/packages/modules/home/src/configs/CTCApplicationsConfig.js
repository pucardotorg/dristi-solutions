const defaultSearchValues = {
  applicationNumber: "",
  caseSearchText: "",
};

export const CTCApplicationsConfig = {
  type: "search",
  apiDetails: {
    serviceName: "/task/v1/table/search",
    requestParam: {
      tenantId: Digit.ULBService.getCurrentTenantId(),
      limit: 10,
      offset: 0,
    },
    requestBody: {
      apiOperation: "SEARCH",
      criteria: {},
    },
    minParametersForSearchForm: 0,
    masterName: "commonUiConfig",
    moduleName: "CTCApplicationsConfig",
    searchFormJsonPath: "requestBody.criteria",
    filterFormJsonPath: "requestBody.criteria",
    tableFormJsonPath: "requestParam",
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
            label: "Case Number",
            type: "text",
            isMandatory: false,
            disable: false,
            populators: {
              name: "caseSearchText",
              error: "BR_PATTERN_ERR_MSG",
              style: { maxWidth: "300px", minWidth: "250px", width: "100%" },
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
            label: "SELECT",
            additionalCustomization: true,
          },
          {
            label: "APPLICATION_NUMBER",
            jsonPath: "businessObject.applicationNumber",
            additionalCustomization: true,
          },
          {
            label: "CASE_NUMBER",
            jsonPath: "businessObject.caseNumber",
            additionalCustomization: true,
          },
          {
            label: "PETITIONER",
            jsonPath: "businessObject.petitioner",
            additionalCustomization: true,
          },
          {
            label: "DATE_RAISED",
            jsonPath: "businessObject.dateRaised",
            additionalCustomization: true,
          },
          {
            label: "STATUS",
            jsonPath: "businessObject.status",
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
