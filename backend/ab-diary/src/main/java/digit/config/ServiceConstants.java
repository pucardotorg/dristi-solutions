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


    public static final String VALIDATION_EXCEPTION = "VALIDATION_EXCEPTION";
    public static final String ENRICHMENT_EXCEPTION = "ENRICHMENT_EXCEPTION";
    public static final String DIARY_ENTRY_CREATE_EXCEPTION = "Exception during creating diary entry";
    public static final String DIARY_ENTRY_UPDATE_EXCEPTION = "Exception during updating diary entry";
    public static final String DIARY_ENTRY_QUERY_EXCEPTION = "DIARY_ENTRY_QUERY_EXCEPTION";
    public static final String DIARY_ENTRY_SEARCH_EXCEPTION = "DIARY_ENTRY_SEARCH_EXCEPTION";
    public static final String ROW_MAPPER_EXCEPTION = "ROW_MAPPER_EXCEPTION";

    public static final String DIARY_UPDATE_EXCEPTION = "Exception during updating case diary";
    public static final String DIARY_QUERY_EXCEPTION = "DIARY_QUERY_EXCEPTION";
    public static final String DIARY_SEARCH_EXCEPTION = "DIARY_SEARCH_EXCEPTION";
    public static final String DIARY_GENERATE_EXCEPTION = "DIARY_GENERATE_EXCEPTION";
    public static final String FILE_STORE_UTILITY_EXCEPTION = "FILE_STORE_UTILITY_EXCEPTION";
    public static final String WORKFLOW_SERVICE_EXCEPTION = "WORKFLOW_SERVICE_EXCEPTION";

    public static final String ERROR_FROM_CASE = "ERROR_WHILE_FETCHING_FROM_CASE_SERVICE";

    public static final String SIGN_ACTION = "SIGN";

    public static final String GENERATE_ACTION = "GENERATE";

    public static final String SIGNED_DOCUMENT_TYPE = "casediary.signed";

    public static final String UNSIGNED_DOCUMENT_TYPE = "casediary.unsigned";

    public static final String DIARY_TYPE = "ADiary";

    public static final String IST_TIME_ZONE = "Asia/Kolkata";

    public static final String SYSTEM="SYSTEM";

    public static final String INTERNALMICROSERVICEROLE_NAME = "SYSTEM";

    public static final String INTERNALMICROSERVICEROLE_CODE = "SYSTEM";

    public static final String INTERNALMICROSERVICEUSER_NAME = "Internal Microservice User";

    public static final String INTERNALMICROSERVICEUSER_USERNAME = "INTERNAL_SYSTEM_USER";

    public static final String INTERNALMICROSERVICEUSER_MOBILENO = "1234567890";

    public static final String INTERNALMICROSERVICEUSER_TYPE = "SYSTEM";

    public static final String msgId = "1730882648558|en_IN";

}
