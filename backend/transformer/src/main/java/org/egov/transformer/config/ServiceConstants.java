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
   public static final String ES_UPDATE_BAIL_DOCUMENT_FORMAT = "{\"doc\":{\"Data\":{\"bailDetails\":{\"caseNumber\":\"%s\"}}}}\n";
}
