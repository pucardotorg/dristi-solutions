const defaultSearchValues = {
  hearingType: {},
};

export const homeHearingsConfig = {
  label: "HEARINGS_TAB",
  type: "search",
  apiDetails: {
    serviceName: "/hearing/v1/search",
    requestParam: {
      tenantId: Digit.ULBService.getCurrentTenantId(),
    },
    requestBody: {
      criteria: {
        tenantId: Digit.ULBService.getCurrentTenantId(),
      },
    },
    masterName: "commonUiConfig",
    moduleName: "SearchIndividualConfig",
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
            label: "TYPE",
            isMandatory: false,
            key: "hearingType",
            type: "dropdown",
            populators: {
              name: "hearingType",
              optionsKey: "type",
              mdmsConfig: {
                masterName: "HearingType",
                moduleName: "Hearing",
                // localePrefix: "SUBMISSION_TYPE",
              },
            },
          },
          {
            label: "Status",
            isMandatory: false,
            key: "status",
            type: "dropdown",
            populators: {
              name: "status",
              optionsKey: "value",
              options: [
                { value: "SCHEDULED", label: "SCHEDULED" },
                { value: "COMPLETED", label: "COMPLETED" },
              ],
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
