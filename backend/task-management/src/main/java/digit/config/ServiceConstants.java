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

    //payment constants
    public static final String PAYMENT_MODULE_NAME = "payment";
    public static final String PAYMENT_TYPE_MASTER_NAME = "paymentType";
    public static final String FILTER_PAYMENT_TYPE = "$.[?(@.suffix == '%s' && @.businessService[?(@.businessCode == '%s')])]";
    public static final String FILTER_PAYMENT_TYPE_DELIVERY_CHANNEL = "$[?(@.deliveryChannel == '%s' && @.businessService[?(@.businessCode == '%s')])]";

}
