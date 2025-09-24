const defaultSearchValues = {
  searchText: "",
  applicationStatus: "",
  orderType: { code: "", name: "PROCESS_TYPE" },
  channel: { code: "", displayLabel: "DELIVERY_CHANNEL" },
  completeStatus: { code: "", name: "STATUS" },
  hearingDate: "",
  // orderType: { type: OrderWorkflowState.ABATED }, // "", // null,
};

export const defaultSearchValuesForJudgePending = {
  searchText: "",
  // applicationStatus: {
  //   id: 2,
  //   code: "SIGN_PENDING",
  //   name: "Sign Pending",
  //   isActive: true,
  // },
  // orderType: {
  //   id: 2,
  //   code: "WARRANT",
  //   name: "Warrant",
  //   isActive: true,
  // },
};

export const defaultSearchValuesForJudgeSent = {
  searchText: "",
  applicationStatus: "",
  // orderType: {
  //   id: 2,
  //   code: "WARRANT",
  //   name: "Warrant",
  //   isActive: true,
  // },
};

export const SummonsTabsConfig = {
  tenantId: "pg",
  moduleName: "reviewSummonWarrantNotice",
  showTab: true,
  SummonsTabsConfig: [
    // Pending Sign
    {
      label: "PENDING_SIGN",
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
            applicationStatus: "SIGN_PENDING",
            completeStatus: ["ISSUE_SUMMON", "ISSUE_NOTICE", "ISSUE_WARRANT", "ISSUE_PROCLAMATION", "ISSUE_ATTACHMENT"],
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
              // subheading
              // {
              //   type: "label",
              //   label: "PENDING_SIGN",
              //   key: "pendingSignHeading",
              //   breakAfter: true,
              // },
              // hidden
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
                hideInForm: true,
              },
              // process type
              {
                label: "",
                isMandatory: false,
                key: "orderType",
                type: "dropdown",
                disable: false,
                populators: {
                  name: "orderType",
                  optionsKey: "name",
                  defaultValue: { code: "", name: "PROCESS_TYPE" },
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
                  className: "custom-dropdown-color",
                },
              },
              // hidden
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
                hideInForm: true,
              },
              // Delivery channel
              {
                label: "",
                isMandatory: false,
                key: "channel",
                type: "dropdown",
                populators: {
                  name: "channel",
                  // optionsKey: "channel",
                  optionsKey: "displayLabel",
                  defaultValue: { code: "", displayLabel: "DELIVERY_CHANNEL" },
                  mdmsConfig: {
                    moduleName: "payment",
                    masterName: "paymentType",
                    select:
                      "(data) => { var list = (data && data.payment && data.payment.paymentType) ? data.payment.paymentType : []; var seen = {}; var unique = []; for (var i = 0; i < list.length; i++) { var ch = list[i].deliveryChannel; if (!seen[ch]) { seen[ch] = true; unique.push(list[i]); } } return unique.map(function(item){ return { code: item.deliveryChannel, name: item.deliveryChannel, displayLabel: item.deliveryChannel }; }); }",
                  },
                  optionsCustomStyle: {
                    overflowX: "hidden",
                  },
                  styles: {
                    maxWidth: "250px",
                    minWidth: "200px",
                  },
                },
              },
              // hearing date
              {
                label: "",
                isMandatory: false,
                key: "hearingDate",
                type: "date",
                disable: false,
                populators: {
                  name: "hearingDate",
                },
              },
              // search case
              {
                label: "",
                isMandatory: false,
                type: "text",
                key: "searchText", // seach text
                disable: false,
                populators: {
                  name: "searchText",
                  placeholder: "Search Case Name or Number",
                  style: {
                    width: "320px",
                    backgroundImage:
                      "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzk5OTk5OSIgd2lkdGg9IjE4cHgiIGhlaWdodD0iMThweCI+PHBhdGggZD0iTTE1LjUgMTRoLS43OWwtLjI4LS4yN0MxNS40MSAxMi41OSAxNiAxMS4xMSAxNiA5LjUgMTYgNS45MSAxMy4wOSAzIDkuNSAzUzMgNS45MSAzIDkuNSA1LjkxIDE2IDkuNSAxNmMxLjYxIDAgMy4wOS0uNTkgNC4yMy0xLjU3bC4yNy4yOHYuNzlsNSA0Ljk5TDIwLjQ5IDE5bC00Ljk5LTV6bS02IDBDNy4wMSAxNCA1IDExLjk5IDUgOS41UzcuMDEgNSA5LjUgNSAxNCA3LjAxIDE0IDkuNSAxMS45OSAxNCA5LjUgMTR6Ii8+PC9zdmc+')",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 10px center",
                    backgroundSize: "18px 18px",
                    paddingRight: "40px",
                  },
                  className: "digit-search-input align-right",
                },
              },
            ],
          },

          show: true,
        },
        searchResult: {
          tenantId: Digit.ULBService.getCurrentTenantId(),
          uiConfig: {
            // columns: [
            //   {
            //     label: "CASE_NAME",
            //     jsonPath: "filingNumber",
            //     additionalCustomization: true,
            //   },
            //   {
            //     label: "CASE_NUMBER",
            //     jsonPath: "filingNumber",
            //     additionalCustomization: true,
            //   },
            //   {
            //     label: "PROCESS_TYPE",
            //     jsonPath: "taskType",
            //     additionalCustomization: true,
            //   },
            //   {
            //     label: "ISSUE_DATE",
            //     jsonPath: "createdDate",
            //     additionalCustomization: true,
            //   },
            //   {
            //     label: "DELIEVERY_CHANNEL",
            //     jsonPath: "delieveryChannel",
            //     additionalCustomization: true,
            //   },

            //   {
            //     label: "HEARING_DATE",
            //     jsonPath: "hearingDate",
            //     additionalCustomization: true,
            //   },
            //   {
            //     label: "SELECT",
            //     additionalCustomization: true,
            //   },
            // ],
            columns: [
              {
                label: "SELECT",
                jsonPath: "",
                columnType: "checkbox",
                additionalCustomization: true,
              },
              {
                label: "CASE_TITLE",
                jsonPath: "caseName",
                additionalCustomization: true,
              },
              {
                label: "CS_CASE_NUMBER_HOME",
                jsonPath: "courtCaseNumber",
                additionalCustomization: true,
              },
              {
                label: "PROCESS_TYPE",
                jsonPath: "taskType",
                additionalCustomization: true,
              },
              {
                label: "ISSUE_DATE",
                jsonPath: "createdDate",
                additionalCustomization: true,
              },
              {
                label: "DELIEVERY_CHANNEL",
                jsonPath: "delieveryChannel",
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
    // Signed
    {
      label: "SIGNED",
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
            applicationStatus: "SIGNED",
            completeStatus: ["ISSUE_SUMMON", "ISSUE_NOTICE", "ISSUE_WARRANT", "ISSUE_PROCLAMATION", "ISSUE_ATTACHMENT"],
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
              // subheading
              // {
              //   type: "label",
              //   label: "SIGNED",
              //   key: "signedHeading",
              //   breakAfter: true,
              // },
              // hidden
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
                hideInForm: true,
              },
              // Process type
              // {
              //   label: "",
              //   // name: "PROCESS_TYPE",
              //   isMandatory: false,
              //   key: "orderType",
              //   type: "dropdown",
              //   disable: false,
              //   populators: {
              //     name: "orderType",
              //     optionsKey: "code",
              //     defaultValue: { code: "", name: "PROCESS_TYPE" },
              //     mdmsConfig: {
              //       moduleName: "Order",
              //       masterName: "CourtStaffOrderType",
              //       select: "(data) => {return data['Order'].CourtStaffOrderType?.map((item) => {return item;});}",
              //     },
              //     optionsCustomStyle: {
              //       overflowX: "hidden",
              //     },
              //     styles: {
              //       maxWidth: "200px",
              //       minWidth: "150px",
              //     },
              //   },
              // },
              {
                label: "",
                isMandatory: false,
                key: "orderType",
                type: "dropdown",
                disable: false,
                populators: {
                  name: "orderType",
                  optionsKey: "name",
                  defaultValue: { code: "", name: "PROCESS_TYPE" },
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
              // Delivery channel
              {
                label: "",
                isMandatory: false,
                key: "channel",
                type: "dropdown",

                populators: {
                  name: "channel",
                  // optionsKey: "channel",
                  optionsKey: "displayLabel",
                  defaultValue: { code: "", displayLabel: "DELIVERY_CHANNEL" },
                  mdmsConfig: {
                    moduleName: "payment",
                    masterName: "paymentType",
                    select:
                      "(data) => { var list = (data && data.payment && data.payment.paymentType) ? data.payment.paymentType : []; var seen = {}; var unique = []; for (var i = 0; i < list.length; i++) { var ch = list[i].deliveryChannel; if (!seen[ch]) { seen[ch] = true; unique.push(list[i]); } } return unique.map(function(item){ return { code: item.deliveryChannel, name: item.deliveryChannel, displayLabel: item.deliveryChannel }; }); }",
                  },
                  optionsCustomStyle: {
                    overflowX: "hidden",
                  },
                  styles: {
                    maxWidth: "250px",
                    minWidth: "200px",
                  },
                },
              },
              // hearing date
              {
                label: "",
                isMandatory: false,
                key: "hearingDate",
                type: "date",
                disable: false,
                populators: {
                  name: "hearingDate",
                },
              },
              // hidden
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
                hideInForm: true,
              },
              // Case Name or number
              {
                label: "",
                isMandatory: false,
                type: "text",
                key: "searchText", // seach text
                disable: false,
                populators: {
                  name: "searchText",
                  placeholder: "Search Case Name or Number",
                  style: {
                    width: "320px",
                    backgroundImage:
                      "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzk5OTk5OSIgd2lkdGg9IjE4cHgiIGhlaWdodD0iMThweCI+PHBhdGggZD0iTTE1LjUgMTRoLS43OWwtLjI4LS4yN0MxNS40MSAxMi41OSAxNiAxMS4xMSAxNiA5LjUgMTYgNS45MSAxMy4wOSAzIDkuNSAzUzMgNS45MSAzIDkuNSA1LjkxIDE2IDkuNSAxNmMxLjYxIDAgMy4wOS0uNTkgNC4yMy0xLjU3bC4yNy4yOHYuNzlsNSA0Ljk5TDIwLjQ5IDE5bC00Ljk5LTV6bS02IDBDNy4wMSAxNCA1IDExLjk5IDUgOS41UzcuMDEgNSA5LjUgNSAxNCA3LjAxIDE0IDkuNSAxMS45OSAxNCA5LjUgMTR6Ii8+PC9zdmc+')",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 10px center",
                    backgroundSize: "18px 18px",
                    paddingRight: "40px",
                  },
                  className: "digit-search-input align-right",
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
                label: "SELECT",
                jsonPath: "",
                columnType: "checkbox",
                additionalCustomization: true,
              },
              {
                label: "CASE_TITLE",
                jsonPath: "caseName",
                additionalCustomization: true,
              },
              {
                label: "CS_CASE_NUMBER_HOME",
                jsonPath: "courtCaseNumber",
                additionalCustomization: true,
              },
              {
                label: "PROCESS_TYPE",
                jsonPath: "taskType",
                additionalCustomization: true,
              },
              {
                label: "ISSUE_DATE",
                jsonPath: "createdDate",
                additionalCustomization: true,
              },
              {
                label: "DELIEVERY_CHANNEL",
                jsonPath: "delieveryChannel",
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
    // Sent
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
            completeStatus: ["ATTACHMENT_SENT", "PROCLAMATION_SENT", "SUMMON_SENT", "WARRANT_SENT", "NOTICE_SENT"],
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
              // subheading
              // {
              //   type: "label",
              //   label: "SENT",
              //   key: "sentHeading",
              //   breakAfter: true,
              // },
              // hidden
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
                hideInForm: true,
              },
              // Process type
              {
                label: "",
                isMandatory: false,
                key: "orderType",
                type: "dropdown",
                disable: false,
                populators: {
                  name: "orderType",
                  optionsKey: "name",
                  defaultValue: { code: "", name: "PROCESS_TYPE" },
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
              // Delivery channel
              {
                label: "",
                isMandatory: false,
                key: "channel",
                type: "dropdown",

                populators: {
                  name: "channel",
                  // optionsKey: "channel",
                  optionsKey: "displayLabel",
                  defaultValue: { code: "", displayLabel: "DELIVERY_CHANNEL" },
                  mdmsConfig: {
                    moduleName: "payment",
                    masterName: "paymentType",
                    select:
                      "(data) => { var list = (data && data.payment && data.payment.paymentType) ? data.payment.paymentType : []; var seen = {}; var unique = []; for (var i = 0; i < list.length; i++) { var ch = list[i].deliveryChannel; if (!seen[ch]) { seen[ch] = true; unique.push(list[i]); } } return unique.map(function(item){ return { code: item.deliveryChannel, name: item.deliveryChannel, displayLabel: item.deliveryChannel }; }); }",
                  },
                  optionsCustomStyle: {
                    overflowX: "hidden",
                  },
                  styles: {
                    maxWidth: "250px",
                    minWidth: "200px",
                  },
                },
              },
              // hearing date
              {
                label: "",
                isMandatory: false,
                key: "hearingDate",
                type: "date",
                disable: false,
                populators: {
                  name: "hearingDate",
                },
              },
              // hidden
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
                hideInForm: true,
              },
              // Case Name or number
              {
                label: "",
                isMandatory: false,
                type: "text",
                key: "searchText", // seach text
                disable: false,
                populators: {
                  name: "searchText",
                  placeholder: "Search Case Name or Number",
                  style: {
                    width: "320px",
                    backgroundImage:
                      "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzk5OTk5OSIgd2lkdGg9IjE4cHgiIGhlaWdodD0iMThweCI+PHBhdGggZD0iTTE1LjUgMTRoLS43OWwtLjI4LS4yN0MxNS40MSAxMi41OSAxNiAxMS4xMSAxNiA5LjUgMTYgNS45MSAxMy4wOSAzIDkuNSAzUzMgNS45MSAzIDkuNSA1LjkxIDE2IDkuNSAxNmMxLjYxIDAgMy4wOS0uNTkgNC4yMy0xLjU3bC4yNy4yOHYuNzlsNSA0Ljk5TDIwLjQ5IDE5bC00Ljk5LTV6bS02IDBDNy4wMSAxNCA1IDExLjk5IDUgOS41UzcuMDEgNSA5LjUgNSAxNCA3LjAxIDE0IDkuNSAxMS45OSAxNCA5LjUgMTR6Ii8+PC9zdmc+')",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 10px center",
                    backgroundSize: "18px 18px",
                    paddingRight: "40px",
                  },
                  className: "digit-search-input align-right",
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
                label: "CASE_TITLE",
                jsonPath: "caseName",
                additionalCustomization: true,
              },
              {
                label: "CS_CASE_NUMBER_HOME",
                jsonPath: "courtCaseNumber",
                additionalCustomization: true,
              },
              {
                label: "PROCESS_TYPE",
                jsonPath: "taskType",
                additionalCustomization: true,
              },
              {
                label: "ISSUE_DATE",
                jsonPath: "createdDate",
                additionalCustomization: true,
              },
              {
                label: "DELIEVERY_CHANNEL",
                jsonPath: "delieveryChannel",
                additionalCustomization: true,
              },

              {
                label: "HEARING_DATE",
                jsonPath: "hearingDate",
                additionalCustomization: true,
              },
              // Signed date
              {
                label: "SENT_DATE",
                jsonPath: "",
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
    // Completed
    {
      label: "COMPLETED",
      type: "search",
      apiDetails: {
        serviceName: "/task/v1/table/search",
        requestParam: {
          tenantId: Digit.ULBService.getCurrentTenantId(),
        },
        requestBody: {
          criteria: {
            completeStatus: ["EXECUTED", "NOT_EXECUTED", "DELIVERED", "UNDELIVERED"],
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
              // subheading
              // {
              //   type: "label",
              //   label: "COMPLETED",
              //   key: "completedHeading",
              //   breakAfter: true,
              // },
              // hidden
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
                hideInForm: true,
              },
              // Process type
              {
                label: "",
                isMandatory: false,
                key: "orderType",
                type: "dropdown",
                disable: false,
                populators: {
                  name: "orderType",
                  optionsKey: "name",
                  defaultValue: { code: "", name: "PROCESS_TYPE" },
                  mdmsConfig: {
                    // moduleName: "Order",
                    // masterName: "CourtStaffOrderType",
                    // select: "(data) => {return data['Order'].CourtStaffOrderType?.map((item) => {return item;});}",
                    moduleName: "Order,Notice",
                    masterName: "CourtStaffOrderType,NoticeType",
                    select:
                      "(data) => { console.log('MDMS data:', data);  const processTypes = (data?.['Order']?.CourtStaffOrderType || []).map(i => ({ ...i, code: i.code || i.name })); const noticeTypes = (data?.['Notice']?.NoticeType || []).map(i => ({ ...i, code: i.code || i.name })); console.log('Merged types:', [...processTypes, ...noticeTypes]); return [...processTypes, ...noticeTypes]; }",

                    // select:
                    //   "(data) => { const processTypes = (data?.['Order']?.CourtStaffOrderType) || []; const noticeTypes = (data?.['Notice']?.NoticeType) || []; return [...processTypes, ...noticeTypes]; }",
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
              // Delivery channel
              {
                label: "",
                isMandatory: false,
                key: "deliveryChannel",
                type: "dropdown",

                populators: {
                  name: "channel",
                  // optionsKey: "channel",
                  optionsKey: "displayLabel",
                  defaultValue: { code: "", displayLabel: "DELIVERY_CHANNEL" },
                  mdmsConfig: {
                    moduleName: "payment",
                    masterName: "paymentType",
                    select:
                      "(data) => { var list = (data && data.payment && data.payment.paymentType) ? data.payment.paymentType : []; var seen = {}; var unique = []; for (var i = 0; i < list.length; i++) { var ch = list[i].deliveryChannel; if (!seen[ch]) { seen[ch] = true; unique.push(list[i]); } } return unique.map(function(item){ return { code: item.deliveryChannel, name: item.deliveryChannel, displayLabel: item.deliveryChannel }; }); }",
                  },
                  optionsCustomStyle: {
                    overflowX: "hidden",
                  },
                  styles: {
                    maxWidth: "250px",
                    minWidth: "200px",
                  },
                },
              },

              {
                label: "",
                isMandatory: false,
                key: "completeStatus",
                type: "dropdown",
                // disable: false,
                populators: {
                  name: "completeStatus",
                  optionsKey: "name",
                  defaultValue: { code: "", name: "STATUS" },
                  mdmsConfig: {
                    moduleName: "Order",
                    masterName: "SentStatus",
                    // select: "(data) => {return data['Order'].SentStatus?.map((item) => {return item;});}",
                    select:
                      "(data) => {return data['Order'].SentStatus?.filter((item) => [`DELIVERED`,`UNDELIVERED`,`EXECUTED`,`NOT_EXECUTED`].includes(item.code));}",
                    //  "(data) => {return data['Order'].OrderStatus?.filter((item)=>[`PENDING_BULK_E-SIGN`, `DRAFT_IN_PROGRESS`].includes(item.type));}",
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
              // hearing date
              {
                label: "",
                isMandatory: false,
                key: "hearingDate",
                type: "date",
                disable: false,
                populators: {
                  name: "hearingDate",
                },
              },
              // Case Name or number
              {
                label: "",
                isMandatory: false,
                type: "text",
                key: "searchText", // seach text
                disable: false,
                populators: {
                  name: "searchText",
                  placeholder: "Search Case Name or Number",
                  style: {
                    width: "320px",
                    backgroundImage:
                      "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzk5OTk5OSIgd2lkdGg9IjE4cHgiIGhlaWdodD0iMThweCI+PHBhdGggZD0iTTE1LjUgMTRoLS43OWwtLjI4LS4yN0MxNS40MSAxMi41OSAxNiAxMS4xMSAxNiA5LjUgMTYgNS45MSAxMy4wOSAzIDkuNSAzUzMgNS45MSAzIDkuNSA1LjkxIDE2IDkuNSAxNmMxLjYxIDAgMy4wOS0uNTkgNC4yMy0xLjU3bC4yNy4yOHYuNzlsNSA0Ljk5TDIwLjQ5IDE5bC00Ljk5LTV6bS02IDBDNy4wMSAxNCA1IDExLjk5IDUgOS41UzcuMDEgNSA5LjUgNSAxNCA3LjAxIDE0IDkuNSAxMS45OSAxNCA5LjUgMTR6Ii8+PC9zdmc+')",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 10px center",
                    backgroundSize: "18px 18px",
                    paddingRight: "40px",
                  },
                  className: "digit-search-input align-right",
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
                label: "CASE_TITLE",
                jsonPath: "caseName",
                additionalCustomization: true,
              },
              {
                label: "CS_CASE_NUMBER_HOME",
                jsonPath: "courtCaseNumber",
                additionalCustomization: true,
              },
              {
                label: "PROCESS_TYPE",
                jsonPath: "taskType",
                additionalCustomization: true,
              },
              {
                label: "ISSUE_DATE",
                jsonPath: "createdDate",
                additionalCustomization: true,
              },
              {
                label: "DELIEVERY_CHANNEL",
                jsonPath: "delieveryChannel",
                additionalCustomization: true,
              },

              {
                label: "HEARING_DATE",
                jsonPath: "hearingDate",
                additionalCustomization: true,
              },
              {
                label: "STATUS",
                jsonPath: "status",
                additionalCustomization: true,
              },
              {
                label: "STATUS_UPDATE_DATE",
                jsonPath: "statusChangeDate",
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
