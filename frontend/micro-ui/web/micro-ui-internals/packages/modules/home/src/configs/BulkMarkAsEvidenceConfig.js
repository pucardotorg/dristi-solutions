const defaultSearchValues = {
  caseTitle: "",
};

const limit = parseInt(sessionStorage.getItem("bulkMarkAsEvidenceLimit")) || 10;
const offset = parseInt(sessionStorage.getItem("bulkMarkAsEvidenceOffset")) || 0;

export const bulkMarkAsEvidenceConfig = {
  label: "CS_HOME_BULK_MARK_AS_EVIDENCE",
  type: "search",
  apiDetails: {
    serviceName: "/inbox/v2/index/_search",
    requestParam: {},
    requestBody: {
      inbox: {
        limit: limit,
        offset: offset,
        moduleSearchCriteria: {
          courtId: localStorage.getItem("courtId"),
          evidenceMarkedStatus: "PENDING_BULK_E-SIGN",
        },
        processSearchCriteria: {
          businessService: ["evidence-default"],
          moduleName: "Evidence Service",
        },
        tenantId: Digit.ULBService.getCurrentTenantId(),
      },
    },
    minParametersForSearchForm: 0,
    masterName: "commonUiConfig",
    moduleName: "BulkMarkAsEvidenceConfig",
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
            jsonPath: "businessObject.artifactDetails.caseTitle",
            additionalCustomization: true,
          },
          {
            label: "CASE_ID",
            jsonPath: "businessObject.artifactDetails.caseNumber",
            additionalCustomization: true,
          },
          {
            label: "DOCUMENT_HEADING",
            jsonPath: "businessObject.artifactDetails.artifactType",
            additionalCustomization: true,
          },
          {
            label: "EVIDENCE_NUMBER",
            jsonPath: "businessObject.artifactDetails.evidenceNumber",
            additionalCustomization: true,
          },
        ],
        resultsJsonPath: "items",
        customDefaultPagination: {
          limit: limit,
          offset: offset,
        },
        manualPagination: true,
        enableColumnSort: true,
      },

      show: true,
    },
  },
};
