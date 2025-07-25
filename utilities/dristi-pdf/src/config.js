// config.js
// const env = process.env.NODE_ENV; // 'dev' or 'test'

const HOST = process.env.EGOV_HOST || "localhost";

if (!HOST) {
  console.log("You need to set the HOST variable");
  process.exit(1);
}

module.exports = {
  auth_token: process.env.AUTH_TOKEN,

  KAFKA_BROKER_HOST: process.env.KAFKA_BROKER_HOST || "localhost:9092",
  KAFKA_RECEIVE_CREATE_JOB_TOPIC:
    process.env.KAFKA_RECEIVE_CREATE_JOB_TOPIC || "PDF_GEN_RECEIVE",
  KAFKA_BULK_PDF_TOPIC: process.env.KAFKA_BULK_PDF_TOPIC || "BULK_PDF_GEN",
  KAFKA_PAYMENT_EXCEL_GEN_TOPIC:
    process.env.KAFKA_PAYMENT_EXCEL_GEN_TOPIC || "PAYMENT_EXCEL_GEN",
  KAFKA_EXPENSE_PAYMENT_CREATE_TOPIC:
    process.env.KAFKA_EXPENSE_PAYMENT_CREATE_TOPIC || "expense-payment-create",

  PDF_BATCH_SIZE: process.env.PDF_BATCH_SIZE || 40,

  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_NAME: process.env.DB_NAME || "postgres",
  DB_PORT: process.env.DB_PORT || 5432,

  pdf: {
    summons_issue: process.env.SUMMONS_ISSUE || "summons-issue",
    summons_issue_qr: process.env.SUMMONS_ISSUE_QR || "summons-issue-qr",
    order_generic: process.env.ORDER_GENERIC || "order-generic",
    order_generic_qr: process.env.ORDER_GENERIC_QR || "order-generic-qr",
    order_accept_voluntary:
      process.env.ORDER_ACCEPT_VOLUNTARY || "order-accept-voluntary",
    order_accept_voluntary_qr:
      process.env.ORDER_ACCEPT_VOLUNTARY_QR || "order-accept-voluntary-qr",
    order_reject_voluntary:
      process.env.ORDER_REJECT_VOLUNTARY || "order-reject-voluntary",
    order_reject_voluntary_qr:
      process.env.ORDER_REJECT_VOLUNTARY_QR || "order-reject-voluntary-qr",
    order_accept_checkout:
      process.env.ORDER_ACCEPT_CHECKOUT || "order-accept-checkout-request",
    order_accept_checkout_qr:
      process.env.ORDER_ACCEPT_CHECKOUT_QR ||
      "order-accept-checkout-request-qr",
    order_reject_checkout:
      process.env.ORDER_REJECT_CHECKOUT || "order-reject-checkout-request",
    order_reject_checkout_qr:
      process.env.ORDER_REJECT_CHECKOUT_QR ||
      "order-reject-checkout-request-qr",
    case_transfer: process.env.CASE_TRANSFER || "order-case-transfer",
    case_transfer_qr: process.env.CASE_TRANSFER_QR || "order-case-transfer-qr",
    case_settlement_acceptance:
      process.env.CASE_SETTLEMENT_ACCEPTANCE ||
      "order-case-settlement-acceptance",
    case_settlement_acceptance_qr:
      process.env.CASE_SETTLEMENT_ACCEPTANCE_QR ||
      "order-case-settlement-acceptance-qr",
    case_settlement_rejection:
      process.env.CASE_SETTLEMENT_REJECTION || "order-case-settlement-rejected",
    case_settlement_rejection_qr:
      process.env.CASE_SETTLEMENT_REJECTION_QR ||
      "order-case-settlement-rejected-qr",
    adr_case_referral:
      process.env.ADR_CASE_REFERRAL || "order-referral-case-adr",
    adr_case_referral_qr:
      process.env.ADR_CASE_REFERRAL_QR || "order-referral-case-adr-qr",
    mandatory_async_submissions_responses:
      process.env.MANDATORY_ASYNC_SUBMISSIONS_RESPONSES ||
      "mandatory-async-submissions-responses",
    mandatory_async_submissions_responses_qr:
      process.env.MANDATORY_ASYNC_SUBMISSIONS_RESPONSES_QR ||
      "mandatory-async-submissions-responses-qr",
    reschedule_request_judge:
      process.env.RESCHEDULE_REQUEST_JUDGE || "reschedule-request-judge",
    reschedule_request_judge_qr:
      process.env.RESCHEDULE_REQUEST_JUDGE_QR || "reschedule-request-judge-qr",
    new_hearing_date_after_reschedule:
      process.env.NEW_HEARING_DATE_AFTER_RESCHEDULE ||
      "new-hearing-date-after-rescheduling",
    new_hearing_date_after_reschedule_qr:
      process.env.NEW_HEARING_DATE_AFTER_RESCHEDULE_QR ||
      "new-hearing-date-after-rescheduling-qr",
    schedule_hearing_date:
      process.env.SCHEDULE_HEARING_DATE || "schedule-hearing-date",
    schedule_hearing_date_qr:
      process.env.SCHEDULE_HEARING_DATE_QR || "schedule-hearing-date-qr",
    accept_rescheduling_request:
      process.env.ACCEPT_RESCHEDULING_REQUEST || "accept-reschedule-request",
    accept_rescheduling_request_qr:
      process.env.ACCEPT_RESCHEDULING_REQUEST_QR ||
      "accept-reschedule-request-qr",
    reject_rescheduling_request:
      process.env.REJECT_RESCHEDULING_REQUEST || "reject-reschedule-request",
    reject_rescheduling_request_qr:
      process.env.REJECT_RESCHEDULING_REQUEST_QR ||
      "reject-reschedule-request-qr",
    accept_adr_application:
      process.env.ACCEPT_ADR_APPLICATION || "accept-adr-application",
    accept_adr_application_qr:
      process.env.ACCEPT_ADR_APPLICATION_QR || "accept-adr-application-qr",
    reject_adr_application:
      process.env.REJECT_ADR_APPLICATION || "reject-adr-application",
    reject_adr_application_qr:
      process.env.REJECT_ADR_APPLICATION_QR || "reject-adr-application-qr",
    application_submission_extension:
      process.env.APPLICATION_SUBMISSION_EXTENSION ||
      "application-submission-extension",
    application_submission_extension_qr:
      process.env.APPLICATION_SUBMISSION_EXTENSION_QR ||
      "application-submission-extension-qr",
    application_generic:
      process.env.APPLICATION_GENERIC || "application-generic",
    application_generic_qr:
      process.env.APPLICATION_GENERIC_QR || "application-generic-qr",
    application_production_documents:
      process.env.APPLICATION_PRODUCTION_DOCUMENTS ||
      "application-production-of-documents",
    application_production_documents_qr:
      process.env.APPLICATION_PRODUCTION_DOCUMENTS_QR ||
      "application-production-of-documents-qr",
    application_bail_bond:
      process.env.APPLICATION_BAIL_BOND || "application-bail-bond",
    application_bail_bond_qr:
      process.env.APPLICATION_BAIL_BOND_QR || "application-bail-bond-qr",
    application_case_transfer:
      process.env.APPLICATION_CASE_TRANSFER || "application-case-transfer",
    application_case_transfer_qr:
      process.env.APPLICATION_CASE_TRANSFER_QR ||
      "application-case-transfer-qr",
    application_case_withdrawal:
      process.env.APPLICATION_CASE_WITHDRAWAL || "application-case-withdrawal",
    application_case_withdrawal_qr:
      process.env.APPLICATION_CASE_WITHDRAWAL_QR ||
      "application-case-withdrawal-qr",
    application_reschedule_request:
      process.env.APPLICATION_RESCHEDULE_REQUEST ||
      "application-reschedule-request",
    application_reschedule_request_qr:
      process.env.APPLICATION_RESCHEDULE_REQUEST_QR ||
      "application-reschedule-request-qr",
    application_checkout:
      process.env.APPLICATION_CHECKOUT || "application-for-checkout-request",
    application_checkout_qr:
      process.env.APPLICATION_CHECKOUT_QR ||
      "application-for-checkout-request-qr",
    application_delay_condonation:
      process.env.APPLICATION_DELAY_CONDONATION ||
      "application-delay-condonation",
    application_delay_condonation_qr:
      process.env.APPLICATION_DELAY_CONDONATION_QR ||
      "application-delay-condonation-qr",
    application_submit_bail_documents:
      process.env.APPLICATION_SUBMIT_BAIL_DOCUMENTS ||
      "application-submit-bail-documents",
    application_submit_bail_documents_qr:
      process.env.APPLICATION_SUBMIT_BAIL_DOCUMENTS_QR ||
      "application-submit-bail-documents-qr",
    order_bail_rejection:
      process.env.ORDER_BAIL_REJECTION || "order-bail-rejection",
    order_bail_rejection_qr:
      process.env.ORDER_BAIL_REJECTION_QR || "order-bail-rejection-qr",
    order_bail_acceptance:
      process.env.ORDER_BAIL_ACCEPTANCE || "order-bail-acceptance",
    order_bail_acceptance_qr:
      process.env.ORDER_BAIL_ACCEPTANCE_QR || "order-bail-acceptance-qr",
    order_for_mandatory_async_submissions_and_response_qr:
      process.env.ORDER_MANDATORY_SUBMISSION_QR ||
      "order-for-mandatory-async-submissions-and-response-qr",
    order_for_mandatory_async_submissions_and_response:
      process.env.ORDER_MANDATORY_SUBMISSION ||
      "order-for-mandatory-async-submissions-and-response",
    order_for_accept_rescheduling_request:
      process.env.ORDER_FOR_ACCEPT_RESCHEDULING_REQUEST ||
      "order-for-accept-rescheduling-request",
    order_for_accept_rescheduling_request_qr:
      process.env.ORDER_FOR_ACCEPT_RESCHEDULING_REQUEST_QR ||
      "order-for-accept-rescheduling-request-qr",
    order_for_rejection_rescheduling_request:
      process.env.ORDER_REJECTION_RESCHEDULE_REQUEST ||
      "order-for-rejection-rescheduling-request",
    order_for_rejection_rescheduling_request_qr:
      process.env.ORDER_FOR_REJECTION_RESCHEDULING_REQUEST_QR ||
      "order-for-rejection-rescheduling-request-qr",
    order_initiate_reschedule_qr:
      process.env.ORDER_INITIATE_RESCHEDULE_QR ||
      "order-initiate-reschedule-qr",
    order_initiate_reschedule:
      process.env.ORDER_INITIATE_RESCHEDULE || "order-initiate-reschedule",
    order_notice: process.env.ORDER_NOTICE || "order-notice",
    order_notice_qr: process.env.ORDER_NOTICE_QR || "order-notice-qr",
    order_issue_warrant_qr:
      process.env.ORDER_ISSUE_WARRANT_QR || "order-issue-warrant-qr",
    order_issue_warrant:
      process.env.ORDER_ISSUE_WARRANT || "order-issue-warrant",
    order_case_withdrawal_acceptance_qr:
      process.env.ORDER_CASE_WITHDRAWAL_ACCEPTANCE_QR ||
      "order-case-withdrawal-acceptance-qr",
    order_case_withdrawal_acceptance:
      process.env.ORDER_CASE_WITHDRAWAL_ACCEPTANCE ||
      "order-case-withdrawal-acceptance",
    order_case_withdrawal_rejected:
      process.env.ORDER_CASE_WITHDRAWAL_REJECT ||
      "order-case-withdrawal-rejected",
    order_case_withdrawal_rejected_qr:
      process.env.ORDER_CASE_WITHDRAWAL_REJECT ||
      "order-case-withdrawal-rejected-qr",
    order_reject_application_submission_deadline_qr:
      process.env.ORDER_REJECT_APPLICATION_SUBMISSION_DEADLINE_QR ||
      "order-reject-application-submission-deadline-qr",
    order_reject_application_submission_deadline:
      process.env.ORDER_REJECT_APPLICATION_SUBMISSION_DEADLINE ||
      "order-reject-application-submission-deadline",
    order_for_extension_deadline_qr:
      process.env.ORDER_FOR_EXTENSION_DEADLINE_QR ||
      "order-for-extension-deadline-qr",
    order_for_extension_deadline:
      process.env.ORDER_FOR_EXTENSION_DEADLINE ||
      "order-for-extension-deadline",
    case_settlement_application:
      process.env.CASE_SETTLEMENT_APPLICATION || "application-case-settlement",
    case_settlement_application_qr:
      process.env.CASE_SETTLEMENT_APPLICATION_QR ||
      "application-case-settlement-qr",
    order_section202_crpc:
      process.env.ORDER_SECTION202_CRPC || "order-202-crpc",
    order_section202_crpc_qr:
      process.env.ORDER_SECTION202_CRPC_QR || "order-202-crpc-qr",
    order_acceptance_rejection_case:
      process.env.ORDER_ACCEPTANCE_REJECTION_CASE ||
      "order-acceptance-rejection-case",
    order_acceptance_rejection_case_qr:
      process.env.ORDER_ACCEPTANCE_REJECTION_CASE_QR ||
      "order-acceptance-rejection-case-qr",
    order_acceptance_rejection_dca:
      process.env.ORDER_ACCEPTANCE_REJECTION_DCA ||
      "order-acceptance-rejection-dca",
    order_acceptance_rejection_dca_qr:
      process.env.ORDER_ACCEPTANCE_REJECTION_DCA_QR ||
      "order-acceptance-rejection-dca-qr",
    order_notice_bnss_dca:
      process.env.ORDER_NOTICE_BNSS_DCA || "order-notice-bnss-dca",
    order_notice_bnss_dca_qr:
      process.env.ORDER_NOTICE_BNSS_DCA_QR || "order-notice-bnss-dca-qr",
    order_set_terms_of_bail:
      process.env.ORDER_SET_TERMS_OF_BAIL || "order-set-terms-of-bail",
    order_set_terms_of_bail_qr:
      process.env.ORDER_SET_TERMS_OF_BAIL_QR || "order-set-terms-of-bail-qr",
    order_admit_case: process.env.ORDER_ADMIT_CASE || "order-admit-case",
    order_admit_case_qr:
      process.env.ORDER_ADMIT_CASE_QR || "order-admit-case-qr",
    order_dismiss_case: process.env.ORDER_DISMISS_CASE || "order-dismiss-case",
    order_dismiss_case_qr:
      process.env.ORDER_DISMISS_CASE_QR || "order-dismiss-case-qr",
    hearing_bulk_reschedule:
      process.env.HEARING_BULK_RESCHEDULE || "order-bulk-reschedule",
    hearing_bulk_reschedule_qr:
      process.env.HEARING_BULK_RESCHEDULE_QR || "order-bulk-reschedule-qr",
    order_approval_rejection_litigant_details_change:
      process.env.ORDER_APPROVAL_REJECTION_LITIGANT_DETAILS_CHANGE ||
      "order-approval-rejection-litigant-details",
    order_approval_rejection_litigant_details_change_qr:
      process.env.ORDER_APPROVAL_REJECTION_LITIGANT_DETAILS_CHANGE_QR ||
      "order-approval-rejection-litigant-details-qr",
    order_change_advocate:
      process.env.ORDER_CHANGE_ADVOCATE || "order-replace-advocate",
    order_change_advocate_qr:
      process.env.ORDER_CHANGE_ADVOCATE_QR || "order-replace-advocate-qr",
    application_profile_edit:
      process.env.APPLICATION_PROFILE_EDIT || "application-profile-edit",
    application_profile_edit_qr:
      process.env.APPLICATION_PROFILE_EDIT_QR || "application-profile-edit-qr",
    bail_bond: process.env.BAIL_BOND || "bail-bond",
    bail_bond_qr: process.env.BAIL_BOND_QR || "bail-bond-qr",
  },

  app: {
    port: parseInt(process.env.APP_PORT) || 8080,
    host: HOST,
    contextPath: process.env.CONTEXT_PATH || "/egov-pdf",
  },

  host: {
    task: process.env.DRISTI_TASK_HOST || "http://localhost:8096",
    mdms: process.env.EGOV_MDMS_HOST || "http://localhost:8081",
    pdf: process.env.EGOV_PDF_HOST || "http://localhost:8070",
    case: process.env.DRISTI_CASE_HOST || "http://localhost:8091",
    order: process.env.DRISTI_ORDER_HOST || "http://localhost:8092",
    hrms: process.env.EGOV_HRMS_HOST || "http://localhost:8082",
    individual: process.env.EGOV_INDIVIDUAL_HOST || "http://localhost:8085",
    advocate: process.env.DRISTI_ADVOCATE_HOST || "http://localhost:8086",
    hearing: process.env.DRISTI_HEARING_HOST || "http://localhost:8093",
    sunbirdrc_credential_service:
      process.env.EGOV_SUNBIRDRC_CREDENTIAL_HOST || "http://localhost:8095",
    application: process.env.DRISTI_APPLICATION_HOST || "http://localhost:8094",
    localization: process.env.EGOV_LOCALIZATION_HOST || "http://localhost:8083",
    filestore:
      process.env.EGOV_FILESTORE_SERVICE_HOST || "http://localhost:8084",
    evidence: process.env.DRISTI_EVIDENCE_HOST || "http://localhost:8090",
    bailBond: process.env.DRISTI_BAIL_BOND_HOST || "http://localhost:8097",
  },

  paths: {
    pdf_create: "/pdf-service/v1/_createnosave",
    pdf_create_save: "/pdf-service/v1/_create",
    case_search: "/case/v1/_search",
    order_search: "/order/v1/search",
    hearing_search: "/hearing/v1/search",
    application_search: "/application/v1/search",
    hrms_search: "/egov-hrms/employees/_search",
    individual_search: "/individual/v1/_search",
    advocate_search: "/advocate/v1/_search",
    mdms_search: "/egov-mdms-service/v2/_search",
    sunbirdrc_credential_service_search:
      "/sunbirdrc-credential-service/qrcode/_get",
    message_search: "/localization/messages/v1/_search",
    filestore_create: "/filestore/v1/files",
    filestore_search: "/filestore/v1/files/url",
    filestore_search_id: "/filestore/v1/files/id",
    hearing_bulk_reschedule: "/hearing/v1/bulk/_reschedule",
    task_search: "task/v1/search",
    task_table_search: "/task/v1/table/search",
    evidence_search: "/evidence/v1/_search",
    bail_bond_search: "/bail-bond/v1/_search",
  },

  constraints: {
    beneficiaryIdByHeadCode: "Deduction_{tanentId}_{headcode}",
  },

  constants: {
    caseDetails: {
      offence:
        process.env.OFFENCE || "dishonour of cheque due to inadiquacy of funds",
      statuteAndAct: process.env.STATUE_AND_ACT || "NIA 138",
    },
  },
  workFlowState: {
    hearing: {
      OPTOUT: "OPT_OUT",
      SCHEDULED: "SCHEDULED",
    },
  },
};
