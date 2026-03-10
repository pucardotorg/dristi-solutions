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

    public static final String ENG_LOCALE_CODE = "en_IN";

    public static final String NOTIFICATION_MODULE_CODE = "notification";

    public static final String MODULE_CODE = "rainmaker-common,rainmaker-home,rainmaker-case,rainmaker-orders,rainmaker-hearings,rainmaker-submission";

    public static final String LOCALIZATION_CODES_JSONPATH = "$.messages.*.code";
    public static final String LOCALIZATION_MSGS_JSONPATH = "$.messages.*.message";


    public static final String INDIVIDUAL_UTILITY_EXCEPTION = "INDIVIDUAL_UTILITY_EXCEPTION";

    public static final String CTC_APPLICATION_UPDATE_EXCEPTION = "CTC_APPLICATION_UPDATE_EXCEPTION";
    public static final String CTC_VALIDATION_EXCEPTION = "CTC_VALIDATION_EXCEPTION";
    public static final String ERROR_WHILE_CREATING_DEMAND_FOR_GENERIC_TASK = "ERROR_WHILE_CREATING_DEMAND_FOR_GENERIC_TASK";

    public static final String ES_ERRORS_PATH = "$.errors";
    public static final String ES_INDEX_HEADER_FORMAT = "{\"index\":{\"_index\":\"%s\",\"_id\":\"%s\"}}\n";
    public static final String ES_ISSUE_CTC_DOC_FORMAT =
            "{\"Data\": {"
                    + "\"docId\": \"%s\","
                    + "\"ctcApplicationNumber\": \"%s\","
                    + "\"createdTime\": %d,"
                    + "\"lastModifiedTime\": %d,"
                    + "\"docTitle\": \"%s\","
                    + "\"status\": \"%s\","
                    + "\"caseTitle\": \"%s\","
                    + "\"caseNumber\": \"%s\","
                    + "\"filingNumber\": \"%s\","
                    + "\"courtId\": \"%s\","
                    + "\"tenantId\": \"%s\","
                    + "\"fileStoreId\": \"%s\""
                    + "}}\n";
    public static final String ES_UPDATE_BY_QUERY_STATUS =
            "{\"query\":{\"term\":{\"Data.docId.keyword\":\"%s\"}},"
                    + "\"script\":{\"source\":\"ctx._source.Data.status=params.status;ctx._source.Data.lastModifiedTime=params.time;ctx._source.Data.documents=params.documents;\","
                    + "\"lang\":\"painless\","
                    + "\"params\":{\"status\":\"%s\",\"time\":%d,\"documents\":%s}}}";

    public static final String ES_SEARCH_DOCS_BY_APPLICATION =
            "{\"query\":{\"term\":{\"Data.ctcApplicationNumber.keyword\":\"%s\"}},"
                    + "\"_source\":[\"Data.status\"],\"size\":1000}";

    public static final String ES_CTC_APPLICATION_TRACKER_FORMAT =
            "{\"Data\": {"
                    + "\"tenantId\": \"%s\","
                    + "\"courtId\": \"%s\","
                    + "\"filingNumber\": \"%s\","
                    + "\"ctcApplicationNumber\": \"%s\","
                    + "\"status\": \"%s\","
                    + "\"dateRaised\": %d,"
                    + "\"applicantName\": \"%s\","
                    + "\"caseTitle\": \"%s\","
                    + "\"caseNumber\": \"%s\","
                    + "\"isActive\": %b,"
                    + "\"searchableFields\": %s"
                    + "}}\n";
    public static final String ES_DEACTIVATE_TRACKER_BY_APPLICATION =
            "{\"query\":{\"term\":{\"Data.ctcApplicationNumber.keyword\":\"%s\"}},"
                    + "\"script\":{\"source\":\"ctx._source.Data.isActive=false;\","
                    + "\"lang\":\"painless\"}}";
    public static final String CTC_APPLICATION_TRACKER_INDEX_EXCEPTION = "CTC_APPLICATION_TRACKER_INDEX_EXCEPTION";
    public static final String CTC_ISSUE_DOCUMENTS_INDEX_EXCEPTION = "CTC_ISSUE_DOCUMENTS_INDEX_EXCEPTION";
    public static final String CTC_ISSUE_DOCUMENTS_UPDATE_EXCEPTION = "CTC_ISSUE_DOCUMENTS_UPDATE_EXCEPTION";

    public static final String ACTION_ISSUE = "ISSUE";
    public static final String ACTION_REJECT = "REJECT";
    public static final String STATUS_ISSUED = "ISSUED";
    public static final String STATUS_REJECTED = "REJECTED";

    public static final String MOBILE_PATTERN = "Pattern.compile(\"^[6-9]\\\\d{9}$\")";

    public static final String ADVOCATE_ROLE = "ADVOCATE_ROLE";

    public static final String CITIZEN_ROLE = "CITIZEN";

    public static final String POA = "POA";

    public static final String ADVOCATE_NAME = "advocateName";

    public static final String ADVOCATE_UUID = "uuid";

    public static final String ADVOCATE = "Advocate";

    public static final String COMPLAINANT = "Complainant";

    public static final String ACCUSED = "Accused";

    public static final String E_SIGN = "ESIGN";

    public static final String UPLOAD_SIGNED_COPY = "UPLOAD_SIGNED_COPY";

    public static final String CTC_APPLICATION_FEE  = "_CTC_APPLICATION_FEE";

    public static final String PENDING_ISSUE = "PENDING_ISSUE";
    public static final String PARTIALLY_ISSUED = "PARTIALLY_ISSUED";

    public static final String WF_ACTION_ISSUE = "ISSUE";
    public static final String WF_ACTION_ISSUE_ALL = "ISSUE_ALL";
    public static final String WF_ACTION_REJECT = "REJECT";
    public static final String WF_ACTION_REJECT_ALL = "REJECT_ALL";

}
