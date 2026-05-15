export const epostTrackingDefaultSearchValues = {
  pagination: {
    sortBy: "",
    order: "",
  },
  deliveryStatusList: {
    name: "All",
    code: "ALL",
  },
  speedPostId: "",
  bookingDate: "",
};

const EPOST_API_BASE = {
  serviceName: "/epost-tracker/epost/v1/_getEPost",
  masterName: "commonUiConfig",
  moduleName: "EpostTrackingUiConfig",
  minParametersForSearchForm: 0,
  tableFormJsonPath: "requestParam",
  filterFormJsonPath: "requestBody",
  searchFormJsonPath: "requestBody",
};

const buildEpostApiDetails = (ePostTrackerSearchCriteria) => ({
  ...EPOST_API_BASE,
  requestParam: {
    tenantId: Digit.ULBService.getCurrentTenantId(),
    limit: 10,
    offset: 0,
  },
  requestBody: {
    apiOperation: "SEARCH",
    Individual: {
      tenantId: Digit.ULBService.getCurrentTenantId(),
    },
    ePostTrackerSearchCriteria,
  },
});

const buildEpostSearchSection = (fields, defaultValues) => ({
  uiConfig: {
    formClassName: "custom-speedpost-search-pending-booking",
    primaryLabel: "ES_COMMON_SEARCH",
    secondaryLabel: "ES_COMMON_CLEAR_SEARCH",
    minReqFields: 0,
    defaultValues,
    fields,
  },
  show: false,
  customShow: true,
});

const buildEpostSearchResultSection = (columns) => ({
  tenantId: Digit.ULBService.getCurrentTenantId(),
  uiConfig: {
    columns,
    enableColumnSort: true,
    resultsJsonPath: "EPostTracker",
    manualPagination: true,
  },
  show: true,
});

export const epostSpeedPostIdSearchField = {
  isMandatory: false,
  type: "text",
  disable: false,
  showIcon: true,
  icon: "SearchIcon",
  label: "SEACRH_SPEED_POST_ID",
  key: "speedPostId",
  populators: {
    name: "speedPostId",
  },
};

const buildEpostTab = ({ label, ePostTrackerSearchCriteria, defaultValues, fields, columns }) => ({
  label,
  type: "search",
  moduleName: "EpostTrackingUiConfig",
  apiDetails: buildEpostApiDetails(ePostTrackerSearchCriteria),
  sections: {
    search: buildEpostSearchSection(fields, defaultValues),
    searchResult: buildEpostSearchResultSection(columns),
  },
});

const pendingBookingCriteria = {
  isDataRequired: true,
  speedPostId: "",
  deliveryStatusList: [],
  pagination: { orderBy: "", sortBy: "" },
};

const inTransitCriteria = {
  isDataRequired: true,
  speedPostId: "",
  deliveryStatusList: { name: "All", code: "ALL" },
  pagination: { orderBy: "", sortBy: "" },
};

const reportsCriteria = {
  isDataRequired: false,
  speedPostId: "",
  deliveryStatusList: {},
  pagination: { orderBy: "", sortBy: "" },
};

export const epostPendingBookingColumns = [
  { label: "SPEED_POST_ID", jsonPath: "speedPostId", additionalCustomization: true },
  { label: "TASK_TYPE", jsonPath: "taskType", additionalCustomization: true },
  { label: "RECIEVED_DATE", jsonPath: "receivedDate", additionalCustomization: true },
  { label: "ADDRESS", jsonPath: "address", additionalCustomization: true },
  { label: "PINCODE", jsonPath: "pinCode" },
  { label: "CS_ACTIONS", jsonPath: "actions", additionalCustomization: true },
];

export const epostInTransitColumns = [
  { label: "SPEED_POST_ID", jsonPath: "speedPostId" },
  { label: "BOOKING_DATE", jsonPath: "bookingDate", additionalCustomization: true },
  { label: "STATUS", jsonPath: "deliveryStatus", additionalCustomization: true },
  { label: "CS_ACTIONS", jsonPath: "actions", additionalCustomization: true },
];

export const epostReportsColumns = [
  { label: "SPEED_POST_ID", jsonPath: "speedPostId" },
  { label: "BOOKING_DATE_TIME", jsonPath: "bookingDate", additionalCustomization: true },
  { label: "STATUS", jsonPath: "deliveryStatus", additionalCustomization: true },
  { label: "TOTAL_CHARGES", jsonPath: "totalAmount", additionalCustomization: true },
  { label: "CS_ACTIONS_PENCIL", jsonPath: "actions", additionalCustomization: true },
];

export const buildEpostTrackingTabSearchConfig = () => [
  buildEpostTab({
    label: "PENDING_BOOKING",
    ePostTrackerSearchCriteria: pendingBookingCriteria,
    defaultValues: epostTrackingDefaultSearchValues,
    fields: [epostSpeedPostIdSearchField],
    columns: epostPendingBookingColumns,
  }),
  buildEpostTab({
    label: "IN_TRANSIT",
    ePostTrackerSearchCriteria: inTransitCriteria,
    defaultValues: {
      ...epostTrackingDefaultSearchValues,
      deliveryStatusList: { name: "All", code: "ALL" },
    },
    fields: [
      {
        label: "STATUS",
        isMandatory: false,
        key: "deliveryStatusList",
        type: "dropdown",
        populators: {
          name: "deliveryStatusList",
          optionsKey: "name",
          options: [],
        },
      },
      {
        label: "BOOKING_DATE",
        isMandatory: false,
        key: "bookingDate",
        type: "date",
        disable: false,
        populators: { name: "bookingDate" },
      },
      epostSpeedPostIdSearchField,
    ],
    columns: epostInTransitColumns,
  }),
  buildEpostTab({
    label: "CS_REPORTS",
    ePostTrackerSearchCriteria: reportsCriteria,
    defaultValues: epostTrackingDefaultSearchValues,
    fields: [
      {
        label: "MONTH",
        isMandatory: false,
        key: "monthReports",
        type: "month",
        disable: false,
        populators: { name: "monthReports" },
      },
      epostSpeedPostIdSearchField,
    ],
    columns: epostReportsColumns,
  }),
];
