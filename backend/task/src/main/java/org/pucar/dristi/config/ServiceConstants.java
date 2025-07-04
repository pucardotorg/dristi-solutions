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

    public static final String ENRICHMENT_EXCEPTION = "ENRICHMENT_EXCEPTION";

    public static final String VALIDATION_ERR = "VALIDATION_EXCEPTION";
    public static final String CREATE_TASK_ERR = "Error creating task";
    public static final String UPDATE_TASK_ERR = "Error updating task";
    public static final String TASK_SEARCH_QUERY_EXCEPTION = "Error updating task";
    public static final String DOCUMENT_SEARCH_QUERY_EXCEPTION = "Error searching task documents";
    public static final String AMOUNT_SEARCH_QUERY_EXCEPTION = "Error searching task amount";
    public static final String ROW_MAPPER_EXCEPTION = "Error in row mapper";
    public static final String EXIST_TASK_ERR = "Error while checking task exist";
    public static final String SEARCH_TASK_ERR = "Error while searching task";
    public static final String BAIL = "BAIL";
    public static final String SUMMON = "SUMMONS";

    public static final String MAKE_PAYMENT = "MAKE_PAYMENT";

    public static final String NOTICE = "NOTICE";
    public static final String WARRANT = "WARRANT";
    public static final String ISSUESUMMON = "ISSUE_SUMMON";

    public static final String SUMMON_SENT = "SUMMON_SENT";

    public static final String NOTICE_SENT = "NOTICE_SENT";

    public static final String WARRANT_SENT = "WARRANT_SENT";


    public static final String ISSUENOTICE = "ISSUE_NOTICE";

    public static final String DOCUMENT_UPLOAD_QUERY_EXCEPTION = "DOCUMENT_UPLOAD_QUERY_EXCEPTION";


    public static final String PAYMENT_MODULE_NAME = "payment";
    public static final String PAYMENT_TYPE_MASTER_NAME = "paymentType";

    public static final String FILTER_PAYMENT_TYPE = "$.[?(@.suffix == '%s' && @.businessService[?(@.businessCode == '%s')])]";

    public static final String FILTER_PAYMENT_TYPE_DELIVERY_CHANNEL = "$[?(@.deliveryChannel == '%s' && @.businessService[?(@.businessCode == '%s')])]";

    public static final String UPLOAD_TASK_DOCUMENT_ERROR = "UPLOAD_TASK_DOCUMENT_ERROR";
    public static final String PENDING_TASK_CREATOR = "PENDING_TASK_CREATOR";
    public static final String PENDING_TASK = "PENDING_TASK";

    public static final String JOIN_CASE = "JOIN_CASE";
    public static final String JOIN_CASE_PAYMENT = "JOIN_CASE_PAYMENT";
    public static final String APPROVED = "APPROVED";
    public static final String REJECTED = "REJECTED";
    public static final String PENDING_APPROVAL = "PENDING_APPROVAL";

    public static final String REJECT = "REJECT";

    public static final String INVALID_PENDING_TASK = "INVALID_PENDING_TASK";

    public static final String ERROR_WHILE_FETCHING_FROM_CASE ="ERROR_WHILE_FETCHING_FROM_CASE";

    public static final String REQUEST_INFO = "RequestInfo";
    public static final String DELIVERED = "DELIVERED";
    public static final String RE_ISSUE = "RE_ISSUE";
    public static final String PENDING_PAYMENT = "PENDING_PAYMENT";
    public static final String NOTICE_DELIVERED = "NOTICE_DELIVERED";
    public static final String NOTICE_NOT_DELIVERED = "NOTICE_NOT_DELIVERED";
    public static final String SUMMONS_DELIVERED = "SUMMONS_DELIVERED";
    public static final String SUMMONS_NOT_DELIVERED = "SUMMONS_NOT_DELIVERED";
    public static final String WARRANT_ISSUED = "WARRANT_ISSUED";
    public static final String WARRANT_ISSUE_SUCCESS = "WARRANT_ISSUE_SUCCESS";
    public static final String EXECUTED = "EXECUTED";
    public static final String WARRANT_DELIVERED = "WARRANT_DELIVERED";
    public static final String NOT_EXECUTED = "NOT_EXECUTED";
    public static final String WARRANT_NOT_DELIVERED = "WARRANT_NOT_DELIVERED";


    public static final String NOTIFICATION_ENG_LOCALE_CODE = "en_IN";

    public static final String NOTIFICATION_MODULE_CODE = "notification";
    public static final String NOTIFICATION_LOCALIZATION_CODES_JSONPATH = "$.messages.*.code";
    public static final String NOTIFICATION_LOCALIZATION_MSGS_JSONPATH = "$.messages.*.message";

    public static final String INDIVIDUAL_UTILITY_EXCEPTION = "INDIVIDUAL_UTILITY_EXCEPTION";

    public static final String ERROR_FROM_CASE = "ERROR_WHILE_FETCHING_FROM_CASE_SERVICE";
    public static final String GEOLOCATION = "geoLocationDetails";

    public static final String GENERIC = "GENERIC";
    public static final String ERROR_WHILE_CREATING_DEMAND_FOR_GENERIC_TASK = "Error while creating demand for generic task: ";

    public static final String CHANNEL_CODE = "channelCode";
    public static final String RPAD = "RPAD";
    public static final String PENDING_ENVELOPE_SUBMISSION = "PENDING_ENVELOPE_SUBMISSION";
    public static final String MANUAL = "MANUAL_";
    public static final String ERROR_WHILE_FETCHING_FROM_ADVOCATE = "ERROR_WHILE_FETCHING_FROM_ADVOCATE";

}
