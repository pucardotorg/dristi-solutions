package digit.config;


import org.springframework.stereotype.Component;


@Component
public class ServiceConstants {

    public static final String EXTERNAL_SERVICE_EXCEPTION = "External Service threw an Exception: ";
    public static final String SEARCHER_SERVICE_EXCEPTION = "Exception while fetching from searcher: ";

    public static final String IDGEN_ERROR = "IDGEN ERROR";
    public static final String NO_IDS_FOUND_ERROR = "No ids returned from idgen Service";

    //ERROR CONSTANTS
    public static final String ERROR_WHILE_FETCHING_FROM_MDMS = "Exception occurred while fetching category lists from mdms: ";
    public static final String ERROR_WHILE_FETCHING_FROM_CASE = "ERROR_WHILE_FETCHING_FROM_CASE";
    public static final String ERROR_WHILE_FETCHING_FROM_ORDER = "ERROR_WHILE_FETCHING_FROM_ORDER";

    public static final String RES_MSG_ID = "uief87324";
    public static final String SUCCESSFUL = "successful";
    public static final String FAILED = "failed";

    public static final String URL = "url";
    public static final String URL_SHORTENING_ERROR_CODE = "URL_SHORTENING_ERROR";
    public static final String URL_SHORTENING_ERROR_MESSAGE = "Unable to shorten url: ";

    public static final String CREATE_TASK_MANAGEMENT_EXCEPTION = "CREATE_TASK_MANAGEMENT_EXCEPTION";
    public static final String WORKFLOW_SERVICE_EXCEPTION = "WORKFLOW_SERVICE_EXCEPTION";
    public static final String PAYMENT_CALCULATOR_ERROR = "PAYMENT_CALCULATOR_ERROR";
    public static final String ERROR_WHILE_CREATING_DEMAND_FOR_TASK_MANAGEMENT = "ERROR_WHILE_CREATING_DEMAND_FOR_TASK_MANAGEMENT";

    public static final String SUMMONS = "SUMMONS";
    public static final String NOTICE = "NOTICE";
    public static final String SMS = "SMS";
    public static final String EMAIL = "EMAIL";

    // workflow actions
    public static final String UPDATE = "UPDATE";
    public static final String CREATE = "CREATE";
    public static final String UPDATE_UPFRONT_PAYMENT = "UPDATE_UPFRONT_PAYMENT";
    public static final String COMPLETE_TASK_CREATION = "COMPLETE_TASK_CREATION";
    public static final String CREATE_WITH_OUT_PAYMENT = "CREATE_WITH_OUT_PAYMENT";
    public static final String COMPLETED = "COMPLETED";
    public static final String MAKE_PAYMENT = "MAKE_PAYMENT";

    public static final String WITNESS ="WITNESS";
    public static final String ACCUSED = "ACCUSED";
    public static final String INDIVIDUAL = "INDIVIDUAL";
    public static final String COMPLAINANT_PRIMARY = "complainant.primary";
    public static final String SYSTEM_ADMIN = "SYSTEM_ADMIN";
    public static final String MANUAL = "MANUAL_";
    public static final String PAYMENT_RECEIPT = "PAYMENT_RECEIPT";
    public static final String ONLINE = "ONLINE";
    public static final String TASK_CREATOR = "TASK_CREATOR";
}
