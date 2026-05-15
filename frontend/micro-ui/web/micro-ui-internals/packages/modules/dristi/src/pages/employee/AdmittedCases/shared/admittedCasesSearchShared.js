export const admittedCasesDefaultSearchValues = {
  owner: {},
  parties: {},
  hearingType: {},
  orderType: {},
  status: {},
  orderNumber: "",
  applicationType: {},
  applicationCMPNumber: "",
  artifactType: {},
  artifactNumber: "",
};

export const admittedCasesOrderSearchValues = {
  parties: "",
  status: "",
  id: "",
  type: "",
};

export const buildAdmittedCasesSearchSection = (fields, defaultValues) => ({
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

export const buildAdmittedCasesSearchResult = (columns, resultsJsonPath) => ({
  tenantId: Digit.ULBService.getCurrentTenantId(),
  uiConfig: {
    columns,
    enableColumnSort: true,
    resultsJsonPath,
  },
  show: true,
});

export const buildAdmittedCasesTabShell = (label, displayLabel, sections, extra = {}) => ({
  label,
  displayLabel,
  type: "search",
  ...extra,
  sections,
});
