//config for offline payments on home screen.

const defaultSearchValues = {
  caseTitleFilingNumber: "",
  sortOrder: "DESC",
  caseType: "",
  paymentType: "",
};

export const offlinePaymentsConfig = {
  tenantId: "pg",
  moduleName: "paymentInboxConfig",
  showTab: true,
  TabSearchConfig: [
    {
      label: "PENDING",
      type: "search",
      apiDetails: {
        serviceName: "/inbox/v2/index/_search",
        requestParam: {},
        requestBody: {
          inbox: {
            processSearchCriteria: {
              businessService: ["billing"],
              moduleName: "Billing service",
            },
            moduleSearchCriteria: {
              billStatus: "ACTIVE",
            },
          },
        },
        minParametersForSearchForm: 0,
        masterName: "commonUiConfig",
        moduleName: "paymentInboxConfig",
        searchFormJsonPath: "requestBody.inbox.moduleSearchCriteria",
        filterFormJsonPath: "requestBody.inbox.moduleSearchCriteria",
        tableFormJsonPath: "requestBody.inbox",
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
                  options: ["Negotiable Instruments Act 1881"],
                  styles: {
                    maxWidth: "300px",
                    minWidth: "200px",
                  },
                  optionsCustomStyle: {
                    overflowX: "hidden",
                  },
                },
                hideInForm: true,
              },
              {
                label: "NYAY_PAYMENT_TYPE",
                isMandatory: false,
                key: "paymentType",
                type: "dropdown",
                disable: false,
                populators: {
                  name: "paymentType",
                  mdmsConfig: {
                    masterName: "paymentType",
                    moduleName: "payment",
                    select:
                      "(data) => {return data['payment'].paymentType?.filter((item) => item?.paymentType !== `Warrant Court Fee`).map((item) => {return item?.paymentType;}).sort((a, b) => a.localeCompare(b));}",
                  },
                  styles: {
                    maxWidth: "300px",
                    minWidth: "200px",
                  },
                  optionsCustomStyle: {
                    overflowX: "hidden",
                  },
                },
              },
              {
                label: "CASE_ID_TITLE",
                type: "text",
                isMandatory: false,
                disable: false,
                populators: {
                  name: "caseTitleFilingNumber",
                  // placeholder: "CASE_ID_TITLE",
                  error: "BR_PATTERN_ERR_MSG",
                  validation: {
                    pattern: {},
                    minlength: 1,
                  },
                },
              },
            ],
          },
          children: {},
          show: true,
        },
        searchResult: {
          tenantId: Digit.ULBService.getCurrentTenantId(),
          label: "",
          uiConfig: {
            columns: [
              {
                label: "PENDING_CASE_NAME",
                jsonPath: "",
                additionalCustomization: true,
              },
              {
                label: "CS_CASE_NUMBER_HOME",
                jsonPath: "",
                additionalCustomization: true,
              },
              {
                label: "CS_STAGE",
                jsonPath: "businessObject.billDetails.stage",
              },
              {
                label: "NYAY_PAYMENT_TYPE",
                jsonPath: "businessObject.billDetails.paymentType",
              },
              {
                label: "AMOUNT_DUE",
                jsonPath: "businessObject.billDetails.amount",
                additionalCustomization: true,
              },
              // {
              //   label: "CASE_TYPE",
              //   jsonPath: "businessObject.billDetails.caseType",
              // },
              {
                label: "PAYMENT_GENERATED_DATE",
                jsonPath: "businessObject.billDetails.paymentCreatedDate",
                additionalCustomization: true,
              },
              {
                label: "ACTION",
                jsonPath: "businessObject.billDetails.id",
                additionalCustomization: true,
              },
            ],
            enableColumnSort: true,
            resultsJsonPath: "items",
          },
          show: true,
        },
      },
    },
    {
      label: "PAID",
      type: "search",
      apiDetails: {
        serviceName: "/inbox/v2/index/_search",
        requestParam: {},
        requestBody: {
          inbox: {
            processSearchCriteria: {
              businessService: ["billing"],
              moduleName: "Billing service",
            },
            moduleSearchCriteria: {
              billStatus: "PAID",
            },
          },
        },
        minParametersForSearchForm: 0,
        masterName: "commonUiConfig",
        moduleName: "paymentInboxConfig",
        searchFormJsonPath: "requestBody.inbox.moduleSearchCriteria",
        filterFormJsonPath: "requestBody.inbox.moduleSearchCriteria",
        tableFormJsonPath: "requestBody.inbox",
      },
      sections: {
        search: {
          uiConfig: {
            formClassName: "custom-both-clear-search",

            primaryLabel: "ES_COMMON_SEARCH",
            secondaryLabel: "ES_COMMON_CLEAR_SEARCH",
            minReqFields: 0,
            defaultValues: {
              caseTitleFilingNumber: "",
              sortOrder: "DESC",
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
                  options: ["Negotiable Instruments Act 1881"],
                  styles: {
                    maxWidth: "300px",
                    minWidth: "200px",
                  },
                  optionsCustomStyle: {
                    overflowX: "hidden",
                  },
                },
                hideInForm: true,
              },
              {
                label: "NYAY_PAYMENT_TYPE",
                isMandatory: false,
                key: "paymentType",
                type: "dropdown",
                disable: false,
                populators: {
                  name: "paymentType",
                  mdmsConfig: {
                    masterName: "paymentType",
                    moduleName: "payment",
                    select:
                      "(data) => {return data['payment'].paymentType?.map((item) => {return item?.paymentType;}).sort((a, b) => a.localeCompare(b));}",
                  },
                  styles: {
                    maxWidth: "300px",
                    minWidth: "200px",
                  },
                  optionsCustomStyle: {
                    overflowX: "hidden",
                  },
                },
              },
              {
                label: "CASE_ID_TITLE",
                type: "text",
                isMandatory: false,
                disable: false,
                populators: {
                  name: "caseTitleFilingNumber",
                  // placeholder: "CASE_ID_TITLE",
                  error: "BR_PATTERN_ERR_MSG",
                  validation: {
                    pattern: {},
                    minlength: 1,
                  },
                },
              },
            ],
          },
          children: {},
          show: true,
        },
        searchResult: {
          tenantId: Digit.ULBService.getCurrentTenantId(),
          label: "",
          uiConfig: {
            columns: [
              {
                label: "PENDING_CASE_NAME",
                jsonPath: "",
                additionalCustomization: true,
              },
              {
                label: "CS_CASE_NUMBER_HOME",
                jsonPath: "",
                additionalCustomization: true,
              },
              {
                label: "CS_STAGE",
                jsonPath: "businessObject.billDetails.stage",
              },
              {
                label: "NYAY_PAYMENT_TYPE",
                jsonPath: "businessObject.billDetails.paymentType",
              },
              {
                label: "AMOUNT_DUE",
                jsonPath: "businessObject.billDetails.amount",
                additionalCustomization: true,
              },
              // {
              //   label: "CASE_TYPE",
              //   jsonPath: "businessObject.billDetails.caseType",
              // },
              {
                label: "PAYMENT_GENERATED_DATE",
                jsonPath: "businessObject.billDetails.paymentCreatedDate",
                additionalCustomization: true,
              },
              {
                label: "PAYMENT_COMPLETED_DATE",
                jsonPath: "businessObject.billDetails.paymentCompletedDate",
                additionalCustomization: true,
              },
              {
                label: "ACTION",
                jsonPath: "businessObject.billDetails.id",
                additionalCustomization: true,
              },
            ],
            enableColumnSort: true,
            resultsJsonPath: "items",
          },
          show: true,
        },
      },
    },
  ],
};
