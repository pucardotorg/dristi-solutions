export const summonsDefaultSearchValues = {
  searchText: "",
  orderType: "",
  channel: "",
  hearingDate: "",
  compStatus: "",
};

export const defaultSearchValuesForPendingRpad = {
  searchText: "",
  orderType: "",
  channel: { code: "RPAD", name: "RPAD", displayLabel: "RPAD" },
  hearingDate: "",
  compStatus: "",
};

export const defaultSearchValuesForJudgePending = {
  searchText: "",
  hearingDate: "",
  orderType: "",
  channel: "",
  compStatus: "",
};

export const defaultSearchValuesForJudgeSent = {
  searchText: "",
  applicationStatus: "",
  hearingDate: "",
  orderType: "",
  channel: "",
  compStatus: "",
};

export const defaultSearchValuesForCompleted = {
  applicationStatus: "",
  searchText: "",
  hearingDate: "",
  orderType: "",
  channel: "",
  compStatus: "",
  completeStatus: ["EXECUTED", "NOT_EXECUTED", "DELIVERED", "UNDELIVERED"],
};

const COURT_STAFF_ORDER_TYPE_SELECT =
  "(data) => { return data?.Order?.CourtStaffOrderType?.map(item => ({ ...item, name: item.code === 'MISCELLANEOUS_PROCESS' ? 'Others' : item.name })).sort((a, b) => a.name.localeCompare(b.name)); }";

const DELIVERY_CHANNEL_SELECT =
  "(data) => { var list = (data && data.payment && data.payment.paymentType) ? data.payment.paymentType : []; var seen = {}; var unique = []; for (var i = 0; i < list.length; i++) { var ch = list[i].deliveryChannel; if (!seen[ch]) { seen[ch] = true; unique.push(list[i]); } } unique = unique.filter(item => item.deliveryChannel !== 'Online' && item.deliveryChannel !== 'ONLINE'); return unique.map(function(item) { return { code: item.deliveryChannel, name: item.deliveryChannel, displayLabel: item.deliveryChannel === 'EPOST' ? 'Post' : item.deliveryChannel }; }).sort((a, b) => a.displayLabel.localeCompare(b.displayLabel)); }";

const dropdownStylesNarrow = { maxWidth: "200px", minWidth: "150px" };
const dropdownStylesWide = { maxWidth: "250px", minWidth: "200px" };
const optionsCustomStyle = { overflowX: "hidden" };

export const summonsIssueDateSortField = {
  type: "component",
  component: "CustomSortComponent",
  isMandatory: false,
  disable: false,
  name: "Issue Date",
  key: "sortCaseListByDate",
  sortBy: "createdDate",
  showIcon: true,
  icon: "UpDownArrowIcon",
  populators: {},
  hideInForm: true,
};

export const buildSummonsProcessTypeField = (withDropdownClassName) => ({
  label: "PROCESS_TYPE",
  isMandatory: false,
  key: "orderType",
  type: "dropdown",
  disable: false,
  populators: {
    name: "orderType",
    optionsKey: "name",
    mdmsConfig: {
      moduleName: "Order",
      masterName: "CourtStaffOrderType",
      select: COURT_STAFF_ORDER_TYPE_SELECT,
    },
    optionsCustomStyle,
    styles: dropdownStylesNarrow,
    ...(withDropdownClassName ? { className: "custom-dropdown-color" } : {}),
  },
});

export const summonsDeliveryChannelField = {
  label: "DELIVERY_CHANNEL",
  isMandatory: false,
  key: "channel",
  type: "dropdown",
  populators: {
    name: "channel",
    optionsKey: "displayLabel",
    mdmsConfig: {
      moduleName: "payment",
      masterName: "paymentType",
      select: DELIVERY_CHANNEL_SELECT,
    },
    optionsCustomStyle,
    styles: dropdownStylesWide,
  },
};

export const summonsCompletedDeliveryChannelField = {
  label: "DELIVERY_CHANNEL",
  isMandatory: false,
  key: "deliveryChannel",
  type: "dropdown",
  populators: {
    name: "channel",
    optionsKey: "displayLabel",
    mdmsConfig: {
      moduleName: "payment",
      masterName: "paymentType",
      select: DELIVERY_CHANNEL_SELECT,
    },
    optionsCustomStyle,
    styles: dropdownStylesWide,
  },
};

export const summonsRpadOnlyChannelField = {
  label: "DELIVERY_CHANNEL",
  isMandatory: false,
  key: "channel",
  type: "dropdown",
  populators: {
    name: "channel",
    optionsKey: "displayLabel",
    defaultValue: { code: "RPAD", name: "RPAD", displayLabel: "RPAD" },
    options: [{ code: "RPAD", name: "RPAD", displayLabel: "RPAD" }],
    optionsCustomStyle,
    styles: dropdownStylesWide,
  },
};

export const summonsHearingDateField = {
  label: "HEARING_DATE",
  isMandatory: false,
  key: "hearingDate",
  type: "date",
  disable: false,
  populators: { name: "hearingDate" },
};

export const summonsCaseSearchField = {
  label: "CS_CASE_NAME_ID",
  isMandatory: false,
  type: "text",
  key: "searchText",
  disable: false,
  populators: {
    name: "searchText",
    error: "BR_PATTERN_ERR_MSG",
    style: { maxWidth: "250px", minWidth: "200px", width: "220px" },
    validation: { pattern: {}, minlength: 2 },
  },
};

export const summonsNoticeTypeField = {
  label: "NOTICE_TYPE",
  isMandatory: false,
  key: "noticeType",
  type: "dropdown",
  disable: false,
  populators: {
    name: "noticeType",
    optionsKey: "name",
    defaultValue: { code: "", name: "NOTICE_TYPE" },
    mdmsConfig: {
      moduleName: "Notice",
      masterName: "NoticeType",
      select: "(data) => { return data['Notice'].NoticeType?.map((item) => {return item;}); console.log('NoticeType MDMS data:', data);}",
    },
    optionsCustomStyle,
    styles: dropdownStylesNarrow,
    className: "custom-dropdown-color",
  },
  hideInForm: true,
};

export const buildSummonsESignStatusField = (hideInForm) => ({
  label: "E_SIGN_STATUS",
  isMandatory: false,
  key: "applicationStatus",
  type: "dropdown",
  disable: false,
  populators: {
    name: "applicationStatus",
    optionsKey: "code",
    mdmsConfig: {
      moduleName: "Order",
      masterName: "ESignPendingStatus",
      select:
        hideInForm
          ? "(data) => {return data['Order'].ESignPendingStatus?.map((item) => {return item;}).sort((a, b) => a.code.localeCompare(b.code));}"
          : "(data) => {return data['Order'].ESignPendingStatus?.map((item) => {return item;});}",
    },
    optionsCustomStyle,
    styles: dropdownStylesNarrow,
  },
  hideInForm,
});

export const summonsCompletedStatusField = {
  label: "STATUS",
  isMandatory: false,
  key: "compStatus",
  type: "dropdown",
  populators: {
    name: "compStatus",
    optionsKey: "name",
    mdmsConfig: {
      moduleName: "Order",
      masterName: "SentStatus",
      select:
        "(data) => {return data['Order'].SentStatus?.filter((item) => [`DELIVERED`,`UNDELIVERED`,`EXECUTED`,`NOT_EXECUTED`].includes(item.code)).sort((a, b) => a.name.localeCompare(b.name));}",
    },
    optionsCustomStyle,
    styles: dropdownStylesNarrow,
  },
};

const checkboxColumn = { label: "SELECT", columnType: "checkbox", additionalCustomization: true };

const baseResultColumn = (label, jsonPath, extra = {}) => ({
  label,
  jsonPath,
  additionalCustomization: true,
  ...extra,
});

export const summonsRpadPendingColumns = [
  checkboxColumn,
  baseResultColumn("CASE_TITLE", "caseName"),
  baseResultColumn("CS_CASE_NUMBER_HOME", "courtCaseNumber"),
  baseResultColumn("PROCESS_TYPE", "taskType"),
  baseResultColumn("PAYMENT_MADE", "paymentMade"),
  baseResultColumn("DELIEVERY_CHANNEL", "delieveryChannel"),
  baseResultColumn("HEARING_DATE", "hearingDate"),
];

export const summonsCheckboxIssueColumns = [
  checkboxColumn,
  baseResultColumn("CASE_TITLE", "caseName"),
  baseResultColumn("CS_CASE_NUMBER_HOME", "courtCaseNumber"),
  baseResultColumn("PROCESS_TYPE", "taskType"),
  baseResultColumn("ISSUE_DATE", "createdDate"),
  baseResultColumn("DELIEVERY_CHANNEL", "delieveryChannel"),
  baseResultColumn("HEARING_DATE", "hearingDate"),
];

export const summonsSentColumns = [
  baseResultColumn("CASE_TITLE", "caseName"),
  baseResultColumn("CS_CASE_NUMBER_HOME", "courtCaseNumber"),
  baseResultColumn("PROCESS_TYPE", "taskType"),
  baseResultColumn("ISSUE_DATE", "createdDate"),
  baseResultColumn("DELIEVERY_CHANNEL", "delieveryChannel"),
  baseResultColumn("HEARING_DATE", "hearingDate"),
  baseResultColumn("SENT_DATE", ""),
];

export const summonsCompletedColumns = [
  baseResultColumn("CASE_TITLE", "caseName"),
  baseResultColumn("CS_CASE_NUMBER_HOME", "courtCaseNumber"),
  baseResultColumn("PROCESS_TYPE", "taskType"),
  baseResultColumn("ISSUE_DATE", "createdDate"),
  baseResultColumn("DELIEVERY_CHANNEL", "delieveryChannel"),
  baseResultColumn("HEARING_DATE", "hearingDate"),
  baseResultColumn("STATUS", "status"),
  baseResultColumn("STATUS_UPDATE_DATE", "statusChangeDate"),
];

const SORT_ADDITIONAL_DETAILS = { sortBy: "sortCaseListByDate" };

const buildSummonsApiDetails = (criteria, requestParam) => ({
  serviceName: "/task/v1/table/search",
  requestParam,
  requestBody: {
    apiOperation: "SEARCH",
    criteria,
  },
  masterName: "commonUiConfig",
  moduleName: "reviewSummonWarrantNotice",
  minParametersForSearchForm: 0,
  tableFormJsonPath: "requestParam",
  filterFormJsonPath: "requestBody.criteria",
  searchFormJsonPath: "requestBody.criteria",
});

const buildSummonsSentApiDetails = (criteria) => ({
  serviceName: "/task/v1/table/search",
  requestParam: {
    tenantId: Digit.ULBService.getCurrentTenantId(),
  },
  requestBody: { criteria },
  masterName: "commonUiConfig",
  moduleName: "reviewSummonWarrantNotice",
  minParametersForSearchForm: 0,
  tableFormJsonPath: "requestParam",
  filterFormJsonPath: "requestBody.criteria",
  searchFormJsonPath: "requestBody.criteria",
});

/**
 * @param {{
 *   label: string,
 *   criteria: object,
 *   defaultValues: object,
 *   searchFields: object[],
 *   columns: object[],
 *   requestParam?: object,
 *   useSentStyleApi?: boolean,
 *   additionalDetails?: object,
 * }} params
 */
export const buildSummonsTaskTab = (params) => {
  const requestParam =
    params.requestParam ||
    (params.useSentStyleApi
      ? { tenantId: Digit.ULBService.getCurrentTenantId() }
      : {
          tenantId: Digit.ULBService.getCurrentTenantId(),
          limit: 10,
          offset: 0,
        });

  const apiDetails = params.useSentStyleApi
    ? buildSummonsSentApiDetails(params.criteria)
    : buildSummonsApiDetails(params.criteria, requestParam);

  const tab = {
    label: params.label,
    type: "search",
    apiDetails,
    sections: {
      search: {
        uiConfig: {
          formClassName: "custom-both-clear-search",
          primaryLabel: "ES_COMMON_SEARCH",
          secondaryLabel: "ES_COMMON_CLEAR_SEARCH",
          minReqFields: 0,
          defaultValues: params.defaultValues,
          fields: params.searchFields,
        },
        show: true,
      },
      searchResult: {
        tenantId: Digit.ULBService.getCurrentTenantId(),
        uiConfig: {
          columns: params.columns,
          enableColumnSort: true,
          resultsJsonPath: "list",
        },
        show: true,
      },
    },
  };

  if (params.additionalDetails !== false) {
    tab.additionalDetails = params.additionalDetails || SORT_ADDITIONAL_DETAILS;
  }

  return tab;
};

export const buildSummonsStandardSearchFields = (withProcessTypeClassName) => [
  summonsIssueDateSortField,
  buildSummonsProcessTypeField(withProcessTypeClassName),
  summonsDeliveryChannelField,
  summonsHearingDateField,
  summonsCaseSearchField,
];

export const buildSummonsPendingSignSearchFields = () => [
  summonsIssueDateSortField,
  buildSummonsProcessTypeField(true),
  summonsNoticeTypeField,
  buildSummonsESignStatusField(true),
  summonsDeliveryChannelField,
  summonsHearingDateField,
  summonsCaseSearchField,
];

export const buildSummonsSignedSearchFields = () => [
  summonsIssueDateSortField,
  buildSummonsProcessTypeField(false),
  summonsDeliveryChannelField,
  summonsHearingDateField,
  buildSummonsESignStatusField(true),
  summonsCaseSearchField,
];

export const buildSummonsCompletedSearchFields = () => [
  summonsIssueDateSortField,
  buildSummonsProcessTypeField(false),
  summonsCompletedDeliveryChannelField,
  summonsCompletedStatusField,
  summonsHearingDateField,
  summonsCaseSearchField,
];
