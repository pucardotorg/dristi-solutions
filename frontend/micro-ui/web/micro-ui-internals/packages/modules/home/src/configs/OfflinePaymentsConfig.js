//config for offline payments on home screen.

import {
  buildPaymentInboxBillingApiDetails,
  buildPaymentInboxCaseTypeField,
  buildPaymentInboxPaymentTypeField,
  buildPaymentInboxSearchResultColumnsPaid,
  buildPaymentInboxSearchResultColumnsPending,
  PAYMENT_INBOX_CASE_TITLE_FIELD,
  PAYMENT_INBOX_COLUMNS_LEAD_OFFLINE_HOME,
  PAYMENT_INBOX_DEFAULT_SEARCH_VALUES,
  PAYMENT_INBOX_MDMS_PAID_MAP_SORTED,
  PAYMENT_INBOX_MDMS_PENDING_FILTER_SORTED,
  PAYMENT_INBOX_PAID_TAB_DEFAULT_VALUES,
} from "@egovernments/digit-ui-module-dristi/src/configs/shared/paymentInboxBillingShared";

export const offlinePaymentsConfig = {
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
            formClassName: "custom-both-clear-search",

            primaryLabel: "ES_COMMON_SEARCH",
            secondaryLabel: "ES_COMMON_CLEAR_SEARCH",
            minReqFields: 0,
            defaultValues: PAYMENT_INBOX_DEFAULT_SEARCH_VALUES,
            fields: [
              buildPaymentInboxCaseTypeField({ hideInForm: true }),
              buildPaymentInboxPaymentTypeField(PAYMENT_INBOX_MDMS_PENDING_FILTER_SORTED),
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
            columns: buildPaymentInboxSearchResultColumnsPending(PAYMENT_INBOX_COLUMNS_LEAD_OFFLINE_HOME),
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
            formClassName: "custom-both-clear-search",

            primaryLabel: "ES_COMMON_SEARCH",
            secondaryLabel: "ES_COMMON_CLEAR_SEARCH",
            minReqFields: 0,
            defaultValues: PAYMENT_INBOX_PAID_TAB_DEFAULT_VALUES,
            fields: [
              buildPaymentInboxCaseTypeField({ hideInForm: true }),
              buildPaymentInboxPaymentTypeField(PAYMENT_INBOX_MDMS_PAID_MAP_SORTED),
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
            columns: buildPaymentInboxSearchResultColumnsPaid(PAYMENT_INBOX_COLUMNS_LEAD_OFFLINE_HOME),
            enableColumnSort: true,
            resultsJsonPath: "items",
          },
          show: true,
        },
      },
    },
  ],
};
