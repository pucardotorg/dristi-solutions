const today = new Date();
const todayStr = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split("T")[0];

const defaultSearchValues = {
  caseSearchText: "",
  date: todayStr,
  stage: null,
};

export const scrutinyPendingTaskConfig = [
  {
    label: "CS_SCRUTINY_DUE",
    type: "search",
    apiDetails: {
      serviceName: "/inbox/v2/_getFields/actionCategory",
      requestParam: {
        // tenantId: Digit.ULBService.getCurrentTenantId(),
      },
      requestBody: {
        SearchCriteria: {
          moduleName: "Pending Tasks Service",
          tenantId: Digit.ULBService.getCurrentTenantId(),

          moduleSearchCriteria: {
            screenType: ["home", "applicationCompositeOrder"],
            isCompleted: false,
            courtId: localStorage.getItem("courtId"),
            assignedRole: JSON.parse(window.localStorage.getItem("user-info"))?.roles?.map((role) => role?.code),
          },
          searchScrutinyCases: {
            date: null,
            isOnlyCountRequired: true,
            actionCategory: "Scrutinise cases",
            status: ["UNDER_SCRUTINY"],
          },
          limit: 10,
          offset: 0,
        },
      },
      masterName: "commonUiConfig",
      moduleName: "HomeScrutinyPendingConfig",
      minParametersForSearchForm: 0,
      tableFormJsonPath: "requestParam",
      filterFormJsonPath: "requestBody",
      searchFormJsonPath: "requestBody",
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
              key: "caseSearchText",
              isMandatory: false,
              disable: false,
              populators: {
                name: "caseSearchText",
                error: "BR_PATTERN_ERR_MSG",
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
              label: "PENDING_CASE_NAME",
              jsonPath: "caseTitle",
              additionalCustomization: true,
            },
            {
              label: "CS_CASE_NUMBER_HOME",
              jsonPath: "caseNumber",
              additionalCustomization: true,
            },
            {
              label: "CASE_TYPE",
              jsonPath: "",
              additionalCustomization: true,
            },
            {
              label: "CS_DAYS_FILING",
              jsonPath: "createdTime",
              additionalCustomization: true,
            },
          ],
          enableColumnSort: true,
          resultsJsonPath: "data",
        },
        show: true,
      },
    },
  },
  {
    label: "CS_SCRUTINY_CASE_REASSIGNED",
    type: "search",
    apiDetails: {
      serviceName: "/inbox/v2/_getFields/actionCategory",
      requestParam: {
        // tenantId: Digit.ULBService.getCurrentTenantId(),
      },
      requestBody: {
        SearchCriteria: {
          moduleName: "Pending Tasks Service",
          tenantId: Digit.ULBService.getCurrentTenantId(),

          moduleSearchCriteria: {
            screenType: ["home", "applicationCompositeOrder"],
            isCompleted: false,
            courtId: localStorage.getItem("courtId"),
            assignedRole: JSON.parse(window.localStorage.getItem("user-info"))?.roles?.map((role) => role?.code),
          },
          searchScrutinyCases: {
            date: null,
            isOnlyCountRequired: true,
            actionCategory: "Scrutinise cases",
            status: ["CASE_REASSIGNED"],
          },
          limit: 10,
          offset: 0,
        },
      },
      masterName: "commonUiConfig",
      moduleName: "HomeScrutinyPendingConfig",
      minParametersForSearchForm: 0,
      tableFormJsonPath: "requestParam",
      filterFormJsonPath: "requestBody",
      searchFormJsonPath: "requestBody",
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
              key: "caseSearchText",
              isMandatory: false,
              disable: false,
              populators: {
                name: "caseSearchText",
                error: "BR_PATTERN_ERR_MSG",
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
              label: "PENDING_CASE_NAME",
              jsonPath: "caseTitle",
              additionalCustomization: true,
            },
            {
              label: "CS_CASE_NUMBER_HOME",
              jsonPath: "caseNumber",
              additionalCustomization: true,
            },
            {
              label: "CASE_TYPE",
              jsonPath: "",
              additionalCustomization: true,
            },
            {
              label: "CS_DAYS_FILING",
              jsonPath: "createdTime",
              additionalCustomization: true,
            },
          ],
          enableColumnSort: true,
          resultsJsonPath: "data",
        },
        show: true,
      },
    },
  },
];
