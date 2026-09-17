const courtId = localStorage.getItem("courtId");

export const bulkADiarySignConfig = {
  label: "CS_HOME_BULK_ADIARY_SIGN",
  type: "search",
  apiDetails: {
    serviceName: "/ab-diary/case/diary/entries/v1/search",
    requestParam: {
      _: Date.now(),
    },
    requestBody: {
      criteria: {
        courtId: courtId || "",
        tenantId: Digit.ULBService.getCurrentTenantId(),
      },
      pagination: {
        limit: 10,
      },
    },
    minParametersForSearchForm: 0,
    masterName: "commonUiConfig",
    moduleName: "bulkADiarySignConfig",
    tableFormJsonPath: "requestBody.pagination",
    filterFormJsonPath: "requestBody.criteria",
    searchFormJsonPath: "requestBody.criteria",
  },
  sections: {
    search: {
      uiConfig: {
        formClassName: "custom-both-clear-search",
        primaryLabel: "ES_COMMON_SEARCH",
        secondaryLabel: "ES_COMMON_CLEAR_SEARCH",
        minReqFields: 0,
        fields: [
          {
            label: "CS_ADIARY_DATED",
            type: "date",
            isMandatory: false,
            disable: false,
            key: "date",
            populators: {
              name: "date",
              error: "BR_PATTERN_ERR_MSG",
              style: { maxWidth: "250px", minWidth: "200px", width: "220px" },
              validation: {
                pattern: {},
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
            label: "CASE_NUMBER",
            jsonPath: "caseNumber",
          },
          {
            label: "PROCEEDINGS_OR_BUSINESS_OF_DAY",
            jsonPath: "businessOfDay",
            additionalCustomization: true,
          },
          {
            label: "NEXT_HEARING_DATE",
            jsonPath: "hearingDate",
            additionalCustomization: true,
          },
        ],
        resultsJsonPath: "entries",
        customDefaultPagination: {
          limit: 10,
          offset: 0,
        },
        manualPagination: true,
        enableColumnSort: true,
      },

      show: true,
    },
  },
};
