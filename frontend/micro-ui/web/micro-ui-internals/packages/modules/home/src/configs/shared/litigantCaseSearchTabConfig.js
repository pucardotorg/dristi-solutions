import { defaultSearchValues } from "./employeeHomeSearchDefaults";
import {
  buildEmployeeSortField,
  employeeCaseTypeField,
  employeeCaseSearchTextField,
  employeeOutcomeField,
  employeeSecondaryStageField,
  employeeStageFieldScrutinyTab,
} from "./employeeCaseSearchTabConfig";

const LITIGANT_TENANT_ID = "pg";
const LITIGANT_MODULE = "homeLitigantUiConfig";

const buildLitigantApiDetails = (criteria, moduleName = LITIGANT_MODULE) => ({
  serviceName: "/case/v2/search/list",
  requestParam: {},
  requestBody: {
    tenantId: LITIGANT_TENANT_ID,
    criteria,
  },
  masterName: "commonUiConfig",
  moduleName,
  minParametersForSearchForm: 0,
  tableFormJsonPath: "requestBody",
  filterFormJsonPath: "requestBody",
  searchFormJsonPath: "requestBody",
});

const buildLitigantSearchSection = (fields, defaultValues) => ({
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

const buildLitigantSearchResult = (columns) => ({
  tenantId: Digit.ULBService.getCurrentTenantId(),
  uiConfig: {
    columns,
    enableColumnSort: true,
    resultsJsonPath: "caseList",
  },
  show: true,
});

export const litigantCaseSearchTextFieldWithStyle = {
  ...employeeCaseSearchTextField,
  populators: {
    ...employeeCaseSearchTextField.populators,
    style: { maxWidth: "250px", minWidth: "200px", width: "220px" },
  },
};

export const litigantOngoingSearchFields = [
  employeeCaseTypeField,
  employeeStageFieldScrutinyTab,
  employeeSecondaryStageField,
  litigantCaseSearchTextFieldWithStyle,
];

export const litigantOngoingResultColumns = [
  { label: "CS_CASE_NAME", jsonPath: "caseTitle", additionalCustomization: true },
  { label: "CS_STAGE", jsonPath: "stage", additionalCustomization: true },
  { label: "CS_SECONDARY_STAGE", jsonPath: "secondaryStage", additionalCustomization: true },
  { label: "CS_CASE_NUMBER_HOME", jsonPath: "filingNumber", additionalCustomization: true },
  { label: "CASE_TYPE", jsonPath: "", additionalCustomization: true },
];

export const litigantPendingSubmissionResultColumns = [
  { label: "CS_CASE_NAME", jsonPath: "caseTitle", additionalCustomization: true },
  { label: "CS_STAGE", jsonPath: "status", additionalCustomization: true },
  { label: "CASE_TYPE", jsonPath: "", additionalCustomization: true },
  { label: "CS_LAST_EDITED", jsonPath: "auditDetails.lastModifiedTime", additionalCustomization: true },
];

export const litigantClosedSearchFields = [
  employeeCaseTypeField,
  employeeOutcomeField,
  employeeSecondaryStageField,
  employeeCaseSearchTextField,
];

export const litigantClosedResultColumns = [
  { label: "CS_CASE_NAME", jsonPath: "caseTitle" },
  { label: "CS_STAGE", jsonPath: "stage", additionalCustomization: true },
  { label: "CS_CASE_NUMBER_HOME", jsonPath: "filingNumber", additionalCustomization: true },
  { label: "CASE_TYPE", jsonPath: "", additionalCustomization: true },
  { label: "CS_FILING_DATE", jsonPath: "filingDate", additionalCustomization: true },
];

export const litigantLprResultColumns = [
  { label: "CS_CASE_NAME", jsonPath: "caseTitle" },
  { label: "CS_CASE_NUMBER_HOME", jsonPath: "filingNumber", additionalCustomization: true },
  { label: "CASE_TYPE", jsonPath: "", additionalCustomization: true },
  { label: "CS_FILING_DATE", jsonPath: "filingDate", additionalCustomization: true },
];

/**
 * @param {{
 *   label: string,
 *   criteria: object,
 *   searchFields: object[],
 *   columns: object[],
 *   defaultValues?: object,
 *   moduleName?: string,
 *   additionalDetails?: object,
 * }} params
 */
export const buildLitigantCaseListTab = (params) => {
  const tab = {
    label: params.label,
    type: "search",
    apiDetails: buildLitigantApiDetails(params.criteria, params.moduleName),
    sections: {
      search: buildLitigantSearchSection(params.searchFields, params.defaultValues || defaultSearchValues),
      searchResult: buildLitigantSearchResult(params.columns),
    },
  };

  if (params.additionalDetails) {
    tab.additionalDetails = params.additionalDetails;
  }

  return tab;
};

export const buildLitigantHomeTabs = () => [
  buildLitigantCaseListTab({
    label: "CS_ONGOING",
    criteria: {},
    searchFields: litigantOngoingSearchFields,
    columns: litigantOngoingResultColumns,
  }),
  buildLitigantCaseListTab({
    label: "CS_PENDING_SUBMISSION",
    criteria: { status: ["DRAFT_IN_PROGRESS", "PENDING_E-SIGN", "PENDING_E-SIGN-2"] },
    searchFields: [litigantCaseSearchTextFieldWithStyle],
    columns: litigantPendingSubmissionResultColumns,
    defaultValues: { ...defaultSearchValues },
    additionalDetails: { sortBy: "sortCaseListByDate" },
  }),
  buildLitigantCaseListTab({
    label: "CS_CLOSED",
    criteria: { outcome: [] },
    searchFields: litigantClosedSearchFields,
    columns: litigantClosedResultColumns,
    additionalDetails: { sortBy: "sortCaseListByDate", activeTab: "DISPOSED" },
  }),
  buildLitigantCaseListTab({
    label: "CS_LPR",
    criteria: { isLPRCase: true },
    moduleName: "homeJudgeUIConfig",
    searchFields: [
      buildEmployeeSortField({ name: "Closed:", ascText: "New First", descText: "Old First" }),
      employeeCaseTypeField,
      employeeCaseSearchTextField,
    ],
    columns: litigantLprResultColumns,
    additionalDetails: { sortBy: "sortCaseListByDate" },
  }),
];
