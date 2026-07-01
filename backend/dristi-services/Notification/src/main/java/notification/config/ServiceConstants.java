package notification.config;


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
    public static final String EXISTS_NOTIFICATION_EXCEPTION = "EXISTS_NOTIFICATION_EXCEPTION";
    public static final String NOTIFICATION_SEARCH_QUERY_EXCEPTION = "NOTIFICATION_SEARCH_QUERY_EXCEPTION";


}
