const today = new Date();
const todayStr = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split("T")[0];

const defaultSearchValues = {
  caseSearchText: "",
  date: todayStr,
  stage: null,
};

export const pendingTaskConfig = {
  label: "PENDING_TASKS_TAB",
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
          courtId: sessionStorage.getItem("courtId"),
          assignedRole: JSON.parse(window.localStorage.getItem("user-info"))?.roles?.map((role) => role?.code),
        },
        limit: 10,
        offset: 0,
      },
    },
    masterName: "commonUiConfig",
    moduleName: "HomePendingConfig",
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
            label: "DATE",
            isMandatory: false,
            key: "date",
            type: "date",
            disable: false,
            populators: {
              name: "date",
              min: new Date().toISOString().split("T")[0],
            },
          },
          {
            label: "STAGE",
            isMandatory: false,
            key: "stage",
            type: "dropdown",
            populators: {
              name: "stage",
              optionsKey: "code",
              mdmsConfig: {
                masterName: "SubStage",
                moduleName: "case",
                select: "(data) => {return data['case'].SubStage?.map((item) => {return item});}",
              },
              // mdmsConfig: {
              //   masterName: "pendingTaskFilterText",
              //   moduleName: "case",
              //   // select: "(data) => {return data['case'].SubStage?.map((item) => {return item});}",
              //   select: "(data) => { return data?.case?.pendingTaskFilterText || [] }",
              // },
            },
          },
          {
            label: "CS_CASE_NAME_ADVOCATE",
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
            label: "CASE_ID",
            jsonPath: "caseNumber",
            additionalCustomization: true,
          },
          {
            label: "STAGE",
            jsonPath: "substage",
            additionalCustomization: true,
          },
          {
            label: "ADVOCATES",
            labelChildren: "OutlinedInfoIcon",
            tooltipValue: "ONLY_CURRENT_AND_FUTURE_DATES_ARE_ALLOWED",
            jsonPath: "advocateDetails",
            additionalCustomization: true,
          },
          {
            label: "APPLICATION_TYPE",
            jsonPath: "applicationType",
            additionalCustomization: true,
          },
        ],
        enableColumnSort: true,
        resultsJsonPath: "data",
      },
      show: true,
    },
  },
};
