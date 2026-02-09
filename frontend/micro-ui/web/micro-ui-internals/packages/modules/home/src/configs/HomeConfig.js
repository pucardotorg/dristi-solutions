import { TabBenchSearchConfig } from "./BenchHomeConfig";
import { TabCourtRoomSearchConfig } from "./CourtRoomHomeConfig";
import { TabFSOSearchConfig } from "./FSOHomeConfig";
import { TabJudgeSearchConfig } from "./JudgeHomeConfig";
import { TabLitigantSearchConfig } from "./LitigantHomeConfig";

export const CaseWorkflowState = {
  CASE_REASSIGNED: "CASE_REASSIGNED",
  DRAFT_IN_PROGRESS: "DRAFT_IN_PROGRESS",
  UNDER_SCRUTINY: "UNDER_SCRUTINY",
  CASE_ADMITTED: "CASE_ADMITTED",
  PENDING_ADMISSION: "PENDING_ADMISSION",
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

export const TabUnifiedEmployeeSearchConfig = {
  tenantId: Digit.ULBService.getCurrentTenantId(),
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
          tenantId: Digit.ULBService.getCurrentTenantId(),
          criteria: {
            stage: ["Pre-Trial", "Trial", "Post-Trial", "Long Pending Register"],
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
            defaultValues: {
              caseSearchText: "",
              caseType: "NIA S138",
              substage: "",
            },
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
                    select: "(data) => {return data['case'].SubStage?.map((item) => {return item}).sort((a,b) => a.code.localeCompare(b.code));}",
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
          tenantId: Digit.ULBService.getCurrentTenantId(),
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
            defaultValues: {
              caseSearchText: "",
              caseType: "NIA S138",
              substage: "",
            },
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
                    select: "(data) => {return data['case'].SubStage?.map((item) => {return item}).sort((a,b) => a.code.localeCompare(b.code));}",
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
          tenantId: Digit.ULBService.getCurrentTenantId(),
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
            defaultValues: {
              caseSearchText: "",
              caseType: "NIA S138",
              substage: "",
            },
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
                    select: "(data) => {return data['case'].SubStage?.map((item) => {return item}).sort((a,b) => a.code.localeCompare(b.code));}",
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
          tenantId: Digit.ULBService.getCurrentTenantId(),
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
            defaultValues: {
              caseSearchText: "",
              caseType: "NIA S138",
              substage: "",
            },
            fields: [
              {
                type: "component",
                component: "CustomSortComponent",
                isMandatory: false,
                disable: false,
                name: "Closed:",
                key: "sortCaseListByDate",
                sortBy: "createdtime",
                ascText: "New First",
                descText: "Old First",
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
                      "(data) => {return data['case'].OutcomeType?.flatMap((item) => {return item.judgementList && item.judgementList.length > 0 ? item.judgementList.map(it => ({outcome: it})) : [item];}).sort((a,b) => a.outcome.localeCompare(b.outcome));}",
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
    {
      label: "CS_LPR",
      type: "search",
      apiDetails: {
        serviceName: "/case/v2/search/list",
        requestParam: {},
        requestBody: {
          tenantId: Digit.ULBService.getCurrentTenantId(),
          criteria: {
            isLPRCase: true,
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
            defaultValues: {
              caseSearchText: "",
              caseType: "NIA S138",
              substage: "",
            },
            fields: [
              {
                type: "component",
                component: "CustomSortComponent",
                isMandatory: false,
                disable: false,
                name: "Closed:",
                key: "sortCaseListByDate",
                sortBy: "createdtime",
                ascText: "New First",
                descText: "Old First",
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

export const CaseReviewerAdditionalTab = {
  label: "CS_SCRUTINY_DUE",
  type: "search",
  apiDetails: {
    serviceName: "/case/v2/search/list",
    requestParam: {},
    requestBody: {
      tenantId: Digit.ULBService.getCurrentTenantId(),
      criteria: {
        status: ["UNDER_SCRUTINY"],
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
        defaultValues: {
          caseSearchText: "",
          caseType: "NIA S138",
          substage: "",
          sortCaseListByDate: {
            sortBy: "createdtime",
            order: "desc",
          },
        },
        fields: [
          {
            type: "component",
            component: "CustomSortComponent",
            isMandatory: false,
            disable: false,
            name: "Filed",
            key: "sortCaseListByDate",
            sortBy: "createdtime",
            ascText: "(Old First)",
            descText: "(New First)",
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
            label: "CS_SCRUTINY_STATUS",
            jsonPath: "status",
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
            label: "CS_DAYS_FILING",
            jsonPath: "lastModifiedTime",
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
};

export const getUnifiedEmployeeConfig = (roles) => {
  const baseConfig = { ...TabUnifiedEmployeeSearchConfig };
  const hasCaseReviewerRole = roles?.some((role) => role.code === "CASE_REVIEWER");
  const allTabs = [...baseConfig.TabSearchConfig];
  baseConfig.TabSearchConfig = allTabs;
  return baseConfig;
};

export const getOnRowClickConfig = (roles) => {
  const hasCaseReviewerRole = roles?.some((role) => role.code === "CASE_REVIEWER");

  if (hasCaseReviewerRole) {
    return {
      dependentUrl: "/dristi/case",
      urlDependentOn: "status",
      urlDependentValue: "UNDER_SCRUTINY",
      params: [{ key: "caseId", value: "id" }],
    };
  } else {
    return {
      dependentUrl: "/dristi/admission",
      urlDependentOn: "status",
      urlDependentValue: "",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "caseId", value: "id" },
      ],
    };
  }
};

export const rolesToConfigMapping = [
  {
    roles: ["CASE_VIEWER", "JUDGE_ROLE"], // this mapping is redundant now, we are now using getUnifiedEmployeeConfig logic for employees config.
    config: TabJudgeSearchConfig,
    isJudge: true,
    onRowClickRoute: {
      dependentUrl: "/dristi/admission",
      urlDependentOn: "status",
      urlDependentValue: "",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "caseId", value: "id" },
      ],
    },
  },
  // {
  //   roles: ["CASE_VIEWER"],
  //   config: getUnifiedEmployeeConfig(["CASE_VIEWER"]),
  //   isJudge: true,
  //   onRowClickRoute: getOnRowClickConfig(["CASE_VIEWER"]),
  // },
  {
    roles: ["TYPIST_ROLE"], // this mapping is redundant now, we are now using getUnifiedEmployeeConfig logic for employees config.
    config: TabJudgeSearchConfig,
    isTypist: true,
    onRowClickRoute: {
      dependentUrl: "/dristi/admission",
      urlDependentOn: "status",
      urlDependentValue: "",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "caseId", value: "id" },
      ],
    },
  },
  {
    roles: ["CASE_VIEWER", "HEARING_CREATOR"], // this mapping is redundant now, we are now using getUnifiedEmployeeConfig logic for employees config.
    config: TabJudgeSearchConfig,
    isCourtOfficer: true,
    onRowClickRoute: {
      dependentUrl: "/dristi/admission",
      urlDependentOn: "status",
      urlDependentValue: "",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "caseId", value: "id" },
      ],
    },
  },
  {
    roles: ["CASE_VIEWER", "CASE_REVIEWER"], // this mapping is redundant now, we are now using getUnifiedEmployeeConfig logic for employees config.
    config: TabFSOSearchConfig,
    isFSO: true,
    onRowClickRoute: {
      dependentUrl: "/dristi/case",
      urlDependentOn: "status",
      urlDependentValue: "UNDER_SCRUTINY",
      params: [{ key: "caseId", value: "id" }],
    },
  },
  // {
  //   roles: ["CASE_VIEWER", "CASE_REVIEWER"],
  //   config: getUnifiedEmployeeConfig(["CASE_VIEWER", "CASE_REVIEWER"]),
  //   isFSO: true,
  //   onRowClickRoute: getOnRowClickConfig(["CASE_VIEWER", "CASE_REVIEWER"]),
  // },
  {
    roles: ["CASE_VIEWER", "BENCH_CLERK"], // this mapping is redundant now, we are now using getUnifiedEmployeeConfig logic for employees config.
    config: TabBenchSearchConfig,
    isCourtOfficer: true,
    onRowClickRoute: {
      dependentUrl: "/dristi/admission",
      urlDependentOn: "status",
      urlDependentValue: "",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "caseId", value: "id" },
      ],
    },
  },
  {
    roles: ["CASE_VIEWER", "COURT_ADMIN", "COURT_ROOM_MANAGER"], // this mapping is redundant now, we are now using getUnifiedEmployeeConfig logic for employees config.
    config: TabCourtRoomSearchConfig,
    isCourtOfficer: true,
    onRowClickRoute: {
      dependentUrl: "/dristi/admission",
      urlDependentOn: "status",
      urlDependentValue: "",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "caseId", value: "id" },
      ],
    },
  },
];

export const litigantConfig = {
  roles: ["CASE_VIEWER"],
  config: TabLitigantSearchConfig,
  isLitigant: true,
  showJoinFileOption: true,
  onRowClickRoute: {
    dependentUrl: "/dristi/home/file-case/case",
    urlDependentOn: "status",
    urlDependentValue: ["DRAFT_IN_PROGRESS", "CASE_REASSIGNED"],
    params: [{ key: "caseId", value: "id" }],
  },
};

export const caseTypes = [{ name: "NIA S138", code: "NIA S138" }];

export const taskTypes = [
  { code: "case-default", name: "WBH_MDMS_MASTER_CASE" },
  { code: "hearing-default", name: "CS_HEARING" },
  { code: "order-default", name: "CS_ORDER" },
  { code: "application-voluntary-submission", name: "VOLUNTARY_SUBMISSION" },
  { code: "application-order-submission-feedback", name: "ORDER_SUBMISSION_FEEDBACK" },
  { code: "application-order-submission-default", name: "ORDER_SUBMISSION" },
  { code: "artifact-default", name: "EVIDENCE" },
  { code: "task-summons", name: "TASK_SUMMONS" },
];
export const pendingTaskCaseActions = {
  PENDING_PAYMENT: {
    actorName: ["LITIGANT/ADVOCATE"],
    actionName: "Make Payment",
    redirectDetails: {
      url: "/home/home-pending-task/e-filing-payment-breakdown",
    },
  },
  RE_PENDING_PAYMENT: {
    actorName: ["LITIGANT/ADVOCATE"],
    actionName: "Make Payment",
    redirectDetails: {
      url: "/home/home-pending-task/e-filing-payment-breakdown",
    },
  },
  PENDING_RESPONSE: {
    actorName: ["LITIGANT/ADVOCATE"],
    actionName: "Pending Response",
  },
  UNDER_SCRUTINY: {
    actorName: ["FSO"],
    actionName: "Case Filed and ready for FSO to review",
    redirectDetails: {
      url: "/dristi/case",
      params: [{ key: "caseId", value: "id" }],
    },
  },
  CASE_REASSIGNED: {
    actorName: ["LITIGANT/ADVOCATE"],
    actionName: "Case Sent Back for Edit",
    redirectDetails: {
      url: "/dristi/home/file-case/case",
      params: [{ key: "caseId", value: "id" }],
    },
  },
  "PENDING_E-SIGN": {
    actorName: ["LITIGANT/ADVOCATE"],
    actionName: "E-Sign Pending",
    redirectDetails: {
      url: "/dristi/home/file-case/sign-complaint",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "caseId", value: "id" },
      ],
    },
  },
  "PENDING_E-SIGN-2": {
    actorName: ["LITIGANT/ADVOCATE"],
    actionName: "E-Sign Pending",
    redirectDetails: {
      url: "/dristi/home/file-case/sign-complaint",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "caseId", value: "id" },
      ],
    },
  },
  PENDING_SIGN: {
    actorName: ["LITIGANT/ADVOCATE"],
    actionName: "E-Sign Pending",
    redirectDetails: {
      url: "/dristi/home/file-case/sign-complaint",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "caseId", value: "id" },
      ],
    },
  },
  "PENDING_RE_E-SIGN": {
    actorName: ["LITIGANT/ADVOCATE"],
    actionName: "E-Sign Pending",
    redirectDetails: {
      url: "/dristi/home/file-case/sign-complaint",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "caseId", value: "id" },
      ],
    },
  },
  "PENDING_RE_E-SIGN-2": {
    actorName: ["LITIGANT/ADVOCATE"],
    actionName: "E-Sign Pending",
    redirectDetails: {
      url: "/dristi/home/file-case/sign-complaint",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "caseId", value: "id" },
      ],
    },
  },
  PENDING_RE_SIGN: {
    actorName: ["LITIGANT/ADVOCATE"],
    actionName: "E-Sign Pending",
    redirectDetails: {
      url: "/dristi/home/file-case/sign-complaint",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "caseId", value: "id" },
      ],
    },
  },
  PENDING_ADMISSION: {
    actorName: ["JUDGE"],
    actionName: "Case Approved from Scrutiny",
    redirectDetails: {
      url: "/dristi/home/view-case",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "caseId", value: "id" },
      ],
    },
  },
  CASE_ADMITTED: {
    actorName: ["JUDGE"],
    actionName: "Schedule admission hearing",
    redirectDetails: {
      url: "/dristi/home/view-case",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "caseId", value: "id" },
      ],
    },
  },
  SCHEDULE_HEARING: {
    actorName: ["JUDGE"],
    actionName: "Schedule admission hearing",
    redirectDetails: {
      url: "/home/home-pending-task/home-schedule-hearing",
      params: [{ key: "filingNumber", value: "filingNumber" }],
    },
  },
  PENDING_REGISTRATION: {
    actorName: ["JUDGE"],
    actionName: "Register the Case",
    redirectDetails: {
      url: "/dristi/admission",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "caseId", value: "id" },
      ],
    },
  },
  PENDING_ADMISSION_HEARING: {
    actorName: ["JUDGE"],
    actionName: "Register the Case",
    redirectDetails: {
      url: "/dristi/admission",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "caseId", value: "id" },
      ],
    },
  },
};

export const pendingTaskHearingActions = {
  SCHEDULE_HEARING: {
    actorName: ["JUDGE"],
    actionName: "Schedule admission hearing",
    redirectDetails: {
      url: "/home/home-pending-task/home-schedule-hearing",
      params: [{ key: "filingNumber", value: "filingNumber" }],
    },
  },
  OPTOUT: {
    actorName: ["LITIGANT/ADVOCATE"],
    actionName: "Schedule admission hearing",
    redirectDetails: {
      url: "/home/home-pending-task/home-schedule-hearing",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "status", defaultValue: "OPTOUT" },
      ],
    },
  },
  ABANDONED: {
    actorName: ["JUDGE"],
    actionName: "Schedule admission hearing",
    customFunction: "handleCreateOrder",
    // additionalDetailsKeys: ["orderType"],
    redirectDetails: {
      url: "/orders/generate-order",
      params: [{ key: "filingNumber", value: "filingNumber" }],
    },
  },
};

export const pendingTaskOrderActions = {
  CREATE_ORDER: {
    actorName: ["JUDGE"],
    actionName: "Schedule hearing",
    redirectDetails: {
      url: "/orders/generate-order",
      params: [{ key: "filingNumber", value: "filingNumber" }],
    },
  },
  SAVE_DRAFT: {
    actorName: ["JUDGE"],
    actionName: "Schedule admission hearing",
    customFunction: "handleCreateOrder",
    additionalDetailsKeys: ["orderType"],
    redirectDetails: {
      url: "/orders/generate-order",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "applicationNumber", value: "referenceId" },
      ],
    },
  },
  DRAFT_IN_PROGRESS: {
    actorName: ["JUDGE"],
    actionName: "Draft in Progress for Order",
    redirectDetails: {
      url: "/orders/generate-order",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "orderNumber", value: "referenceId" },
      ],
    },
  },

  SUMMON_WARRANT_STATUS: {
    actorName: ["JUDGE"],
    actionName: "Show Summon-Warrant Status",
    redirectDetails: {
      url: "/home/home-pending-task/summons-warrants-modal",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "hearingId", value: "referenceId" },
        { key: "taskOrderType", defaultValue: "SUMMONS" },
      ],
    },
  },
  NOTICE_STATUS: {
    actorName: ["JUDGE"],
    actionName: "Show Notice Status",
    additionalDetailsKeys: ["partyIndex"],
    redirectDetails: {
      url: "/home/home-pending-task/summons-warrants-modal",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "hearingId", value: "referenceId" },
        { key: "taskOrderType", defaultValue: "NOTICE" },
      ],
    },
  },
  PAYMENT_PENDING_POST: {
    actorName: ["JUDGE"],
    actionName: "Show Summon-Warrant Status",
    redirectDetails: {
      url: "/home/home-pending-task/post-payment-modal",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "taskNumber", value: "referenceId" },
      ],
    },
  },
  PAYMENT_PENDING_RPAD: {
    actorName: ["JUDGE"],
    actionName: "Show Summon-Warrant Status",
    redirectDetails: {
      url: "/home/home-pending-task/rpad-payment-modal",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "taskNumber", value: "referenceId" },
      ],
    },
  },
  PAYMENT_PENDING_SMS: {
    actorName: ["JUDGE"],
    actionName: "Show Summon-Warrant Status",
    redirectDetails: {
      url: "/home/home-pending-task/sms-payment-modal",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "taskNumber", value: "referenceId" },
      ],
    },
  },
  PAYMENT_PENDING_EMAIL: {
    actorName: ["JUDGE"],
    actionName: "Show Summon-Warrant Status",
    redirectDetails: {
      url: "/home/home-pending-task/email-payment-modal",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "taskNumber", value: "referenceId" },
      ],
    },
  },
  RESCHEDULE_HEARING: {
    actorName: ["JUDGE"],
    actionName: "Schedule admission hearing",
    redirectDetails: {
      url: "/home/home-pending-task/home-set-next-hearing",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "hearingId", value: "referenceId" },
      ],
    },
  },
  PAYMENT_PENDING_POLICE: {
    actorName: ["JUDGE"],
    actionName: "Show Warrant Payment Status",
    redirectDetails: {
      url: "/home/home-pending-task/icops-payment-modal",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "taskNumber", value: "referenceId" },
      ],
    },
  },
  "RE-ISSUE_SUMMON": {
    actorName: ["JUDGE"],
    redirectDetails: {
      url: "/home/home-pending-task/reissue-summons-modal",
      params: [
        { key: "caseId", value: "id" },
        { key: "caseTitle", value: "caseTitle" },
        { key: "filingNumber", value: "filingNumber" },
        { key: "cnrNumber", value: "cnrNumber" },
        { key: "hearingId", value: "referenceId" },
        { key: "orderType", defaultValue: "SUMMONS" },
      ],
    },
  },
  "RE-ISSUE_NOTICE": {
    actorName: ["JUDGE"],
    redirectDetails: {
      url: "/home/home-pending-task/reissue-summons-modal",
      params: [
        { key: "caseId", value: "id" },
        { key: "caseTitle", value: "caseTitle" },
        { key: "filingNumber", value: "filingNumber" },
        { key: "cnrNumber", value: "cnrNumber" },
        { key: "hearingId", value: "referenceId" },
        { key: "orderType", defaultValue: "NOTICE" },
      ],
    },
  },
};

export const pendingTaskOrderOfJudgementActions = {};

export const pendingTaskVoluntarySubmissionActions = {
  CREATE_DCA_SUBMISSION: {
    actorName: ["LITIGANT/ADVOCATE"],
    actionName: "Create DCA Application",
    redirectDetails: {
      url: "/submissions/submissions-create",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "applicationType", defaultValue: "DELAY_CONDONATION" },
      ],
    },
  },
  MAKE_PAYMENT_SUBMISSION: {
    actorName: ["LITIGANT/ADVOCATE"],
    actionName: "Payment for Submission",
    redirectDetails: {
      url: "/submissions/submissions-create",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "applicationNumber", value: "referenceId" },
      ],
    },
  },
  ESIGN_THE_SUBMISSION: {
    actorName: ["LITIGANT/ADVOCATE"],
    actionName: "Esign the Submission",
    redirectDetails: {
      url: "/submissions/submissions-create",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "applicationNumber", value: "referenceId" },
      ],
    },
  },
  PENDINGESIGN: {
    actorName: ["LITIGANT/ADVOCATE"],
    actionName: "Esign the Submission",
    redirectDetails: {
      url: "/submissions/submissions-create",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "applicationNumber", value: "referenceId" },
      ],
    },
  },
  PENDINGREVIEW: {
    actorName: ["JUDGE"],
    actionName: "Review the submission",
    customFunction: "handleReviewSubmission",
    redirectDetails: {
      url: "/submissions/submissions-create",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "applicationNumber", value: "referenceId" },
      ],
    },
  },
  PENDINGAPPROVAL: {
    actorName: ["JUDGE"],
    actionName: "Review the submission",
    customFunction: "handleReviewSubmission",
    redirectDetails: {
      url: "/submissions/submissions-create",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "applicationNumber", value: "referenceId" },
      ],
    },
  },
};

export const pendingTaskSubmissionWithResponseActions = {
  CREATE_SUBMISSION: {
    actorName: ["LITIGANT/ADVOCATE"],
    actionName: "Mandatory Submission of Documents",
    customFunction: "handleReviewOrder",
    redirectDetails: {
      url: "/submissions/submissions-create",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "orderNumber", value: "referenceId" },
      ],
    },
  },
  MAKE_PAYMENT_SUBMISSION: {
    actorName: ["LITIGANT/ADVOCATE"],
    actionName: "Payment for Submission",
    redirectDetails: {
      url: "/submissions/submissions-create",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "applicationNumber", value: "referenceId" },
      ],
    },
  },
  ESIGN_THE_SUBMISSION: {
    actorName: ["LITIGANT/ADVOCATE"],
    actionName: "Esign the Submission",
    redirectDetails: {
      url: "/submissions/submissions-create",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "applicationNumber", value: "referenceId" },
      ],
    },
  },
  PENDINGRESPONSE: {
    actorName: ["LITIGANT/ADVOCATE"],
    actionName: "Review the submission",
    customFunction: "handleReviewSubmission",
    redirectDetails: {
      url: "/submissions/submissions-create",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "applicationNumber", value: "referenceId" },
      ],
    },
  },
};

export const pendingTaskSubmissionWithoutResponseActions = {
  CREATE_SUBMISSION: {
    actorName: ["LITIGANT/ADVOCATE"],
    actionName: "Mandatory Submission of Documents",
    customFunction: "handleReviewOrder",
    redirectDetails: {
      url: "/submissions/submissions-create",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "orderNumber", value: "referenceId" },
      ],
    },
  },
  MAKE_PAYMENT_SUBMISSION: {
    actorName: ["LITIGANT/ADVOCATE"],
    actionName: "Payment for Submission",
    redirectDetails: {
      url: "/submissions/submissions-create",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "applicationNumber", value: "referenceId" },
      ],
    },
  },
  ESIGN_THE_SUBMISSION: {
    actorName: ["LITIGANT/ADVOCATE"],
    actionName: "Esign the Submission",
    redirectDetails: {
      url: "/submissions/submissions-create",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "applicationNumber", value: "referenceId" },
      ],
    },
  },
};

export const pendingTaskForArtifactActions = {};

export const pendingTaskForSummonsActions = {
  ISSUE_SUMMON: {
    actorName: ["CMO"],
    actionName: "Esign the Task Summon",
    redirectDetails: {
      url: "/orders/Summons&Notice",
      params: [{ key: "taskNumber", value: "referenceId" }],
    },
  },
};

export const pendingTaskForNoticeActions = {
  ISSUE_NOTICE: {
    actorName: ["CMO"],
    actionName: "Esign the Task Notice",
    redirectDetails: {
      url: "/orders/Summons&Notice",
      params: [{ key: "taskNumber", value: "referenceId" }],
    },
  },
};

export const pendingTaskForDocumentSubmissionActions = {
  PENDINGESIGN_SUBMIT_DOCUMENT: {
    actorName: ["LITIGANT/ADVOCATE"],
    actionName: "Esign the Document Submission",
    redirectDetails: {
      url: "/submissions/submit-document",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "artifactNumber", value: "referenceId" },
      ],
    },
  },
};

export const pendingTaskVoluntarySubmissionBailDocumentsActions = {
  CREATE_SUBMISSION: {
    actorName: ["LITIGANT/ADVOCATE"],
    actionName: "Application for Submit Bail Documents",
    customFunction: "handleReviewOrder",
    redirectDetails: {
      url: "/submissions/submissions-create",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "orderNumber", value: "referenceId" },
      ],
    },
  },
  PENDINGAPPROVAL: {
    actorName: ["JUDGE"],
    actionName: "Review the submission",
    customFunction: "handleReviewSubmission",
    redirectDetails: {
      url: "/submissions/submissions-create",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "applicationNumber", value: "referenceId" },
      ],
    },
  },
  ESIGN_THE_SUBMISSION: {
    actorName: ["LITIGANT/ADVOCATE"],
    actionName: "Esign the Submission",
    redirectDetails: {
      url: "/submissions/submissions-create",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "applicationNumber", value: "referenceId" },
      ],
    },
  },
};

export const pendingTaskVoluntarySubmissionBailActions = {
  PENDINGAPPROVAL: {
    actorName: ["JUDGE"],
    actionName: "Review the submission",
    customFunction: "handleReviewSubmission",
    redirectDetails: {
      url: "/submissions/submissions-create",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "applicationNumber", value: "referenceId" },
      ],
    },
  },
  MAKE_PAYMENT_SUBMISSION: {
    actorName: ["LITIGANT/ADVOCATE"],
    actionName: "Payment for Submission",
    redirectDetails: {
      url: "/submissions/submissions-create",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "applicationNumber", value: "referenceId" },
      ],
    },
  },
  ESIGN_THE_SUBMISSION: {
    actorName: ["LITIGANT/ADVOCATE"],
    actionName: "Esign the Submission",
    redirectDetails: {
      url: "/submissions/submissions-create",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "applicationNumber", value: "referenceId" },
      ],
    },
  },
};

export const pendingTaskCaseGeneratePaymentActions = {
  PENDING_PAYMENT: {
    actorName: ["LITIGANT/ADVOCATE"],
    actionName: "Make Payment",
    redirectDetails: {
      url: "/home/home-pending-task/case-payment-demand-breakdown",
      params: [{ key: "taskNumber", value: "referenceId" }],
    },
  },
};

export const pendingTaskForBailBondActions = {
  PENDING_SIGN: {
    actorName: ["JUDGE"],
    actionName: "E-Sign Pending",
    redirectDetails: {
      url: "/home/bail-bond",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "caseTitle", value: "caseTitle" },
        { key: "caseId", value: "id" },
      ],
    },
  },
  PENDING_REVIEW: {
    actorName: ["JUDGE"],
    actionName: "Review the bail bond",
    redirectDetails: {
      url: "/home/sign-bail-bond",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "bailId", value: "referenceId" },
        { key: "caseId", value: "id" },
      ],
    },
  },
  "PENDING_E-SIGN": {
    actorName: ["LITIGANT/ADVOCATE"],
    actionName: "E-Sign Pending",
    redirectDetails: {
      url: "/dristi/home/bail-bond-sign",
      params: [{ key: "bailbondId", value: "referenceId" }],
    },
  },
  PENDING_RAISE_BAIL_BOND: {
    actorName: ["LITIGANT/ADVOCATE"],
    actionName: "Raise Bail Bond",
    redirectDetails: {
      url: "/submissions/bail-bond",
      params: [{ key: "filingNumber", value: "filingNumber" }],
    },
  },
};

export const pendingTaskForWitnessDepositionActions = {
  "PENDING_E-SIGN": {
    actorName: [""],
    actionName: "E-Sign Pending",
    redirectDetails: {
      url: "/dristi/home/evidence-sign",
      params: [
        { key: "artifactNumber", value: "referenceId" },
        { key: "filingNumber", value: "filingNumber" },
      ],
    },
  },
  PENDING_REVIEW: {
    actorName: ["JUDGE"],
    actionName: "Review the witness deposition",
    redirectDetails: {
      url: "/home/sign-witness-deposition",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "artifactNumber", value: "referenceId" },
        { key: "caseId", value: "id" },
      ],
    },
  },
};

export const pendingTaskForDigitalizedDocumentExaminationActions = {
  "PENDING_E-SIGN": {
    actorName: [""],
    actionName: "E-Sign Pending",
    redirectDetails: {
      url: "/dristi/home/digitalized-document-sign",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "digitalizedDocumentId", value: "referenceId" },
        { key: "type", defaultValue: "EXAMINATION_OF_ACCUSED" },
      ],
    },
  },
  PENDING_REVIEW: {
    actorName: ["JUDGE"],
    actionName: "Review the examination",
    redirectDetails: {
      url: "/home/digitized-document-sign",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "documentNumber", value: "referenceId" },
        { key: "caseId", value: "id" },
      ],
    },
  },
};

export const pendingTaskForDigitalizedDocumentPleaActions = {
  "PENDING_E-SIGN": {
    actorName: [""],
    actionName: "E-Sign Pending",
    redirectDetails: {
      url: "/dristi/home/digitalized-document-sign",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "digitalizedDocumentId", value: "referenceId" },
        { key: "type", defaultValue: "PLEA" },
      ],
    },
  },

  PENDING_REVIEW: {
    actorName: ["JUDGE"],
    actionName: "Review the plea",
    redirectDetails: {
      url: "/home/digitized-document-sign",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "documentNumber", value: "referenceId" },
        { key: "caseId", value: "id" },
      ],
    },
  },
};

export const pendingTaskForDigitalizedDocumentMediationActions = {
  "PENDING_E-SIGN": {
    actorName: [""],
    actionName: "E-Sign Pending",
    redirectDetails: {
      url: "/home/mediation-form-sign",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "documentNumber", value: "referenceId" },
        { key: "courtId", value: "courtId" },
      ],
    },
  },
  PENDING_REVIEW: {
    actorName: ["JUDGE"],
    actionName: "Review of Mediation Form",
    redirectDetails: {
      url: "/home/mediation-form-sign",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "documentNumber", value: "referenceId" },
      ],
    },
  },
  PENDING_UPLOAD: {
    actorName: ["JUDGE"],
    actionName: "Review the witness deposition",
    redirectDetails: {
      url: "/home/mediation-form-sign",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "documentNumber", value: "referenceId" },
        { key: "courtId", value: "courtId" },
      ],
    },
  },
};

export const selectTaskType = {
  "case-default": pendingTaskCaseActions,
  "hearing-default": pendingTaskHearingActions,
  "order-default": pendingTaskOrderActions,
  "application-voluntary-submission": pendingTaskVoluntarySubmissionActions,
  "delay-condonation-submission": pendingTaskVoluntarySubmissionActions,
  "application-order-submission-feedback": pendingTaskSubmissionWithResponseActions,
  "application-order-submission-default": pendingTaskSubmissionWithoutResponseActions,
  "artifact-default": pendingTaskForArtifactActions,
  "task-summons": pendingTaskForSummonsActions,
  "task-notice": pendingTaskForNoticeActions,
  "voluntary-document-submission": pendingTaskForDocumentSubmissionActions,
  "voluntary-application-submission-bail-documents": pendingTaskVoluntarySubmissionBailDocumentsActions,
  "voluntary-application-submission-bail": pendingTaskVoluntarySubmissionBailActions,
  "task-generic": pendingTaskCaseGeneratePaymentActions,
  "bail bond": pendingTaskForBailBondActions,
  "bail-bond-default": pendingTaskForBailBondActions,
  "witness-deposition-default": pendingTaskForWitnessDepositionActions,
  "digitalized-document-mediation": pendingTaskForDigitalizedDocumentMediationActions,
  "digitalized-document-examination": pendingTaskForDigitalizedDocumentExaminationActions,
  "digitalized-document-plea": pendingTaskForDigitalizedDocumentPleaActions,
};
