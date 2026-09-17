// default values of search input component
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

const digitalizationDefaultSearch = {
  type: {},
  documentNumber: "",
};

const defaultBailValues = { bailId: "" };

//config for tab search sceeen
export const DocumentSearchConfig = {
  tenantId: Digit.ULBService.getCurrentTenantId(),
  moduleName: "commonCampaignUiConfig",
  showTab: true,
  DocumentSearchConfig: [
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
                key: "artifactType",
                type: "dropdown",
                populators: {
                  name: "artifactType",
                  optionsKey: "name",
                  options: [],
                },
              },
              {
                label: "SEARCH_ARTIFACT_NUMBER",
                isMandatory: false,
                key: "artifactNumber",
                type: "text",
                populators: {
                  name: "artifactNumber",
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
                label: "FILING_NAME",
                jsonPath: "artifactType",
                additionalCustomization: true,
              },
              {
                label: "FILING_ID",
                jsonPath: "artifactNumber",
              },
              {
                label: "EVIDENCE_NUMBER",
                jsonPath: "evidenceNumber",
                additionalCustomization: true,
              },
              {
                label: "TYPE",
                additionalCustomization: true,
              },
              {
                label: "STATUS",
                additionalCustomization: true,
              },
              {
                label: "EVIDENCE_STATUS",
                additionalCustomization: true,
              },
              {
                label: "REPRESENTATIVES",
                jsonPath: "sourceType",
                additionalCustomization: true,
              },
              // {
              //   label: "FILE",
              //   jsonPath: "file",
              //   additionalCustomization: true,
              // },
              {
                label: "CS_ACTIONS",
                additionalCustomization: true,
              },
            ],

            enableColumnSort: true,
            resultsJsonPath: "artifacts",
          },
          show: true,
        },
      },
    },
    {
      label: "Bail Bonds",
      displayLabel: "BAIL_BONDS_TAB",
      type: "search",

      apiDetails: {
        serviceName: "/bail-bond/v1/_search",
        requestParam: {
          tenantId: Digit.ULBService.getCurrentTenantId(),
        },
        requestBody: {
          criteria: {
            fuzzySearch: true,
          },
          pagination: {
            limit: 10,
            offSet: 0,
            sortBy: "bailCreatedTime",
            order: "desc",
          },
        },

        masterName: "commonUiConfig",
        moduleName: "BailBondConfig",
        minParametersForSearchForm: 0,
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
            defaultValues: defaultBailValues,
            fields: [
              //   {
              //     label: "TYPE",
              //     isMandatory: false,
              //     key: "artifactType",
              //     type: "dropdown",
              //     populators: {
              //       name: "artifactType",
              //       optionsKey: "name",
              //       mdmsConfig: {
              //         masterName: "EvidenceType",
              //         moduleName: "Evidence",
              //         localePrefix: "EVIDENCE_TYPE",
              //         select:
              //           "(data) => {return data['Evidence'].EvidenceType?.map((item) => {return { ...item, name: item.subtype && item.subtype.trim() !== '' ? `${item.type}_${item.subtype}` : item.type };});}",
              //         // localePrefix: "SUBMISSION_TYPE",
              //       },
              //     },
              //   },
              {
                label: "SEARCH_BAIL_ID",
                isMandatory: false,
                key: "bailId",
                type: "text",
                populators: {
                  name: "bailId",
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
                label: "BAIL_TYPE",
                jsonPath: "bailType",
                additionalCustomization: true,
              },
              {
                label: "BAIL_ID",
                jsonPath: "bailId",
                additionalCustomization: true,
              },
              {
                label: "STATUS",
                jsonPath: "status",
                additionalCustomization: true,
              },
              {
                label: "LITIGANT_NAME",
                jsonPath: "litigantName",
                additionalCustomization: true,
              },
            ],

            enableColumnSort: true,
            resultsJsonPath: "bails",
          },
          show: true,
        },
      },
    },
    {
      label: "Digitalization Forms",
      displayLabel: "DIGITALIZATION_TAB",
      type: "search",
      apiDetails: {
        serviceName: "/inbox/v2/_getFields",
        requestParam: {
          tenantId: Digit.ULBService.getCurrentTenantId(),
        },
        requestBody: {
          SearchCriteria: {},
        },
        masterName: "commonUiConfig",
        moduleName: "DigitalizationConfig",
        minParametersForSearchForm: 0,
        tableFormJsonPath: "requestBody.pagination",
        filterFormJsonPath: "requestBody.SearchCriteria",
        searchFormJsonPath: "requestBody.SearchCriteria",
      },
      sections: {
        search: {
          uiConfig: {
            formClassName: "custom-both-clear-search",
            primaryLabel: "ES_COMMON_SEARCH",
            secondaryLabel: "ES_COMMON_CLEAR_SEARCH",
            minReqFields: 0,
            defaultValues: digitalizationDefaultSearch,
            fields: [
              {
                label: "TYPE",
                isMandatory: false,
                key: "type",
                type: "dropdown",
                populators: {
                  name: "type",
                  optionsKey: "name",
                  mdmsConfig: {
                    masterName: "DigitalizationForm",
                    moduleName: "Order",
                    select:
                      "(data) => {return data['Order']?.DigitalizationForm?.map((item) => {return { code: item.code, name: item.name};}).sort((a,b) => a.name.localeCompare(b.name));}",
                  },
                },
              },
              {
                label: "SEARCH_DOCUMENT_NUMBER",
                isMandatory: false,
                key: "documentNumber",
                type: "text",
                populators: {
                  name: "documentNumber",
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
                label: "DOCUMENT_TYPE",
                jsonPath: "type",
                additionalCustomization: true,
              },
              {
                label: "DITILIZATION_DOCUMENT_NUMBER",
                jsonPath: "documentNumber",
              },
              {
                label: "PARTIES",
                jsonpath: "parties",
                additionalCustomization: true,
              },
              {
                label: "STATUS",
                jsonPath: "status",
                additionalCustomization: true,
              },
              {
                label: "CS_ACTIONS",
                additionalCustomization: true,
              },
            ],

            enableColumnSort: true,
            resultsJsonPath: "documents",
          },
          show: true,
        },
      },
    },
  ],
};
