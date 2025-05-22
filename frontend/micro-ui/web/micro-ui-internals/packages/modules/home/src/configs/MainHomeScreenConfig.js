const defaultSearchValues = {
  owner: {},
  parties: {},
  hearingType: {},
  orderType: {},
  status: {},
  orderNumber: "",
  applicationType: {},
  applicationCMPNumber: "",
  artifactType: {},
  artifactNumber: "",
};

export const mainHomeScreenConfig = {
  tenantId: "pg",
  moduleName: "mainHomeScreenConfig",
  showTab: true,
  TabSearchConfig: [
    {
      label: "Hearings",
      displayLabel: "HEARINGS_TAB",
      type: "search",
      apiDetails: {
        serviceName: "/hearing/v1/search",
        requestParam: {
          tenantId: Digit.ULBService.getCurrentTenantId(),
        },
        requestBody: {
          apiOperation: "SEARCH",
          Individual: {
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
              // {
              //   label: "Stage",
              //   isMandatory: false,
              //   key: "stage",
              //   type: "dropdown",
              //   populators: {
              //     name: "stage",
              //     optionsKey: "value",
              //     mdmsConfig: {
              //       masterName: "Stage",
              //       moduleName: "case",
              //       // localePrefix: "SUBMISSION_TYPE",
              //     },
              //   },
              // },
              // {
              //   label: "Parties",
              //   isMandatory: false,
              //   key: "parties",
              //   type: "dropdown",
              //   populators: {
              //     name: "parties",
              //   },
              // },
              // {
              //   label: "Order ID",
              //   isMandatory: false,
              //   key: "orderNumber",
              //   type: "text",
              //   populators: {
              //     name: "orderNumber",
              //   },
              // },
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
              // {
              //   label: "Date Added",
              //   jsonPath: "auditDetails.createdTime",
              //   additionalCustomization: true,
              // },
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
    },
  ],
};
