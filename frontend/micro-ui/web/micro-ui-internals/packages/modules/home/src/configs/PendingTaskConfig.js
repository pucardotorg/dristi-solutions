const defaultSearchValues = {
  caseSearchText: "",
  date: new Date().toISOString().split("T")[0],
  stage: null,
};

export const pendingTaskConfig = {
  label: "PENDING_TASKS_TAB",
  type: "search",
  apiDetails: {
    serviceName: "/inbox/v2/_getFields",
    requestParam: {
      // tenantId: Digit.ULBService.getCurrentTenantId(),
    },
    requestBody: {
      moduleName: "Pending Tasks Service",
      moduleSearchCriteria: {
        tenantId: Digit.ULBService.getCurrentTenantId(),
      },
    },
    masterName: "commonUiConfig",
    moduleName: "HomePendingConfig",
    minParametersForSearchForm: 0,
    tableFormJsonPath: "requestParam",
    filterFormJsonPath: "requestBody.HearingList",
    searchFormJsonPath: "requestBody.HearingList",
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
            },
          },
          {
            label: "STAGE",
            isMandatory: false,
            key: "stage",
            type: "dropdown",
            populators: {
              name: "stage",
              optionsKey: "name",
              mdmsConfig: {
                masterName: "pendingTaskFilterText",
                moduleName: "case",
                // select: "(data) => {return data['case'].SubStage?.map((item) => {return item});}",
                select: "(data) => { return data?.case?.pendingTaskFilterText || [] }",
              },
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
            label: "HEARING_TYPE",
            jsonPath: "hearingType",
            additionalCustomization: true,
          },
          // {
          //   label: "Stage",
          //   jsonPath: "",
          // },
          {
            label: "PARTIES",
            jsonPath: "attendees",
            additionalCustomization: true,
          },
          {
            label: "STATUS",
            jsonPath: "status",
            additionalCustomization: true,
          },
          {
            label: "DATE",
            jsonPath: "startTime",
            additionalCustomization: true,
          },
          {
            label: "CS_ACTIONS",
            additionalCustomization: true,
          },
        ],
        enableColumnSort: true,
        resultsJsonPath: "HearingList",
      },
      show: true,
    },
  },
};
