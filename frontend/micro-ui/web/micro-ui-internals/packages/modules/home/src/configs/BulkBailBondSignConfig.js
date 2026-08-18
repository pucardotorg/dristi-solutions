import { OrderWorkflowState } from "@egovernments/digit-ui-module-dristi/src/Utils/orderWorkflow";

const defaultSearchValues = {
  caseTitle: "",
};

const limit = parseInt(sessionStorage.getItem("bulkBailBondSignlimit") || 10);
const offset = parseInt(sessionStorage.getItem("bulkBailBondSignoffset") || 0);

export const bulkBailBondSignConfig = {
  label: "CS_HOME_BULK_BAIL_BOND_SIGN",
  type: "search",
  // preProcess: {
  //   data: (data) => {
  //     // Process the data to mark items as selected based on your criteria
  //     return data.map((item) => ({
  //       ...item,
  //       selected: item.businessObject?.pendingActions === "SIGN_BAIL_BOND",
  //     }));
  //   },
  // },
  apiDetails: {
    serviceName: "/inbox/v2/index/_search",
    requestParam: {},
    requestBody: {
      inbox: {
        limit: limit,
        offset: offset,
        moduleSearchCriteria: {
          courtId: localStorage.getItem("courtId"),
          status: "PENDING_REVIEW",
        },
        processSearchCriteria: {
          businessService: ["bail-bond-default"],
          moduleName: "Bail Bond Service",
        },
        tenantId: Digit.ULBService.getCurrentTenantId(),
      },
    },
    minParametersForSearchForm: 0,
    masterName: "commonUiConfig",
    moduleName: "bulkBailBondSignConfig",
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
            jsonPath: "businessObject.bailDetails.caseTitle",
            additionalCustomization: true,
          },
          {
            label: "CS_CASE_NUMBER_HOME",
            jsonPath: "businessObject.bailDetails.caseNumber",
            additionalCustomization: true,
          },
          {
            label: "LITIGANT",
            jsonPath: "businessObject.bailDetails.litigantName",
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
