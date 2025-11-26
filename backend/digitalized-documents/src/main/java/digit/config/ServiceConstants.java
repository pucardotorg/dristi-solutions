package digit.config;


import org.springframework.stereotype.Component;


@Component
public class ServiceConstants {

    public static final String EXTERNAL_SERVICE_EXCEPTION = "External Service threw an Exception: ";
    public static final String SEARCHER_SERVICE_EXCEPTION = "Exception while fetching from searcher: ";

    public static final String IDGEN_ERROR = "IDGEN ERROR";
    public static final String NO_IDS_FOUND_ERROR = "No ids returned from idgen Service";

    public static final String RES_MSG_ID = "uief87324";
    public static final String SUCCESSFUL = "successful";
    public static final String FAILED = "failed";

    public static final String URL = "url";
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

    // mediation
    public static final String INVALID_ORDER_NUMBER = "INVALID_ORDER_NUMBER";

    public static final String INVALID_MEDIATION_DETAILS = "INVALID_MEDIATION_DETAILS";

    // Workflow actions
    public static final String SKIP_SIGN_AND_SUBMIT = "SKIP_SIGN_AND_SUBMIT";
    public static final String EDIT = "EDIT";
    public static final String E_SIGN = "E_SIGN";
    public static final String E_SIGN_COMPLETE = "E_SIGN_COMPLETE";
    public static final String SYSTEM = "SYSTEM";

}
