/**
 * Config for Assign Cases section on Manage Office Member page.
 * Uses advocate-office-management/v1/_searchCaseMember for member case search.
 * @param {Object} options
 * @param {Object} options.member - Office member being managed (must have memberUserUuid)
 * @param {Object} options.advocateInfo - Logged-in advocate info (officeAdvocateUserUuid, advocateId)
 */
export const assignCasesConfig = ({ member = {}, advocateInfo = {} } = {}) => {
  const tenantId = Digit?.ULBService?.getCurrentTenantId();
  const memberUserUuid = member?.memberUserUuid;
  const officeAdvocateUserUuid = advocateInfo?.officeAdvocateUserUuid;
  const advocateId = advocateInfo?.advocateId;

  return {
    label: "ASSIGN_CASES",
    type: "search",
    apiDetails: {
      serviceName: "/advocate-office-management/v1/_searchCaseMember",
      requestParam: {
        tenantId,
      },
      requestBody: {
        criteria: {
          tenantId,
          memberUserUuid,
          officeAdvocateUserUuid,
          caseMappingFilterStatus: "ASSIGNED_CASES",
          advocateId,
        },
        pagination: {
          limit: 10,
          offSet: 0,
        },
      },
      masterName: "commonUiConfig",
      moduleName: "assignCasesConfig",
      minParametersForSearchForm: 1,
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
          defaultValues: {
            caseMappingFilterStatus: { code: "ALL_CASES", name: "All Cases" },
            caseSearchText: "",
            filingNumber: "",
          },
          fields: [
            {
              label: "ASSIGNMENT_STATUS",
              isMandatory: false,
              key: "caseMappingFilterStatus",
              type: "dropdown",
              populators: {
                name: "caseMappingFilterStatus",
                optionsKey: "name",
                error: "Should not be empty",
                options: [
                  { code: "ALL_CASES", name: "All Cases" },
                  { code: "ASSIGNED_CASES", name: "Assigned Cases" },
                  { code: "UNASSIGNED_CASES", name: "Unassigned Cases" },
                ],
              },
            },
            {
              label: "SEARCH_CASE_NAME_OR_NUMBER",
              isMandatory: false,
              key: "caseSearchText",
              type: "text",
              populators: {
                name: "caseSearchText",
                error: "Should not be empty",
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
              columnType: "checkbox",
              additionalCustomization: true,
            },
            {
              label: "CASE_NAME",
              jsonPath: "caseTitle",
              additionalCustomization: true,
            },
            {
              label: "CASE_NUMBER",
              jsonPath: "filingNumber",
              additionalCustomization: true,
            },
          ],
          enableColumnSort: true,
          resultsJsonPath: "cases",
          customDefaultPagination: {
            limit: 10,
            offset: 0,
          },
          manualPagination: true,
        },
        show: true,
      },
    },
  };
};
