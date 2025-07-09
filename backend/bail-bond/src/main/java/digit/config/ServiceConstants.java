package digit.config;


import org.springframework.stereotype.Component;


@Component
public class ServiceConstants {

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

    public static final String BAIL_SEARCH_EXCEPTION = "BAIL_SEARCH_EXCEPTION";
    public static final String ENRICHMENT_EXCEPTION = "ENRICHMENT_EXCEPTION";

    public static final String APPLICATION_ACTIVE_STATUS = "ACTIVE";
    public static final String INDIVIDUAL_SERVICE_EXCEPTION = "INDIVIDUAL_SERVICE_EXCEPTION";
    public static final String VALIDATION_EXCEPTION = "VALIDATION_ERROR";
    public static final String WORKFLOW_SERVICE_EXCEPTION = "WORKFLOW_SERVICE_EXCEPTION";
    public static final String DOCUMENT_SEARCH_QUERY_EXCEPTION = "DOCUMENT_SEARCH_QUERY_EXCEPTION";
    public static final String INDIVIDUAL_NOT_FOUND = "INDIVIDUAL_NOT_FOUND";
    public static final String ROW_MAPPER_EXCEPTION = "ROW_MAPPER_EXCEPTION";
    public static final String INDIVIDUAL_UTILITY_EXCEPTION = "INDIVIDUAL_UTILITY_EXCEPTION";
    public static final String TEST_EXCEPTION = "TEST_EXCEPTION";
    public static final String BAIL_CREATE_EXCEPTION = "BAIL_CREATE_EXCEPTION";
    public static final String BAIL_UPDATE_EXCEPTION = "BAIL_UPDATE_EXCEPTION";
    public static final String HEARING_UPDATE_TIME_EXCEPTION = "Exception while updating hearing start and end time";
    public static final String HEARING_SEARCH_EXCEPTION = "Exception while Searching hearing";
    public static final String SEARCH_QUERY_EXCEPTION = "Exception while creating query";
    public static final String ERROR_WHILE_FETCHING_FROM_CASE = "ERROR_WHILE_FETCHING_FROM_CASE";
    public static final String ERROR_WHILE_FETCHING_FROM_APPLICATION_SERVICE = "ERROR_WHILE_FETCHING_FROM_APPLICATION_SERVICE";
    public static final String INVALID_FILESTORE_ID = "INVALID_FILESTORE_ID";
    public static final String INVALID_DOCUMENT_DETAILS = "Invalid document details";
    public static final String BAIL_SIGN_ERROR = "BAIL_SIGN_ERROR";
    public static final String BAILS_BULK_SIGN_EXCEPTION = "BAILS_BULK_SIGN_EXCEPTION";




    public static final String JSON_PARSING_ERR = "JSON_PARSING_ERR";

    public static final String PDF_UTILITY_EXCEPTION = "PDF_UTILITY_EXCEPTION";
    public static final String WITNESS_DEPOSITION_UPDATE_EXCEPTION = "Exception while uploading witness deposition pdf";

    public static final String ACCUSED = "ACCUSED";
    public static final String COMPLAINANT = "COMPLAINANT";
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
            + "\"serialNumber\": %d"
            + "}"
            + "}"
            + "}\n";


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

    public static final String SUMMONS = "SUMMONS";

    public static final String PENDING_PAYMENT = "PENDING_PAYMENT";

    public static final String EXPIRE = "EXPIRE";

    public static final String ABANDONED = "ABANDONED";

    public static final String PAYMENTTYPE = "paymentType";

    public static final String SUMMON = "SUMMONS";

    public static final String MANUAL = "MANUAL_";

    public static final String FILE_STORE_UTILITY_EXCEPTION = "FILE_STORE_UTILITY_EXCEPTION";
    public static final String ESIGN_SERVICE_EXCEPTION = "ESIGN_SERVICE_EXCEPTION";

    public static final String FILE_STORE_SERVICE_EXCEPTION_CODE = "FILE_STORE_SERVICE_EXCEPTION_CODE";
    public static final String FILE_STORE_SERVICE_EXCEPTION_MESSAGE = "FILE_STORE_SERVICE_EXCEPTION_MESSAGE";

    public static final String E_SIGN = "E-SIGN";
    public static final String SIGNED = "SIGNED";
    public static final String COMPOSITE = "COMPOSITE";

    public static final String COORDINATES_ERROR = "COORDINATES_ERROR";
    public static final String EMPTY_ORDERS_ERROR = "EMPTY_ORDERS_ERROR";
    public static final String ORDER_SIGN_ERROR = "ORDER_SIGN_ERROR";
    public static final String UPDATE_ORDER_SIGN_ERROR = "UPDATE_ORDER_SIGN_ERROR";
    public static final String UPDATE_ORDER_SIGN_ERROR_MESSAGE = "Error while updating order with signed doc";
    public static final String XML_CREATE_ERROR = "XML_CREATE_ERROR";
    public static final String XML_CREATE_ERROR_MESSAGE = "error while creating XML";
    public static final String INVALID_FILE_STORE_RESPONSE = "INVALID_FILE_STORE_RESPONSE";
    public static final String FILESTORE_SERVICE_EXCEPTION = "FILESTORE_SERVICE_EXCEPTION";
    public static final String FILE_STORE_UTILITY_MESSAGE_CODE = "Error occurred when getting saving document in File Store";
    public static final String FILE_STORE_SERVICE_EXCEPTION_MESSAGE_CODE = "Failed to get valid file store id from file store service response";
    public static final String INVALID_INPUT = "INVALID_INPUT";

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
    public static final String DATA = "data";
    public static final String OMIT_XML_DECLARATION = "omit-xml-declaration";
    public static final String EMPTY_BAILS_ERROR = "EMPTY_BAILS_ERROR";
    public static final String UNSIGNED = "UNSIGNED";

    private static final String FILE_STORE_ID_KEY = "fileStoreId";
    private static final String FILES_KEY = "files";
    private static final String DOCUMENT_TYPE_PDF = "application/pdf";


    public static final String ERROR_WHILE_CREATING_SURETY = "ERROR_WHILE_CREATING_SURETY";
    public static final String ERROR_WHILE_FETCHING_FROM_SURETY = "ERROR_WHILE_FETCHING_FROM_SURETY";

    public static final String EMPTY_SURETY_ERROR = "EMPTY_SURETY_ERROR";


}
