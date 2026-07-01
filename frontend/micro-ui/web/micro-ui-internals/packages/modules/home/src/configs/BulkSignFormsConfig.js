const defaultSearchValues = {
  caseTitle: "",
  startOfTheDay: "",
  endOfTheDay: "",
  type: {},
};

export const bulkSignFormsConfig = {
  type: "search",
  apiDetails: {
    serviceName: "/inbox/v2/index/_search",
    requestParam: {},
    requestBody: {
      inbox: {
        processSearchCriteria: {
          businessService: ["digitalized-document-examination", "digitalized-document-mediation", "digitalized-document-plea"],
          moduleName: "Digitalized Document Service",
        },
        tenantId: Digit.ULBService.getCurrentTenantId(),
      },
    },
    minParametersForSearchForm: 0,
    masterName: "commonUiConfig",
    moduleName: "bulkSignFormsConfig",
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
            label: "PROCESS_TYPE",
            isMandatory: false,
            key: "type",
            type: "dropdown",
            populators: {
              name: "type",
              optionsKey: "code",
              mdmsConfig: {
                masterName: "DigitalizationForm",
                moduleName: "Order",
                select:
                  "(data) => {return data['Order']?.DigitalizationForm?.map((item) => {return { code: item.code, name: item.name};}).sort((a, b) => a.code.localeCompare(b.code));}",
              },
            },
          },
          {
            label: "DATE",
            isMandatory: false,
            key: "startOfTheDay",
            type: "date",
            disable: false,
            populators: {
              name: "startOfTheDay",
            },
          },
          {
            label: "CS_CASE_NAME_ID",
            type: "text",
            isMandatory: false,
            disable: false,
            populators: {
              name: "caseTitle",
              error: "BR_PATTERN_ERR_MSG",
              style: { maxWidth: "250px", minWidth: "200px", width: "220px" },
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
            label: "SELECT",
            additionalCustomization: true,
          },
          {
            label: "CASE_TITLE",
            jsonPath: "businessObject.digitalizedDocumentDetails.caseName",
            additionalCustomization: true,
          },
          {
            label: "CS_CASE_NUMBER_HOME",
            jsonPath: "businessObject.digitalizedDocumentDetails.caseNumber",
          },
          {
            label: "PROCESS_TYPE",
            jsonPath: "businessObject.digitalizedDocumentDetails.type",
            additionalCustomization: true,
          },
          {
            label: "DATE_CREATED",
            jsonPath: "businessObject.digitalizedDocumentDetails.createdTime",
            additionalCustomization: true,
          },
        ],
        resultsJsonPath: "items",
        enableColumnSort: true,
      },
      show: true,
    },
  },
};
