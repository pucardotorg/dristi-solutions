import {
  admittedCasesDefaultSearchValues as defaultSearchValues,
  admittedCasesDocumentsResultColumns,
  admittedCasesDocumentsSearchFields,
  admittedCasesHearingsResultColumns,
  admittedCasesHearingsSearchFields,
  admittedCasesOrderSearchValues as defaultOrderSearchValues,
  admittedCasesOrdersResultColumns,
  admittedCasesOrdersSearchFields,
  admittedCasesSubmissionsResultColumns,
  admittedCasesSubmissionsSearchFields,
  buildAdmittedCasesSearchResult,
  buildAdmittedCasesSearchSection,
} from "./shared/admittedCasesSearchShared";

export const TabSearchconfigNew = {
  tenantId: "mz",
  moduleName: "commonCampaignUiConfig",
  showTab: true,
  TabSearchconfig: [
    {
      label: "Overview",
      displayLabel: "OVERVIEW_TAB",
      type: "search",
    },
    {
      label: "caseFileOverview",
      displayLabel: "CASE_FILE_OVERVIEW_TAB",
      type: "search",
    },
    {
      label: "Complaint",
      displayLabel: "COMPLAINT_TAB",
      type: "search",
    },
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
        search: buildAdmittedCasesSearchSection(admittedCasesHearingsSearchFields, defaultSearchValues),
        searchResult: buildAdmittedCasesSearchResult(admittedCasesHearingsResultColumns, "HearingList"),
      },
    },
    {
      label: "Orders",
      displayLabel: "ORDERS_TAB",
      type: "search",
      apiDetails: {
        serviceName: "/inbox/v2/index/_search",
        requestParam: {},
        requestBody: {
          inbox: {
            processSearchCriteria: {
              businessService: ["notification"],
              moduleName: "Transformer service",
            },
            moduleSearchCriteria: {
              tenantId: Digit.ULBService.getCurrentTenantId(),
            },
            limit: 10,
            offset: 0,
            tenantId: Digit.ULBService.getCurrentTenantId(),
          },
        },
        minParametersForSearchForm: 0,
        masterName: "commonUiConfig",
        moduleName: "orderInboxConfig",
        searchFormJsonPath: "requestBody.inbox.moduleSearchCriteria",
        filterFormJsonPath: "requestBody.inbox.moduleSearchCriteria",
        tableFormJsonPath: "requestBody.inbox",
      },
      sections: {
        search: buildAdmittedCasesSearchSection(admittedCasesOrdersSearchFields, defaultOrderSearchValues),
        searchResult: buildAdmittedCasesSearchResult(admittedCasesOrdersResultColumns, "items"),
      },
    },
    {
      label: "Submissions",
      displayLabel: "APPLICATIONS_TAB",
      type: "search",
      customHookName: "dristi.useApplicationDetails",
      apiDetails: {
        serviceName: "/application/v1/search",
        requestParam: {
          tenantId: Digit.ULBService.getCurrentTenantId(),
        },
        requestBody: {
          apiOperation: "SEARCH",
          Individual: {
            tenantId: Digit.ULBService.getCurrentTenantId(),
          },
          criteria: {
            tenantId: Digit.ULBService.getCurrentTenantId(),
          },
        },
        masterName: "commonUiConfig",
        moduleName: "SearchIndividualConfig",
        minParametersForSearchForm: 0,
        tableFormJsonPath: "requestParam",
        filterFormJsonPath: "requestBody.Individual",
        searchFormJsonPath: "requestBody.Individual",
      },
      sections: {
        search: buildAdmittedCasesSearchSection(admittedCasesSubmissionsSearchFields, defaultSearchValues),
        searchResult: buildAdmittedCasesSearchResult(admittedCasesSubmissionsResultColumns, "applicationList"),
      },
    },
    {
      label: "Documents",
      displayLabel: "FILINGS_TAB",
      type: "search",
      customHookName: "dristi.useEvidenceDetails",
      apiDetails: {
        serviceName: "/evidence/v1/_search",
        requestParam: {
          tenantId: Digit.ULBService.getCurrentTenantId(),
        },
        requestBody: {
          apiOperation: "SEARCH",
          Individual: {
            tenantId: Digit.ULBService.getCurrentTenantId(),
          },
          criteria: {
            tenantId: Digit.ULBService.getCurrentTenantId(),
          },
        },
        masterName: "commonUiConfig",
        moduleName: "FilingsConfig",
        minParametersForSearchForm: 0,
        tableFormJsonPath: "requestParam",
        filterFormJsonPath: "requestBody.Individual",
        searchFormJsonPath: "requestBody.Individual",
      },
      sections: {
        search: buildAdmittedCasesSearchSection(admittedCasesDocumentsSearchFields, defaultSearchValues),
        searchResult: buildAdmittedCasesSearchResult(admittedCasesDocumentsResultColumns, "artifacts"),
      },
    },
    // {
    //   label: "History",
    //   type: "search",
    //   apiDetails: {
    //     serviceName: "/casemanagement/casemanager/case/v1/_history",
    //     requestParam: {
    //       tenantId: Digit.ULBService.getCurrentTenantId(),
    //     },
    //     requestBody: {
    //       criteria: {
    //         tenantId: Digit.ULBService.getCurrentTenantId(),
    //       },
    //     },
    //     masterName: "commonUiConfig",
    //     moduleName: "HistoryConfig",
    //     minParametersForSearchForm: 0,
    //     tableFormJsonPath: "requestParam",
    //     filterFormJsonPath: "requestBody.Individual",
    //     searchFormJsonPath: "requestBody.Individual",
    //   },
    //   sections: {
    //     // search: {
    //     //   uiConfig: {
    //     //     formClassName: "custom-both-clear-search",
    //     //     primaryLabel: "ES_COMMON_SEARCH",
    //     //     secondaryLabel: "ES_COMMON_CLEAR_SEARCH",
    //     //     minReqFields: 0,
    //     //     defaultValues: defaultSearchValues,
    //     //     fields: [
    //     //       // {
    //     //       //   label: "Stage",
    //     //       //   isMandatory: false,
    //     //       //   key: "stage",
    //     //       //   type: "dropdown",
    //     //       //   populators: {
    //     //       //     name: "stage",
    //     //       //     optionsKey: "value",
    //     //       //     mdmsConfig: {
    //     //       //       masterName: "Stage",
    //     //       //       moduleName: "case",
    //     //       //       // localePrefix: "SUBMISSION_TYPE",
    //     //       //     },
    //     //       //   },
    //     //       // },
    //     //       {
    //     //         label: "Owner",
    //     //         isMandatory: false,
    //     //         key: "owner",
    //     //         type: "dropdown",
    //     //         populators: {
    //     //           name: "owner",
    //     //         },
    //     //       },
    //     //     ],
    //     //   },
    //     //   show: false,
    //     // },
    //     searchResult: {
    //       tenantId: Digit.ULBService.getCurrentTenantId(),
    //       uiConfig: {
    //         columns: [
    //           {
    //             label: "Instance",
    //             jsonPath: "instance",
    //             additionalCustomization: true,
    //           },
    //           {
    //             label: "Date",
    //             jsonPath: "date",
    //             additionalCustomization: true,
    //           },
    //           // {
    //           //   label: "Stage",
    //           //   jsonPath: "stage",
    //           // },
    //           {
    //             label: "Status",
    //             jsonPath: "status",
    //             additionalCustomization: true,
    //           },
    //         ],
    //         enableColumnSort: true,
    //         resultsJsonPath: "history",
    //       },
    //       show: true,
    //     },
    //   },
    // },
    {
      label: "Parties",
      displayLabel: "PARTIES_TAB",
      type: "search",
      apiDetails: {
        serviceName: "/case/v1/_search",
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
        moduleName: "PartiesConfig",
        minParametersForSearchForm: 0,
        tableFormJsonPath: "requestParam",
        filterFormJsonPath: "requestBody.Individual",
        searchFormJsonPath: "requestBody.Individual",
      },
      sections: {
        search: {
          uiConfig: {},
          show: false,
        },
        searchResult: {
          tenantId: Digit.ULBService.getCurrentTenantId(),
          uiConfig: {
            columns: [
              {
                label: "PARTY_NAME",
                jsonPath: "name",
                additionalCustomization: true,
              },
              {
                label: "PARTY_TYPE",
                jsonPath: "partyType",
                additionalCustomization: true,
              },
              {
                label: "ASSOCIATED_WITH",
                jsonPath: "",
                additionalCustomization: true,
              },
              {
                label: "STATUS",
                jsonPath: "",
                additionalCustomization: true,
              },
              {
                label: "DATE_ADDED",
                jsonPath: "auditDetails.createdTime",
                additionalCustomization: true,
              },
              {
                label: "ACTIONS",
                jsonPath: "",
                additionalCustomization: true,
              },
            ],

            enableColumnSort: true,
            resultsJsonPath: "criteria.responseList.parties",
            manualPagination: false,
          },
          show: true,
        },
      },
    },
  ],
};
