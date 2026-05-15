import { bulkInboxCaseTitleSearchDefaults } from "./bulkInboxCaseTitleDefaults";

export const bulkInboxCaseTitleSearchField = {
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
};

const buildBulkInboxSearchSection = () => ({
  uiConfig: {
    formClassName: "custom-both-clear-search",
    primaryLabel: "ES_COMMON_SEARCH",
    secondaryLabel: "ES_COMMON_CLEAR_SEARCH",
    minReqFields: 0,
    defaultValues: bulkInboxCaseTitleSearchDefaults,
    fields: [bulkInboxCaseTitleSearchField],
  },
  show: true,
});

const buildBulkInboxSearchResultSection = (columns, limit, offset) => ({
  tenantId: Digit.ULBService.getCurrentTenantId(),
  uiConfig: {
    columns: columns,
    resultsJsonPath: "items",
    customDefaultPagination: {
      limit: limit,
      offset: offset,
    },
    manualPagination: true,
    enableColumnSort: true,
  },
  show: true,
});

/**
 * Shared bulk inbox search config (witness deposition, mark as evidence, bail bond sign).
 * @param {{
 *   label: string,
 *   moduleName: string,
 *   limitSessionKey: string,
 *   offsetSessionKey: string,
 *   moduleSearchCriteria: object,
 *   businessService: string[],
 *   processModuleName: string,
 *   columns: object[],
 * }} params
 */
export const buildBulkInboxCaseTitleSearchConfig = (params) => {
  const limit = parseInt(sessionStorage.getItem(params.limitSessionKey) || 10);
  const offset = parseInt(sessionStorage.getItem(params.offsetSessionKey) || 0);

  return {
    label: params.label,
    type: "search",
    apiDetails: {
      serviceName: "/inbox/v2/index/_search",
      requestParam: {},
      requestBody: {
        inbox: {
          limit: limit,
          offset: offset,
          moduleSearchCriteria: params.moduleSearchCriteria,
          processSearchCriteria: {
            businessService: params.businessService,
            moduleName: params.processModuleName,
          },
          tenantId: Digit.ULBService.getCurrentTenantId(),
        },
      },
      minParametersForSearchForm: 0,
      masterName: "commonUiConfig",
      moduleName: params.moduleName,
      searchFormJsonPath: "requestBody.inbox.moduleSearchCriteria",
      filterFormJsonPath: "requestBody.inbox.moduleSearchCriteria",
      tableFormJsonPath: "requestBody.inbox",
    },
    sections: {
      search: buildBulkInboxSearchSection(),
      searchResult: buildBulkInboxSearchResultSection(params.columns, limit, offset),
    },
  };
};
