import { ordersIndividualSearchDefaultValues as defaultSearchValues } from "./individualSearchFormDefaults";

const TAB_LABELS = ["Overview", "Complaints", "Hearings", "Orders", "Submissions", "Documents", "History"];

export const ordersIndividualSearchFields = [
  {
    label: "Applicant name ",
    isMandatory: false,
    key: "individualName",
    type: "text",
    populators: {
      name: "individualName",
      error: "Required",
      validation: { pattern: /^[A-Za-z]+$/i },
    },
  },
  {
    label: "Phone number",
    isMandatory: false,
    key: "Phone number",
    type: "number",
    disable: false,
    populators: { name: "mobileNumber", error: "sample error message", validation: { min: 0, max: 999999999 } },
  },
  {
    label: "Individual Id ",
    isMandatory: false,
    type: "text",
    disable: false,
    populators: {
      name: "individualId",
    },
  },
];

const buildIndividualSearchApiDetails = () => ({
  serviceName: "/individual/v1/_search",
  requestParam: {
    tenantId: Digit.ULBService.getCurrentTenantId(),
  },
  requestBody: {
    apiOperation: "SEARCH",
    Individual: {
      tenantId: Digit.ULBService.getCurrentTenantId(),
    },
  },
  masterName: "commonUiConfig",
  moduleName: "SearchIndividualConfig",
  minParametersForSearchForm: 0,
  tableFormJsonPath: "requestParam",
  filterFormJsonPath: "requestBody.Individual",
  searchFormJsonPath: "requestBody.Individual",
});

const buildIndividualSearchResultColumns = (includeDocumentColumn) => {
  const columns = [
    {
      label: "IndividualID",
      jsonPath: "individualId",
    },
    {
      label: "Name",
      jsonPath: "name.givenName",
    },
    {
      label: "Address",
      jsonPath: "address.locality.code",
    },
  ];
  if (includeDocumentColumn) {
    columns.push({
      label: "Document",
      jsonPath: "id",
      additionalCustomization: true,
    });
  }
  return columns;
};

export const buildOrdersIndividualSearchTab = (label, includeDocumentColumn) => ({
  label,
  type: "search",
  apiDetails: buildIndividualSearchApiDetails(),
  sections: {
    search: {
      uiConfig: {
        formClassName: "custom-both-clear-search",
        primaryLabel: "ES_COMMON_SEARCH",
        secondaryLabel: "ES_COMMON_CLEAR_SEARCH",
        minReqFields: 0,
        defaultValues: defaultSearchValues,
        fields: ordersIndividualSearchFields,
      },
      show: true,
    },
    searchResult: {
      tenantId: Digit.ULBService.getCurrentTenantId(),
      uiConfig: {
        columns: buildIndividualSearchResultColumns(includeDocumentColumn),
        enableColumnSort: true,
        resultsJsonPath: "Individual",
      },
      show: true,
    },
  },
});

/**
 * @param {{ submissionsTabIncludeDocumentColumn?: boolean }} options
 */
export const buildOrdersCampaignTabSearchConfig = (options) => {
  const submissionsTabIncludeDocumentColumn = options && options.submissionsTabIncludeDocumentColumn;
  return {
    tenantId: "mz",
    moduleName: "commonCampaignUiConfig",
    showTab: true,
    TabSearchconfig: TAB_LABELS.map((label) =>
      buildOrdersIndividualSearchTab(label, label === "Submissions" && submissionsTabIncludeDocumentColumn)
    ),
  };
};
