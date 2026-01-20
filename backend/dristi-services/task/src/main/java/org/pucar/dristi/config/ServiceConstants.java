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
    public static final String ROLE_VIEW_PROCESS_SUMMONS = "VIEW_PROCESS_SUMMONS";
    public static final String ROLE_VIEW_PROCESS_WARRANT = "VIEW_PROCESS_WARRANT";
    public static final String ROLE_VIEW_PROCESS_NOTICE = "VIEW_PROCESS_NOTICE";
    public static final String ROLE_VIEW_PROCESS_PROCLAMATION = "VIEW_PROCESS_PROCLAMATION";
    public static final String ROLE_VIEW_PROCESS_ATTACHMENT = "VIEW_PROCESS_ATTACHMENT";

    public static final String MAKE_PAYMENT = "MAKE_PAYMENT";

    public static final String NOTICE = "NOTICE";
    public static final String WARRANT = "WARRANT";
    public static final String PROCLAMATION = "PROCLAMATION";
    public static final String ATTACHMENT = "ATTACHMENT";
    public static final String ISSUESUMMON = "ISSUE_SUMMON";

    public static final String SUMMON_SENT = "SUMMON_SENT";

    public static final String NOTICE_SENT = "NOTICE_SENT";

    public static final String WARRANT_SENT = "WARRANT_SENT";

    public static final String PROCLAMATION_SENT = "PROCLAMATION_SENT";

    public static final String ATTACHMENT_SENT = "ATTACHMENT_SENT";

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
    public static final String APPLICATION_DETAILS_PATH = "$.application.applicationDetails.taskNumber";
    public static final String APPLICATION_TYPE_PATH = "$.application.applicationType";

    public static final String APPLICATION_STATUS_PATH = "$.application.status";
    public static final String FILING_NUMBER_PATH = "$.application.filingNumber";
    public static final String TENANTID_PATH = "$.application.tenantId";

    public static final String INTERNALMICROSERVICEROLE_NAME = "SYSTEM";

    public static final String INTERNALMICROSERVICEROLE_CODE = "SYSTEM";

    public static final String INTERNALMICROSERVICEUSER_NAME = "Internal Microservice User";

    public static final String INTERNALMICROSERVICEUSER_USERNAME = "INTERNAL_SYSTEM_USER";

    public static final String INTERNALMICROSERVICEUSER_MOBILENO = "1234567890";

    public static final String INTERNALMICROSERVICEUSER_TYPE = "SYSTEM";

    public static final String ESIGN_SERVICE_EXCEPTION = "ESIGN_SERVICE_EXCEPTION";

    public static final String COORDINATES_ERROR = "COORDINATES_ERROR";

    public static final String INVALID_INPUT = "INVALID_INPUT";

    public static final String FILE_STORE_SERVICE_EXCEPTION_CODE = "FILE_STORE_SERVICE_EXCEPTION_CODE";
    public static final String FILE_STORE_SERVICE_EXCEPTION_MESSAGE = "Exception occurred while fetching fileStore object from fileStoreService";

    public static final String FILE_STORE_UTILITY_EXCEPTION = "FILE_STORE_UTILITY_EXCEPTION";

    public static final String TASK_SIGN_ERROR = "TASK_SIGN_ERROR";

    public static final String COMMAND = "command";
    public static final String PKI_NETWORK_SIGN = "pkiNetworkSign";
    public static final String TIME_STAMP = "ts";
    public static final String TXN = "txn";
    public static final String NAME = "name";
    public static final String VALUE = "value";
    public static final String TYPE = "type";
    public static final String PDF = "pdf";
    public static final String ATTRIBUTE = "attribute";
    public static final String FILE = "file";
    public static final String CERTIFICATE = "certificate";
    public static final String PAGE = "page";
    public static final String CO_ORDINATES = "cood";
    public static final String SIZE = "size";
    public static final String DATE_FORMAT = "dateformat";
    public static final String ESIGN_DATE_FORMAT = "dd-MMM-yyyy";
    public static final String DATA = "data";
    public static final String OMIT_XML_DECLARATION = "omit-xml-declaration";
    public static final String XML_CREATE_ERROR = "XML_CREATE_ERROR";
    public static final String XML_CREATE_ERROR_MESSAGE = "error while creating XML";
    public static final String EMPTY_TASKS_ERROR = "EMPTY_TASKS_ERROR";
    public static final String UNSIGNED = "UNSIGNED";
    public static final String SIGNED = "SIGNED";
    public static final String SIGNED_TASK_DOCUMENT = "SIGNED_TASK_DOCUMENT";

    public static final String TASK_PDF_NAME = "Task.pdf";

    public static final String TASKS_BULK_SIGN_EXCEPTION = "TASKS_BULK_SIGN_EXCEPTION";

    public static final String PROCESS_FEE_PAYMENT = "PROCESS_FEE_PAYMENT";

    public static final String TASK_NOT_FOUND = "TASK_NOT_FOUND";
    public static final String INVALID_DELIVERY_CHANNEL = "INVALID_DELIVERY_CHANNEL";
}
