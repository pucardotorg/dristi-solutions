package org.egov.eTreasury.config;


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

    public static final String AUTH_TOKEN = "authToken";

    public static final String TRANSFORMATION = "AES/ECB/PKCS5Padding";

    public static final String AUTHENTICATION_FAILED = "AUTHENTICATION_FAILED";

    public static final String AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR";

    public static final String PAYMENT_PROCESSING_ERROR = "PAYMENT_PROCESSING_ERROR";

    public static final String AUTH_SEK_NOT_FOUND = "AUTH_SEK_NOT_FOUND";
    public static final String TREASURY_RESPONSE_ERROR = "TREASURY_RESPONSE_ERROR";

    public static final String INVALID_BILL_ID = "PAYMENT_RECEIPT_INVALID_BILL_ID";

    public static final String FILESTORE_UTILITY_EXCEPTION = "FILESTORE_UTILITY_EXCEPTION";
    public static final String INVALID_FILE_STORE_ID = "INVALID_FILE_STORE_ID";

    public static final String PDFSERVICE_UTILITY_EXCEPTION = "PDFSERVICE_UTILITY_EXCEPTION";

    public static final String FILE_STORE_ID_KEY = "fileStoreId";
    public static final String FILES_KEY = "files";
    public static final String DOCUMENT_TYPE_PDF = "application/pdf";
    public static final String BREAKUP_TO_HEAD_MASTER = "breakUpToHeadMapping";
    public static final String PAYMENT_TO_BREAKUP_MASTER = "paymentTypeToBreakupMapping";
    public static final String PAYMENT_TYPE_MASTER = "paymentType";
    public static final String PAYMENTMASTERCODE = "PaymentMasterCode";
    public static final String PAYMENT_DISTRIBUTION_EXISTS = "PAYMENT_DISTRIBUTION_EXISTS";
    public static final String DEMAND_CREATION_ERROR = "DEMAND_CREATION_ERROR";
    public static final String MDMS_DATA_MISSING = "MDMS_DATA_MISSING";
    public static final String PAYMENT_TYPE_NOT_FOUND = "PAYMENT_TYPE_NOT_FOUND";
    public static final String PAYMENT_BREAKUP_NOT_FOUND = "PAYMENT_BREAKUP_NOT_FOUND";
    public static final String BREAKUP_TO_HEAD_NOT_FOUND = "BREAKUP_TO_HEAD_NOT_FOUND";
    public static final String PARTIAL_LIABILITY = "PARTIAL_LIABILITY";
    public static final String DELAY_CONDONATION_FEE = "DELAY_CONDONATION_FEE";
    public static final Long TWO_YEARS_IN_MILLISECOND = (365 * 2 + 1) * 24L * 60 * 60 * 1000;
    public static final String CASE_TYPE = "NIA S138";
    public static final String COURT_FEE = "COURT_FEE";
    public static final String ADVOCATE_WELFARE_FUND = "ADVOCATE_WELFARE_FUND";
    public static final String ADVOCATE_CLERK_WELFARE_FUND = "ADVOCATE_CLERK_WELFARE_FUND";
    public static final String LEGAL_BENEFIT_FEE = "LEGAL_BENEFIT_FEE";
    public static final String EPOST_FEE = "E_POST";
    public static final String COMPLAINT_FEE = "COMPLAINT_FEE";
    public static final String APPLICATION_FEE = "APPLICATION_FEE";
    public static final String PETITION_FEE = "PETITION_FEE";
    public static final String CASE_DEFAULT_ENTITY_TYPE = "case-default";
    public static final String INDIVIDUAL_UTILITY_EXCEPTION = "INDIVIDUAL_UTILITY_EXCEPTION";
    public static final String NOTIFICATION_ENG_LOCALE_CODE = "en_IN";
    public static final String NOTIFICATION_MODULE_CODE = "notification";
    public static final String NOTIFICATION_LOCALIZATION_CODES_JSONPATH = "$.messages.*.code";
    public static final String NOTIFICATION_LOCALIZATION_MSGS_JSONPATH = "$.messages.*.message";
    public static final String PAYMENT_COMPLETED_SUCCESSFULLY = "PAYMENT_COMPLETED_SUCCESSFULLY";

}
