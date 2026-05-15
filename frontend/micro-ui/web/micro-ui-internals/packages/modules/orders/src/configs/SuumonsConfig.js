import {
  buildSummonsTaskTab,
  buildSummonsStandardSearchFields,
  buildSummonsPendingSignSearchFields,
  buildSummonsSignedSearchFields,
  buildSummonsCompletedSearchFields,
  defaultSearchValuesForPendingRpad,
  defaultSearchValuesForCompleted,
  summonsDefaultSearchValues,
  buildSummonsProcessTypeField,
  summonsRpadOnlyChannelField,
  summonsCaseSearchField,
  summonsIssueDateSortField,
  summonsRpadPendingColumns,
  summonsCheckboxIssueColumns,
  summonsSentColumns,
  summonsCompletedColumns,
} from "./shared/summonsSearchConfigShared";

export {
  defaultSearchValuesForPendingRpad,
  defaultSearchValuesForJudgePending,
  defaultSearchValuesForJudgeSent,
} from "./shared/summonsSearchConfigShared";

export const SummonsTabsConfig = {
  tenantId: "pg",
  moduleName: "reviewSummonWarrantNotice",
  showTab: true,
  SummonsTabsConfig: [
    buildSummonsTaskTab({
      label: "PENDING_RPAD_COLLECTION",
      criteria: {
        applicationStatus: "SIGN_PENDING",
        completeStatus: ["ISSUE_SUMMON", "ISSUE_NOTICE", "ISSUE_WARRANT", "ISSUE_PROCLAMATION", "ISSUE_ATTACHMENT"],
        isPendingCollection: true,
      },
      defaultValues: defaultSearchValuesForPendingRpad,
      searchFields: [
        summonsIssueDateSortField,
        buildSummonsProcessTypeField(true),
        summonsRpadOnlyChannelField,
        summonsCaseSearchField,
      ],
      columns: summonsRpadPendingColumns,
    }),
    buildSummonsTaskTab({
      label: "PENDING_SIGN",
      criteria: {
        applicationStatus: "SIGN_PENDING",
        completeStatus: [
          "ISSUE_SUMMON",
          "ISSUE_NOTICE",
          "ISSUE_WARRANT",
          "ISSUE_PROCLAMATION",
          "ISSUE_ATTACHMENT",
          "ISSUE_PROCESS",
        ],
        isPendingCollection: false,
      },
      defaultValues: summonsDefaultSearchValues,
      searchFields: buildSummonsPendingSignSearchFields(),
      columns: summonsCheckboxIssueColumns,
    }),
    buildSummonsTaskTab({
      label: "SIGNED",
      criteria: {
        applicationStatus: "SIGNED",
        completeStatus: [
          "ISSUE_SUMMON",
          "ISSUE_NOTICE",
          "ISSUE_WARRANT",
          "ISSUE_PROCLAMATION",
          "ISSUE_ATTACHMENT",
          "ISSUE_PROCESS",
        ],
        isPendingCollection: false,
      },
      defaultValues: summonsDefaultSearchValues,
      searchFields: buildSummonsSignedSearchFields(),
      columns: summonsCheckboxIssueColumns,
    }),
    buildSummonsTaskTab({
      label: "SENT",
      criteria: {
        completeStatus: [
          "ATTACHMENT_SENT",
          "PROCLAMATION_SENT",
          "SUMMON_SENT",
          "WARRANT_SENT",
          "NOTICE_SENT",
          "PROCESS_SENT",
        ],
        isPendingCollection: false,
      },
      defaultValues: summonsDefaultSearchValues,
      searchFields: buildSummonsStandardSearchFields(false),
      columns: summonsSentColumns,
      useSentStyleApi: true,
    }),
    buildSummonsTaskTab({
      label: "COMPLETED",
      criteria: {
        completeStatus: ["EXECUTED", "NOT_EXECUTED", "DELIVERED", "UNDELIVERED"],
        isPendingCollection: false,
      },
      defaultValues: defaultSearchValuesForCompleted,
      searchFields: buildSummonsCompletedSearchFields(),
      columns: summonsCompletedColumns,
      useSentStyleApi: true,
      additionalDetails: {
        sortBy: "sortCaseListByDate",
        activeTab: "DISPOSED",
      },
    }),
  ],
};
