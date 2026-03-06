package org.egov.transformer.config;

import org.springframework.stereotype.Component;

@Component
public class ServiceConstants {
   public static final String CASE_INDEX = "case-index";
   public static final String FILING_NUMBER = "Data.caseDetails.filingNumber";
   public static final String ERROR_CASE_SEARCH = "error executing case search query";
   public static final String CASE_SEARCH_EMPTY = "No case data found for given filingNumber";
   public static final String BAIL_ORDER_TYPE = "BAIL";
   public static final String JUDGEMENT_ORDER_TYPE = "JUDGEMENT";
   public static final String ORDER_INDEX="order-index";
   public static final String ORDER_ID="Data.orderDetails.id";
   public static final String ORDER_SEARCH_EMPTY = "No order data found for given filingNumber";
   public static final String ERROR_ORDER_SEARCH = "error executing order search query";
   public static final String APPLICATION_INDEX = "application-index";
   public static final String APPLICATION_NUMBER = "Data.applicationDetails.applicationNumber";
   public static final String ERROR_APPLICATION_SEARCH = "error executing application search query";
   public static final String APPLICATION_SEARCH_EMPTY = "No application data found for given filingNumber";
   public static final String HEARD="HEARD";
   public static final String ADJOURNED="ADJOURNED";
   public static final String ABATED="ABATED";
   public static final String CLOSED="CLOSED";
   public static final String EXTERNAL_SERVICE_EXCEPTION = "External Service threw an Exception: ";
   public static final String SEARCHER_SERVICE_EXCEPTION = "Exception while fetching from searcher: ";
   public static final String COURT_CASE_JSON_PATH="$.criteria[0].responseList[0]";
   public static final String COMPOSITE = "COMPOSITE";
   public static final String ERROR_WHILE_FETCHING_FROM_MDMS = "ERROR_WHILE_FETCHING_FROM_MDMS";
   public static final String DEFAULT_COURT_MODULE_NAME = "court";
   public static final String DEFAULT_HEARING_MASTER_NAME = "hearings";
   public static final String HEARING_MODULE_NAME = "Hearing";
   public static final String HEARING_STATUS_MASTER_NAME = "HearingStatus";
   public static final String COMMON_MASTERS_MASTER = "common-masters";
   public static final String COURT_ROOMS = "Court_Rooms";
   public static final String HEARING_COMPLETED_STATUS = "COMPLETED";
   public static final String HEARING_SCHEDULED_STATUS = "SCHEDULED";

   public static final String INTERNALMICROSERVICEROLE_NAME = "Internal Microservice Role";

   public static final String INTERNALMICROSERVICEROLE_CODE = "INTERNAL_MICROSERVICE_ROLE";

   public static final String INTERNALMICROSERVICEUSER_NAME = "Internal Microservice User";

   public static final String INTERNALMICROSERVICEUSER_USERNAME = "INTERNAL_USER";

   public static final String INTERNALMICROSERVICEUSER_MOBILENO = "9999999999";

   public static final String INTERNALMICROSERVICEUSER_TYPE = "SYSTEM";

   public static final String FLOW_JAC = "flow_jac";

   public static final String msgId = "1730882648558|en_IN";
   public static final String ERRORS_PATH = "$.errors";

   public static final String ES_UPDATE_BAIL_HEADER_FORMAT = "{\"update\":{\"_index\":\"%s\",\"_id\":\"%s\"}}\n";
   public static final String ES_UPDATE_BAIL_DOCUMENT_FORMAT = "{\"doc\":{\"Data\":{\"bailDetails\":{" +
                                                               "\"caseNumber\":\"%s\"," +
                                                               "\"searchableFields\":%s" +
                                                               "}}}}\n";

   public static final String ES_UPDATE_ARTIFACT_HEADER_FORMAT = "{\"update\":{\"_index\":\"%s\",\"_id\":\"%s\"}}\n";
   public static final String ES_UPDATE_ARTIFACT_DOCUMENT_FORMAT = "{\"doc\":{\"Data\":{\"artifactDetails\":{" +
           "\"caseNumber\":\"%s\"," +
           "\"searchableFields\":%s" +
           "}}}}\n";

   public static final String ARTIFACT_INDEX_BUSINESS_OBJECT_KEY = "artifactDetails";
   public static final String OPEN_HEARING_INDEX_BUSINESS_OBJECT_KEY = "hearingDetails";

   public static final String ENG_LOCALE_CODE = "en_IN";

   public static final String MODULE_CODE = "rainmaker-common,rainmaker-home,rainmaker-case,rainmaker-orders,rainmaker-hearings,rainmaker-submission";

   public static final String LOCALIZATION_CODES_JSONPATH = "$.messages.*.code";
   public static final String LOCALIZATION_MSGS_JSONPATH = "$.messages.*.message";

   public static final String DOT = ". ";

   public static final String DRAFT_IN_PROGRESS = "DRAFT_IN_PROGRESS";
   public static final String PENDING_E_SIGN = "PENDING_E-SIGN";
   public static final String PENDING_REVIEW = "PENDING_REVIEW";
   public static final String PENDING_UPLOAD = "PENDING_UPLOAD";
   public static final String DELETED_DRAFT = "DELETED_DRAFT";
   public static final String COMPLETED = "COMPLETED";

   public static final String EXAMINATION_CREATOR = "EXAMINATION_CREATOR";
   public static final String EXAMINATION_APPROVER = "EXAMINATION_APPROVER";
   public static final String EXAMINATION_SIGNER = "EXAMINATION_SIGNER";
   public static final String EXAMINATION_VIEWER = "EXAMINATION_VIEWER";

   public static final String MEDIATION_CREATOR = "MEDIATION_CREATOR";
   public static final String MEDIATION_APPROVER = "MEDIATION_APPROVER";
   public static final String MEDIATION_SIGNER = "MEDIATION_SIGNER";
   public static final String MEDIATION_VIEWER = "MEDIATION_VIEWER";

   public static final String PLEA_CREATOR = "PLEA_CREATOR";
   public static final String PLEA_APPROVER = "PLEA_APPROVER";
   public static final String PLEA_SIGNER = "PLEA_SIGNER";
   public static final String PLEA_VIEWER = "PLEA_VIEWER";

   public static final String ACCUSED_PARTY_TYPE="respondent";
   public static final String COMPLAINANT_PARTY_TYPE="complainant";



}
