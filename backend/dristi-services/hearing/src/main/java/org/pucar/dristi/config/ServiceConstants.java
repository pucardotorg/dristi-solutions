package org.pucar.dristi.config;


import org.springframework.stereotype.Component;


@Component
public class ServiceConstants {

    private ServiceConstants() {
    }

    public static final String EXTERNAL_SERVICE_EXCEPTION = "External Service threw an Exception: ";
    public static final String SEARCHER_SERVICE_EXCEPTION = "Exception while fetching from searcher: ";

    public static final String IDGEN_ERROR = "IDGEN ERROR";
    public static final String NO_IDS_FOUND_ERROR = "No ids returned from idgen Service";

    public static final String ERROR_WHILE_FETCHING_FROM_MDMS = "Exception occurred while fetching category lists from mdms: ";

    public static final String RES_MSG_ID = "uief87324";
    public static final String SUCCESSFUL = "successful";
    public static final String FAILED = "failed";

    public static final String URL = "url";
    public static final String URL_SHORTENING_ERROR_CODE = "URL_SHORTENING_ERROR";
    public static final String URL_SHORTENING_ERROR_MESSAGE = "Unable to shorten url: ";

    public static final String DOB_FORMAT_Y_M_D = "yyyy-MM-dd";
    public static final String DOB_FORMAT_D_M_Y = "dd/MM/yyyy";
    public static final String ILLEGAL_ARGUMENT_EXCEPTION_CODE = "IllegalArgumentException";
    public static final String OBJECTMAPPER_UNABLE_TO_CONVERT = "ObjectMapper not able to convertValue in userCall";
    public static final String DOB_FORMAT_D_M_Y_H_M_S = "dd-MM-yyyy HH:mm:ss";
    public static final String CREATED_DATE = "createdDate";
    public static final String LAST_MODIFIED_DATE = "lastModifiedDate";
    public static final String DOB = "dob";
    public static final String PWD_EXPIRY_DATE = "pwdExpiryDate";
    public static final String INVALID_DATE_FORMAT_CODE = "INVALID_DATE_FORMAT";
    public static final String INVALID_DATE_FORMAT_MESSAGE = "Failed to parse date format in user";
    public static final String CITIZEN_UPPER = "CITIZEN";
    public static final String CITIZEN_LOWER = "Citizen";
    public static final String USER = "user";

    public static final String PARSING_ERROR = "PARSING ERROR";
    public static final String FAILED_TO_PARSE_BUSINESS_SERVICE_SEARCH = "Failed to parse response of workflow business service search";
    public static final String BUSINESS_SERVICE_NOT_FOUND = "BUSINESSSERVICE_NOT_FOUND";
    public static final String THE_BUSINESS_SERVICE = "The businessService ";
    public static final String NOT_FOUND = " is not found";
    public static final String TENANTID = "?tenantId=";
    public static final String BUSINESS_SERVICES = "&businessServices=";
    public static final String APPLICATION_ACTIVE_STATUS = "ACTIVE";
    public static final String INDIVIDUAL_SERVICE_EXCEPTION = "INDIVIDUAL_SERVICE_EXCEPTION";
    public static final String VALIDATION_EXCEPTION = "VALIDATION_ERROR";
    public static final String ENRICHMENT_EXCEPTION = "ENRICHMENT_EXCEPTION";
    public static final String WORKFLOW_SERVICE_EXCEPTION = "WORKFLOW_SERVICE_EXCEPTION";
    public static final String DOCUMENT_SEARCH_QUERY_EXCEPTION = "DOCUMENT_SEARCH_QUERY_EXCEPTION";
    public static final String INDIVIDUAL_NOT_FOUND = "INDIVIDUAL_NOT_FOUND";
    public static final String ROW_MAPPER_EXCEPTION = "ROW_MAPPER_EXCEPTION";
    public static final String INDIVIDUAL_UTILITY_EXCEPTION = "INDIVIDUAL_UTILITY_EXCEPTION";
    public static final String TEST_EXCEPTION = "TEST_EXCEPTION";
    public static final String HEARING_CREATE_EXCEPTION = "Exception while creating hearing";
    public static final String HEARING_UPDATE_EXCEPTION = "Exception while updating hearing";
    public static final String HEARING_UPDATE_TIME_EXCEPTION = "Exception while updating hearing start and end time";
    public static final String HEARING_SEARCH_EXCEPTION = "Exception while Searching hearing";
    public static final String SEARCH_QUERY_EXCEPTION = "Exception while creating query";
    public static final String ERROR_WHILE_FETCHING_FROM_CASE = "ERROR_WHILE_FETCHING_FROM_CASE";
    public static final String ERROR_WHILE_FETCHING_FROM_APPLICATION_SERVICE = "ERROR_WHILE_FETCHING_FROM_APPLICATION_SERVICE";
    public static final String INVALID_FILESTORE_ID = "INVALID_FILESTORE_ID";
    public static final String INVALID_DOCUMENT_DETAILS = "Invalid document details";

    public static final String MARK_COMPLETE = "MARK_COMPLETE";
    public static final String UPDATE_DATE = "UPDATE_DATE";
    public static final String RESCHEDULE_ONGOING = "RESCHEDULE_ONGOING";
    public static final String JSON_PARSING_ERR = "JSON_PARSING_ERR";

    public static final String PDF_UTILITY_EXCEPTION = "PDF_UTILITY_EXCEPTION";
    public static final String WITNESS_DEPOSITION_UPDATE_EXCEPTION = "Exception while uploading witness deposition pdf";

    public static final String ACCUSED = "ACCUSED";
    public static final String COMPLAINANT = "COMPLAINANT";
    public static final String CASE_DISMISSED = "CASE_DISMISSED";
    public static final String COMPLETED = "COMPLETED";
    public static final String SCHEDULED = "SCHEDULED";
    public static final String HEARING_ADJOURNED = "HEARING_ADJOURNED";
    public static final String NOTIFICATION_ENG_LOCALE_CODE = "en_IN";
    public static final String NOTIFICATION_MODULE_CODE = "notification";
    public static final String NOTIFICATION_LOCALIZATION_CODES_JSONPATH = "$.messages.*.code";
    public static final String NOTIFICATION_LOCALIZATION_MSGS_JSONPATH = "$.messages.*.message";
    public static final String CLOSE = "CLOSE";
    public static final String START = "START";
    public static final String PASS_OVER = "PASS_OVER";
    public static final String ABANDON = "ABANDON";
    public static final String HEARING_MODULE_NAME = "Hearing";
    public static final String HEARING_STATUS_MASTER_NAME = "HearingStatus";
    public static final String HEARING_LINK_MASTER_NAME = "HearingLink";
    public static final String ERRORS_PATH = "$.errors";
    public static final String ES_INDEX_HEADER_FORMAT = "{\"index\":{\"_index\":\"%s\",\"_id\":\"%s\"}}\n";
    public static final String ES_INDEX_DOCUMENT_FORMAT = "{"
            + "\"Data\": {"
            + "\"hearingDetails\": {"
            + "\"hearingUuid\": \"%s\","
            + "\"tenantId\": \"%s\","
            + "\"filingNumber\": \"%s\","
            + "\"caseTitle\": \"%s\","
            + "\"caseUuid\": \"%s\","
            + "\"hearingNumber\": \"%s\","
            + "\"caseNumber\": \"%s\","
            + "\"stage\": \"%s\","
            + "\"status\": \"%s\","
            + "\"fromDate\": %d,"
            + "\"toDate\": %d,"
            + "\"subStage\": \"%s\","
            + "\"courtId\": \"%s\","
            + "\"advocate\": {"
            + "\"accused\": %s,"
            + "\"complainant\": %s"
            + "},"
            + "\"searchableFields\": %s,"
            + "\"hearingType\": \"%s\","
            + "\"caseFilingDate\": %d,"
            + "\"statusOrder\": %d,"
            + "\"hearingTypeOrder\": %d,"
            + "\"serialNumber\": %d,"
            + "\"orderStatus\": \"%s\""
            + "}"
            + "}"
            + "}\n";

    public static final String CASE_TITLE = "caseTitle";
    public static final String CASE_STATUS = "status";
    public static final String CASE_OUTCOME = "outcome";
    public static final String CASE_CNR = "status";
    public static final String CASE_ID = "id";
    public static final String SCHEDULE_HEARING_SUFFIX = "_SCHEDULE_HEARING";
    public static final String ACTION_CATEGORY_SCHEDULE_HEARING = "Schedule Hearing";
    public static final String CREATE_ORDER = "CREATE_ORDER";
    public static final String VIEW_SCHEDULE_HEARING = "VIEW_SCHEDULE_HEARING";
    public static final String SCREEN_TYPE_HOME = "home";

    // module for localized hearing types
    public static final String HEARING_TYPE_MODULE_CODE = "hearingTypes";

    // Hearing Types
    public static final String WARRANT = "WARRANT";
    public static final String EXAMINATION_UNDER_S351_BNSS = "EXAMINATION_UNDER_S351_BNSS";
    public static final String EVIDENCE_COMPLAINANT = "EVIDENCE_COMPLAINANT";
    public static final String EVIDENCE_ACCUSED = "EVIDENCE_ACCUSED";
    public static final String APPEARANCE = "APPEARANCE";
    public static final String JUDGEMENT = "JUDGEMENT";
    public static final String BAIL = "BAIL";
    public static final String ADR = "ADR";
    public static final String REPORTS = "REPORTS";
    public static final String ARGUMENTS = "ARGUMENTS";
    public static final String PLEA = "PLEA";
    public static final String EXECUTION = "EXECUTION";
    public static final String ADMISSION = "ADMISSION";
    // generic message code for all hearing types
    public static final String VARIABLE_HEARING_SCHEDULED = "VARIABLE_HEARING_SCHEDULED";

    public static final String ERROR_WHILE_FETCHING_FROM_ORDER = "ERROR_WHILE_FETCHING_FROM_ORDER";

    public static final String PUBLISHED = "PUBLISHED";

    public static final String NOTICE = "NOTICE";

    public static final String PROCLAMATION = "PROCLAMATION";

    public static final String ATTACHMENT = "ATTACHMENT";

    public static final String SUMMONS = "SUMMONS";

    public static final String PENDING_PAYMENT = "PENDING_PAYMENT";

    public static final String EXPIRE = "EXPIRE";

    public static final String ABANDONED = "ABANDONED";

    public static final String PAYMENTTYPE = "paymentType";

    public static final String SUMMON = "SUMMONS";

    public static final String MANUAL = "MANUAL_";

    public static final String PAYMENT_COLLECTOR = "PAYMENT_COLLECTOR";

    public static final String HEARINGS_HELD_TODAY_SINGLE = "HEARINGS_HELD_TODAY_SINGLE";
    public static final String HEARINGS_HELD_TODAY_MULTIPLE = "HEARINGS_HELD_TODAY_MULTIPLE";
    public static final String HEARINGS_SCHEDULED_TOMORROW_SINGLE = "HEARINGS_SCHEDULED_TOMORROW_SINGLE";
    public static final String HEARINGS_SCHEDULED_TOMORROW_MULTIPLE = "HEARINGS_SCHEDULED_TOMORROW_MULTIPLE";
    public static final String msgId = "1730882648558|en_IN";
    public static final String SYSTEM = "SYSTEM";

    public static final String SYSTEM_ADMIN = "SYSTEM_ADMIN";

    public static final String HEARING_RESCHEDULED = "HEARING_RESCHEDULED";
}
