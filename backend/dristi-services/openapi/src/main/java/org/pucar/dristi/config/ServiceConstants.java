package org.pucar.dristi.config;


import org.springframework.stereotype.Component;


@Component
public class ServiceConstants {

    public static final String EXTERNAL_SERVICE_EXCEPTION = "External Service threw an Exception: ";
    public static final String SEARCHER_SERVICE_EXCEPTION = "Exception while fetching from searcher: ";
    public static final String INVALID_SEARCH_CASE_CRITERIA_EXCEPTION = "INVALID_SEARCH_CASE_CRITERIA_EXCEPTION";

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

    public static final String HEARING_SERVICE_EXCEPTION = "Exception while fetching hearing details from hearing service: ";
    public static final String HEARING_SCHEDULED_STATUS = "SCHEDULED";
    public static final String REGISTRATION_DATE = "registrationDate";

    public static final String CASE_TYPE_CMP = "CMP";
    public static final String CASE_TYPE_ST = "ST";
    public static final String CASE_TYPE_EXCEPTION = "CASE_TYPE_EXCEPTION";

    public static final String HEARING_BUSINESS_SERVICE = "hearing-default";
    public static final String OPENAPI_BUSINESS_SERVICE = "openapi";
    public static final String OPENAPI_MODULE_NAME = "Openapi Service";

    public static final String ERROR_WHILE_FETCHING_FROM_ADVOCATE = "ERROR_WHILE_FETCHING_FROM_ADVOCATE";
    public static final String COURT_CASE_JSON_PATH="$.criteria[0].responseList[0]";
    public static final String ERROR_CASE_SEARCH = "error executing case search query";


    public static final String ERROR_WHILE_FETCHING_FROM_BAIL = "ERROR_WHILE_FETCHING_FROM_BAIL";
    public static final String BAIL_NOT_FOUND_EXCEPTION = "BAIL_NOT_FOUND_EXCEPTION";
    public static final String ORDER_NOT_FOUND_EXCEPTION = "ORDER_NOT_FOUND_EXCEPTION";

    public static final String INTERNALMICROSERVICEROLE_NAME = "Internal Microservice Role";

    public static final String INTERNALMICROSERVICEROLE_CODE = "INTERNAL_MICROSERVICE_ROLE";

    public static final String INTERNALMICROSERVICEUSER_USERNAME = "INTERNAL_USER";

    public static final String INTERNALMICROSERVICEUSER_NAME = "Internal Microservice User";

    public static final String INTERNALMICROSERVICEUSER_MOBILENO = "9999999999";

    public static final String INTERNALMICROSERVICEUSER_TYPE = "SYSTEM";

    public static final String msgId = "1730882648558|en_IN";

    public static final String BAIL_BOND_CREATOR = "BAIL_BOND_CREATOR";

    public static final String E_SIGN = "E-SIGN";

    public static final String SYSTEM = "SYSTEM";

    public static final String EVIDENCE_NOT_FOUND_EXCEPTION = "EVIDENCE_NOT_FOUND_EXCEPTION";

    public static final String EVIDENCE_SERVICE_EXCEPTION = "EVIDENCE_SERVICE_EXCEPTION";

    public static final String EVIDENCE_UPDATE_EXCEPTION = "EVIDENCE_UPDATE_EXCEPTION";

    public static final String DISPOSED = "DISPOSED";

    public static final String PENDING = "PENDING";

    public static final String DIGITALIZE_SERVICE_EXCEPTION = "DIGITALIZE_SERVICE_EXCEPTION";

    public static final String DIGITALIZE_UPDATE_EXCEPTION = "DIGITALIZE_UPDATE_EXCEPTION";

}
