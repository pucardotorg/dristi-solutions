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

    // Advocate Office Management Exception Codes and Messages
    public static final String MEMBER_ALREADY_EXISTS = "MEMBER_ALREADY_EXISTS";
    public static final String MEMBER_ALREADY_EXISTS_MESSAGE = "Member already exists in the office";

    public static final String USER_INFO_ERROR = "USER_INFO_ERROR";
    public static final String USER_INFO_NULL_MESSAGE = "User info cannot be null";
    public static final String USER_UUID_NULL_MESSAGE = "User uuid cannot be null";
    public static final String UNAUTHORIZED = "UNAUTHORIZED";
    public static final String CANNOT_ADD_MEMBER_MESSAGE = "officeAdvocateId must match RequestInfo.userInfo.uuid";
    public static final String CANNOT_LEAVE_OFFICE_MESSAGE = "RequestInfo.userInfo.uuid must match either officeAdvocateId or memberId";
    
    public static final String MEMBER_NOT_FOUND = "MEMBER_NOT_FOUND";
    public static final String MEMBER_NOT_FOUND_MESSAGE = "Member not found in the office";
    
    public static final String SEARCH_CRITERIA_NULL = "SEARCH_CRITERIA_NULL";
    public static final String SEARCH_CRITERIA_NULL_MESSAGE = "Search criteria cannot be null";
    
    public static final String ADD_MEMBER_ERROR = "ADD_MEMBER_ERROR";
    public static final String ADD_MEMBER_ERROR_MESSAGE = "Error while adding member: ";
    
    public static final String LEAVE_OFFICE_ERROR = "LEAVE_OFFICE_ERROR";
    public static final String LEAVE_OFFICE_ERROR_MESSAGE = "Error while processing leave office: ";

    public static final String UPDATE_MEMBER_ACCESS_ERROR = "UPDATE_MEMBER_ACCESS_ERROR";
    public static final String UPDATE_MEMBER_ACCESS_ERROR_MESSAGE = "Error while updating member access: ";
    
    public static final String SEARCH_MEMBER_ERROR = "SEARCH_MEMBER_ERROR";
    public static final String SEARCH_MEMBER_ERROR_MESSAGE = "Error while searching members: ";
    
    public static final String MEMBER_SEARCH_QUERY_EXCEPTION = "MEMBER_SEARCH_QUERY_EXCEPTION";
    public static final String MEMBER_SEARCH_QUERY_EXCEPTION_MESSAGE = "Exception occurred while building the member search query: ";
    
    public static final String SEARCH_MEMBER_ERR = "SEARCH_MEMBER_ERR";
    public static final String ARGS_SIZE_MISMATCH_MESSAGE = "Args and ArgTypes size mismatch";
    public static final String SEARCH_MEMBER_ERR_MESSAGE = "Exception while fetching member list: ";
    
    public static final String ROW_MAPPER_ERROR = "ROW_MAPPER_ERROR";
    public static final String ROW_MAPPER_ERROR_MESSAGE = "Error mapping AddMember result set: ";

    public static final String INDIVIDUAL_NOT_FOUND = "INDIVIDUAL_NOT_FOUND";
    public static final String ADVOCATE_NOT_FOUND = "ADVOCATE_NOT_FOUND";
    public static final String ADVOCATE_CLERK_NOT_FOUND = "ADVOCATE_CLERK_NOT_FOUND";
    public static final String ADVOCATE_NOT_FOUND_MESSAGE = "Advocate not found";
    public static final String ADVOCATE_CLERK_NOT_FOUND_MESSAGE = "Advocate clerk not found";

    public static final String PROCESS_VALIDATION_ERROR = "PROCESS_VALIDATION_ERROR";

}
