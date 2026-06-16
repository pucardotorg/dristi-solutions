import { removeInvalidNameParts } from "./partyUtils";

// Helper function to configure tab-specific settings based on tab label
export const getTabConfig = ({
  tabConfig,
  filingNumber,
  caseCourtId,
  isEmployee,
  caseDetails,
  tenantId,
  caseRelatedData,
  orderTypeOptions,
  orderSetFunc,
  orderDeleteFunc,
  hearingTypeOptions,
  takeActionFunc,
  showMakeSubmission,
  docSetFunc,
  handleFilingAction,
  applicationTypeOptions,
  handleApplicationDeleteFunc,
  cnrNumber,
}) => {
  switch (tabConfig.label) {
    case "Parties":
      return {
        ...tabConfig,
        apiDetails: {
          ...tabConfig.apiDetails,
          requestBody: {
            ...tabConfig.apiDetails.requestBody,
            criteria: [
              {
                filingNumber: filingNumber,
                ...(caseCourtId && { courtId: caseCourtId }),
              },
            ],
          },
        },
        sections: {
          ...tabConfig.sections,
          searchResult: {
            ...tabConfig.sections.searchResult,
            uiConfig: {
              ...tabConfig.sections.searchResult.uiConfig,
              columns: tabConfig.sections.searchResult.uiConfig.columns.filter((column) => !(column?.label === "ACTIONS" && isEmployee)),
            },
          },
        },
      };

    case "Orders":
      return {
        ...tabConfig,
        apiDetails: {
          ...tabConfig.apiDetails,
          requestBody: {
            ...tabConfig.apiDetails.requestBody,
            inbox: {
              ...tabConfig.apiDetails.requestBody.inbox,
              moduleSearchCriteria: {
                ...tabConfig.apiDetails.requestBody.inbox.moduleSearchCriteria,
                caseNumbers: [filingNumber, caseDetails?.cmpNumber, caseDetails?.courtCaseNumber, caseDetails?.lprNumber]?.filter(Boolean),
                ...(caseCourtId && { courtId: caseCourtId }),
              },
            },
          },
        },
        sections: {
          ...tabConfig.sections,
          search: {
            ...tabConfig.sections.search,
            uiConfig: {
              ...tabConfig.sections.search.uiConfig,
              fields: tabConfig.sections.search.uiConfig.fields.map((field) => {
                if (field.key === "parties") {
                  return {
                    ...field,
                    populators: {
                      name: "parties",
                      optionsKey: "name",
                      options: caseRelatedData.parties
                        .map((party) => ({
                          code: removeInvalidNameParts(party.name),
                          name: removeInvalidNameParts(party.name),
                        }))
                        .sort((a, b) => a.name.localeCompare(b.name)),
                    },
                  };
                }

                if (field.key === "type") {
                  return {
                    ...field,
                    populators: {
                      ...field.populators,
                      options: orderTypeOptions || [],
                    },
                  };
                }
                return field;
              }),
            },
          },
          searchResult: {
            ...tabConfig.sections.searchResult,
            uiConfig: {
              ...tabConfig.sections.searchResult.uiConfig,
              columns: tabConfig.sections.searchResult.uiConfig.columns.map((column) => {
                return column.label === "ORDER_TITLE"
                  ? {
                      ...column,
                      clickFunc: orderSetFunc,
                    }
                  : column.label === "CS_ACTIONS"
                  ? {
                      ...column,
                      clickFunc: orderDeleteFunc,
                    }
                  : column;
              }),
            },
          },
        },
      };

    case "Hearings":
      return {
        ...tabConfig,
        apiDetails: {
          ...tabConfig.apiDetails,
          requestBody: {
            ...tabConfig.apiDetails.requestBody,
            criteria: {
              filingNumber: filingNumber,
              tenantId: tenantId,
              ...(caseCourtId && { courtId: caseCourtId }),
            },
          },
        },
        sections: {
          ...tabConfig.sections,
          search: {
            ...tabConfig.sections.search,
            uiConfig: {
              ...tabConfig.sections.search.uiConfig,
              fields: [
                {
                  label: "PARTIES",
                  isMandatory: false,
                  key: "parties",
                  type: "dropdown",
                  populators: {
                    name: "parties",
                    optionsKey: "name",
                    options: caseRelatedData.parties.map((party) => ({
                      code: removeInvalidNameParts(party.name),
                      name: removeInvalidNameParts(party.name),
                    })),
                  },
                },
                ...tabConfig?.sections?.search?.uiConfig?.fields?.map((field) => {
                  if (field.key === "hearingType") {
                    return {
                      ...field,
                      populators: {
                        ...field.populators,
                        options: hearingTypeOptions || [],
                      },
                    };
                  }
                  return field;
                }),
              ],
            },
          },
          searchResult: {
            ...tabConfig.sections.searchResult,
            uiConfig: {
              ...tabConfig.sections.searchResult.uiConfig,
              columns: tabConfig.sections.searchResult.uiConfig.columns.map((column) =>
                column.label === "CS_ACTIONS" ? { ...column, clickFunc: takeActionFunc, showMakeSubmission: showMakeSubmission } : column
              ),
            },
          },
        },
      };

    case "History":
      return {
        ...tabConfig,
        apiDetails: {
          ...tabConfig.apiDetails,
          requestBody: {
            ...tabConfig.apiDetails.requestBody,
            filingNumber: filingNumber,
            tenantId: tenantId,
          },
        },
      };

    case "Documents":
      return {
        ...tabConfig,
        apiDetails: {
          ...tabConfig.apiDetails,
          requestBody: {
            ...tabConfig.apiDetails.requestBody,
            criteria: {
              caseId: caseDetails?.id,
              filingNumber: caseDetails?.filingNumber,
              tenantId: tenantId,
              ...(caseCourtId && { courtId: caseCourtId }),
            },
          },
        },
        sections: {
          ...tabConfig.sections,
          search: {
            ...tabConfig.sections.search,
            uiConfig: {
              ...tabConfig.sections.search.uiConfig,
              fields: [
                // {
                //   label: "OWNER",
                //   isMandatory: false,
                //   key: "owner",
                //   type: "dropdown",
                //   populators: {
                //     name: "owner",
                //     optionsKey: "name",
                //     options: Array.from(
                //       new Map(
                //         artifacts?.map((artifact) => [
                //           removeInvalidNameParts(artifact.owner), // Key for uniqueness
                //           {
                //             code: removeInvalidNameParts(artifact.owner),
                //             name: removeInvalidNameParts(artifact.owner),
                //             value: artifact.sourceID,
                //           },
                //         ])
                //       ).values()
                //     ),
                //   },
                // },
                ...tabConfig.sections.search.uiConfig.fields,
              ],
            },
          },
          searchResult: {
            ...tabConfig.sections.searchResult,
            uiConfig: {
              ...tabConfig.sections.searchResult.uiConfig,
              columns: tabConfig.sections.searchResult.uiConfig.columns.map((column) => {
                switch (column.label) {
                  case "FILE":
                  case "FILING_NAME":
                    return { ...column, clickFunc: docSetFunc };
                  case "CS_ACTIONS":
                    return { ...column, clickFunc: handleFilingAction };
                  default:
                    return column;
                }
              }),
            },
          },
        },
      };

    case "Submissions":
      return {
        ...tabConfig,
        apiDetails: {
          ...tabConfig.apiDetails,
          requestBody: {
            ...tabConfig.apiDetails.requestBody,
            criteria: {
              filingNumber: filingNumber,
              tenantId: tenantId,
            },
          },
        },
        sections: {
          ...tabConfig.sections,
          search: {
            ...tabConfig.sections.search,
            uiConfig: {
              ...tabConfig.sections.search.uiConfig,
              fields: [
                {
                  label: "OWNER",
                  isMandatory: false,
                  key: "owner",
                  type: "dropdown",
                  populators: {
                    name: "owner",
                    optionsKey: "name",
                    options: caseRelatedData.parties
                      .map((party) => ({
                        code: removeInvalidNameParts(party.name),
                        name: removeInvalidNameParts(party.name),
                        value: party.additionalDetails?.uuid,
                      }))
                      .sort((a, b) => a.name.localeCompare(b.name)),
                  },
                },
                ...tabConfig?.sections?.search?.uiConfig?.fields?.map((field) => {
                  if (field.key === "applicationType") {
                    return {
                      ...field,
                      populators: {
                        ...field.populators,
                        options: applicationTypeOptions || [],
                      },
                    };
                  }

                  return field;
                }),
              ],
            },
          },
          searchResult: {
            ...tabConfig.sections.searchResult,
            uiConfig: {
              ...tabConfig.sections.searchResult.uiConfig,
              columns: tabConfig.sections.searchResult.uiConfig.columns.map((column) => {
                switch (column.label) {
                  case "DOCUMENT_TEXT":
                  case "SUBMISSION_TYPE":
                    return {
                      ...column,
                      clickFunc: docSetFunc,
                    };
                  case "CS_ACTIONS":
                    return {
                      ...column,
                      clickFunc: handleApplicationDeleteFunc,
                    };
                  case "OWNER":
                    return {
                      ...column,
                      parties: caseRelatedData.parties,
                    };

                  default:
                    return column;
                }
              }),
            },
          },
        },
      };

    default:
      return {
        ...tabConfig,
        apiDetails: {
          ...tabConfig.apiDetails,
          requestParam: {
            ...tabConfig.apiDetails?.requestParam,
            filingNumber: filingNumber,
            cnrNumber,
            applicationNumber: "",
          },
        },
      };
  }
};
