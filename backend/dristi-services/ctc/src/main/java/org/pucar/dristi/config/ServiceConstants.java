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
                    + "\"id\": \"%s\","
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
            "{\"query\":{\"bool\":{\"must\":[{\"term\":{\"Data.docId.keyword\":\"%s\"}},{\"term\":{\"Data.ctcApplicationNumber.keyword\":\"%s\"}}]}},"
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
                    + "\"searchableFields\": %s"
                    + "}}\n";
    public static final String ES_UPDATE_TRACKER_STATUS_BY_APPLICATION =
            "{\"query\":{\"term\":{\"Data.ctcApplicationNumber.keyword\":\"%s\"}},"
                    + "\"script\":{\"source\":\"ctx._source.Data.status=params.status;\","
                    + "\"lang\":\"painless\","
                    + "\"params\":{\"status\":\"%s\"}}}";
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

    // ESign constants
    public static final String ESIGN_SERVICE_EXCEPTION = "ESIGN_SERVICE_EXCEPTION";
    public static final String FILE_STORE_UTILITY_EXCEPTION = "FILE_STORE_UTILITY_EXCEPTION";
    public static final String COORDINATES_ERROR = "COORDINATES_ERROR";
    public static final String CTC_SIGN_ERROR = "CTC_SIGN_ERROR";
    public static final String CTC_BULK_SIGN_EXCEPTION = "CTC_BULK_SIGN_EXCEPTION";
    public static final String XML_CREATE_ERROR = "XML_CREATE_ERROR";
    public static final String XML_CREATE_ERROR_MESSAGE = "error while creating XML";
    public static final String OMIT_XML_DECLARATION = "omit-xml-declaration";
    public static final String SIGNED = "SIGNED";
    public static final String CTC_DOC_PDF_NAME = "CtcDocument.pdf";

    // XML request constants
    public static final String COMMAND = "command";
    public static final String PKI_NETWORK_SIGN = "pkiNetworkSign";
    public static final String TIME_STAMP = "ts";
    public static final String TXN = "txn";
    public static final String NAME = "name";
    public static final String VALUE = "value";
    public static final String TYPE = "type";
    public static final String PDF = "pdf";
    public static final String ATTRIBUTE = "attribute";
    public static final String FILE = "file";
    public static final String CERTIFICATE = "certificate";
    public static final String PAGE = "page";
    public static final String CO_ORDINATES = "cood";
    public static final String SIZE = "size";
    public static final String DATE_FORMAT = "dateformat";
    public static final String ESIGN_DATE_FORMAT = "dd-MMM-yyyy";
    public static final String DATA = "data";

    public static final String SIGN = "SIGN";
    public static final String INVALID_INPUT = "INVALID_INPUT";

    // Filestore constants
    public static final String FILE_STORE_SERVICE_EXCEPTION_CODE = "FILE_STORE_SERVICE_EXCEPTION_CODE";
    public static final String FILE_STORE_SERVICE_EXCEPTION_MESSAGE = "Error occurred while accessing file store";

}
