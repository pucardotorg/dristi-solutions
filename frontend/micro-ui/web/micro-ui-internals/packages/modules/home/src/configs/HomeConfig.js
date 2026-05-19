import { TabLitigantSearchConfig } from "./LitigantHomeConfig";
import { userTypeOptions } from "./shared/employeeHomeSearchDefaults";
import {
  buildEmployeeCaseListTab,
  buildEmployeeSortField,
  CaseReviewerAdditionalTab,
  employeeAllTabStages,
  employeeOngoingTabStages,
  employeeRegisteredTabStages,
  employeeCaseTypeField,
  employeeCaseSearchTextField,
  employeeOutcomeField,
  employeeStageFieldExcludeRegisteredStages,
  employeeSecondaryStageField,
  employeeStandardCaseResultColumns,
  employeeClosedCaseResultColumns,
  employeeLprCaseResultColumns,
  employeeStandardStageSearchFields,
} from "./shared/employeeCaseSearchTabConfig";
import {
  buildAdmissionPendingAction,
  buildCaseSentBackPendingAction,
  buildGenerateOrderPendingAction,
  buildMakePaymentPendingAction,
  buildPaymentPendingModalAction,
  buildScheduleHearingPendingAction,
  scheduleHearingOptOutRedirect,
  buildSignComplaintPendingAction,
  buildSubmissionsCreateApplicationAction,
  buildSubmissionsCreateOrderAction,
  buildUnderScrutinyPendingAction,
  buildViewCasePendingAction,
  buildVoluntarySubmissionCreateAction,
  litigantAdvocate,
} from "./shared/pendingTaskActionsShared";

export const CaseWorkflowState = {
  CASE_REASSIGNED: "CASE_REASSIGNED",
  DRAFT_IN_PROGRESS: "DRAFT_IN_PROGRESS",
  UNDER_SCRUTINY: "UNDER_SCRUTINY",
  CASE_ADMITTED: "CASE_ADMITTED",
  PENDING_ADMISSION: "PENDING_ADMISSION",
};

export { userTypeOptions };

export { CaseReviewerAdditionalTab };

export const TabUnifiedEmployeeSearchConfig = {
  tenantId: Digit.ULBService.getCurrentTenantId(),
  moduleName: "homeJudgeUIConfig",
  showTab: true,
  TabSearchConfig: [
    buildEmployeeCaseListTab({
      label: "CS_ALL",
      criteria: { lifecycleStatus: "ACTIVE", stage: employeeAllTabStages },
      searchFields: employeeStandardStageSearchFields,
      columns: employeeStandardCaseResultColumns,
    }),
    buildEmployeeCaseListTab({
      label: "CD_ONGOING",
      criteria: { lifecycleStatus: "ACTIVE", stage: employeeOngoingTabStages },
      searchFields: employeeStandardStageSearchFields,
      columns: employeeStandardCaseResultColumns,
    }),
    buildEmployeeCaseListTab({
      label: "CS_REGISTERED",
      criteria: { lifecycleStatus: "ACTIVE", stage: employeeRegisteredTabStages },
      searchFields: [
        buildEmployeeSortField({ name: "Filed", ascText: "First", descText: "Last" }),
        employeeCaseTypeField,
        employeeStageFieldExcludeRegisteredStages,
        employeeSecondaryStageField,
        employeeCaseSearchTextField,
      ],
      columns: employeeStandardCaseResultColumns,
      sortAdditionalDetailsInSections: true,
    }),
    buildEmployeeCaseListTab({
      label: "CD_CLOSED",
      criteria: { lifecycleStatus: "ACTIVE", outcome: [] },
      searchFields: [
        buildEmployeeSortField({ name: "Closed:", ascText: "New First", descText: "Old First" }),
        employeeCaseTypeField,
        employeeOutcomeField,
        employeeCaseSearchTextField,
      ],
      columns: employeeClosedCaseResultColumns,
      sortAdditionalDetailsOnTab: true,
    }),
    buildEmployeeCaseListTab({
      label: "CS_LPR",
      criteria: { lifecycleStatus: "LPR" },
      searchFields: [
        buildEmployeeSortField({ name: "Closed:", ascText: "New First", descText: "Old First" }),
        employeeCaseTypeField,
        employeeCaseSearchTextField,
      ],
      columns: employeeLprCaseResultColumns,
      sortAdditionalDetailsOnTab: true,
    }),
  ],
};


export const getUnifiedEmployeeConfig = (roles) => {
  const baseConfig = { ...TabUnifiedEmployeeSearchConfig };
  const hasCaseReviewerRole = roles?.some((role) => role.code === "CASE_REVIEWER");

  const allTabs = baseConfig.TabSearchConfig.map((tab) => {
    const tabCopy = JSON.parse(JSON.stringify(tab));

    if (!hasCaseReviewerRole && tabCopy.apiDetails?.requestBody?.criteria?.stage) {
      tabCopy.apiDetails.requestBody.criteria.stage = tabCopy.apiDetails.requestBody.criteria.stage.filter(
        (stage) => stage !== "Defect Correction" && stage !== "Scrutiny"
      );
    }

    return tabCopy;
  });

  baseConfig.TabSearchConfig = allTabs;
  return baseConfig;
};

export const getOnRowClickConfig = (roles) => {
  const hasCaseReviewerRole = roles?.some((role) => role.code === "CASE_REVIEWER");

  if (hasCaseReviewerRole) {
    return {
      dependentUrl: "/dristi/case",
      urlDependentOn: "status",
      urlDependentValue: "UNDER_SCRUTINY",
      params: [{ key: "caseId", value: "id" }],
    };
  } else {
    return {
      dependentUrl: "/dristi/admission",
      urlDependentOn: "status",
      urlDependentValue: "",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "caseId", value: "id" },
      ],
    };
  }
};

export const rolesToConfigMapping = [
  // {
  //   roles: ["CASE_VIEWER", "JUDGE_ROLE"], // this mapping is redundant now, we are now using getUnifiedEmployeeConfig logic for employees config.
  //   config: TabJudgeSearchConfig,
  //   isJudge: true,
  //   onRowClickRoute: {
  //     dependentUrl: "/dristi/admission",
  //     urlDependentOn: "status",
  //     urlDependentValue: "",
  //     params: [
  //       { key: "filingNumber", value: "filingNumber" },
  //       { key: "caseId", value: "id" },
  //     ],
  //   },
  // },
  // {
  //   roles: ["CASE_VIEWER"],
  //   config: getUnifiedEmployeeConfig(["CASE_VIEWER"]),
  //   isJudge: true,
  //   onRowClickRoute: getOnRowClickConfig(["CASE_VIEWER"]),
  // },
  // {
  //   roles: ["TYPIST_ROLE"], // this mapping is redundant now, we are now using getUnifiedEmployeeConfig logic for employees config.
  //   config: TabJudgeSearchConfig,
  //   isTypist: true,
  //   onRowClickRoute: {
  //     dependentUrl: "/dristi/admission",
  //     urlDependentOn: "status",
  //     urlDependentValue: "",
  //     params: [
  //       { key: "filingNumber", value: "filingNumber" },
  //       { key: "caseId", value: "id" },
  //     ],
  //   },
  // },
  // {
  //   roles: ["CASE_VIEWER", "HEARING_CREATOR"], // this mapping is redundant now, we are now using getUnifiedEmployeeConfig logic for employees config.
  //   config: TabJudgeSearchConfig,
  //   isCourtOfficer: true,
  //   onRowClickRoute: {
  //     dependentUrl: "/dristi/admission",
  //     urlDependentOn: "status",
  //     urlDependentValue: "",
  //     params: [
  //       { key: "filingNumber", value: "filingNumber" },
  //       { key: "caseId", value: "id" },
  //     ],
  //   },
  // },
  // {
  //   roles: ["CASE_VIEWER", "CASE_REVIEWER"],
  //   config: getUnifiedEmployeeConfig(["CASE_VIEWER", "CASE_REVIEWER"]),
  //   isFSO: true,
  //   onRowClickRoute: getOnRowClickConfig(["CASE_VIEWER", "CASE_REVIEWER"]),
  // },
];

export const litigantConfig = {
  roles: ["CASE_VIEWER"],
  config: TabLitigantSearchConfig,
  isLitigant: true,
  showJoinFileOption: true,
  onRowClickRoute: {
    dependentUrl: "/dristi/home/file-case/case",
    urlDependentOn: "status",
    urlDependentValue: ["DRAFT_IN_PROGRESS", "CASE_REASSIGNED"],
    params: [{ key: "caseId", value: "id" }],
  },
};

export const caseTypes = [{ name: "NIA S138", code: "NIA S138" }];

export const taskTypes = [
  { code: "case-default", name: "WBH_MDMS_MASTER_CASE" },
  { code: "hearing-default", name: "CS_HEARING" },
  { code: "order-default", name: "CS_ORDER" },
  { code: "application-voluntary-submission", name: "VOLUNTARY_SUBMISSION" },
  { code: "application-order-submission-feedback", name: "ORDER_SUBMISSION_FEEDBACK" },
  { code: "application-order-submission-default", name: "ORDER_SUBMISSION" },
  { code: "artifact-default", name: "EVIDENCE" },
  { code: "task-summons", name: "TASK_SUMMONS" },
];
export const pendingTaskCaseActions = {
  PENDING_PAYMENT: buildMakePaymentPendingAction(),
  RE_PENDING_PAYMENT: buildMakePaymentPendingAction(),
  PENDING_RESPONSE: {
    actorName: litigantAdvocate,
    actionName: "Pending Response",
  },
  UNDER_SCRUTINY: buildUnderScrutinyPendingAction(),
  CASE_REASSIGNED: buildCaseSentBackPendingAction(),
  "PENDING_E-SIGN": buildSignComplaintPendingAction(),
  "PENDING_E-SIGN-2": buildSignComplaintPendingAction(),
  PENDING_SIGN: buildSignComplaintPendingAction(),
  "PENDING_RE_E-SIGN": buildSignComplaintPendingAction(),
  "PENDING_RE_E-SIGN-2": buildSignComplaintPendingAction(),
  PENDING_RE_SIGN: buildSignComplaintPendingAction(),
  PENDING_ADMISSION: buildViewCasePendingAction("Case Approved from Scrutiny"),
  CASE_ADMITTED: buildViewCasePendingAction("Schedule admission hearing"),
  SCHEDULE_HEARING: buildScheduleHearingPendingAction("Schedule admission hearing"),
  PENDING_REGISTRATION: buildAdmissionPendingAction("Register the Case"),
  PENDING_ADMISSION_HEARING: buildAdmissionPendingAction("Register the Case"),
};

export const pendingTaskHearingActions = {
  SCHEDULE_HEARING: buildScheduleHearingPendingAction("Schedule admission hearing"),
  OPTOUT: buildScheduleHearingPendingAction("Schedule admission hearing", litigantAdvocate, scheduleHearingOptOutRedirect),
  ABANDONED: buildGenerateOrderPendingAction({
    actionName: "Schedule admission hearing",
    customFunction: "handleCreateOrder",
  }),
};

export const pendingTaskOrderActions = {
  CREATE_ORDER: buildGenerateOrderPendingAction({ actionName: "Schedule hearing" }),
  SAVE_DRAFT: {
    actorName: ["JUDGE"],
    actionName: "Schedule admission hearing",
    customFunction: "handleCreateOrder",
    additionalDetailsKeys: ["orderType"],
    redirectDetails: {
      url: "/orders/generate-order",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "applicationNumber", value: "referenceId" },
      ],
    },
  },
  DRAFT_IN_PROGRESS: {
    actorName: ["JUDGE"],
    actionName: "Draft in Progress for Order",
    redirectDetails: {
      url: "/orders/generate-order",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "orderNumber", value: "referenceId" },
      ],
    },
  },

  SUMMON_WARRANT_STATUS: {
    actorName: ["JUDGE"],
    actionName: "Show Summon-Warrant Status",
    redirectDetails: {
      url: "/home/home-pending-task/summons-warrants-modal",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "hearingId", value: "referenceId" },
        { key: "taskOrderType", defaultValue: "SUMMONS" },
      ],
    },
  },
  NOTICE_STATUS: {
    actorName: ["JUDGE"],
    actionName: "Show Notice Status",
    additionalDetailsKeys: ["partyIndex"],
    redirectDetails: {
      url: "/home/home-pending-task/summons-warrants-modal",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "hearingId", value: "referenceId" },
        { key: "taskOrderType", defaultValue: "NOTICE" },
      ],
    },
  },
  PAYMENT_PENDING_POST: buildPaymentPendingModalAction("/home/home-pending-task/post-payment-modal"),
  PAYMENT_PENDING_RPAD: buildPaymentPendingModalAction("/home/home-pending-task/rpad-payment-modal"),
  PAYMENT_PENDING_SMS: buildPaymentPendingModalAction("/home/home-pending-task/sms-payment-modal"),
  PAYMENT_PENDING_EMAIL: buildPaymentPendingModalAction("/home/home-pending-task/email-payment-modal"),
  RESCHEDULE_HEARING: {
    actorName: ["JUDGE"],
    actionName: "Schedule admission hearing",
    redirectDetails: {
      url: "/home/home-pending-task/home-set-next-hearing",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "hearingId", value: "referenceId" },
      ],
    },
  },
  PAYMENT_PENDING_POLICE: buildPaymentPendingModalAction("/home/home-pending-task/icops-payment-modal", "Show Warrant Payment Status"),
  "RE-ISSUE_SUMMON": {
    actorName: ["JUDGE"],
    redirectDetails: {
      url: "/home/home-pending-task/reissue-summons-modal",
      params: [
        { key: "caseId", value: "id" },
        { key: "caseTitle", value: "caseTitle" },
        { key: "filingNumber", value: "filingNumber" },
        { key: "cnrNumber", value: "cnrNumber" },
        { key: "hearingId", value: "referenceId" },
        { key: "orderType", defaultValue: "SUMMONS" },
      ],
    },
  },
  "RE-ISSUE_NOTICE": {
    actorName: ["JUDGE"],
    redirectDetails: {
      url: "/home/home-pending-task/reissue-summons-modal",
      params: [
        { key: "caseId", value: "id" },
        { key: "caseTitle", value: "caseTitle" },
        { key: "filingNumber", value: "filingNumber" },
        { key: "cnrNumber", value: "cnrNumber" },
        { key: "hearingId", value: "referenceId" },
        { key: "orderType", defaultValue: "NOTICE" },
      ],
    },
  },
};

export const pendingTaskOrderOfJudgementActions = {};

export const pendingTaskVoluntarySubmissionActions = {
  CREATE_DCA_SUBMISSION: buildVoluntarySubmissionCreateAction({
    actionName: "Create DCA Application",
    applicationTypeDefault: "DELAY_CONDONATION",
  }),
  MAKE_PAYMENT_SUBMISSION: buildSubmissionsCreateApplicationAction({ actionName: "Payment for Submission" }),
  ESIGN_THE_SUBMISSION: buildSubmissionsCreateApplicationAction({ actionName: "Esign the Submission" }),
  PENDINGESIGN: buildSubmissionsCreateApplicationAction({ actionName: "Esign the Submission" }),
  PENDINGREVIEW: buildSubmissionsCreateApplicationAction({
    actorName: ["JUDGE"],
    actionName: "Review the submission",
    customFunction: "handleReviewSubmission",
  }),
  PENDINGAPPROVAL: buildSubmissionsCreateApplicationAction({
    actorName: ["JUDGE"],
    actionName: "Review the submission",
    customFunction: "handleReviewSubmission",
  }),
};

export const pendingTaskSubmissionWithResponseActions = {
  CREATE_SUBMISSION: buildSubmissionsCreateOrderAction({
    actionName: "Mandatory Submission of Documents",
    customFunction: "handleReviewOrder",
  }),
  MAKE_PAYMENT_SUBMISSION: buildSubmissionsCreateApplicationAction({ actionName: "Payment for Submission" }),
  ESIGN_THE_SUBMISSION: buildSubmissionsCreateApplicationAction({ actionName: "Esign the Submission" }),
  PENDINGRESPONSE: buildSubmissionsCreateApplicationAction({
    actionName: "Review the submission",
    customFunction: "handleReviewSubmission",
  }),
};

export const pendingTaskSubmissionWithoutResponseActions = {
  CREATE_SUBMISSION: buildSubmissionsCreateOrderAction({
    actionName: "Mandatory Submission of Documents",
    customFunction: "handleReviewOrder",
  }),
  MAKE_PAYMENT_SUBMISSION: buildSubmissionsCreateApplicationAction({ actionName: "Payment for Submission" }),
  ESIGN_THE_SUBMISSION: buildSubmissionsCreateApplicationAction({ actionName: "Esign the Submission" }),
};

export const pendingTaskForArtifactActions = {};

export const pendingTaskForSummonsActions = {
  ISSUE_SUMMON: {
    actorName: ["CMO"],
    actionName: "Esign the Task Summon",
    redirectDetails: {
      url: "/orders/Summons&Notice",
      params: [{ key: "taskNumber", value: "referenceId" }],
    },
  },
};

export const pendingTaskForNoticeActions = {
  ISSUE_NOTICE: {
    actorName: ["CMO"],
    actionName: "Esign the Task Notice",
    redirectDetails: {
      url: "/orders/Summons&Notice",
      params: [{ key: "taskNumber", value: "referenceId" }],
    },
  },
};

export const pendingTaskForDocumentSubmissionActions = {
  PENDINGESIGN_SUBMIT_DOCUMENT: {
    actorName: ["LITIGANT/ADVOCATE"],
    actionName: "Esign the Document Submission",
    redirectDetails: {
      url: "/submissions/submit-document",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "artifactNumber", value: "referenceId" },
      ],
    },
  },
};

export const pendingTaskVoluntarySubmissionBailDocumentsActions = {
  CREATE_SUBMISSION: {
    actorName: ["LITIGANT/ADVOCATE"],
    actionName: "Application for Submit Bail Documents",
    customFunction: "handleReviewOrder",
    redirectDetails: {
      url: "/submissions/submissions-create",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "orderNumber", value: "referenceId" },
      ],
    },
  },
  PENDINGAPPROVAL: {
    actorName: ["JUDGE"],
    actionName: "Review the submission",
    customFunction: "handleReviewSubmission",
    redirectDetails: {
      url: "/submissions/submissions-create",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "applicationNumber", value: "referenceId" },
      ],
    },
  },
  ESIGN_THE_SUBMISSION: {
    actorName: ["LITIGANT/ADVOCATE"],
    actionName: "Esign the Submission",
    redirectDetails: {
      url: "/submissions/submissions-create",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "applicationNumber", value: "referenceId" },
      ],
    },
  },
};

export const pendingTaskVoluntarySubmissionBailActions = {
  PENDINGAPPROVAL: {
    actorName: ["JUDGE"],
    actionName: "Review the submission",
    customFunction: "handleReviewSubmission",
    redirectDetails: {
      url: "/submissions/submissions-create",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "applicationNumber", value: "referenceId" },
      ],
    },
  },
  MAKE_PAYMENT_SUBMISSION: {
    actorName: ["LITIGANT/ADVOCATE"],
    actionName: "Payment for Submission",
    redirectDetails: {
      url: "/submissions/submissions-create",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "applicationNumber", value: "referenceId" },
      ],
    },
  },
  ESIGN_THE_SUBMISSION: {
    actorName: ["LITIGANT/ADVOCATE"],
    actionName: "Esign the Submission",
    redirectDetails: {
      url: "/submissions/submissions-create",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "applicationNumber", value: "referenceId" },
      ],
    },
  },
};

export const pendingTaskCaseGeneratePaymentActions = {
  PENDING_PAYMENT: {
    actorName: ["LITIGANT/ADVOCATE"],
    actionName: "Make Payment",
    redirectDetails: {
      url: "/home/home-pending-task/case-payment-demand-breakdown",
      params: [{ key: "taskNumber", value: "referenceId" }],
    },
  },
};

export const pendingTaskForBailBondActions = {
  PENDING_SIGN: {
    actorName: ["JUDGE"],
    actionName: "E-Sign Pending",
    redirectDetails: {
      url: "/home/bail-bond",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "caseTitle", value: "caseTitle" },
        { key: "caseId", value: "id" },
      ],
    },
  },
  PENDING_REVIEW: {
    actorName: ["JUDGE"],
    actionName: "Review the bail bond",
    redirectDetails: {
      url: "/home/sign-bail-bond",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "bailId", value: "referenceId" },
        { key: "caseId", value: "id" },
      ],
    },
  },
  "PENDING_E-SIGN": {
    actorName: ["LITIGANT/ADVOCATE"],
    actionName: "E-Sign Pending",
    redirectDetails: {
      url: "/dristi/home/bail-bond-sign",
      params: [
        { key: "bailbondId", value: "referenceId" },
        { key: "filingNumber", value: "filingNumber" },
        { key: "caseId", value: "id" },
      ],
    },
  },
  PENDING_RAISE_BAIL_BOND: {
    actorName: ["LITIGANT/ADVOCATE"],
    actionName: "Raise Bail Bond",
    redirectDetails: {
      url: "/submissions/bail-bond",
      params: [{ key: "filingNumber", value: "filingNumber" }],
    },
  },
};

export const pendingTaskForWitnessDepositionActions = {
  "PENDING_E-SIGN": {
    actorName: [""],
    actionName: "E-Sign Pending",
    redirectDetails: {
      url: "/dristi/home/evidence-sign",
      params: [
        { key: "artifactNumber", value: "referenceId" },
        { key: "filingNumber", value: "filingNumber" },
      ],
    },
  },
  PENDING_REVIEW: {
    actorName: ["JUDGE"],
    actionName: "Review the witness deposition",
    redirectDetails: {
      url: "/home/sign-witness-deposition",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "artifactNumber", value: "referenceId" },
        { key: "caseId", value: "id" },
      ],
    },
  },
};

export const pendingTaskForDigitalizedDocumentExaminationActions = {
  "PENDING_E-SIGN": {
    actorName: [""],
    actionName: "E-Sign Pending",
    redirectDetails: {
      url: "/dristi/home/digitalized-document-sign",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "digitalizedDocumentId", value: "referenceId" },
        { key: "type", defaultValue: "EXAMINATION_OF_ACCUSED" },
      ],
    },
  },
  PENDING_REVIEW: {
    actorName: ["JUDGE"],
    actionName: "Review the examination",
    redirectDetails: {
      url: "/home/digitized-document-sign",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "documentNumber", value: "referenceId" },
        { key: "caseId", value: "id" },
      ],
    },
  },
};

export const pendingTaskForDigitalizedDocumentPleaActions = {
  "PENDING_E-SIGN": {
    actorName: [""],
    actionName: "E-Sign Pending",
    redirectDetails: {
      url: "/dristi/home/digitalized-document-sign",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "digitalizedDocumentId", value: "referenceId" },
        { key: "type", defaultValue: "PLEA" },
      ],
    },
  },

  PENDING_REVIEW: {
    actorName: ["JUDGE"],
    actionName: "Review the plea",
    redirectDetails: {
      url: "/home/digitized-document-sign",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "documentNumber", value: "referenceId" },
        { key: "caseId", value: "id" },
      ],
    },
  },
};

export const pendingTaskForDigitalizedDocumentMediationActions = {
  "PENDING_E-SIGN": {
    actorName: [""],
    actionName: "E-Sign Pending",
    redirectDetails: {
      url: "/home/mediation-form-sign",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "documentNumber", value: "referenceId" },
        { key: "courtId", value: "courtId" },
      ],
    },
  },
  PENDING_REVIEW: {
    actorName: ["JUDGE"],
    actionName: "Review of Mediation Form",
    redirectDetails: {
      url: "/home/mediation-form-sign",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "documentNumber", value: "referenceId" },
      ],
    },
  },
  PENDING_UPLOAD: {
    actorName: ["JUDGE"],
    actionName: "Review the witness deposition",
    redirectDetails: {
      url: "/home/mediation-form-sign",
      params: [
        { key: "filingNumber", value: "filingNumber" },
        { key: "documentNumber", value: "referenceId" },
        { key: "courtId", value: "courtId" },
      ],
    },
  },
};

export const selectTaskType = {
  "case-default": pendingTaskCaseActions,
  "hearing-default": pendingTaskHearingActions,
  "order-default": pendingTaskOrderActions,
  "application-voluntary-submission": pendingTaskVoluntarySubmissionActions,
  "delay-condonation-submission": pendingTaskVoluntarySubmissionActions,
  "application-order-submission-feedback": pendingTaskSubmissionWithResponseActions,
  "application-order-submission-default": pendingTaskSubmissionWithoutResponseActions,
  "artifact-default": pendingTaskForArtifactActions,
  "task-summons": pendingTaskForSummonsActions,
  "task-notice": pendingTaskForNoticeActions,
  "voluntary-document-submission": pendingTaskForDocumentSubmissionActions,
  "voluntary-application-submission-bail-documents": pendingTaskVoluntarySubmissionBailDocumentsActions,
  "voluntary-application-submission-bail": pendingTaskVoluntarySubmissionBailActions,
  "task-generic": pendingTaskCaseGeneratePaymentActions,
  "bail bond": pendingTaskForBailBondActions,
  "bail-bond-default": pendingTaskForBailBondActions,
  "witness-deposition-default": pendingTaskForWitnessDepositionActions,
  "digitalized-document-mediation": pendingTaskForDigitalizedDocumentMediationActions,
  "digitalized-document-examination": pendingTaskForDigitalizedDocumentExaminationActions,
  "digitalized-document-plea": pendingTaskForDigitalizedDocumentPleaActions,
};
