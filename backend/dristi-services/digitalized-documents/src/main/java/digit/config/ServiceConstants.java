package digit.config;


import org.springframework.stereotype.Component;


@Component
public class ServiceConstants {

    public static final String EXTERNAL_SERVICE_EXCEPTION = "External Service threw an Exception: ";
    public static final String SEARCHER_SERVICE_EXCEPTION = "Exception while fetching from searcher: ";
    public static final String ERROR_WHILE_FETCHING_FROM_CASE = "ERROR_WHILE_FETCHING_FROM_CASE";

    public static final String IDGEN_ERROR = "IDGEN ERROR";
    public static final String NO_IDS_FOUND_ERROR = "No ids returned from idgen Service";

    public static final String RES_MSG_ID = "uief87324";
    public static final String SUCCESSFUL = "successful";
    public static final String FAILED = "failed";

    public static final String URL = "url";
    public static final String REFERENCE_ID = "referenceId";
    public static final String URL_SHORTENING_ERROR_CODE = "URL_SHORTENING_ERROR";
    public static final String URL_SHORTENING_ERROR_MESSAGE = "Unable to shorten url: ";

    public static final String PARSING_ERROR = "PARSING ERROR";
    public static final String FAILED_TO_PARSE_BUSINESS_SERVICE_SEARCH = "Failed to parse response of workflow business service search";
    public static final String WORKFLOW_SERVICE_EXCEPTION = "WORKFLOW_SERVICE_EXCEPTION";
    public static final String BUSINESS_SERVICE_NOT_FOUND = "BUSINESSSERVICE_NOT_FOUND";
    public static final String THE_BUSINESS_SERVICE = "The businessService ";
    public static final String NOT_FOUND = " is not found";
    public static final String TENANTID = "?tenantId=";
    public static final String BUSINESS_SERVICES = "&businessServices=";

    public static final String INVALID_DOCUMENT_TYPE = "INVALID_DOCUMENT_TYPE";

    public static final String SERVICE_NOT_FOUND = "SERVICE_NOT_FOUND";

    public static final String CREATE_DIGITALIZED_DOCUMENT_FAILED = "CREATE_DIGITALIZED_DOCUMENT_FAILED";

    public static final String UPDATE_DIGITALIZED_DOCUMENT_FAILED = "UPDATE_DIGITALIZED_DOCUMENT_FAILED";

    // mediation
    public static final String INVALID_ORDER_NUMBER = "INVALID_ORDER_NUMBER";

    public static final String INVALID_MEDIATION_DETAILS = "INVALID_MEDIATION_DETAILS";

    // Workflow actions
    public static final String SKIP_SIGN_AND_SUBMIT = "SKIP_SIGN_AND_SUBMIT";
    public static final String EDIT = "EDIT";
    public static final String E_SIGN = "E-SIGN";
    public static final String SIGN = "SIGN";
    public static final String INITIATE_E_SIGN = "INITIATE_E-SIGN";
    public static final String E_SIGN_COMPLETE = "E-SIGN_COMPLETE";
    public static final String SYSTEM = "SYSTEM";

    public static final String VALIDATION_ERROR = "VALIDATION_ERROR";
    public static final String INVALID_INPUT = "INVALID_INPUT";
    public static final String FILE_STORE_SERVICE_EXCEPTION_CODE = "FILE_STORE_SERVICE_EXCEPTION_CODE";
    public static final String FILE = "file";

    public static final String NOTIFICATION_ENG_LOCALE_CODE = "en_IN";
    public static final String NOTIFICATION_MODULE_CODE = "notification";
    public static final String NOTIFICATION_LOCALIZATION_CODES_JSONPATH = "$.messages.*.code";
    public static final String NOTIFICATION_LOCALIZATION_MSGS_JSONPATH = "$.messages.*.message";

    public static final String SIGN_EXAMINATION_DOCUMENT = "SIGN_EXAMINATION_DOCUMENT";
    public static final String SIGN_PLEA_DOCUMENT = "SIGN_PLEA_DOCUMENT";
    public static final String SIGN_MEDIATION_DOCUMENT = "SIGN_MEDIATION_DOCUMENT";

    public static final String MEDIATION_CREATOR = "MEDIATION_CREATOR";
    public static final String PLEA_CREATOR = "PLEA_CREATOR";
    public static final String EXAMINATION_CREATOR = "EXAMINATION_CREATOR";
    public static final String SYSTEM_ADMIN = "SYSTEM_ADMIN";
    public static final String ESIGN_SERVICE_EXCEPTION = "ESIGN_SERVICE_EXCEPTION";

    public static final String COMMAND = "command";
    public static final String PKI_NETWORK_SIGN = "pkiNetworkSign";
    public static final String TIME_STAMP = "ts";
    public static final String TXN = "txn";
    public static final String NAME = "name";
    public static final String VALUE = "value";
    public static final String TYPE = "type";
    public static final String PDF = "pdf";
    public static final String ATTRIBUTE = "attribute";
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


}
