package org.pucar.dristi.config;


import org.springframework.stereotype.Component;


@Component
public class ServiceConstants {

    private ServiceConstants() {
    }

    public static final String EXTERNAL_SERVICE_EXCEPTION = "External Service threw an Exception: ";
    public static final String ENRICHMENT_EXCEPTION = "ENRICHMENT_EXCEPTION";
    public static final String ORDER_EXISTS_EXCEPTION = "ORDER_EXISTS_EXCEPTION";
    public static final String ORDER_UPDATE_EXCEPTION = "ORDER_UPDATE_EXCEPTION";
    public static final String ORDER_CREATE_EXCEPTION = "ORDER_CREATE_EXCEPTION";
    public static final String ORDER_SEARCH_EXCEPTION = "ORDER_SEARCH_EXCEPTION";
    public static final String VALIDATION_EXCEPTION = "VALIDATION_EXCEPTION";
    public static final String GET_WORKFLOW_EXCEPTION = "GET_WORKFLOW_EXCEPTION";
    public static final String DOCUMENT_SEARCH_QUERY_EXCEPTION = "DOCUMENT_SEARCH_QUERY_EXCEPTION";
    public static final String STATUTE_SEARCH_QUERY_EXCEPTION = "STATUTE_SEARCH_QUERY_EXCEPTION";
    public static final String SEARCHER_SERVICE_EXCEPTION = "Exception while fetching from searcher: ";

    public static final String IDGEN_ERROR = "IDGEN ERROR";
    public static final String NO_IDS_FOUND_ERROR = "No ids returned from idgen Service";

    public static final String ERROR_WHILE_FETCHING_FROM_MDMS = "Exception occurred while fetching category lists from mdms: ";
    public static final String ERROR_WHILE_FETCHING_FROM_CASE = "Exception occurred while fetching case details: ";
    public static final String CREATE_ORDER_ERR = "Exception occurred while validating order details: ";
    public static final String MDMS_DATA_NOT_FOUND = "MDMS_DATA_NOT_FOUND";

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
    public static final String ADMINISTRATIVE = "ADMINISTRATIVE";

    public static final String PARSING_ERROR = "PARSING ERROR";
    public static final String FAILED_TO_PARSE_BUSINESS_SERVICE_SEARCH = "Failed to parse response of workflow business service search";
    public static final String BUSINESS_SERVICE_NOT_FOUND = "BUSINESSSERVICE_NOT_FOUND";
    public static final String THE_BUSINESS_SERVICE = "The businessService ";
    public static final String NOT_FOUND = " is not found";
    public static final String TENANTID = "?tenantId=";
    public static final String BUSINESS_SERVICES = "&businessServices=";
    public static final String JUDGEMENT = "JUDGEMENT";
    public static final String CASE_DECISION_AVAILABLE = "CASE_DECISION_AVAILABLE";
    public static final String INVALID_FILESTORE_ID = "INVALID_FILESTORE_ID";
    public static final String INVALID_DOCUMENT_DETAILS = "Invalid document details";

    public static final String PUBLISHED = "PUBLISHED";

    public static final String ADMISSION_HEARING_SCHEDULED = "ADMISSION_HEARING_SCHEDULED";

    public static final String NOTIFICATION_ENG_LOCALE_CODE = "en_IN";

    public static final String NOTIFICATION_MODULE_CODE = "notification";

    public static final String NOTIFICATION_LOCALIZATION_CODES_JSONPATH = "$.messages.*.code";
    public static final String NOTIFICATION_LOCALIZATION_MSGS_JSONPATH = "$.messages.*.message";

    public static final String ORDER_ISSUED = "ORDER_ISSUED";

    public static final String SCHEDULE_OF_HEARING_DATE = "SCHEDULE_OF_HEARING_DATE";
    public static final String SCHEDULING_NEXT_HEARING = "SCHEDULING_NEXT_HEARING";
    public static final String ASSIGNING_DATE_RESCHEDULED_HEARING = "ASSIGNING_DATE_RESCHEDULED_HEARING";
    public static final String HEARING_RESCHEDULED = "HEARING_RESCHEDULED";
    public static final String EXAMINATION_UNDER_S351_BNSS = "EXAMINATION_UNDER_S351_BNSS";
    public static final String EXAMINATION_UNDER_S351_BNSS_SCHEDULED = "EXAMINATION_UNDER_S351_BNSS_SCHEDULED";
    public static final String EVIDENCE_ACCUSED = "EVIDENCE_ACCUSED";
    public static final String EVIDENCE_ACCUSED_PUBLISHED = "EVIDENCE_ACCUSED_PUBLISHED";
    public static final String EVIDENCE_COMPLAINANT = "EVIDENCE_COMPLAINANT";
    public static final String EVIDENCE_COMPLAINANT_PUBLISHED = "EVIDENCE_COMPLAINANT_PUBLISHED";
    public static final String APPEARANCE = "APPEARANCE";
    public static final String APPEARANCE_PUBLISHED = "APPEARANCE_PUBLISHED";

    public static final String INDIVIDUAL_UTILITY_EXCEPTION = "INDIVIDUAL_UTILITY_EXCEPTION";

    public static final String WARRANT = "WARRANT";
    public static final String WARRANT_ISSUED = "WARRANT_ISSUED";
    public static final String SUMMONS = "SUMMONS";
    public static final String SUMMONS_ISSUED = "SUMMONS_ISSUED";
    public static final String ORDER_PUBLISHED = "ORDER_PUBLISHED";
    public static final String MANDATORY_SUBMISSIONS_RESPONSES = "MANDATORY_SUBMISSIONS_RESPONSES";
    public static final String EVIDENCE_REQUESTED = "EVIDENCE_REQUESTED";
    public static final String EVIDENCE = "Evidence";
    public static final String NOTICE = "NOTICE";
    public static final String NOTICE_ISSUED = "NOTICE_ISSUED";
    public static final String CASE_ADMITTED = "CASE_ADMITTED";
    public static final String NEXT_HEARING_SCHEDULED = "NEXT_HEARING_SCHEDULED";
    public static final String RESPONDENT = "RESPONDENT";
    public static final String COMPLAINANT = "COMPLAINANT";
    public static final String INTERMEDIATE = "INTERMEDIATE";
    public static final String COMPOSITE = "COMPOSITE";
}
