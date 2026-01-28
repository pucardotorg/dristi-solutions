export const registerUserConfig = {
  label: "ES_COMMON_INBOX",
  type: "search",
  apiDetails: {
    serviceName: "/inbox/v2/_search",
    requestParam: {},
    requestBody: {
      inbox: {
        processSearchCriteria: {
          businessService: ["user-registration-advocate"],
          moduleName: "Advocate services",
        },
        moduleSearchCriteria: {},
        limit: 10,
        offset: 0,
      },
    },
    minParametersForSearchForm: 1,
    masterName: "commonUiConfig",
    moduleName: "registerUserHomeConfig",
    searchFormJsonPath: "requestBody.inbox.moduleSearchCriteria",
    tableFormJsonPath: "requestBody.inbox",
  },
  sections: {
    search: {
      uiConfig: {
        headerStyle: null,
        formClassName: "custom-both-clear-search",
        primaryLabel: "ES_COMMON_SEARCH",
        secondaryLabel: "ES_COMMON_CLEAR_SEARCH",
        minReqFields: 1,
        defaultValues: {
          applicationNumber_WILDCARD: "",
          isActive: false,
          userType: "Advocate",
        },
        fields: [
          {
            key: "userType",
            type: "dropdown",
            label: "REGISTER_USER_USER_TYPE",
            populators: {
              name: "userType",
              error: "CORE_REQUIRED_FIELD_ERROR",
              label: "SELECT_USER_TYPE",
              options: ["Advocate", "Advocate Clerk"],
            },
          },
          {
            label: "APPLICATION_NO",
            type: "text",
            isMandatory: false,
            disable: false,
            populators: {
              name: "applicationNumber_WILDCARD",
              error: "BR_PATTERN_ERR_MSG",
              validation: {
                pattern: {},
                minlength: 2,
              },
            },
          },
        ],
      },
      children: {},
      show: true,
    },
    searchResult: {
      label: "",
      uiConfig: {
        columns: [
          {
            label: "APPLICATION_NO",
            jsonPath: "businessObject.advocateDetails.applicationNumber",
            additionalCustomization: true,
          },
          {
            label: "USER_NAME",
            jsonPath: "businessObject.individual.name",
            additionalCustomization: true,
          },
          {
            label: "USER_TYPE",
            jsonPath: "ProcessInstance.businessService",
            additionalCustomization: true,
          },
          {
            label: "DATE_CREATED",
            jsonPath: "businessObject.auditDetails.createdTime",
            additionalCustomization: true,
          },
          {
            label: "DUE_SINCE_IN_DAYS",
            jsonPath: "dueSince",
            additionalCustomization: true,
          },
          { label: "ACTION", jsonPath: "businessObject.individual.individualId", additionalCustomization: true },
        ],
        enableGlobalSearch: false,
        enableColumnSort: true,
        resultsJsonPath: "items",
      },
      children: {},
      show: true,
    },
  },
  additionalSections: {},
  additionalDetails: "applicationNumber_WILDCARD",
};
