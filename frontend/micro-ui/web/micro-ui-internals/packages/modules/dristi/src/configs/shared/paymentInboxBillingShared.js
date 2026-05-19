/**
 * Shared billing / payment inbox table config used by:
 * - `dristi/.../Payment/paymentInboxConfig.js` (employee payment tab)
 * - `home/.../OfflinePaymentsConfig.js` (offline payments)
 *
 * Intentional differences (sort on select expr, formClassName, lead columns, sort widget) stay in callers.
 */

export const PAYMENT_INBOX_DEFAULT_SEARCH_VALUES = {
  caseTitleFilingNumber: "",
  sortOrder: "DESC",
  caseType: "",
  paymentType: "",
};

export const PAYMENT_INBOX_PAID_TAB_DEFAULT_VALUES = {
  caseTitleFilingNumber: "",
  sortOrder: "DESC",
};

/** MDMS `select` expressions — must stay character-identical to legacy configs. */
export const PAYMENT_INBOX_MDMS_PENDING_FILTER =
  "(data) => {return data['payment'].paymentType?.filter((item) => item?.paymentType !== `Warrant Court Fee`).map((item) => {return item?.paymentType;});}";

export const PAYMENT_INBOX_MDMS_PENDING_FILTER_SORTED =
  "(data) => {return data['payment'].paymentType?.filter((item) => item?.paymentType !== `Warrant Court Fee`).map((item) => {return item?.paymentType;}).sort((a, b) => a.localeCompare(b));}";

export const PAYMENT_INBOX_MDMS_PAID_MAP =
  "(data) => {return data['payment'].paymentType?.map((item) => {return item?.paymentType;});}";

export const PAYMENT_INBOX_MDMS_PAID_MAP_SORTED =
  "(data) => {return data['payment'].paymentType?.map((item) => {return item?.paymentType;}).sort((a, b) => a.localeCompare(b));}";

export const PAYMENT_INBOX_SORT_FIELD = {
  type: "component",
  component: "CustomSortComponent",
  isMandatory: false,
  disable: false,
  name: "SORT_BY",
  key: "sortOrder",
  paymentInbox: true,
  ascText: "OLDEST_TO_NEWEST",
  descText: "NEWEST_TO_OLDEST",
  showAdditionalText: true,
  showIcon: true,
  icon: "UpDownArrowIcon",
  populators: {},
};

export const PAYMENT_INBOX_CASE_TITLE_FIELD = {
  label: "CASE_ID_TITLE",
  type: "text",
  isMandatory: false,
  disable: false,
  populators: {
    name: "caseTitleFilingNumber",
    error: "BR_PATTERN_ERR_MSG",
    validation: {
      pattern: {},
      minlength: 1,
    },
  },
};

export const PAYMENT_INBOX_COLUMN_CASE_NAME_ID = {
  label: "CASE_NAME_ID",
  jsonPath: "businessObject.billDetails.caseTitleFilingNumber",
  additionalCustomization: true,
};

export const PAYMENT_INBOX_COLUMNS_LEAD_OFFLINE_HOME = [
  { label: "PENDING_CASE_NAME", jsonPath: "", additionalCustomization: true },
  { label: "CS_CASE_NUMBER_HOME", jsonPath: "", additionalCustomization: true },
];

export const PAYMENT_INBOX_COLUMNS_BILL_MIDDLE = [
  { label: "CS_STAGE", jsonPath: "businessObject.billDetails.stage" },
  { label: "NYAY_PAYMENT_TYPE", jsonPath: "businessObject.billDetails.paymentType" },
  { label: "AMOUNT_DUE", jsonPath: "businessObject.billDetails.amount", additionalCustomization: true },
];

export const PAYMENT_INBOX_COLUMN_PAYMENT_GENERATED = {
  label: "PAYMENT_GENERATED_DATE",
  jsonPath: "businessObject.billDetails.paymentCreatedDate",
  additionalCustomization: true,
};

export const PAYMENT_INBOX_COLUMN_PAYMENT_COMPLETED = {
  label: "PAYMENT_COMPLETED_DATE",
  jsonPath: "businessObject.billDetails.paymentCompletedDate",
  additionalCustomization: true,
};

export const PAYMENT_INBOX_COLUMN_ACTION = {
  label: "ACTION",
  jsonPath: "businessObject.billDetails.id",
  additionalCustomization: true,
};

export function buildPaymentInboxCaseTypeField(options = {}) {
  const base = {
    label: "CASE_TYPE",
    isMandatory: false,
    key: "caseType",
    type: "dropdown",
    disable: false,
    populators: {
      name: "caseType",
      options: ["Negotiable Instruments Act 1881"],
      styles: {
        maxWidth: "300px",
        minWidth: "200px",
      },
      optionsCustomStyle: {
        overflowX: "hidden",
      },
    },
  };
  if (options.hideInForm) {
    return { ...base, hideInForm: true };
  }
  return base;
}

export function buildPaymentInboxPaymentTypeField(selectExpression) {
  return {
    label: "NYAY_PAYMENT_TYPE",
    isMandatory: false,
    key: "paymentType",
    type: "dropdown",
    disable: false,
    populators: {
      name: "paymentType",
      mdmsConfig: {
        masterName: "paymentType",
        moduleName: "payment",
        select: selectExpression,
      },
      styles: {
        maxWidth: "300px",
        minWidth: "200px",
      },
      optionsCustomStyle: {
        overflowX: "hidden",
      },
    },
  };
}

export function buildPaymentInboxBillingApiDetails(billStatus) {
  return {
    serviceName: "/inbox/v2/index/_search",
    requestParam: {},
    requestBody: {
      inbox: {
        processSearchCriteria: {
          businessService: ["billing"],
          moduleName: "Billing service",
        },
        moduleSearchCriteria: {
          billStatus,
        },
      },
    },
    minParametersForSearchForm: 0,
    masterName: "commonUiConfig",
    moduleName: "paymentInboxConfig",
    searchFormJsonPath: "requestBody.inbox.moduleSearchCriteria",
    filterFormJsonPath: "requestBody.inbox.moduleSearchCriteria",
    tableFormJsonPath: "requestBody.inbox",
  };
}

export function buildPaymentInboxSearchResultColumnsPending(leadColumns) {
  return [...leadColumns, ...PAYMENT_INBOX_COLUMNS_BILL_MIDDLE, PAYMENT_INBOX_COLUMN_PAYMENT_GENERATED, PAYMENT_INBOX_COLUMN_ACTION];
}

export function buildPaymentInboxSearchResultColumnsPaid(leadColumns) {
  return [
    ...leadColumns,
    ...PAYMENT_INBOX_COLUMNS_BILL_MIDDLE,
    PAYMENT_INBOX_COLUMN_PAYMENT_GENERATED,
    PAYMENT_INBOX_COLUMN_PAYMENT_COMPLETED,
    PAYMENT_INBOX_COLUMN_ACTION,
  ];
}
