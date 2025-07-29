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

	public static final String RES_MSG_ID = "uief87324";
	public static final String SUCCESSFUL = "successful";
	public static final String FAILED = "failed";

	public static final String URL = "url";
	public static final String REFERENCE_ID = "referenceId";
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
	public static final String EMPLOYEE_UPPER = "EMPLOYEE";
	public static final String PENDING_E_SIGN = "PENDING_E-SIGN";
	public static final String USER = "user";
	public static final String COMMENT_ADD_ERR = "COMMENT_ADD_ERR";
	public static final String COMPLAINANT = "COMPLAINANT";
	public static final String RESPONDENT = "RESPONDENT";
	public static final String ACCUSED = "ACCUSED";
	public static final String COURT = "COURT";
	public static final String JUDGE_ROLE = "JUDGE_ROLE";
	public static final String TYPIST_ROLE = "TYPIST_ROLE";

	public static final String PARSING_ERROR = "PARSING ERROR";
	public static final String FAILED_TO_PARSE_BUSINESS_SERVICE_SEARCH = "Failed to parse response of workflow business service search";
	public static final String BUSINESS_SERVICE_NOT_FOUND = "BUSINESSSERVICE_NOT_FOUND";
	public static final String THE_BUSINESS_SERVICE = "The businessService ";
	public static final String NOT_FOUND = " is not found";
	public static final String TENANTID = "?tenantId=";
	public static final String BUSINESS_SERVICES = "&businessServices=";
	public static final String EVIDENCE_CREATE_EXCEPTION = "ADVOCATE_CREATE_EXCEPTION";
	public static final String WORKFLOW_SERVICE_EXCEPTION = "WORKFLOW_SERVICE_EXCEPTION";
	public static final String ENRICHMENT_EXCEPTION = "ENRICHMENT_EXCEPTION";
	public static final String EVIDENCE_SEARCH_QUERY_EXCEPTION = "EVIDENCE_SEARCH_QUERY_EXCEPTION";
	public static final String DOCUMENT_SEARCH_QUERY_EXCEPTION = "DOCUMENT_SEARCH_QUERY_EXCEPTION";
	public static final String COMMENT_SEARCH_QUERY_EXCEPTION = "COMMENT_SEARCH_QUERY_EXCEPTION";
	public static final String MDMS_DATA_NOT_FOUND = "MDMS_DATA_NOT_FOUND";
	public static final String PUBLISHED_STATE = "PUBLISHED";
	public static final String ABATED_STATE = "ABATED";
	public static final String DELETED_STATE = "DELETED";
	public static final String SUBMITTED_STATE = "SUBMITTED";
	public static final String ARTIFACT_ID_NAME = "artifact.artifact_number";
	public static final String AFFIDAVIT = "AFFIDAVIT";
	public static final String DOCUMENTARY = "DOCUMENTARY";
	public static final String DEPOSITION = "DEPOSITION";
	public static final String SUBMISSION = "DIRECT";
	public static final String CASE_FILING = "CASE_FILING";
	public static final String CASE_EXCEPTION = "CASE_EXCEPTION";
	public static final String ORDER_EXCEPTION = "ORDER_EXCEPTION";
	public static final String APPLICATION_EXCEPTION = "APPLICATION_EXCEPTION";
	public static final String HEARING_EXCEPTION = "HEARING_EXCEPTION";
	public static final String EVIDENCE_UPDATE_EXCEPTION= "EVIDENCE_UPDATE_EXCEPTION";
	public static final String EVIDENCE_SEARCH_EXCEPTION= "EVIDENCE_SEARCH_EXCEPTION";
	public static final String ERROR_WHILE_FETCHING_FROM_CASE = "ERROR_WHILE_FETCHING_FROM_CASE";
	public static final String ERROR_WHILE_FETCHING_FROM_APPLICATION_SERVICE = "ERROR_WHILE_FETCHING_FROM_APPLICATION_SERVICE";
	public static final String ERROR_WHILE_FETCHING_FROM_ORDER = "ERROR_WHILE_FETCHING_FROM_ORDER_SERVICE";
	public static final String ERROR_WHILE_FETCHING_FROM_HEARING = "ERROR_WHILE_FETCHING_FROM_HEARING";

    public static final String NOTIFICATION_ENG_LOCALE_CODE = "en_IN";
    public static final String NOTIFICATION_MODULE_CODE = "notification";
    public static final String NOTIFICATION_LOCALIZATION_CODES_JSONPATH = "$.messages.*.code";
    public static final String NOTIFICATION_LOCALIZATION_MSGS_JSONPATH = "$.messages.*.message";
    public static final String INDIVIDUAL_UTILITY_EXCEPTION = "INDIVIDUAL_UTILITY_EXCEPTION";
    public static final String DOCUMENT_MARKED_EXHIBIT = "DOCUMENT_MARKED_EXHIBIT";
    public static final String REQUEST_INFO_PATH = "$.RequestInfo";
    public static final String APPLICATION_NUMBER_PATH = "$.application.applicationNumber";

    public static final String APPLICATION_STATUS_PATH = "$.application.status";
	public static final String FILING_NUMBER_PATH = "$.application.filingNumber";

	public static final String SUBMITTED = "SUBMITTED";
	public static final String EVIDENCE_SUBMISSION_CODE = "EVIDENCE_SUBMISSION,EVIDENCE_SUBMISSION_MESSAGE_FILING,EVIDENCE_SUBMISSION_MESSAGE_OPPOSITE_PARTY";
	public static final String EVIDENCE_SUBMISSION_MESSAGE_FILING = "EVIDENCE_SUBMISSION_MESSAGE_FILING";
	public static final String EVIDENCE_SUBMISSION = "EVIDENCE_SUBMISSION";
	public static final String EVIDENCE_SUBMISSION_MESSAGE_OPPOSITE_PARTY = "EVIDENCE_SUBMISSION_MESSAGE_OPPOSITE_PARTY";
	public static final String DIRECT = "DIRECT";
	public static final String APPLICATION = "APPLICATION";
	public static final String BENCH_CLERK = "BENCH_CLERK";
	public static final String ICOPS ="ICOPS";

	public static final String INITIATE_E_SIGN = "INITIATE_E-SIGN";

	public static final String WITNESS_DEPOSITION_CODE = "WITNESS_DEPOSITION_MESSAGE";

	public static final String MANUAL = "MANUAL_";

	public static final String FILE_STORE_UTILITY_EXCEPTION = "FILE_STORE_UTILITY_EXCEPTION";
	public static final String ESIGN_SERVICE_EXCEPTION = "ESIGN_SERVICE_EXCEPTION";

	public static final String FILE_STORE_SERVICE_EXCEPTION_CODE = "FILE_STORE_SERVICE_EXCEPTION_CODE";
	public static final String FILE_STORE_SERVICE_EXCEPTION_MESSAGE = "FILE_STORE_SERVICE_EXCEPTION_MESSAGE";

	public static final String SIGNED = "SIGNED";
	public static final String COMPOSITE = "COMPOSITE";

	public static final String COORDINATES_ERROR = "COORDINATES_ERROR";
	public static final String XML_CREATE_ERROR = "XML_CREATE_ERROR";
	public static final String XML_CREATE_ERROR_MESSAGE = "error while creating XML";
	public static final String INVALID_FILE_STORE_RESPONSE = "INVALID_FILE_STORE_RESPONSE";
	public static final String FILE_STORE_SERVICE_EXCEPTION_MESSAGE_CODE = "Failed to get valid file store id from file store service response";
	public static final String INVALID_INPUT = "INVALID_INPUT";

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
	public static final String DATA = "data";
	public static final String OMIT_XML_DECLARATION = "omit-xml-declaration";

	public static final String ARTIFACT_FILE_NAME = "artifact.pdf";
	public static final String WITNESS_DEPOSITION = "WITNESS_DEPOSITION";

}
