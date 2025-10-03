const today = new Date();
const todayStr = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split("T")[0];

const sessionStoredEpoch = sessionStorage.getItem("diaryDate");

const defaultSearchValues = {
  // date: sessionStoredEpoch ? new Date(sessionStoredEpoch - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0] : todayStr,
  date: todayStr
};

const limit = parseInt(sessionStorage.getItem("bulkWitnessDepositionSignlimit") || 10);
const offset = parseInt(sessionStorage.getItem("bulkWitnessDepositionSignoffset") || 0);
const courtId = sessionStorage.getItem("courtId");;

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
        date: todayStr,
        tenantId: Digit.ULBService.getCurrentTenantId(),
      },
      pagination: {
        limit: 10,
        offSet: 0,
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
        defaultValues: defaultSearchValues,
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
          limit: limit,
          offset: offset,
        },
        manualPagination: true,
        enableColumnSort: true,
      },

      show: true,
    },
  },
};
