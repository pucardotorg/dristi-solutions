const defaultSearchValues = {
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

export const TabSearchConfig = [
  {
    label: "PENDING_BOOKING",
    type: "search",
    moduleName: "EpostTrackingUiConfig",
    apiDetails: {
      serviceName: "/epost-tracker/epost/v1/_getEPost",
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
        ePostTrackerSearchCriteria: {
          isDataRequired: true,
          speedPostId: "",
          deliveryStatusList: [],
          pagination: {
            orderBy: "",
            sortBy: "",
          },
        },
      },
      masterName: "commonUiConfig",
      moduleName: "EpostTrackingUiConfig",
      minParametersForSearchForm: 0,
      tableFormJsonPath: "requestParam",
      filterFormJsonPath: "requestBody",
      searchFormJsonPath: "requestBody",
    },
    sections: {
      search: {
        uiConfig: {
          formClassName: "custom-speedpost-search-pending-booking",
          primaryLabel: "ES_COMMON_SEARCH",
          secondaryLabel: "ES_COMMON_CLEAR_SEARCH",
          minReqFields: 0,
          defaultValues: defaultSearchValues,
          fields: [
            // {
            //   type: "component",
            //   component: "CustomSortComponent",
            //   isMandatory: false,
            //   disable: false,
            //   name: "Date Received",
            //   key: "pagination",
            //   sortBy: "receivedDate",
            //   ascText: "ASC",
            //   descText: "DESC",
            //   showAdditionalText: true,
            //   showIcon: true,
            //   icon: "UpDownArrowIcon",
            //   populators: {},
            // },
            {
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
            },

            // {
            //   type: "dropdown",
            //   isMandatory: false,
            //   disable: false,
            //   populators: {
            //     defaultText: "Status",
            //     styles: { width: "250px" },
            //     name: "deliveryStatusList.selected",
            //     options: ["IN_TRANSIT", "NOT_UPDATED", "DELIVERED", "NOT_DELIVERED"],
            //   },
            // },
            // {
            //   type: "dropdown",
            //   isMandatory: false,
            //   disable: false,
            //   populators: {
            //     placeholder: "Type",
            //     styles: { width: "250px" },
            //     name: "type",
            //     options: [
            //       "IN_TRANSIT",
            //       "NOT_UPDATED",
            //     ],
            //   },
            // },
          ],
        },
        show: false,
        customShow: true,
      },
      searchResult: {
        tenantId: Digit.ULBService.getCurrentTenantId(),
        uiConfig: {
          columns: [
            {
              label: "SPEED_POST_ID",
              jsonPath: "speedPostId",
              additionalCustomization: true,
            },
            {
              label: "TASK_TYPE",
              jsonPath: "taskType",
              additionalCustomization: true,
            },
            {
              label: "RECIEVED_DATE",
              jsonPath: "receivedDate",
              additionalCustomization: true,
            },
            {
              label: "ADDRESS",
              jsonPath: "address",
              additionalCustomization: true,
            },
            {
              label: "PINCODE",
              jsonPath: "pinCode",
            },
            {
              label: "CS_ACTIONS",
              jsonPath: "actions",
              additionalCustomization: true,
            },
          ],
          enableColumnSort: true,
          resultsJsonPath: "EPostTracker",
          manualPagination: true,
        },
        show: true,
      },
    },
  },
  {
    label: "IN_TRANSIT",
    type: "search",
    moduleName: "EpostTrackingUiConfig",
    apiDetails: {
      serviceName: "/epost-tracker/epost/v1/_getEPost",
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
        ePostTrackerSearchCriteria: {
          isDataRequired: true,
          speedPostId: "",
          deliveryStatusList: {
            name: "All",
            code: "ALL",
          },
          pagination: {
            orderBy: "",
            sortBy: "",
          },
        },
      },
      masterName: "commonUiConfig",
      moduleName: "EpostTrackingUiConfig",
      minParametersForSearchForm: 0,
      tableFormJsonPath: "requestParam",
      filterFormJsonPath: "requestBody",
      searchFormJsonPath: "requestBody",
    },
    sections: {
      search: {
        uiConfig: {
          formClassName: "custom-speedpost-search-pending-booking",
          primaryLabel: "ES_COMMON_SEARCH",
          secondaryLabel: "ES_COMMON_CLEAR_SEARCH",
          minReqFields: 0,
          defaultValues: {
            ...defaultSearchValues,
            deliveryStatusList: {
              name: "All",
              code: "ALL",
            },
          },
          fields: [
            // {
            //   type: "component",
            //   component: "CustomSortComponent",
            //   isMandatory: false,
            //   disable: false,
            //   name: "Date Received",
            //   key: "pagination",
            //   sortBy: "receivedDate",
            //   ascText: "ASC",
            //   descText: "DESC",
            //   showAdditionalText: true,
            //   showIcon: true,
            //   icon: "UpDownArrowIcon",
            //   populators: {},
            // },
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
              populators: {
                name: "bookingDate",
              },
            },
            {
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
            },
            // {
            //   type: "dropdown",
            //   isMandatory: false,
            //   disable: false,
            //   populators: {
            //     styles: { width: "250px" },
            //     name: "deliveryStatusList.selected",
            //     options: inboxFilters,
            //   },
            // },
            // {
            //   type: "dropdown",
            //   isMandatory: false,
            //   disable: false,
            //   populators: {
            //     placeholder: "Type",
            //     styles: { width: "250px" },
            //     name: "type",
            //     options: [
            //       "IN_TRANSIT",
            //       "NOT_UPDATED",
            //     ],
            //   },
            // },
          ],
        },
        show: false,
        customShow: true,
      },
      searchResult: {
        tenantId: Digit.ULBService.getCurrentTenantId(),
        uiConfig: {
          columns: [
            {
              label: "SPEED_POST_ID",
              jsonPath: "speedPostId",
            },
            {
              label: "BOOKING_DATE",
              jsonPath: "bookingDate",
              additionalCustomization: true,
            },
            {
              label: "STATUS",
              jsonPath: "deliveryStatus",
              additionalCustomization: true,
            },
            {
              label: "CS_ACTIONS",
              jsonPath: "actions",
              additionalCustomization: true,
            },
          ],
          enableColumnSort: true,
          resultsJsonPath: "EPostTracker",
          manualPagination: true,
        },
        show: true,
      },
    },
  },
  {
    label: "CS_REPORTS",
    type: "search",
    moduleName: "EpostTrackingUiConfig",
    apiDetails: {
      serviceName: "/epost-tracker/epost/v1/_getEPost",
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
        ePostTrackerSearchCriteria: {
          isDataRequired: false,
          speedPostId: "",
          deliveryStatusList: {},
          pagination: {
            orderBy: "",
            sortBy: "",
          },
        },
      },
      masterName: "commonUiConfig",
      moduleName: "EpostTrackingUiConfig",
      minParametersForSearchForm: 0,
      tableFormJsonPath: "requestParam",
      filterFormJsonPath: "requestBody",
      searchFormJsonPath: "requestBody",
    },
    sections: {
      search: {
        uiConfig: {
          formClassName: "custom-speedpost-search-pending-booking",
          primaryLabel: "ES_COMMON_SEARCH",
          secondaryLabel: "ES_COMMON_CLEAR_SEARCH",
          minReqFields: 0,
          defaultValues: defaultSearchValues,
          fields: [
            // {
            //   type: "component",
            //   component: "CustomSortComponent",
            //   isMandatory: false,
            //   disable: false,
            //   name: "Date Received",
            //   key: "pagination",
            //   sortBy: "receivedDate",
            //   ascText: "ASC",
            //   descText: "DESC",
            //   showAdditionalText: true,
            //   showIcon: true,
            //   icon: "UpDownArrowIcon",
            //   populators: {},
            // },
            {
              label: "MONTH",
              isMandatory: false,
              key: "monthReports",
              type: "month",
              disable: false,
              populators: {
                name: "monthReports",
              },
            },
            {
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
            },
            // {
            //   type: "dropdown",
            //   isMandatory: false,
            //   disable: false,
            //   populators: {
            //     styles: { width: "250px" },
            //     name: "deliveryStatusList.selected",
            //     options: [],
            //   },
            // },
            // {
            //   type: "dropdown",
            //   isMandatory: false,
            //   disable: false,
            //   populators: {
            //     placeholder: "Type",
            //     styles: { width: "250px" },
            //     name: "type",
            //     options: [
            //       "IN_TRANSIT",
            //       "NOT_UPDATED",
            //     ],
            //   },
            // },
          ],
        },
        show: false,
        customShow: true,
      },
      searchResult: {
        tenantId: Digit.ULBService.getCurrentTenantId(),
        uiConfig: {
          columns: [
            {
              label: "SPEED_POST_ID",
              jsonPath: "speedPostId",
            },
            {
              label: "BOOKING_DATE_TIME",
              jsonPath: "bookingDate",
              additionalCustomization: true,
            },
            {
              label: "STATUS",
              jsonPath: "deliveryStatus",
              additionalCustomization: true,
            },
            {
              label: "TOTAL_CHARGES",
              jsonPath: "totalAmount",
              additionalCustomization: true,
            },
            {
              label: "CS_ACTIONS_PENCIL",
              jsonPath: "actions",
              additionalCustomization: true,
            },
          ],
          enableColumnSort: true,
          resultsJsonPath: "EPostTracker",
          manualPagination: true,
        },
        show: true,
      },
    },
  },
];
