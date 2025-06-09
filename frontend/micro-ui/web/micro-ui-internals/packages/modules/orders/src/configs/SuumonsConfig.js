const defaultSearchValues = {
  searchText: "",
  applicationStatus: "",
  orderType: null,
};

export const defaultSearchValuesForJudgePending = {
  searchText: "",
  applicationStatus: {
    id: 2,
    code: "SIGN_PENDING",
    name: "Sign Pending",
    isActive: true,
  },
  orderType: {
    id: 2,
    code: "WARRANT",
    name: "Warrant",
    isActive: true,
  },
};

export const defaultSearchValuesForJudgeSent = {
  searchText: "",
  applicationStatus: "",
  orderType: {
    id: 2,
    code: "WARRANT",
    name: "Warrant",
    isActive: true,
  },
};

export const SummonsTabsConfig = {
  tenantId: "pg",
  moduleName: "reviewSummonWarrantNotice",
  showTab: true,
  SummonsTabsConfig: [
    {
      label: "PENDING",
      type: "search",
      apiDetails: {
        serviceName: "/task/v1/table/search",
        requestParam: {
          tenantId: Digit.ULBService.getCurrentTenantId(),
          limit: 10,
          offset: 0,
        },
        requestBody: {
          apiOperation: "SEARCH",
          criteria: {
            completeStatus: ["ISSUE_SUMMON", "ISSUE_NOTICE", "ISSUE_WARRANT"], // have to do changes
          },
        },
        masterName: "commonUiConfig",
        moduleName: "reviewSummonWarrantNotice",
        minParametersForSearchForm: 0,
        tableFormJsonPath: "requestParam",
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
                type: "component",
                component: "CustomSortComponent",
                isMandatory: false,
                disable: false,
                name: "Issue Date",
                key: "sortCaseListByDate",
                sortBy: "createdDate",
                showIcon: true,
                icon: "UpDownArrowIcon",
                populators: {},
              },
              {
                label: "ORDER_TYPE",
                isMandatory: false,
                key: "orderType",
                type: "dropdown",
                disable: false,
                populators: {
                  name: "orderType",
                  optionsKey: "code",
                  mdmsConfig: {
                    moduleName: "Order",
                    masterName: "CourtStaffOrderType",
                    select: "(data) => {return data['Order'].CourtStaffOrderType?.map((item) => {return item;});}",
                  },
                  optionsCustomStyle: {
                    overflowX: "hidden",
                  },
                  styles: {
                    maxWidth: "200px",
                    minWidth: "150px",
                  },
                },
              },
              {
                label: "E_SIGN_STATUS",
                isMandatory: false,
                key: "applicationStatus",
                type: "dropdown",
                disable: false,
                populators: {
                  name: "applicationStatus",
                  optionsKey: "code",
                  mdmsConfig: {
                    moduleName: "Order",
                    masterName: "ESignPendingStatus",
                    select: "(data) => {return data['Order'].ESignPendingStatus?.map((item) => {return item;});}",
                  },
                  optionsCustomStyle: {
                    overflowX: "hidden",
                  },
                  styles: {
                    maxWidth: "200px",
                    minWidth: "150px",
                  },
                },
              },
              {
                label: "SEARCH_E_PROCESS",
                isMandatory: false,
                type: "text",
                key: "searchText", // seach text
                disable: false,
                populators: {
                  name: "searchText",
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
                label: "CASE_NAME_ID",
                jsonPath: "filingNumber",
                additionalCustomization: true,
              },
              {
                label: "ORDER_TYPE",
                jsonPath: "taskType",
                additionalCustomization: true,
              },
              {
                label: "STATUS",
                jsonPath: "documentStatus",
                additionalCustomization: true,
              },
              {
                label: "DELIEVERY_CHANNEL",
                jsonPath: "delieveryChannel",
                additionalCustomization: true,
              },
              {
                label: "ISSUED",
                jsonPath: "createdDate",
                additionalCustomization: true,
              },
              {
                label: "HEARING_DATE",
                jsonPath: "hearingDate",
                additionalCustomization: true,
              },
            ],
            enableColumnSort: true,
            resultsJsonPath: "list",
          },
          show: true,
        },
      },
      additionalDetails: {
        sortBy: "sortCaseListByDate",
      },
    },
    {
      label: "SENT",
      type: "search",
      apiDetails: {
        serviceName: "/task/v1/table/search",
        requestParam: {
          tenantId: Digit.ULBService.getCurrentTenantId(),
        },
        requestBody: {
          criteria: {
            completeStatus: [],
          },
        },
        masterName: "commonUiConfig",
        moduleName: "reviewSummonWarrantNotice",
        minParametersForSearchForm: 0,
        tableFormJsonPath: "requestParam",
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
                type: "component",
                component: "CustomSortComponent",
                isMandatory: false,
                disable: false,
                name: "Issue Date",
                key: "sortCaseListByDate",
                sortBy: "createdDate",
                showIcon: true,
                icon: "UpDownArrowIcon",
                populators: {},
              },
              {
                label: "ORDER_TYPE",
                isMandatory: false,
                key: "orderType",
                type: "dropdown",
                disable: false,
                populators: {
                  name: "orderType",
                  optionsKey: "code",
                  mdmsConfig: {
                    moduleName: "Order",
                    masterName: "CourtStaffOrderType",
                    select: "(data) => {return data['Order'].CourtStaffOrderType?.map((item) => {return item;});}",
                  },
                  optionsCustomStyle: {
                    overflowX: "hidden",
                  },
                  styles: {
                    maxWidth: "200px",
                    minWidth: "150px",
                  },
                },
              },
              {
                label: "STATUS",
                isMandatory: false,
                key: "completeStatus",
                type: "dropdown",
                disable: false,
                populators: {
                  name: "completeStatus",
                  optionsKey: "code",
                  mdmsConfig: {
                    moduleName: "Order",
                    masterName: "SentStatus",
                    select: "(data) => {return data['Order'].SentStatus?.map((item) => {return item;});}",
                  },
                  optionsCustomStyle: {
                    overflowX: "hidden",
                  },
                  styles: {
                    maxWidth: "200px",
                    minWidth: "150px",
                  },
                },
              },
              {
                label: "SEARCH_E_PROCESS",
                isMandatory: false,
                type: "text",
                key: "searchText", // seach text
                disable: false,
                populators: {
                  name: "searchText",
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
                label: "CASE_NAME_ID",
                jsonPath: "filingNumber",
                additionalCustomization: true,
              },
              {
                label: "STATUS",
                jsonPath: "status",
                additionalCustomization: true,
              },
              {
                label: "ORDER_TYPE",
                jsonPath: "taskType",
                additionalCustomization: true,
              },
              {
                label: "DELIEVERY_CHANNEL",
                jsonPath: "delieveryChannel",
                additionalCustomization: true,
              },
              {
                label: "ISSUED",
                jsonPath: "createdDate",
                additionalCustomization: true,
              },
              {
                label: "DELIEVRY_DATE",
                jsonPath: "statusChangeDate",
                additionalCustomization: true,
              },
              {
                label: "HEARING_DATE",
                jsonPath: "hearingDate",
                additionalCustomization: true,
              },
            ],
            enableColumnSort: true,
            resultsJsonPath: "list",
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

export const SummonsTabsConfigJudge = {
  tenantId: "pg",
  moduleName: "reviewSummonWarrantNotice",
  showTab: true,
  SummonsTabsConfig: [
    {
      label: "PENDING",
      type: "search",
      apiDetails: {
        serviceName: "/task/v1/table/search",
        requestParam: {
          tenantId: Digit.ULBService.getCurrentTenantId(),
          limit: 10,
          offset: 0,
        },
        requestBody: {
          apiOperation: "SEARCH",
          criteria: {
            completeStatus: ["ISSUE_SUMMON", "ISSUE_NOTICE", "ISSUE_WARRANT"], // have to do changes
          },
        },
        masterName: "commonUiConfig",
        moduleName: "reviewSummonWarrantNotice",
        minParametersForSearchForm: 0,
        tableFormJsonPath: "requestParam",
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
            defaultValues: defaultSearchValuesForJudgePending,
            fields: [
              {
                type: "component",
                component: "CustomSortComponent",
                isMandatory: false,
                disable: false,
                name: "Issue Date",
                key: "sortCaseListByDate",
                sortBy: "createdDate",
                showIcon: true,
                icon: "UpDownArrowIcon",
                populators: {},
              },
              {
                label: "ORDER_TYPE",
                isMandatory: false,
                key: "orderType",
                type: "dropdown",
                disable: false,
                populators: {
                  name: "orderType",
                  optionsKey: "code",
                  mdmsConfig: {
                    moduleName: "Order",
                    masterName: "CourtStaffOrderType",
                    select: "(data) => {return data['Order'].CourtStaffOrderType?.map((item) => {return item;});}",
                  },
                  optionsCustomStyle: {
                    overflowX: "hidden",
                  },
                  styles: {
                    maxWidth: "200px",
                    minWidth: "150px",
                  },
                },
              },
              {
                label: "E_SIGN_STATUS",
                isMandatory: false,
                key: "applicationStatus",
                type: "dropdown",
                disable: false,
                populators: {
                  name: "applicationStatus",
                  optionsKey: "code",
                  mdmsConfig: {
                    moduleName: "Order",
                    masterName: "ESignPendingStatus",
                    select: "(data) => {return data['Order'].ESignPendingStatus?.map((item) => {return item;});}",
                  },
                  optionsCustomStyle: {
                    overflowX: "hidden",
                  },
                  styles: {
                    maxWidth: "200px",
                    minWidth: "150px",
                  },
                },
              },
              {
                label: "SEARCH_E_PROCESS",
                isMandatory: false,
                type: "text",
                key: "searchText", // seach text
                disable: false,
                populators: {
                  name: "searchText",
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
                label: "E_PROCESS_ID",
                jsonPath: "taskNumber",
              },

              {
                label: "CASE_NAME_ID",
                jsonPath: "filingNumber",
                additionalCustomization: true,
              },
              {
                label: "ORDER_TYPE",
                jsonPath: "taskType",
                additionalCustomization: true,
              },
              {
                label: "DELIEVERY_CHANNEL",
                jsonPath: "delieveryChannel",
                additionalCustomization: true,
              },
              {
                label: "STATUS",
                jsonPath: "documentStatus",
                additionalCustomization: true,
              },
              {
                label: "ISSUED",
                jsonPath: "createdDate",
                additionalCustomization: true,
              },
              {
                label: "HEARING_DATE",
                jsonPath: "hearingDate",
                additionalCustomization: true,
              },
            ],
            enableColumnSort: true,
            resultsJsonPath: "list",
          },
          show: true,
        },
      },
      additionalDetails: {
        sortBy: "sortCaseListByDate",
      },
    },
    {
      label: "SENT",
      type: "search",
      apiDetails: {
        serviceName: "/task/v1/table/search",
        requestParam: {
          tenantId: Digit.ULBService.getCurrentTenantId(),
        },
        requestBody: {
          criteria: {
            completeStatus: [],
          },
        },
        masterName: "commonUiConfig",
        moduleName: "reviewSummonWarrantNotice",
        minParametersForSearchForm: 0,
        tableFormJsonPath: "requestParam",
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
            defaultValues: defaultSearchValuesForJudgeSent,
            fields: [
              {
                type: "component",
                component: "CustomSortComponent",
                isMandatory: false,
                disable: false,
                name: "Issue Date",
                key: "sortCaseListByDate",
                sortBy: "createdDate",
                showIcon: true,
                icon: "UpDownArrowIcon",
                populators: {},
              },
              {
                label: "ORDER_TYPE",
                isMandatory: false,
                key: "orderType",
                type: "dropdown",
                disable: false,
                populators: {
                  name: "orderType",
                  optionsKey: "code",
                  mdmsConfig: {
                    moduleName: "Order",
                    masterName: "CourtStaffOrderType",
                    select: "(data) => {return data['Order'].CourtStaffOrderType?.map((item) => {return item;});}",
                  },
                  optionsCustomStyle: {
                    overflowX: "hidden",
                  },
                  styles: {
                    maxWidth: "200px",
                    minWidth: "150px",
                  },
                },
              },
              {
                label: "STATUS",
                isMandatory: false,
                key: "completeStatus",
                type: "dropdown",
                disable: false,
                populators: {
                  name: "completeStatus",
                  optionsKey: "code",
                  mdmsConfig: {
                    moduleName: "Order",
                    masterName: "SentStatus",
                    select: "(data) => {return data['Order'].SentStatus?.map((item) => {return item;});}",
                  },
                  optionsCustomStyle: {
                    overflowX: "hidden",
                  },
                  styles: {
                    maxWidth: "200px",
                    minWidth: "150px",
                  },
                },
              },
              {
                label: "SEARCH_E_PROCESS",
                isMandatory: false,
                type: "text",
                key: "searchText", // seach text
                disable: false,
                populators: {
                  name: "searchText",
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
                label: "E_PROCESS_ID",
                jsonPath: "taskNumber",
              },

              {
                label: "CASE_NAME_ID",
                jsonPath: "filingNumber",
                additionalCustomization: true,
              },
              {
                label: "ORDER_TYPE",
                jsonPath: "taskType",
                additionalCustomization: true,
              },
              {
                label: "DELIEVERY_CHANNEL",
                jsonPath: "delieveryChannel",
                additionalCustomization: true,
              },
              {
                label: "STATUS",
                jsonPath: "status",
                additionalCustomization: true,
              },
              {
                label: "DELIEVRY_DATE",
                jsonPath: "statusChangeDate",
                additionalCustomization: true,
              },
              {
                label: "ISSUED",
                jsonPath: "createdDate",
                additionalCustomization: true,
              },
              {
                label: "HEARING_DATE",
                jsonPath: "hearingDate",
                additionalCustomization: true,
              },
            ],
            enableColumnSort: true,
            resultsJsonPath: "list",
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
