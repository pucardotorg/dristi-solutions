const defaultSearchValues = {
  date: new Date().toISOString().split("T")[0],
  status: null,
  hearingType: null,
  caseSearchText: null,
};

export const homeHearingsConfig = {
  label: "HEARINGS_TAB",
  type: "search",
  // customHookName: "hearings.usePreHearingModalData",
  apiDetails: {
    serviceName: "/inbox/v2/index/_search?tenantId=kl",
    requestParam: {
      tenantId: Digit.ULBService.getCurrentTenantId(),
    },
    requestBody: {
      criteria: {
        tenantId: Digit.ULBService.getCurrentTenantId(),
      },
    },
    masterName: "commonUiConfig",
    moduleName: "HomeHearingConfig",
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
            label: "STATUS",
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
          {
            label: "PURPOSE",
            isMandatory: false,
            key: "purpose",
            type: "dropdown",
            populators: {
              name: "purpose",
              optionsKey: "type",
              mdmsConfig: {
                masterName: "HearingType",
                moduleName: "Hearing",
                // localePrefix: "SUBMISSION_TYPE",
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
            label: "S.NO",
            jsonPath: "",
            additionalCustomization: true,
          },
          {
            label: "CASE_NAME",
            jsonPath: "businessObject.hearingDetails.caseTitle",
            additionalCustomization: true,
          },
          {
            label: "CASE_NUMBER",
            jsonPath: "businessObject.hearingDetails.caseNumber",
            additionalCustomization: true,
          },
          {
            label: "ADVOCATES",
            jsonPath: "businessObject.hearingDetails.hearingNumber",
            additionalCustomization: true,
          },
          {
            label: "STATUS",
            jsonPath: "businessObject.hearingDetails.status",
            additionalCustomization: true,
          },
          {
            label: "PURPOSE",
            jsonPath: "businessObject.hearingDetails.subStage",
            additionalCustomization: true,
          },

          {
            label: "CS_ACTIONS",
            additionalCustomization: true,
          },
        ],
        enableColumnSort: true,
        resultsJsonPath: "items",
      },
      show: true,
    },
  },
};
