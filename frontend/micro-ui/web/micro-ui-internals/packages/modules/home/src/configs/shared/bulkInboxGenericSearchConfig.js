/**
 * Generic inbox v2 search config for bulk flows (e-sign orders, sign forms).
 * @param {{
 *   moduleName: string,
 *   defaultValues: object,
 *   fields: object[],
 *   columns: object[],
 *   processSearchCriteria: object,
 *   moduleSearchCriteria?: object,
 *   requestParam?: object,
 * }} params
 */
export const buildBulkInboxGenericSearchConfig = (params) => ({
  type: "search",
  apiDetails: {
    serviceName: "/inbox/v2/index/_search",
    requestParam: params.requestParam || {},
    requestBody: {
      inbox: {
        processSearchCriteria: params.processSearchCriteria,
        ...(params.moduleSearchCriteria ? { moduleSearchCriteria: params.moduleSearchCriteria } : {}),
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
    search: {
      uiConfig: {
        formClassName: "custom-both-clear-search",
        primaryLabel: "ES_COMMON_SEARCH",
        secondaryLabel: "ES_COMMON_CLEAR_SEARCH",
        minReqFields: 0,
        defaultValues: params.defaultValues,
        fields: params.fields,
      },
      show: true,
    },
    searchResult: {
      tenantId: Digit.ULBService.getCurrentTenantId(),
      uiConfig: {
        columns: params.columns,
        resultsJsonPath: "items",
        enableColumnSort: true,
      },
      show: true,
    },
  },
});
