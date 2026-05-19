const defaultSearchValues = {
  individualName: "",
  mobileNumber: "",
  IndividualID: "",
};

const hearingsMockSearchFields = [
  {
    label: "Pending Task",
    isMandatory: false,
    key: "pendingTask",
    type: "dropdown",
    populators: {
      name: "individualName",
      error: "Required",
      validation: { pattern: /^[A-Za-z]+$/i },
    },
  },
  {
    label: "Case Type",
    isMandatory: false,
    key: "caseType",
    type: "dropdown",
    disable: false,
    populators: { name: "mobileNumber", error: "sample error message", validation: { min: 0, max: 999999999 } },
  },
  {
    label: "Stage",
    isMandatory: false,
    type: "dropdown",
    key: "stage",
    disable: false,
    populators: {
      name: "individualId",
    },
  },
  {
    label: "Case ID",
    isMandatory: false,
    type: "text",
    key: "caseId",
    disable: false,
    placeholder: "Search Case ID or Case Name",
    populators: {
      name: "individualId",
    },
  },
  {
    label: "Case Name",
    isMandatory: false,
    type: "text",
    placeholder: "placeholder",
    key: "caseName",
    disable: false,
    populators: {
      name: "individualId",
    },
  },
];

const hearingsMockResultColumns = [
  { label: "Case Name", jsonPath: "caseTitle" },
  { label: "Stage", jsonPath: "caseStage" },
  { label: "Case ID", jsonPath: "cnrNumber" },
  { label: "Case Type", jsonPath: "statutes[0]" },
  { label: "Info", jsonPath: "numTasksDue" },
];

const buildHearingsMockInboxTab = (label) => ({
  label,
  type: "search",
  apiDetails: {
    serviceName: "/pgr-services/mock/inbox/cases",
    requestParam: {
      tenantId: Digit.ULBService.getCurrentTenantId(),
    },
    requestBody: {
      apiOperation: "SEARCH",
    },
    masterName: "commonUiConfig",
    moduleName: "homeHearingUIConfig",
    minParametersForSearchForm: 0,
    tableFormJsonPath: "requestParam",
    filterFormJsonPath: "requestBody",
    searchFormJsonPath: "requestBody",
  },
  sections: {
    search: {
      uiConfig: {
        formClassName: "custom-both-clear-search",
        primaryLabel: "ES_COMMON_SEARCH",
        secondaryLabel: "ES_COMMON_CLEAR_SEARCH",
        minReqFields: 0,
        defaultValues: defaultSearchValues,
        fields: hearingsMockSearchFields,
      },
      show: true,
    },
    searchResult: {
      tenantId: Digit.ULBService.getCurrentTenantId(),
      uiConfig: {
        columns: hearingsMockResultColumns,
        enableColumnSort: true,
        resultsJsonPath: "cases",
      },
      show: true,
    },
  },
});

export const hearingsMockInboxTabLabels = ["Your Cases", "Ongoing", "Registered", "Closed"];

export const buildHearingsMockInboxTabs = () => hearingsMockInboxTabLabels.map(buildHearingsMockInboxTab);
