// const defaultSearchValues = {
//   filingNumber: "",
//   cnrNumber: "",
//   applicationNumber:""
// };

import { ORDER_TYPES, PARTY_TYPES } from "../utils/constants";

const _getPartyType = (orderType, partyType) => {
  if (orderType === ORDER_TYPES.MISCELLANEOUS_PROCESS) {
    if (partyType === PARTY_TYPES.OTHER || partyType === PARTY_TYPES.OTHERS) {
      return "others";
    }

    return partyType === PARTY_TYPES.ACCUSED || partyType === PARTY_TYPES.RESPONDENT ? "respondent" : partyType?.toLowerCase();
  }

  if (![ORDER_TYPES.NOTICE, ORDER_TYPES.SUMMONS]?.includes(orderType)) {
    return "respondent";
  }

  return partyType === PARTY_TYPES.ACCUSED || partyType === PARTY_TYPES.RESPONDENT ? "respondent" : partyType?.toLowerCase();
};

export const summonsConfig = ({ filingNumber, orderNumber, orderId, orderType, taskCnrNumber, itemId, partyUniqueId, partyType }) => {
  return {
    label: `1(${orderType === ORDER_TYPES.NOTICE ? "Notice" : "Summon"}s)`,
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
          partyType: _getPartyType(orderType, partyType),
          ...(![PARTY_TYPES.POLICE, PARTY_TYPES.OTHER, PARTY_TYPES.OTHERS]?.includes((partyType || "")?.toLowerCase()) && { partyUniqueId: partyUniqueId }),
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
              additionalCustomization: true,
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
              additionalCustomization: true,
            },
          ],

          enableColumnSort: true,
          resultsJsonPath: "list",
        },
        show: true,
      },
    },
    additionalDetails: { filingNumber, orderNumber, orderId, taskCnrNumber, itemId, orderType },
  };
};
