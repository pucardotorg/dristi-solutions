const buildBulkSearchSection = (fields, defaultValues) => ({
  uiConfig: {
    formClassName: "custom-both-clear-search",
    primaryLabel: "ES_COMMON_SEARCH",
    secondaryLabel: "ES_COMMON_CLEAR_SEARCH",
    minReqFields: 0,
    defaultValues,
    fields,
  },
  show: true,
});

const buildBulkSearchResult = (columns, resultsJsonPath, options = {}) => ({
  tenantId: Digit.ULBService.getCurrentTenantId(),
  uiConfig: {
    columns,
    resultsJsonPath,
    enableColumnSort: true,
    ...(options.customDefaultPagination ? { customDefaultPagination: options.customDefaultPagination } : {}),
    ...(options.manualPagination ? { manualPagination: options.manualPagination } : {}),
  },
  show: true,
});

export const bulkADiaryDateField = {
  label: "CS_ADIARY_DATED",
  type: "date",
  isMandatory: false,
  disable: false,
  key: "date",
  populators: {
    name: "date",
    error: "BR_PATTERN_ERR_MSG",
    style: { maxWidth: "250px", minWidth: "200px", width: "220px" },
    validation: { pattern: {} },
  },
};

export const buildBulkADiarySignConfig = () => {
  const courtId = localStorage.getItem("courtId");

  return {
    label: "CS_HOME_BULK_ADIARY_SIGN",
    type: "search",
    apiDetails: {
      serviceName: "/ab-diary/case/diary/entries/v1/search",
      requestParam: { _: Date.now() },
      requestBody: {
        criteria: {
          courtId: courtId || "",
          tenantId: Digit.ULBService.getCurrentTenantId(),
        },
        pagination: { limit: 10 },
      },
      minParametersForSearchForm: 0,
      masterName: "commonUiConfig",
      moduleName: "bulkADiarySignConfig",
      tableFormJsonPath: "requestBody.pagination",
      filterFormJsonPath: "requestBody.criteria",
      searchFormJsonPath: "requestBody.criteria",
    },
    sections: {
      search: buildBulkSearchSection([bulkADiaryDateField]),
      searchResult: buildBulkSearchResult(
        [
          { label: "CASE_NUMBER", jsonPath: "caseNumber" },
          { label: "PROCEEDINGS_OR_BUSINESS_OF_DAY", jsonPath: "businessOfDay", additionalCustomization: true },
          { label: "NEXT_HEARING_DATE", jsonPath: "hearingDate", additionalCustomization: true },
        ],
        "entries",
        { customDefaultPagination: { limit: 10, offset: 0 }, manualPagination: true }
      ),
    },
  };
};

const bulkCtcTextField = (label, name) => ({
  label,
  type: "text",
  isMandatory: false,
  disable: false,
  populators: {
    name,
    error: "BR_PATTERN_ERR_MSG",
    style: { maxWidth: "350px", minWidth: "250px", width: "100%" },
    validation: { pattern: {}, minlength: 2 },
  },
});

export const buildBulkIssueCTCConfig = () => ({
  type: "search",
  apiDetails: {
    serviceName: "/inbox/v2/index/_search",
    requestParam: { tenantId: Digit.ULBService.getCurrentTenantId() },
    requestBody: {
      inbox: {
        processSearchCriteria: {
          businessService: ["ctc-default"],
          moduleName: "CTC Issue Doc",
          tenantId: Digit.ULBService.getCurrentTenantId(),
        },
        moduleSearchCriteria: {
          tenantId: Digit.ULBService.getCurrentTenantId(),
          searchableFields: "",
        },
        tenantId: Digit.ULBService.getCurrentTenantId(),
        limit: 10,
        offset: 0,
      },
    },
    minParametersForSearchForm: 0,
    masterName: "commonUiConfig",
    moduleName: "bulkIssueCTCConfig",
    searchFormJsonPath: "requestBody.inbox.moduleSearchCriteria",
    filterFormJsonPath: "requestBody.inbox.moduleSearchCriteria",
    tableFormJsonPath: "requestBody.inbox",
  },
  sections: {
    search: buildBulkSearchSection(
      [bulkCtcTextField("SEARCH_DOCUMENT_NAME", "documentName"), bulkCtcTextField("CTC_CASE_NAME_OR_NUMBER", "searchQuery")],
      { documentName: "", searchQuery: "" }
    ),
    searchResult: buildBulkSearchResult(
      [
        { label: "SELECT", additionalCustomization: true },
        { label: "DOCUMENTS_REQUESTED", jsonPath: "businessObject.docTitle", additionalCustomization: true },
        { label: "CASE_NAME", jsonPath: "businessObject.caseTitle", additionalCustomization: true },
        { label: "CASE_NUMBER", jsonPath: "businessObject.caseNumber", additionalCustomization: true },
        { label: "APPLICATION_NUMBER", jsonPath: "businessObject.ctcApplicationNumber", additionalCustomization: true },
      ],
      "items"
    ),
  },
});
