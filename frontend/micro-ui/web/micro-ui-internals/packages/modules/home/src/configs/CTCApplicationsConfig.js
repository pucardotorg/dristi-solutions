const defaultSearchValues = {
  applicationNumber: "",
  caseSearchText: "",
};

export const CTCApplicationsConfig = {
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
          moduleName: "CTC Service",
          tenantId: Digit.ULBService.getCurrentTenantId(),
        },
        moduleSearchCriteria: {
          tenantId: Digit.ULBService.getCurrentTenantId(),
        },
        tenantId: Digit.ULBService.getCurrentTenantId(),
        limit: 10,
        offset: 0,
      },
    },
    minParametersForSearchForm: 0,
    masterName: "commonUiConfig",
    moduleName: "CTCApplicationsConfig",
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
            label: "Case Number",
            type: "text",
            isMandatory: false,
            disable: false,
            populators: {
              name: "caseSearchText",
              error: "BR_PATTERN_ERR_MSG",
              style: { maxWidth: "300px", minWidth: "250px", width: "100%" },
              validation: {
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
            jsonPath: "businessObject.ctcApplicationNumber",
            additionalCustomization: true,
          },
          {
            label: "CASE_NUMBER",
            jsonPath: "businessObject.caseNumber",
            additionalCustomization: true,
          },
          {
            label: "PETITIONER",
            jsonPath: "businessObject.applicantName",
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
