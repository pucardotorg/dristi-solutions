const defaultSearchValues = {
  caseSearchText: "",
  date: new Date().toISOString().split("T")[0],
  stage: null,
};

export const convertEpochToDate = (dateEpoch) => {
  // Returning null in else case because new Date(null) returns initial date from calender
  if (dateEpoch) {
    const dateFromApi = new Date(dateEpoch);
    let month = dateFromApi.getMonth() + 1;
    let day = dateFromApi.getDate();
    let year = dateFromApi.getFullYear();
    month = (month > 9 ? "" : "0") + month;
    day = (day > 9 ? "" : "0") + day;
    return `${year}-${month}-${day}`;
  } else {
    return null;
  }
};

export const pendingTaskConfig = {
  label: "PENDING_TASKS_TAB",
  type: "search",
  apiDetails: {
    serviceName: "/inbox/v2/_getFields/actionCategory",
    requestParam: {
      // tenantId: Digit.ULBService.getCurrentTenantId(),
    },
    requestBody: {
      SearchCriteria: {
        moduleName: "Pending Tasks Service",
        tenantId: Digit.ULBService.getCurrentTenantId(),

        moduleSearchCriteria: {
          screenType: ["home", "applicationCompositeOrder"],
          isCompleted: false,
          assignedRole: [
            "DIARY_APPROVER",
            "HEARING_VIEWER",
            "WORKFLOW_ABANDON",
            "ORDER_ESIGN",
            "WORKFLOW_ADMIN",
            "APPLICATION_CREATOR",
            "DEPOSITION_PUBLISHER",
            "HEARING_APPROVER",
            "SUBMISSION_RESPONDER",
            "ORDER_VIEWER",
            "ORDER_REASSIGN",
            "CASE_EDITOR",
            "TASK_CREATOR",
            "APPLICATION_APPROVER",
            "DIARY_VIEWER",
            "EMPLOYEE",
            "ORDER_DELETE",
            "NOTIFICATION_APPROVER",
            "CASE_VIEWER",
            "TASK_EDITOR",
            "APPLICATION_REJECTOR",
            "HEARING_EDITOR",
            "DIARY_EDITOR",
            "ORDER_APPROVER",
            "NOTIFICATION_CREATOR",
            "HEARING_CREATOR",
            "EVIDENCE_CREATOR",
            "ORDER_CREATOR",
            "CALCULATION_VIEWER",
            "JUDGE_ROLE",
            "EVIDENCE_EDITOR",
            "CASE_APPROVER",
            "SUBMISSION_APPROVER",
            "TASK_VIEWER",
            "HEARING_SCHEDULER",
          ],
        },
        limit: 10,
        offset: 0,
      },
    },
    masterName: "commonUiConfig",
    moduleName: "HomePendingConfig",
    minParametersForSearchForm: 0,
    tableFormJsonPath: "requestParam",
    filterFormJsonPath: "requestBody",
    searchFormJsonPath: "requestBody",
  },
  sections: {
    search: {
      uiConfig: {
        formClassName: "custom-both-clear-search",
        primaryLabel: "ES_COMMON_SEARCH",
        secondaryLabel: "ES_COMMON_CLEAR_SEARCH",
        minReqFields: 0,
        defaultValues: defaultSearchValues,
        fields: [
          {
            label: "DATE",
            isMandatory: false,
            key: "date",
            type: "date",
            disable: false,
            populators: {
              name: "date",
              min: convertEpochToDate(new Date().toJSON().slice(0, 10).replace(/-/g, "/")),
            },
          },
          {
            label: "STAGE",
            isMandatory: false,
            key: "stage",
            type: "dropdown",
            populators: {
              name: "stage",
              optionsKey: "code",
              mdmsConfig: {
                masterName: "SubStage",
                moduleName: "case",
                select: "(data) => {return data['case'].SubStage?.map((item) => {return item});}",
              },
              // mdmsConfig: {
              //   masterName: "pendingTaskFilterText",
              //   moduleName: "case",
              //   // select: "(data) => {return data['case'].SubStage?.map((item) => {return item});}",
              //   select: "(data) => { return data?.case?.pendingTaskFilterText || [] }",
              // },
            },
          },
          {
            label: "CS_CASE_NAME_ADVOCATE",
            type: "text",
            key: "caseSearchText",
            isMandatory: false,
            disable: false,
            populators: {
              name: "caseSearchText",
              error: "BR_PATTERN_ERR_MSG",
              validation: {
                pattern: {},
                minlength: 2,
              },
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
            label: "PENDING_CASE_NAME",
            jsonPath: "caseTitle",
            additionalCustomization: true,
          },
          {
            label: "CASE_ID",
            jsonPath: "caseNumber",
            additionalCustomization: true,
          },
          {
            label: "STAGE",
            jsonPath: "substage",
            additionalCustomization: true,
          },
          {
            label: "ADVOCATES",
            labelChildren: "OutlinedInfoIcon",
            tooltipValue: "ONLY_CURRENT_AND_FUTURE_DATES_ARE_ALLOWED",
            jsonPath: "advocateDetails",
            additionalCustomization: true,
          },
        ],
        enableColumnSort: true,
        resultsJsonPath: "data",
      },
      show: true,
    },
  },
};
