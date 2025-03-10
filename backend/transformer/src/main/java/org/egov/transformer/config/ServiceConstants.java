package org.egov.transformer.config;

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
}
