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
    public static final String ERROR_WHILE_FETCHING_FROM_CASE = "Exception occurred while fetching case details: ";
    public static final String SUCCESSFUL = "successful";
    public static final String FAILED = "failed";

    public static final String PARSING_ERROR = "PARSING ERROR";
    public static final String FAILED_TO_PARSE_BUSINESS_SERVICE_SEARCH = "Failed to parse response of workflow business service search";
    public static final String BUSINESS_SERVICE_NOT_FOUND = "BUSINESSSERVICE_NOT_FOUND";
    public static final String THE_BUSINESS_SERVICE = "The businessService ";
    public static final String NOT_FOUND = " is not found";
    public static final String TENANTID = "?tenantId=";
    public static final String BUSINESS_SERVICES = "&businessServices=";

    public static final String ENG_LOCALE_CODE = "en_IN";

    public static final String NOTIFICATION_MODULE_CODE = "notification";

    public static final String MODULE_CODE = "rainmaker-common,rainmaker-home,rainmaker-case,rainmaker-orders,rainmaker-hearings,rainmaker-submission";

    public static final String LOCALIZATION_CODES_JSONPATH = "$.messages.*.code";
    public static final String LOCALIZATION_MSGS_JSONPATH = "$.messages.*.message";


    public static final String INDIVIDUAL_UTILITY_EXCEPTION = "INDIVIDUAL_UTILITY_EXCEPTION";

    public static final String ERROR_WHILE_FETCHING_FROM_HEARING_SERVICE = "ERROR_WHILE_FETCHING_FROM_HEARING_SERVICE";
    
    public static final String YYYY_MM_DD = "yyyy-MM-dd";

    public static final String CTC_APPLICATION_EXISTS_EXCEPTION = "CTC_APPLICATION_EXISTS_EXCEPTION";
    public static final String CTC_APPLICATION_CREATE_EXCEPTION = "CTC_APPLICATION_CREATE_EXCEPTION";
    public static final String CTC_APPLICATION_UPDATE_EXCEPTION = "CTC_APPLICATION_UPDATE_EXCEPTION";
    public static final String CTC_APPLICATION_SEARCH_EXCEPTION = "CTC_APPLICATION_SEARCH_EXCEPTION";
    public static final String CTC_VALIDATION_EXCEPTION = "CTC_VALIDATION_EXCEPTION";
    public static final String MOBILE_NOT_REGISTERED_WITH_CASE = "MOBILE_NOT_REGISTERED_WITH_CASE";
    public static final String CTC_APPLICATION_NUMBER_PREFIX = "CA";
    public static final String CTC_BASE_FEE = "20";
    public static final String CTC_PER_PAGE_FEE = "1.5";
    public static final String CTC_STATUS_PENDING = "PENDING";
    public static final String CTC_STATUS_APPROVED = "APPROVED";
    public static final String CTC_STATUS_REJECTED = "REJECTED";
    public static final String CTC_STATUS_PAYMENT_PENDING = "PAYMENT_PENDING";
    public static final String CTC_STATUS_ISSUED = "ISSUED";
}
