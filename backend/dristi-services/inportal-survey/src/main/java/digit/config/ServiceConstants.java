package digit.config;


import org.springframework.stereotype.Component;


@Component
public class ServiceConstants {

    public static final String RES_MSG_ID = "uief87324";
    public static final String SUCCESSFUL = "successful";
    public static final String FAILED = "failed";


    public static final String EXTERNAL_SERVICE_EXCEPTION = "External Service threw an Exception: ";
    public static final String SEARCHER_SERVICE_EXCEPTION = "Exception while fetching from searcher: ";
    public static final String INVALID_REQUEST = "Invalid Request: ";
    public static final String REQUEST_NULL = "Request can not be null";
    public static final String REQUEST_INFO_NULL = "RequestInfo can not be null";
    public static final String USER_INFO_NULL = "UserInfo can not be null";
    public static final String USER_ID_NULL = "UserId can not be null";
    public static final String ELIGIBILITY_CHECK_EXCEPTION = "Exception while checking eligibility: ";
    public static final String ROW_MAPPER_EXCEPTION = "ROW_MAPPER_EXCEPTION";
    public static final String SURVEY_TRACKER_SEARCH_EXCEPTION = "SURVEY_TRACKER_SEARCH_EXCEPTION";
    public static final String REMIND_ME_LATER_EXCEPTION = "REMIND_ME_LATER_EXCEPTION";
    public static final String FEED_BACK_EXCEPTION = "FEED_BACK_EXCEPTION";

    // roles
    public static final String ADVOCATE_ROLE = "ADVOCATE_ROLE";
    public static final String ADVOCATE = "ADVOCATE";
    public static final String LITIGANT = "LITIGANT";

    // MDMS
    public static final String ERROR_WHILE_FETCHING_FROM_MDMS = "Exception while fetching from MDMS: ";

}
