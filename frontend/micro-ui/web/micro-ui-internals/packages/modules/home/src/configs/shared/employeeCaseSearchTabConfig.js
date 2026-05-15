import { defaultSearchValues } from "./employeeHomeSearchDefaults";

const CASE_LIST_API_BASE = {
  serviceName: "/case/v2/search/list",
  requestParam: {},
  masterName: "commonUiConfig",
  moduleName: "homeJudgeUIConfig",
  minParametersForSearchForm: 0,
  tableFormJsonPath: "requestBody",
  filterFormJsonPath: "requestBody",
  searchFormJsonPath: "requestBody",
};

const SORT_ADDITIONAL_DETAILS = { sortBy: "sortCaseListByDate" };

const STAGE_MDMS_EXCLUDE_FILING =
  "(data) => {return data['case'].CaseUiPrimaryStage?.filter((item) => (item?.name || '').trim() !== 'Filing').sort((a,b)=>(a?.name || '').localeCompare(b?.name || '')).map((item) => {return item;});}";

const STAGE_MDMS_EXCLUDE_REGISTERED =
  "(data) => {const excludedStages = ['Filing', 'Scrutiny', 'Defect Correction', 'Registration']; return data['case'].CaseUiPrimaryStage?.filter((item) => !excludedStages.includes((item?.name || '').trim())).sort((a,b)=>(a?.name || '').localeCompare(b?.name || '')).map((item) => {return item;});}";

const STAGE_MDMS_SCRUTINY_TAB =
  "(data) => {return data['case'].CaseUiPrimaryStage?.sort((a,b)=>a.name.localeCompare(b.name)).map((item) => {return item;});}";

const SECONDARY_STAGE_MDMS_SELECT =
  "(data) => {return data['case'].CaseSecondaryStage?.map((item) => {return item}).filter((item) => item?.substage).filter((item, index, arr) => index === arr.findIndex((x) => (x?.substage || '').trim().toLowerCase() === (item?.substage || '').trim().toLowerCase())).sort((a,b) => (a?.substage || '').trim().localeCompare((b?.substage || '').trim()));}";

const OUTCOME_MDMS_SELECT =
  "(data) => {return data['case'].OutcomeType?.flatMap((item) => {return item.judgementList && item.judgementList.length > 0 ? item.judgementList.map(it => ({outcome: it})) : [item];}).sort((a,b) => a.outcome.localeCompare(b.outcome));}";

const dropdownStyles = {
  maxWidth: "200px",
  minWidth: "150px",
};
const dropdownStylesWide = {
  maxWidth: "250px",
  minWidth: "200px",
};
const optionsCustomStyle = { overflowX: "hidden" };

export const employeeAllTabStages = [
  "Post-Disposal",
  "Long Pending Register",
  "Post-Judgement",
  "Judgement",
  "Arguments",
  "Defense Evidence",
  "Examination of Accused",
  "Complainant Evidence",
  "Bail & Recording of Plea",
  "Appearance",
  "Cognizance",
  "Registration",
  "Defect Correction",
  "Scrutiny",
];

export const employeeOngoingTabStages = [
  "Long Pending Register",
  "Post-Judgement",
  "Judgement",
  "Arguments",
  "Defense Evidence",
  "Examination of Accused",
  "Complainant Evidence",
  "Bail & Recording of Plea",
  "Appearance",
  "Cognizance",
  "Registration",
  "Defect Correction",
  "Scrutiny",
];

export const employeeRegisteredTabStages = [
  "Long Pending Register",
  "Post-Disposal",
  "Post-Judgement",
  "Judgement",
  "Arguments",
  "Defense Evidence",
  "Examination of Accused",
  "Complainant Evidence",
  "Bail & Recording of Plea",
  "Appearance",
  "Cognizance",
];

export const employeeCaseTypeField = {
  label: "CASE_TYPE",
  isMandatory: false,
  key: "caseType",
  type: "dropdown",
  disable: false,
  populators: {
    name: "caseType",
    options: ["NIA S138"],
    styles: dropdownStyles,
    optionsCustomStyle,
  },
};

export const employeeCaseSearchTextField = {
  label: "CS_CASE_NAME_ID",
  type: "text",
  isMandatory: false,
  disable: false,
  populators: {
    name: "caseSearchText",
    error: "BR_PATTERN_ERR_MSG",
    validation: {
      pattern: {},
      minlength: 2,
    },
  },
};

export const employeeSecondaryStageField = {
  label: "CS_SECONDARY_STAGE",
  isMandatory: false,
  key: "secondaryStage",
  type: "dropdown",
  disable: false,
  populators: {
    name: "secondaryStage",
    optionsKey: "substage",
    mdmsConfig: {
      masterName: "CaseSecondaryStage",
      moduleName: "case",
      select: SECONDARY_STAGE_MDMS_SELECT,
    },
    styles: dropdownStylesWide,
    optionsCustomStyle,
  },
};

export const employeeStageFieldExcludeFiling = {
  label: "CS_STAGE",
  isMandatory: false,
  key: "stage",
  type: "dropdown",
  disable: false,
  populators: {
    name: "stage",
    optionsKey: "name",
    mdmsConfig: {
      masterName: "CaseUiPrimaryStage",
      moduleName: "case",
      select: STAGE_MDMS_EXCLUDE_FILING,
    },
    styles: dropdownStylesWide,
    optionsCustomStyle,
  },
};

export const employeeStageFieldExcludeRegisteredStages = {
  label: "CS_STAGE",
  isMandatory: false,
  key: "stage",
  type: "dropdown",
  disable: false,
  populators: {
    name: "stage",
    optionsKey: "name",
    mdmsConfig: {
      masterName: "CaseUiPrimaryStage",
      moduleName: "case",
      select: STAGE_MDMS_EXCLUDE_REGISTERED,
    },
    styles: dropdownStylesWide,
    optionsCustomStyle,
  },
};

export const employeeStageFieldScrutinyTab = {
  label: "CS_STAGE",
  isMandatory: false,
  key: "stage",
  type: "dropdown",
  disable: false,
  populators: {
    name: "stage",
    optionsKey: "name",
    mdmsConfig: {
      masterName: "CaseUiPrimaryStage",
      moduleName: "case",
      select: STAGE_MDMS_SCRUTINY_TAB,
    },
    styles: dropdownStylesWide,
    optionsCustomStyle,
  },
};

export const employeeOutcomeField = {
  label: "CD_OUTCOME",
  isMandatory: false,
  key: "outcome",
  type: "dropdown",
  disable: false,
  populators: {
    name: "outcome",
    optionsKey: "outcome",
    mdmsConfig: {
      masterName: "OutcomeType",
      moduleName: "case",
      select: OUTCOME_MDMS_SELECT,
    },
    styles: dropdownStylesWide,
    optionsCustomStyle,
  },
};

export const buildEmployeeSortField = ({ name, ascText, descText }) => ({
  type: "component",
  component: "CustomSortComponent",
  isMandatory: false,
  disable: false,
  name,
  key: "sortCaseListByDate",
  sortBy: "createdtime",
  ascText,
  descText,
  showAdditionalText: true,
  showIcon: true,
  icon: "UpDownArrowIcon",
  populators: {},
});

export const employeeStandardCaseResultColumns = [
  { label: "CS_CASE_NAME", jsonPath: "caseTitle" },
  { label: "CS_STAGE", jsonPath: "stage", additionalCustomization: true },
  { label: "CS_SECONDARY_STAGE", jsonPath: "secondaryStage", additionalCustomization: true },
  { label: "CS_CASE_NUMBER_HOME", jsonPath: "filingNumber", additionalCustomization: true },
  { label: "CASE_TYPE", jsonPath: "", additionalCustomization: true },
  { label: "CS_FILING_DATE", jsonPath: "filingDate", additionalCustomization: true },
];

export const employeeClosedCaseResultColumns = [
  { label: "CS_CASE_NAME", jsonPath: "caseTitle" },
  { label: "CD_OUTCOME", jsonPath: "outcome", additionalCustomization: true },
  { label: "CS_CASE_NUMBER_HOME", jsonPath: "filingNumber", additionalCustomization: true },
  { label: "CASE_TYPE", jsonPath: "", additionalCustomization: true },
  { label: "CS_FILING_DATE", jsonPath: "filingDate", additionalCustomization: true },
];

export const employeeLprCaseResultColumns = [
  { label: "CS_CASE_NAME", jsonPath: "caseTitle" },
  { label: "CS_CASE_NUMBER_HOME", jsonPath: "filingNumber", additionalCustomization: true },
  { label: "CASE_TYPE", jsonPath: "", additionalCustomization: true },
  { label: "CS_FILING_DATE", jsonPath: "filingDate", additionalCustomization: true },
];

export const employeeScrutinyCaseResultColumns = [
  { label: "CS_CASE_NAME", jsonPath: "caseTitle" },
  { label: "CS_SCRUTINY_STATUS", jsonPath: "status", additionalCustomization: true },
  { label: "CS_CASE_NUMBER_HOME", jsonPath: "filingNumber", additionalCustomization: true },
  { label: "CASE_TYPE", jsonPath: "", additionalCustomization: true },
  { label: "CS_DAYS_FILING", jsonPath: "lastModifiedTime", additionalCustomization: true },
];

const buildCaseListApiDetails = (criteria) => ({
  ...CASE_LIST_API_BASE,
  requestBody: {
    tenantId: Digit.ULBService.getCurrentTenantId(),
    criteria,
  },
});

const buildSearchSection = (fields, defaultValues) => ({
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

const buildSearchResultSection = (columns) => ({
  tenantId: Digit.ULBService.getCurrentTenantId(),
  uiConfig: {
    columns,
    enableColumnSort: true,
    resultsJsonPath: "caseList",
  },
  show: true,
});

/**
 * @param {{
 *   label: string,
 *   criteria: object,
 *   searchFields: object[],
 *   columns: object[],
 *   defaultValues?: object,
 *   sortAdditionalDetailsInSections?: boolean,
 *   sortAdditionalDetailsOnTab?: boolean,
 * }} params
 */
export const buildEmployeeCaseListTab = (params) => {
  const tab = {
    label: params.label,
    type: "search",
    apiDetails: buildCaseListApiDetails(params.criteria),
    sections: {
      search: buildSearchSection(params.searchFields, params.defaultValues || defaultSearchValues),
      searchResult: buildSearchResultSection(params.columns),
    },
  };

  if (params.sortAdditionalDetailsInSections) {
    tab.sections.additionalDetails = SORT_ADDITIONAL_DETAILS;
  }
  if (params.sortAdditionalDetailsOnTab) {
    tab.additionalDetails = SORT_ADDITIONAL_DETAILS;
  }

  return tab;
};

export const employeeStandardStageSearchFields = [
  employeeCaseTypeField,
  employeeStageFieldExcludeFiling,
  employeeSecondaryStageField,
  employeeCaseSearchTextField,
];

export const CaseReviewerAdditionalTab = buildEmployeeCaseListTab({
  label: "CS_SCRUTINY_DUE",
  criteria: { status: ["UNDER_SCRUTINY"] },
  defaultValues: {
    ...defaultSearchValues,
    sortCaseListByDate: {
      sortBy: "createdtime",
      order: "desc",
    },
  },
  searchFields: [
    buildEmployeeSortField({
      name: "Filed",
      ascText: "(Old First)",
      descText: "(New First)",
    }),
    employeeCaseTypeField,
    employeeStageFieldScrutinyTab,
    employeeSecondaryStageField,
    employeeCaseSearchTextField,
  ],
  columns: employeeScrutinyCaseResultColumns,
  sortAdditionalDetailsOnTab: true,
});
