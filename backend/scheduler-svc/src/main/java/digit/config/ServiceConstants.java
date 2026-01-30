package digit.config;


import org.springframework.stereotype.Component;


@Component
public class ServiceConstants {

    public static final String EXTERNAL_SERVICE_EXCEPTION = "External Service threw an Exception: ";
    public static final String SEARCHER_SERVICE_EXCEPTION = "Exception while fetching from searcher: ";
    public static final String IDGEN_ERROR = "IDGEN ERROR";
    public static final String NO_IDS_FOUND_ERROR = "No ids returned from idgen Service";
    public static final String ERROR_WHILE_FETCHING_FROM_MDMS = "Exception occurred while fetching category lists from mdms: ";
    public static final String ERROR_WHILE_UPDATING_FROM_MDMS = "Exception occurred while updating mdms: ";
    public static final String RES_MSG_ID = "uief87324";
    public static final String SUCCESSFUL = "successful";
    public static final String FAILED = "failed";
    public static final String PARSING_ERROR = "PARSING ERROR";
    public static final String FAILED_TO_PARSE_BUSINESS_SERVICE_SEARCH = "Failed to parse response of workflow business service search";
    public static final String BUSINESS_SERVICE_NOT_FOUND = "BUSINESSSERVICE_NOT_FOUND";
    public static final String THE_BUSINESS_SERVICE = "The businessService ";
    public static final String NOT_FOUND = " is not found";
    public static final String TENANTID = "?tenantId=";
    public static final String BUSINESS_SERVICES = "&businessServices=";
    public static final String FILE_STORE_UTILITY_EXCEPTION = "FILE_STORE_UTILITY_EXCEPTION";
    public static final String OPT_OUT_DUE = "OPT_OUT_DUE";
    public final String APPLICATION_STATE = "PENDINGAPPROVAL";
    public final String APPLICATION_PENDING_REVIEW_STATE = "PENDINGREVIEW";
    public static final String DELAY_CONDONATION = "DELAY_CONDONATION";

    public static final String OPT_OUT_SELECTION_LIMIT = "OPT_OUT_SELECTION_LIMIT";
    public final String COMPLAINANT = "complainant.primary";
    public final String RESPONDENT = "respondent.primary";
    public final String ADVOCATE_NAME = "advocateName";
    public final String SYSTEM_ADMIN = "SYSTEM_ADMIN";
    public static final String CAUSE_LIST_NOT_FOUND = "Cause list not found for given date or court, please generate one.";
    public static final String INACTIVE = "INACTIVE";
    public static final String ACTIVE = "ACTIVE";
    public static final String BLOCKED = "BLOCKED";
    public static final String SCHEDULE = "SCHEDULED";
    public final String DEFAULT_JUDGE_CALENDAR_MODULE_NAME = "schedule-hearing";
    public final String DEFAULT_JUDGE_CALENDAR_MASTER_NAME = "COURT000334";
    public final String DEFAULT_COURT_MODULE_NAME = "court";
    public final String DEFAULT_SLOTTING_MASTER_NAME = "slots";
    public final String DEFAULT_HEARING_MASTER_NAME = "hearings";
    public final String HEARING_PRIORITY_MASTER_NAME = "hearingPriority";
    public final String SCHEDULER_CONFIG_MASTER_NAME = "config";
    public final String SCHEDULER_CONFIG_MODULE_NAME = "SCHEDULER-CONFIG";

    public static final String PENDING_TASK_ENTITY_TYPE = "order-managelifecycle";
    public static final String PENDING_TASK_NAME = "Create Order for rescheduling the hearing";
    public static final String PENDING_TASK_STATUS = "RESCHEDULE_HEARING";
    public static final String RE_SCHEDULE_PENDING_TASK_ACTION_CATEGORY = "Reschedule Applications";
    public static final String RE_SCHEDULE_APPLICATION_TYPE  = "RE_SCHEDULE";
    public static final String SCHEDULE_HEARING_ACTION_CATEGORY = "Schedule Hearing";

    public static final String STATUS_RESCHEDULE = "RESCHEDULE";

    public static final String INTERNALMICROSERVICEROLE_NAME = "Internal Microservice Role";

    public static final String INTERNALMICROSERVICEROLE_CODE = "INTERNAL_MICROSERVICE_ROLE";

    public static final String INTERNALMICROSERVICEUSER_NAME = "Internal Microservice User";

    public static final String INTERNALMICROSERVICEUSER_USERNAME = "INTERNAL_USER";

    public static final String INTERNALMICROSERVICEUSER_MOBILENO = "9999999999";

    public static final String INTERNALMICROSERVICEUSER_TYPE = "SYSTEM";

    public static final String FLOW_JAC = "flow_jac";

    public static final String msgId = "1730882648558|en_IN";

    public static final String DATE_FORMAT = "dd-MM-yyyy";

    public static final String INDIVIDUAL_UTILITY_EXCEPTION = "INDIVIDUAL_UTILITY_EXCEPTION";
    public static final String INDIVIDUAL_SERVICE_EXCEPTION = "INDIVIDUAL_SERVICE_EXCEPTION";

    public static final String NOTIFICATION_ENG_LOCALE_CODE = "en_IN";
    public static final String NOTIFICATION_MODULE_CODE = "notification";
    public static final String NOTIFICATION_LOCALIZATION_CODES_JSONPATH = "$.messages.*.code";
    public static final String NOTIFICATION_LOCALIZATION_MSGS_JSONPATH = "$.messages.*.message";

    // sms code for getting hearing reminder notification when cause list is generated
    public static final String CAUSE_LIST_HEARING_MESSAGE = "CAUSE_LIST_HEARING_MESSAGE";

    public static final String SCREEN_TYPE = "home";

    public static final String CAUSE_LIST_EMAIL_BODY =
            "Please find attached the cause list for of the 24X7 ON Court located in the Kollam District Court Complex. " +
                    "We kindly request the Bar Association to share the causelist in the relevant channels with concerned advocates.<br><br>" +
                    "Regards,";

    // Other constants can be added here
    public static final String EMAIL_SEND_ERROR = "EMAIL_SEND_ERROR";
    public static final String EMAIL_SEND_ERROR_MESSAGE = "Failed to send cause list email: ";

    // File name pattern
    public static final String CAUSE_LIST_FILE_NAME_PATTERN = "CauseList_%s.pdf";

    public static final String CAUSE_LIST_EMAIL_TEMPLATE_CODE = "CAUSELIST_EMAIL";

    public static final String PASSED_OVER = "PASSED_OVER";

    public static final String SCHEDULED = "SCHEDULED";

    public static final String ABANDON = "ABANDON";

    public static final String WORKFLOW_ABANDON = "WORKFLOW_ABANDON";


    public static final String IN_PROGRESS = "IN_PROGRESS";

    public static final String EMPLOYEE = "EMPLOYEE";

    public static final String ERRORS_PATH = "$.errors";

    public static final String ES_UPDATE_HEADER_FORMAT = "{\"update\":{\"_index\":\"%s\",\"_id\":\"%s\"}}\n";

    public static final String ES_UPDATE_DOCUMENT_FORMAT = "{\"doc\":{\"Data\":{\"hearingDetails\":{\"serialNumber\":%d}}}}\n";

    public static final String PAYMENT_COLLECTOR = "PAYMENT_COLLECTOR";

    public static final String EXPIRED = "EXPIRED";

    // roles
    public static final String VIEW_RE_SCHEDULE_APPLICATION = "VIEW_RE_SCHEDULE_APPLICATION";
}
