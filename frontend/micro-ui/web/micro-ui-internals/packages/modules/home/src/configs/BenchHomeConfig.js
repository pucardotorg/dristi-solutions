const defaultSearchValues = {
  caseSearchText: "",
  caseType: "NIA S138",
  substage: "",
};

export const userTypeOptions = [
  {
    code: "LITIGANT",
    name: "LITIGANT_TEXT",
    showBarDetails: false,
    isVerified: false,
    role: [
      "CASE_CREATOR",
      "CASE_EDITOR",
      "CASE_VIEWER",
      "EVIDENCE_CREATOR",
      "EVIDENCE_VIEWER",
      "EVIDENCE_EDITOR",
      "APPLICATION_CREATOR",
      "APPLICATION_VIEWER",
      "HEARING_VIEWER",
      "ORDER_VIEWER",
      "SUBMISSION_CREATOR",
      "SUBMISSION_RESPONDER",
      "SUBMISSION_DELETE",
      "TASK_VIEWER",
      "ADVOCATE_VIEWER",
      "PENDING_TASK_CREATOR",
      "BAIL_BOND_CREATOR",
      "BAIL_BOND_VIEWER",
      "BAIL_BOND_EDITOR",
    ],
    subText: "LITIGANT_SUB_TEXT",
  },
  {
    code: "ADVOCATE",
    name: "ADVOCATE_TEXT",
    showBarDetails: true,
    isVerified: true,
    hasBarRegistrationNo: true,
    role: [
      "ADVOCATE_ROLE",
      "CASE_CREATOR",
      "CASE_EDITOR",
      "CASE_VIEWER",
      "EVIDENCE_CREATOR",
      "EVIDENCE_VIEWER",
      "EVIDENCE_EDITOR",
      "APPLICATION_CREATOR",
      "APPLICATION_VIEWER",
      "HEARING_VIEWER",
      "ORDER_VIEWER",
      "SUBMISSION_CREATOR",
      "SUBMISSION_RESPONDER",
      "SUBMISSION_DELETE",
      "TASK_VIEWER",
      "USER_REGISTER",
      "ADVOCATE_VIEWER",
      "ADVOCATE_APPLICATION_VIEWER",
      "PENDING_TASK_CREATOR",
      "BAIL_BOND_CREATOR",
      "BAIL_BOND_VIEWER",
      "BAIL_BOND_EDITOR",
    ],
    apiDetails: {
      serviceName: "/advocate/v1/_create",
      requestKey: "advocate",
      AdditionalFields: ["barRegistrationNumber"],
    },
    subText: "ADVOCATE_SUB_TEXT",
  },
  {
    code: "ADVOCATE_CLERK",
    name: "ADVOCATE_CLERK_TEXT",
    showBarDetails: true,
    hasStateRegistrationNo: true,
    isVerified: true,
    role: [
      "ADVOCATE_CLERK_ROLE",
      "CASE_CREATOR",
      "CASE_EDITOR",
      "CASE_VIEWER",
      "EVIDENCE_CREATOR",
      "EVIDENCE_VIEWER",
      "EVIDENCE_EDITOR",
      "APPLICATION_CREATOR",
      "APPLICATION_VIEWER",
      "HEARING_VIEWER",
      "ORDER_VIEWER",
      "SUBMISSION_CREATOR",
      "SUBMISSION_RESPONDER",
      "SUBMISSION_DELETE",
      "TASK_VIEWER",
      "USER_REGISTER",
      "ADVOCATE_VIEWER",
      "ADVOCATE_APPLICATION_VIEWER",
      "PENDING_TASK_CREATOR",
      "BAIL_BOND_CREATOR",
      "BAIL_BOND_VIEWER",
      "BAIL_BOND_EDITOR",
    ],
    apiDetails: {
      serviceName: "/advocate/clerk/v1/_create",
      requestKey: "clerk",
      AdditionalFields: ["stateRegnNumber"],
    },

    subText: "ADVOCATE_CLERK_SUB_TEXT",
  },
];

export const TabBenchSearchConfig = {
  tenantId: "pg",
  moduleName: "homeJudgeUIConfig",
  showTab: true,
  TabSearchConfig: [
    {
      label: "CS_ALL",
      type: "search",
      apiDetails: {
        serviceName: "/case/v2/search/list",
        requestParam: {},
        requestBody: {
          tenantId: "pg",
          criteria: {
            stage: ["Pre-Trial", "Trial", "Post-Trial"],
            status: ["PENDING_REGISTRATION", "PENDING_ADMISSION", "CASE_ADMITTED", "PENDING_ADMISSION_HEARING", "PENDING_NOTICE", "PENDING_RESPONSE"],
          },
        },
        masterName: "commonUiConfig",
        moduleName: "homeJudgeUIConfig",
        minParametersForSearchForm: 0,
        tableFormJsonPath: "requestBody",
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
                label: "CASE_TYPE",
                isMandatory: false,
                key: "caseType",
                type: "dropdown",
                disable: false,
                populators: {
                  name: "caseType",
                  options: ["NIA S138"],
                  styles: {
                    maxWidth: "200px",
                    minWidth: "150px",
                  },
                  optionsCustomStyle: {
                    overflowX: "hidden",
                  },
                },
              },
              {
                label: "CS_STAGE",
                isMandatory: false,
                key: "stage",
                type: "dropdown",
                disable: false,
                populators: {
                  name: "substage",
                  optionsKey: "code",
                  mdmsConfig: {
                    masterName: "SubStage",
                    moduleName: "case",
                    select: "(data) => {return data['case'].SubStage?.map((item) => {return item});}",
                  },
                  styles: {
                    maxWidth: "250px",
                    minWidth: "200px",
                  },
                  optionsCustomStyle: {
                    overflowX: "hidden",
                  },
                },
              },
              {
                label: "CS_CASE_NAME_ID",
                type: "text",
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
                label: "CS_CASE_NAME",
                jsonPath: "caseTitle",
              },
              {
                label: "CS_STAGE",
                jsonPath: "substage",
                additionalCustomization: true,
              },
              {
                label: "CS_CASE_NUMBER_HOME",
                jsonPath: "filingNumber",
                additionalCustomization: true,
              },
              {
                label: "CASE_TYPE",
                jsonPath: "",
                additionalCustomization: true,
              },
              {
                label: "CS_FILING_DATE",
                jsonPath: "filingDate",
                additionalCustomization: true,
              },
            ],

            enableColumnSort: true,
            resultsJsonPath: "caseList",
          },
          show: true,
        },
      },
    },
    {
      label: "CD_ONGOING",
      type: "search",
      apiDetails: {
        serviceName: "/case/v2/search/list",
        requestParam: {},
        requestBody: {
          tenantId: "pg",
          criteria: {
            stage: ["Trial"],
            status: ["PENDING_REGISTRATION", "PENDING_ADMISSION", "CASE_ADMITTED", "PENDING_ADMISSION_HEARING", "PENDING_NOTICE", "PENDING_RESPONSE"],
          },
        },
        masterName: "commonUiConfig",
        moduleName: "homeJudgeUIConfig",
        minParametersForSearchForm: 0,
        tableFormJsonPath: "requestBody",
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
            defaultValues: defaultSearchValues, // Set default values for search fields
            fields: [
              {
                label: "CASE_TYPE",
                isMandatory: false,
                key: "caseType",
                type: "dropdown",
                disable: false,
                populators: {
                  name: "caseType",
                  options: ["NIA S138"],
                  styles: {
                    maxWidth: "200px",
                    minWidth: "150px",
                  },
                  optionsCustomStyle: {
                    overflowX: "hidden",
                  },
                },
              },
              {
                label: "CS_STAGE",
                isMandatory: false,
                key: "stage",
                type: "dropdown",
                disable: false,
                populators: {
                  name: "substage",
                  optionsKey: "code",
                  mdmsConfig: {
                    masterName: "SubStage",
                    moduleName: "case",
                    select: "(data) => {return data['case'].SubStage?.map((item) => {return item});}",
                  },
                  styles: {
                    maxWidth: "250px",
                    minWidth: "200px",
                  },
                  optionsCustomStyle: {
                    overflowX: "hidden",
                  },
                },
              },
              {
                label: "CS_CASE_NAME_ID",
                type: "text",
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
                label: "CS_CASE_NAME",
                jsonPath: "caseTitle",
              },
              {
                label: "CS_STAGE",
                jsonPath: "substage",
                additionalCustomization: true,
              },
              {
                label: "CS_CASE_NUMBER_HOME",
                jsonPath: "filingNumber",
                additionalCustomization: true,
              },
              {
                label: "CASE_TYPE",
                jsonPath: "",
                additionalCustomization: true,
              },
              {
                label: "CS_FILING_DATE",
                jsonPath: "filingDate",
                additionalCustomization: true,
              },
            ],

            enableColumnSort: true,
            resultsJsonPath: "caseList",
          },
          show: true,
        },
      },
    },
    {
      label: "CS_REGISTERED",
      type: "search",
      apiDetails: {
        serviceName: "/case/v2/search/list",
        requestParam: {},
        requestBody: {
          tenantId: "pg",
          criteria: {
            stage: ["Pre-Trial"],
            status: ["PENDING_REGISTRATION", "PENDING_ADMISSION", "PENDING_ADMISSION_HEARING", "PENDING_NOTICE", "PENDING_RESPONSE"],
          },
        },
        masterName: "commonUiConfig",
        moduleName: "homeJudgeUIConfig",
        minParametersForSearchForm: 0,
        tableFormJsonPath: "requestBody",
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
                type: "component",
                component: "CustomSortComponent",
                isMandatory: false,
                disable: false,
                name: "Filed",
                key: "sortCaseListByDate",
                sortBy: "createdtime",
                ascText: "First",
                descText: "Last",
                showAdditionalText: true,
                showIcon: true,
                icon: "UpDownArrowIcon",
                populators: {},
              },
              {
                label: "CASE_TYPE",
                isMandatory: false,
                key: "caseType",
                type: "dropdown",
                disable: false,
                populators: {
                  name: "caseType",
                  options: ["NIA S138"],
                  styles: {
                    maxWidth: "200px",
                    minWidth: "150px",
                  },
                  optionsCustomStyle: {
                    overflowX: "hidden",
                  },
                },
              },
              {
                label: "CS_STAGE",
                isMandatory: false,
                key: "stage",
                type: "dropdown",
                disable: false,
                populators: {
                  name: "substage",
                  optionsKey: "code",
                  mdmsConfig: {
                    masterName: "SubStage",
                    moduleName: "case",
                    select: "(data) => {return data['case'].SubStage?.map((item) => {return item});}",
                  },
                  styles: {
                    maxWidth: "250px",
                    minWidth: "200px",
                  },
                  optionsCustomStyle: {
                    overflowX: "hidden",
                  },
                },
              },
              {
                label: "CS_CASE_NAME_ID",
                type: "text",
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
                label: "CS_CASE_NAME",
                jsonPath: "caseTitle",
              },
              {
                label: "CS_STAGE",
                jsonPath: "substage",
                additionalCustomization: true,
              },

              {
                label: "CS_CASE_NUMBER_HOME",
                jsonPath: "filingNumber",
                additionalCustomization: true,
              },
              {
                label: "CASE_TYPE",
                jsonPath: "",
                additionalCustomization: true,
              },
              {
                label: "CS_FILING_DATE",
                jsonPath: "filingDate",
                additionalCustomization: true,
              },
            ],

            enableColumnSort: true,
            resultsJsonPath: "caseList",
          },
          show: true,
        },
        additionalDetails: {
          sortBy: "sortCaseListByDate",
        },
      },
    },
    {
      label: "CD_CLOSED",
      type: "search",
      apiDetails: {
        serviceName: "/case/v2/search/list",
        requestParam: {},
        requestBody: {
          tenantId: "pg",
          criteria: {
            outcome: [],
          },
        },
        masterName: "commonUiConfig",
        moduleName: "homeJudgeUIConfig",
        minParametersForSearchForm: 0,
        tableFormJsonPath: "requestBody",
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
                type: "component",
                component: "CustomSortComponent",
                isMandatory: false,
                disable: false,
                name: "Closed:",
                key: "sortCaseListByDate",
                sortBy: "createdtime",
                ascText: "new first",
                descText: "old first",
                showAdditionalText: true,
                showIcon: true,
                icon: "UpDownArrowIcon",
                populators: {},
              },
              {
                label: "CASE_TYPE",
                isMandatory: false,
                key: "caseType",
                type: "dropdown",
                disable: false,
                populators: {
                  name: "caseType",
                  options: ["NIA S138"],
                  styles: {
                    maxWidth: "200px",
                    minWidth: "150px",
                  },
                  optionsCustomStyle: {
                    overflowX: "hidden",
                  },
                },
              },
              {
                label: "CD_OUTCOME",
                isMandatory: false,
                key: "outcome",
                type: "dropdown",
                disable: false,
                populators: {
                  name: "outcome",
                  optionsKey: "outcome",
                  mdmsConfig: {
                    masterName: "OutcomeType",
                    moduleName: "case",
                    select:
                      "(data) => {return data['case'].OutcomeType?.flatMap((item) => {return item.judgementList && item.judgementList.length > 0 ? item.judgementList.map(it => ({outcome: it})) : [item];});}",
                  },
                  styles: {
                    maxWidth: "250px",
                    minWidth: "200px",
                  },
                  optionsCustomStyle: {
                    overflowX: "hidden",
                  },
                },
              },
              {
                label: "CS_CASE_NAME_ID",
                type: "text",
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
                label: "CS_CASE_NAME",
                jsonPath: "caseTitle",
              },
              {
                label: "CD_OUTCOME",
                jsonPath: "outcome",
                additionalCustomization: true,
              },
              {
                label: "CS_CASE_NUMBER_HOME",
                jsonPath: "filingNumber",
                additionalCustomization: true,
              },
              {
                label: "CASE_TYPE",
                jsonPath: "",
                additionalCustomization: true,
              },
              {
                label: "CS_FILING_DATE",
                jsonPath: "filingDate",
                additionalCustomization: true,
              },
            ],

            enableColumnSort: true,
            resultsJsonPath: "caseList",
          },
          show: true,
        },
      },
      additionalDetails: {
        sortBy: "sortCaseListByDate",
      },
    },
  ],
};
