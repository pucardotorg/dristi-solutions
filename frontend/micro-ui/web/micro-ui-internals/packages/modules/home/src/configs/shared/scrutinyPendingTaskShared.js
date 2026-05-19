const today = new Date();
const todayStr = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split("T")[0];

export const SCRUTINY_PENDING_DEFAULT_SEARCH_VALUES = {
  caseSearchText: "",
  date: todayStr,
  stage: null,
};

export const SCRUTINY_PENDING_CASE_SEARCH_FIELD = {
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
};

export const SCRUTINY_PENDING_TABLE_UI_CONFIG = {
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
};

export function buildScrutinyPendingTaskApiDetails(scrutinyCaseStatuses) {
  return {
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
          status: scrutinyCaseStatuses,
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
  };
}

export function buildScrutinyPendingTaskSections() {
  return {
    search: {
      uiConfig: {
        formClassName: "custom-both-clear-search",
        primaryLabel: "ES_COMMON_SEARCH",
        secondaryLabel: "ES_COMMON_CLEAR_SEARCH",
        minReqFields: 0,
        defaultValues: SCRUTINY_PENDING_DEFAULT_SEARCH_VALUES,
        fields: [SCRUTINY_PENDING_CASE_SEARCH_FIELD],
      },
      show: true,
    },
    searchResult: {
      tenantId: Digit.ULBService.getCurrentTenantId(),
      uiConfig: SCRUTINY_PENDING_TABLE_UI_CONFIG,
      show: true,
    },
  };
}
