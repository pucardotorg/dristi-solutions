export const newconfigAdvocate = {
  label: "ES_COMMON_INBOX",
  type: "inbox",
  // customHookName: "dristi.useInboxCustomHook",
  apiDetails: {
    serviceName: "/inbox/v2/_search",
    requestParam: {},
    requestBody: {
      inbox: {
        processSearchCriteria: {
          businessService: ["user-registration-advocate"],
          moduleName: "Advocate services",
        },
        moduleSearchCriteria: {},

        limit: 10,
        offset: 0,
      },
    },
    minParametersForSearchForm: 1,
    masterName: "commonUiConfig",
    moduleName: "registrationRequestsConfig",
    searchFormJsonPath: "requestBody.inbox.moduleSearchCriteria",
    tableFormJsonPath: "requestBody.inbox",
  },
  sections: {
    search: {
      uiConfig: {
        headerStyle: null,
        type: "registration-requests-table-search",
        primaryLabel: "ES_COMMON_SEARCH",
        secondaryLabel: "ES_COMMON_CLEAR_SEARCH",
        minReqFields: 1,
        defaultValues: {
          applicationNumber_WILDCARD: "",
          isActive: false,
        },
        fields: [
          {
            label: "APPLICATION_NO",
            type: "text",
            isMandatory: false,
            disable: false,
            populators: {
              name: "applicationNumber_WILDCARD",
              error: "BR_PATTERN_ERR_MSG",
              validation: {
                pattern: {},
                minlength: 2,
              },
            },
          },
        ],
      },
      label: "Registration-Requests",
      children: {},
      show: true,
    },
    searchResult: {
      label: "",
      uiConfig: {
        columns: [
          {
            label: "APPLICATION_NO",
            jsonPath: "businessObject.advocateDetails.applicationNumber",
            additionalCustomization: true,
          },
          {
            label: "USER_NAME",
            jsonPath: "businessObject.individual.name",
            additionalCustomization: true,
          },
          {
            label: "USER_TYPE",
            jsonPath: "ProcessInstance.businessService",
            additionalCustomization: true,
          },
          {
            label: "DATE_CREATED",
            jsonPath: "businessObject.auditDetails.createdTime",
            additionalCustomization: true,
          },
          {
            label: "DUE_SINCE_IN_DAYS",
            jsonPath: "dueSince",
            additionalCustomization: true,
          },
          { label: "ACTION", jsonPath: "businessObject.individual.individualId", additionalCustomization: true },
        ],
        enableGlobalSearch: false,
        enableColumnSort: true,
        resultsJsonPath: "items",
      },
      children: {},
      show: true,
    },
  },
  additionalSections: {},
  additionalDetails: "applicationNumber_WILDCARD",
};

export const newconfigClerk = {
  label: "ES_COMMON_INBOX",
  type: "inbox",
  // customHookName: "dristi.useInboxCustomHook",
  apiDetails: {
    serviceName: "/inbox/v2/_search",
    requestParam: {},
    requestBody: {
      inbox: {
        processSearchCriteria: {
          businessService: ["user-registration-advocate-clerk"],
          moduleName: "Advocate Clerk Service",
        },
        moduleSearchCriteria: {},

        limit: 10,
        offset: 0,
      },
    },
    minParametersForSearchForm: 1,
    masterName: "commonUiConfig",
    moduleName: "registrationRequestsConfig",
    searchFormJsonPath: "requestBody.inbox.moduleSearchCriteria",
    tableFormJsonPath: "requestBody.inbox",
  },
  sections: {
    search: {
      uiConfig: {
        headerStyle: null,
        type: "registration-requests-table-search",
        primaryLabel: "ES_COMMON_SEARCH",
        secondaryLabel: "ES_COMMON_CLEAR_SEARCH",
        minReqFields: 1,
        defaultValues: {
          applicationNumber_WILDCARD: "",
          isActive: false,
        },
        fields: [
          {
            label: "APPLICATION_NO",
            type: "text",
            isMandatory: false,
            disable: false,
            populators: {
              name: "applicationNumber_WILDCARD",
              error: "BR_PATTERN_ERR_MSG",
              validation: {
                pattern: {},
                minlength: 2,
              },
            },
          },
        ],
      },
      label: "Registration-Requests",
      children: {},
      show: true,
    },
    searchResult: {
      label: "",
      uiConfig: {
        columns: [
          {
            label: "APPLICATION_NO",
            jsonPath: "businessObject.clerkDetails.applicationNumber",
            additionalCustomization: true,
          },
          {
            label: "USER_NAME",
            jsonPath: "businessObject.individual.name",
            additionalCustomization: true,
          },
          {
            label: "USER_TYPE",
            jsonPath: "ProcessInstance.businessService",
            additionalCustomization: true,
          },
          {
            label: "DATE_CREATED",
            jsonPath: "businessObject.auditDetails.createdTime",
            additionalCustomization: true,
          },
          {
            label: "DUE_SINCE_IN_DAYS",
            jsonPath: "dueSince",
            additionalCustomization: true,
          },
          { label: "ACTION", jsonPath: "businessObject.individual.individualId", additionalCustomization: true },
        ],
        enableGlobalSearch: false,
        enableColumnSort: true,
        resultsJsonPath: "items",
      },
      children: {},
      show: true,
    },
  },
  additionalSections: {},
  additionalDetails: "applicationNumber_WILDCARD",
};

// export const configAdvocate = {
//   label: "ES_COMMON_INBOX",
//   type: "inbox",
//   apiDetails: {
//     serviceName: "/advocate/v1/_search",
//     requestParam: {},
//     requestBody: {
//       applicationNumber: "",
//
//       status: ["INWORKFLOW"],
//     },
//     minParametersForSearchForm: 1,
//     masterName: "commonUiConfig",
//     moduleName: "registrationRequestsConfig",
//     searchFormJsonPath: "requestBody",
//     tableFormJsonPath: "requestParam",
//   },
//   sections: {
//     search: {
//       uiConfig: {
//         headerStyle: null,
//         type: "registration-requests-table-search",
//         primaryLabel: "ES_COMMON_SEARCH",
//         secondaryLabel: "ES_COMMON_CLEAR_SEARCH",
//         minReqFields: 1,
//         defaultValues: {
//           applicationNumber: "",
//         },
//         fields: [
//           {
//             label: "Application No",
//             type: "text",
//             isMandatory: false,
//             disable: false,
//             populators: {
//               name: "applicationNumber",
//               error: "BR_PATTERN_ERR_MSG",
//               validation: {
//                 pattern: {},
//                 minlength: 2,
//               },
//             },
//           },
//         ],
//       },
//       label: "",
//       children: {},
//       show: true,
//     },
//     searchResult: {
//       label: "",
//       uiConfig: {
//         columns: [
//           {
//             label: "Application No",
//             jsonPath: "applicationNumber",
//             additionalCustomization: true,
//           },
//           {
//             label: "User Name",
//             jsonPath: "additionalDetails",
//             additionalCustomization: true,
//           },
//           {
//             label: "User Type",
//             jsonPath: "usertype",
//             additionalCustomization: true,
//           },
//           {
//             label: "Date Created",
//             jsonPath: "auditDetails.createdTime",
//             additionalCustomization: true,
//           },
//           {
//             label: "Due Since (no of days)",
//             jsonPath: "dueSince",
//             additionalCustomization: true,
//           },
//           { label: "Action", jsonPath: "individualId", additionalCustomization: true },
//         ],
//         enableGlobalSearch: false,
//         enableColumnSort: true,
//         resultsJsonPath: "advocates",
//       },
//       children: {},
//       show: true,
//     },
//   },
//   additionalSections: {},
// };

// export const configClerk = {
//   label: "ES_COMMON_INBOX",
//   type: "inbox",
//   apiDetails: {
//     serviceName: "/advocate/clerk/v1/_search",
//     requestParam: {},
//     requestBody: {
//       applicationNumber: "",
//
//       status: ["INWORKFLOW"],
//     },
//     minParametersForSearchForm: 1,
//     masterName: "commonUiConfig",
//     moduleName: "registrationRequestsConfig",
//     searchFormJsonPath: "requestBody",
//   },
//   sections: {
//     search: {
//       uiConfig: {
//         headerStyle: null,
//         type: "registration-requests-table-search",
//         primaryLabel: "ES_COMMON_SEARCH",
//         secondaryLabel: "ES_COMMON_CLEAR_SEARCH",
//         minReqFields: 1,
//         defaultValues: {
//           applicationNumber: "",
//         },
//         fields: [
//           {
//             label: "Application No",
//             type: "text",
//             isMandatory: false,
//             disable: false,
//             populators: {
//               name: "applicationNumber",
//               error: "BR_PATTERN_ERR_MSG",
//               validation: {
//                 pattern: {},
//                 minlength: 2,
//               },
//             },
//           },
//         ],
//       },
//       label: "",
//       children: {},
//       show: true,
//     },
//     searchResult: {
//       label: "",
//       uiConfig: {
//         columns: [
//           {
//             label: "Application No",
//             jsonPath: "applicationNumber",
//             additionalCustomization: true,
//           },
//           {
//             label: "User Name",
//             jsonPath: "additionalDetails",
//             additionalCustomization: true,
//           },
//           {
//             label: "User Type",
//             jsonPath: "usertype",
//             additionalCustomization: true,
//           },
//           {
//             label: "Date Created",
//             jsonPath: "auditDetails.createdTime",
//             additionalCustomization: true,
//           },
//           {
//             label: "Due Since (no of days)",
//             jsonPath: "dueSince",
//             additionalCustomization: true,
//           },
//           { label: "Action", jsonPath: "individualId", additionalCustomization: true },
//         ],
//         enableGlobalSearch: false,
//         enableColumnSort: true,
//         resultsJsonPath: "clerks",
//       },
//       children: {},
//       show: true,
//     },
//   },
//   additionalSections: {},
// };

export const dropdownConfig = {
  label: "CS_ID_TYPE",
  type: "dropdown",
  name: "selectIdTypeType",
  optionsKey: "name",
  validation: {},
  isMandatory: true,
  mdmsConfig: {
    masterName: "RequestFilter",
    moduleName: "User Registration",
    select: "(data) => {return data['User Registration'].RequestFilter?.map((item) => {return item;});}",
  },
  styles: {
    width: "200px",
  },
};
