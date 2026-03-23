const defaultSearchValues = {
  documentName: "",
  searchQuery: "",
};

export const bulkIssueCTCConfig = {
  type: "search",
  apiDetails: {
    serviceName: "/inbox/v2/index/_search",
    requestParam: {
      tenantId: Digit.ULBService.getCurrentTenantId(),
    },
    requestBody: {
      inbox: {
        processSearchCriteria: {
          businessService: ["ctc-default"],
          moduleName: "CTC Issue Doc",
          tenantId: Digit.ULBService.getCurrentTenantId(),
        },
        moduleSearchCriteria: {
          tenantId: Digit.ULBService.getCurrentTenantId(),
          searchableFields: "",
        },
        tenantId: Digit.ULBService.getCurrentTenantId(),
        limit: 10,
        offset: 0,
      },
    },
    minParametersForSearchForm: 0,
    masterName: "commonUiConfig",
    moduleName: "bulkIssueCTCConfig",
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
            label: "SEARCH_DOCUMENT_NAME",
            type: "text",
            isMandatory: false,
            disable: false,
            populators: {
              name: "documentName",
              error: "BR_PATTERN_ERR_MSG",
              style: { maxWidth: "350px", minWidth: "250px", width: "100%" },
              validation: {
                pattern: {},
                minlength: 2,
              },
            },
          },
          {
            label: "CTC_CASE_NAME_OR_NUMBER",
            type: "text",
            isMandatory: false,
            disable: false,
            populators: {
              name: "searchQuery",
              error: "BR_PATTERN_ERR_MSG",
              style: { maxWidth: "350px", minWidth: "250px", width: "100%" },
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
            label: "DOCUMENTS_REQUESTED",
            jsonPath: "businessObject.docTitle",
            additionalCustomization: true,
          },
          {
            label: "CASE_NAME",
            jsonPath: "businessObject.caseTitle",
            additionalCustomization: true,
          },
          {
            label: "CASE_NUMBER",
            jsonPath: "businessObject.caseNumber",
            additionalCustomization: true,
          },
          {
            label: "APPLICATION_NUMBER",
            jsonPath: "businessObject.ctcApplicationNumber",
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
