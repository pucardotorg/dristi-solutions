// const defaultSearchValues = {
//   filingNumber: "",
//   cnrNumber: "",
//   applicationNumber:""
// };

export const summonsConfig = ({ filingNumber, orderNumber, orderId, orderType, taskCnrNumber, itemId, courtId }) => {
  return {
    label: `1(${orderType === "NOTICE" ? "Notice" : "Summon"}s)`,
    type: "search",
    apiDetails: {
      serviceName: "/task/v1/search",
      requestParam: {
        tenantId: Digit.ULBService.getCurrentTenantId(),
        limit: 2,
        offset: 0,
      },
      requestBody: {
        apiOperation: "SEARCH",
        criteria: {
          tenantId: Digit.ULBService.getCurrentTenantId(),
          // cnrNumber: taskCnrNumber,
          orderId: orderId,
        },
      },
      masterName: "commonUiConfig",
      moduleName: "summonWarrantConfig",
      minParametersForSearchForm: 0,
      tableFormJsonPath: "requestParam",
      filterFormJsonPath: "requestBody.criteria",
      searchFormJsonPath: "requestBody.criteria",
    },
    sections: {
      // search: {
      //   uiConfig: {
      //     fields: [],
      //   },
      //   show: true,
      // },
      searchResult: {
        tenantId: Digit.ULBService.getCurrentTenantId(),
        uiConfig: {
          columns: [
            {
              label: "Delivery Channels",
              jsonPath: "deliveryChannel",
            },

            {
              label: "Channel Details",
              jsonPath: "channelDetails",
            },
            {
              label: "Status",
              jsonPath: "status",
              additionalCustomization: true,
            },
            {
              label: "DELIEVRY_DATE",
              jsonPath: "statusChangeDate",
              additionalCustomization: true,
            },
            {
              label: "Remarks",
              jsonPath: "remarks",
            },
            {
              label: "PROCESS_FEE_PAID_ON",
              jsonPath: "feePaidDate",
              additionalCustomization: true
            },
          ],

          enableColumnSort: true,
          resultsJsonPath: "list",
        },
        show: true,
      },
    },
    additionalDetails: { filingNumber, orderNumber, orderId, taskCnrNumber, itemId },
  };
};
