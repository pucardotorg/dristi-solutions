const defaultSearchValues = {
  stage: "",
  type: {
    type: "NIA S138",
  },
  caseNameOrId: "",
  caseId: "",
  sortCaseListByStartDate: "",
};

export const preHearingConfig = {
  label: "ES_COMMON_HEARING",
  type: "search",
  customHookName: "hearings.usePreHearingModalData",
  apiDetails: {
    serviceName: "/inbox/v2/index/_search",
    requestParam: {
      tenantId: Digit.ULBService.getCurrentTenantId(),
    },
    requestBody: {},
    minParametersForSearchForm: 0,
    masterName: "commonUiConfig",
    moduleName: "PreHearingsConfig",
    searchFormJsonPath: "requestBody.criteria",
    filterFormJsonPath: "requestBody.criteria",
    tableFormJsonPath: "requestBody.criteria",
  },
  sections: {
    search: {
      uiConfig: {
        formClassName: "inbox-filter",
        primaryLabel: "ES_COMMON_SEARCH",
        secondaryLabel: "ES_COMMON_CLEAR_SEARCH",
        minReqFields: 0,
        defaultValues: defaultSearchValues,
        searchWrapperStyles: {
          marginLeft: "auto",
        },
        fields: [
          {
            type: "component",
            component: "CustomSortComponent",
            isMandatory: false,
            disable: false,
            name: "Newest",
            key: "sortCaseListByStartDate",
            sortBy: "startTime",
            ascText: "First",
            descText: "Last",
            showAdditionalText: true,
            showIcon: true,
            icon: "UpDownArrowIcon",
            populators: {},
          },
          // {
          //   label: "Type",
          //   isMandatory: false,
          //   key: "type",
          //   type: "dropdown",
          //   populators: {
          //     styles: { width: "150px" },
          //     name: "type",
          //     error: "Required",
          //     optionsKey: "type",
          //     options: [
          //       {
          //         type: "NIA S138",
          //       },
          //       {
          //         type: "CIA S138",
          //       },
          //     ],
          //   },
          // },
          {
            label: "Stage",
            isMandatory: false,
            key: "stage",
            type: "dropdown",
            populators: {
              styles: { width: "150px" },
              name: "stage",
              error: "Required",
              optionsKey: "code",
              mdmsConfig: {
                masterName: "SubStage",
                moduleName: "case",
                select: "(data) => {return data['case'].SubStage?.map((item) => {return item});}",
              },
            },
          },
          {
            label: "SEARCH_CASE_NAME",
            isMandatory: false,
            key: "caseNameOrId",
            type: "text",
            populators: {
              name: "caseNameOrId",
            },
          },
          {
            label: "SEARCH_CASE_ID",
            isMandatory: false,
            key: "caseId",
            type: "text",
            populators: {
              name: "caseId",
            },
          },
        ],
      },
      show: true,
    },
    searchResult: {
      tenantId: Digit.ULBService.getCurrentTenantId(),
      uiConfig: {
        columns: [
          {
            label: "CASE_TITLE",
            jsonPath: "caseName",
          },
          {
            label: "CS_STAGE",
            jsonPath: "subStage",
            additionalCustomization: true,
          },
          {
            label: "CASE_TYPE",
            jsonPath: "caseType",
          },
          {
            label: "CASE_NUMBER",
            jsonPath: "caseNumber",
          },
          {
            label: "PENDING_TASK",
            jsonPath: "pendingTasks",
          },
          {
            label: "Actions",
            jsonPath: "",
            additionalCustomization: true,
          },
        ],
        enableColumnSort: true,
        resultsJsonPath: "items",
      },
      show: true,
    },
  },
};
