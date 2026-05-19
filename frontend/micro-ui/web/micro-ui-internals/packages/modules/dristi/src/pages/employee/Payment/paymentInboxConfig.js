import {
  buildPaymentInboxBillingApiDetails,
  buildPaymentInboxCaseTypeField,
  buildPaymentInboxPaymentTypeField,
  buildPaymentInboxSearchResultColumnsPaid,
  buildPaymentInboxSearchResultColumnsPending,
  PAYMENT_INBOX_CASE_TITLE_FIELD,
  PAYMENT_INBOX_COLUMN_CASE_NAME_ID,
  PAYMENT_INBOX_DEFAULT_SEARCH_VALUES,
  PAYMENT_INBOX_MDMS_PAID_MAP,
  PAYMENT_INBOX_MDMS_PENDING_FILTER,
  PAYMENT_INBOX_PAID_TAB_DEFAULT_VALUES,
  PAYMENT_INBOX_SORT_FIELD,
} from "../../../configs/shared/paymentInboxBillingShared";

export const paymentTabInboxConfig = {
  tenantId: "pg",
  moduleName: "paymentInboxConfig",
  showTab: true,
  TabSearchConfig: [
    {
      label: "PENDING",
      type: "search",
      apiDetails: buildPaymentInboxBillingApiDetails("ACTIVE"),
      sections: {
        search: {
          uiConfig: {
            type: "registration-requests-table-search",
            primaryLabel: "ES_COMMON_SEARCH",
            secondaryLabel: "ES_COMMON_CLEAR_SEARCH",
            minReqFields: 0,
            defaultValues: PAYMENT_INBOX_DEFAULT_SEARCH_VALUES,
            fields: [
              PAYMENT_INBOX_SORT_FIELD,
              buildPaymentInboxCaseTypeField(),
              buildPaymentInboxPaymentTypeField(PAYMENT_INBOX_MDMS_PENDING_FILTER),
              PAYMENT_INBOX_CASE_TITLE_FIELD,
            ],
          },
          children: {},
          show: true,
        },
        searchResult: {
          tenantId: Digit.ULBService.getCurrentTenantId(),
          label: "",
          uiConfig: {
            columns: buildPaymentInboxSearchResultColumnsPending([PAYMENT_INBOX_COLUMN_CASE_NAME_ID]),
            enableColumnSort: true,
            resultsJsonPath: "items",
          },
          show: true,
        },
      },
    },
    {
      label: "PAID",
      type: "search",
      apiDetails: buildPaymentInboxBillingApiDetails("PAID"),
      sections: {
        search: {
          uiConfig: {
            type: "registration-requests-table-search",
            primaryLabel: "ES_COMMON_SEARCH",
            secondaryLabel: "ES_COMMON_CLEAR_SEARCH",
            minReqFields: 0,
            defaultValues: PAYMENT_INBOX_PAID_TAB_DEFAULT_VALUES,
            fields: [
              PAYMENT_INBOX_SORT_FIELD,
              buildPaymentInboxCaseTypeField(),
              buildPaymentInboxPaymentTypeField(PAYMENT_INBOX_MDMS_PAID_MAP),
              PAYMENT_INBOX_CASE_TITLE_FIELD,
            ],
          },
          children: {},
          show: true,
        },
        searchResult: {
          tenantId: Digit.ULBService.getCurrentTenantId(),
          label: "",
          uiConfig: {
            columns: buildPaymentInboxSearchResultColumnsPaid([PAYMENT_INBOX_COLUMN_CASE_NAME_ID]),
            enableColumnSort: true,
            resultsJsonPath: "items",
          },
          show: true,
        },
      },
    },
  ],
};
