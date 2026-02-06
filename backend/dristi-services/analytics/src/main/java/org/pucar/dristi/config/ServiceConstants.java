package org.pucar.dristi.config;


import org.springframework.stereotype.Component;


@Component
public class ServiceConstants {

    public static final String EXTERNAL_SERVICE_EXCEPTION = "External Service threw an Exception: ";
    public static final String SEARCHER_SERVICE_EXCEPTION = "Error while fetching result from URL: {} with request: {}";
    public static final String ERROR_WHILE_FETCHING_FROM_MDMS = "Exception occurred while fetching category lists from mdms: ";

    //Consumer
    public static final String ES_INDEX_HEADER_FORMAT = "{\"index\":{\"_index\":\"%s\",\"_id\":\"%s\"}}\n";
    public static final String ES_INDEX_DOCUMENT_FORMAT = "{\"Data\": {\"id\":\"%s\",\"name\":\"%s\",\"entityType\":\"%s\",\"referenceId\":\"%s\",\"status\":\"%s\",\"caseNumber\":\"%s\",\"substage\":\"%s\",\"advocateDetails\":%s,\"actionCategory\":\"%s\",\"searchableFields\":%s,\"assignedTo\":%s,\"assignedRole\":%s,\"cnrNumber\":\"%s\",\"filingNumber\":\"%s\",\"caseId\":\"%s\",\"caseTitle\":\"%s\",\"isCompleted\":%b,\"stateSla\":%d,\"businessServiceSla\":%d,\"additionalDetails\":%s,\"screenType\":\"%s\",\"courtId\":\"%s\",\"createdTime\":%d,\"expiryDate\":%d,\"sectionAndSubSection\":\"%s\",\"filingDate\":%d,\"referenceEntityType\":\"%s\",\"offices\":%s,\"dateOfApplication\":\"%s\",\"nextHearingDate\":\"%s\"}}\n";
    public static final String TENANTID_MDC_STRING = "TENANTID";


    public static final String ES_INDEX_BILLING_FORMAT =
            "{\"Data\": {"
                    + "\"billDetails\": {"
                    + "\"id\": \"%s\","
                    + "\"tenantId\": \"%s\","
                    + "\"paymentCreatedDate\": %s,"
                    + "\"paymentCompletedDate\": %s,"
                    + "\"caseTitleFilingNumber\": \"%s, %s\","
                    + "\"stage\": \"%s\","
                    + "\"caseId\": \"%s\","
                    + "\"caseType\": \"%s\","
                    + "\"paymentType\": \"%s\","
                    + "\"amount\": %f,"
                    + "\"billStatus\": \"%s\","
                    + "\"consumerCode\": \"%s\","
                    + "\"filingNumber\": \"%s\","
                    + "\"service\": \"%s\","
                    + "\"courtId\": \"%s\""
                    + "},"
                    + "\"auditDetails\": %s"  // auditDetails as a JSON string
                    + "}}\n";


    //Search Param
    public static final String APPLICATION_NUMBER = "?applicationNumber=";
    public static final String CNR_NUMBER = "&cnrNumber=";
    public static final String HEARING_ID = "&hearingId=";
    public static final String TENANT_ID = "&tenantId=";
    public static final String ORDER_ID = "?orderId=";
    public static final String STATUS = "&status=";
    public static final String FILLING_NUMBER = "?filingNumber=";
    public static final String TASK_NUMBER = "?taskNumber=";
    public static final String ORDER_NUMBER = "?orderNumber=";


    //JSON path
    public static final String DEMAND_PATH = "$.Demands.*";
    public static final String PAYMENT_PAYMENT_DETAILS_PATH = "$.Payment.paymentDetails.*";
    public static final String PAYMENT_TRANSACTION_DATE_PATH = "$.Payment.transactionDate";
    public static final String PAYMENT_PAYMENT_BILL_DETAILS_PATH = "$.bill.billDetails.*";
    public static final String PROCESS_INSTANCE_PATH = "$.ProcessInstances.*";
    public static final String REQUEST_INFO_PATH = "$.RequestInfo";
    public static final String ID_PATH = "$.id";
    //    public static final String BUSINESS_SERVICE_PATH = "$.businessService";
    public static final String BUSINESS_ID_PATH = "$.businessId";
    public static final String STATE_PATH = "$.state.state";
    //    public static final String TENANT_ID_PATH = "$.tenantId";
    public static final String ACTION_PATH = "$.action";
    public static final String ASSIGNES_PATH = "$.assignes.*";
    public static final String ASSIGNED_ROLE_PATH = "$.state.actions.*.roles.*";
    public static final String IS_TERMINATE_STATE_PATH = "$.state.isTerminateState";
    public static final String STATE_SLA_PATH = "$.stateSla";
    public static final String BUSINESS_SERVICE_SLA_PATH = "$.businesssServiceSla";

    public static final String HEARING_PATH = "$.HearingList.*";
    public static final String HEARING_TYPE_PATH = "$.hearingType";
    public static final String PURPOSE_OF_NEXT_HEARING_PATH = "$.purposeOfNextHearing";
    public static final String CASE_PATH = "$.criteria.*.responseList[0]";
    public static final String ARTIFACT_PATH = "$.artifacts.*";
    public static final String TASK_PATH = "$.list.*";
    public static final String ORDER_PATH = "$.list.*";
    public static final String APPLICATION_PATH = "$.applicationList.*";
    public static final String CNR_NUMBERS_PATH = "$.cnrNumbers";
    public static final String CNR_NUMBER_PATH = "$.cnrNumber";

    public static final String CMP_NUMBER_PATH = "$.cmpNumber";
    public static final String CASE_TITLE_PATH = "$.caseTitle";
    public static final String CASE_CMPNUMBER_PATH = "$.cmpNumber";
    public static final String CASE_COURTCASENUMBER_PATH = "$.courtCaseNumber";
    public static final String CASE_COURTID_PATH = "$.courtId";
    public static final String CASEID_PATH = "$.id";
    public static final String CASE_FILING_DATE_PATH = "$.filingDate";

    public static final String IS_LPR_CASE_PATH = "$.isLPRCase";

    public static final String CASE_STAGE_PATH = "$.stage";
    public static final String CASE_STAGE_BACKUP_PATH = "$.stageBackup";
    public static final String CASE_SUB_STAGE_BACKUP_PATH = "$.substageBackup";
    public static final String CASE_SUB_STAGE_PATH = "$.substage";
    public static final String CASE_ID_PATH = "$.caseId";
    public static final String CASE_STATUTES_AND_SECTIONS = "$.statutesAndSections";
    public static final String CASE_REPRESENTATIVES = "$.representatives";
    public static final String FILING_NUMBER_PATH = "$.filingNumber";
    public static final String ERRORS_PATH = "$.errors";
    public static final String ORDER_TYPE_PATH = "$.orderType";
    public static final String ORDER_FINDINGS_PATH = "$.additionalDetails.formdata.findings.code";
    public static final String COMPOSITE_ORDER_FINDINGS_PATH = "$.orderSchema.additionalDetails.formdata.findings.code";
    public static final String ORDER_NATURE_OF_DISPOSAL_PATH = "$.orderDetails.natureOfDisposal";
    public static final String COMPOSITE_ORDER_NATURE_OF_DISPOSAL_PATH = "$.orderSchema.orderDetails.natureOfDisposal";
    public static final String ORDER_CATEGORY_PATH = "$.orderCategory";
    public static final String ORDER_COMPOSITE_ITEMS_PATH = "$.compositeItems.*";
    public static final String APPLICATION_TYPE_PATH = "$.applicationType";
    public static final String INITIAL_HEARING_DATE_PATH = "$.applicationDetails.initialHearingDate";
    public static final String ADVANCEMENT_OR_ADJOURNMENT_APPLICATION = "ADVANCEMENT_OR_ADJOURNMENT_APPLICATION";

    public static final String RES_MSG_ID = "uief87324";
    public static final String SUCCESSFUL = "successful";
    public static final String FAILED = "failed";


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
    public static final String USER = "user";

    public static final String PARSING_ERROR = "PARSING ERROR";
    public static final String FAILED_TO_PARSE_BUSINESS_SERVICE_SEARCH = "Failed to parse response of workflow business service search";
    public static final String BUSINESS_SERVICE_NOT_FOUND = "BUSINESSSERVICE_NOT_FOUND";
    public static final String THE_BUSINESS_SERVICE = "The businessService ";
    public static final String NOT_FOUND = " is not found";
    public static final String TENANTID = "?tenantId=";
    public static final String BUSINESS_SERVICES = "&businessServices=";
    public static final String Pending_Task_Exception = "Pending Task Exception";


    //    path for demand
//public static final String ID_PATH = "$.id";
    public static final String BUSINESS_SERVICE_PATH = "$.businessService";
    public static final String CONSUMER_TYPE_PATH = "$.consumerType";
    public static final String CONSUMER_CODE_PATH = "$.consumerCode";
    public static final String STATUS_PATH = "$.status";
    public static final String TENANT_ID_PATH = "$.tenantId";
    public static final String TAX_PERIOD_FROM_PATH = "$.taxPeriodFrom";
    public static final String TAX_PERIOD_TO_PATH = "$.taxPeriodTo";
    public static final String MINIMUM_AMOUNT_PAYABLE_PATH = "$.minimumAmountPayable";
    public static final String BILL_EXPIRY_TIME_PATH = "$.billExpiryTime";
    public static final String ADDITIONAL_DETAILS_PATH = "$.additionalDetails";
    public static final String FIXED_BILL_EXPIRY_DATE_PATH = "$.fixedBillExpiryDate";
    public static final String PAYER_PATH = "$.payer";
    public static final String DEMAND_DETAILS_PATH = "$.demandDetails";
    public static final String AUDIT_DETAILS_PATH = "$.auditDetails";
    public static final String PAYMENT_CREATED_TIME_PATH = "$.auditDetails.createdTime";
    public static final String DEMAND_DEMAND_ID_PATH = "$.demandId";
    public static final String DEMAND_TAX_HEAD_MASTER_CODE_PATH = "$.taxHeadMasterCode";
    public static final String DEMAND_COLLECTION_AMOUNT_PATH = "$.collectionAmount";
    public static final String DEMAND_TAX_AMOUNT_PATH = "$.taxAmount";
    public static final String DEMAND_AUDIT_DETAILS_PATH = "$.auditDetails";


    public static final String PAYMENT_MODE_MASTER_NAME = "paymentMode";
    public static final String PAYMENT_MODULE_NAME = "payment";
    public static final String PAYMENT_TYPE_MASTER_NAME = "paymentType";


    public static final String FILTER_PAYMENT_MODE = "$.[?(@.suffix == '%s' && '%s' in @.paymentMode)]";
    public static final String OFFLINE = "OFFLINE";

    public static final String FILTER_PAYMENT_TYPE = "$.[?(@.suffix == '%s' && @.businessService[?(@.businessCode == '%s')])]";

    public static final String DEMAND_SERVICE_EXCEPTION = "DEMAND_SERVICE_EXCEPTION : {} ";
    public static final String DEMAND_SERVICE_EXCEPTION_MESSAGE = "Exception Occurred while calling the demand service";
    public static final String DEMAND_SERVICE_CONSUMER_CODE_EXCEPTION_MESSAGE = "Exception Occurred while calling the demand service for consumer code";

    public static final String REQUEST_INFO = "RequestInfo";
    public static final String FILING_NUMBER = "filingNumber";
    public static final String CNR_NUMBER_KEY = "cnrNumber";
    public static final String STRING_FORMAT = "%s?tenantId=%s&demandId=%s";
    public static final String CONSUMER_CODE_FORMAT = "%s?tenantId=%s&consumerCode=%s&status=%s";

    public static final String PAYMENT_TYPE_PATH = "$.[*].paymentType";

    public static final String STATUTE = "statute";
    public static final String STATUTE_DEFAULT_VALUE = "Negotiable Instruments Act 1881";

    public static final String TAX_AMOUNT = "taxAmount";

    public static final String UNKNOWN_TOPIC_EXCEPTION = "UNKNOWN_TOPIC_EXCEPTION";

    public static final String EXTRACT_DEMAND_ID_ERROR = "EXTRACT_DEMAND_ID_ERROR";

    public static final String DEMAND_ID = "demandId";

    public static final String UPDATE_DEMAND_ERROR = "UPDATE_DEMAND_ERROR";

    public static final String STATUS_KEY = "status";

    public static final String STATUS_PAID = "PAID";

    public static final String DEMANDS = "Demands";

    public static final String OFFLINE_PAYMENT_ERROR = "OFFLINE_PAYMENT_NOT_SUPPORTED";

    public static final String OFFLINE_PAYMENT_ERROR_MESSAGE = "Offline paymnet is not supported";

    public static final String JSON_PROCESSING_EXCEPTION = "JSON_PROCESSING_EXCEPTION";
    public static final String JSON_PROCESSING_EXCEPTION_MSG = "Exception occurred while filtering payment type master data";

    public static final String PAYMENT_TYPE = "paymentType";

    public static final String NO_PAYMENT_TYPE_FOUND_CODE = "NO_PAYMENT_TYPE_FOUND";

    public static final String NO_PAYMENT_TYPE_FOUND_MSG = "No payment type found for the given service code.";

    public static final String ASSIGN_TO_PATH="$.assignedTo";


    public static final String NOTIFICATION_ENG_LOCALE_CODE = "en_IN";

    public static final String NOTIFICATION_MODULE_CODE = "notification";

    public static final String NOTIFICATION_LOCALIZATION_CODES_JSONPATH = "$.messages.*.code";
    public static final String NOTIFICATION_LOCALIZATION_MSGS_JSONPATH = "$.messages.*.message";

    public static final String PENDING_TASK_CREATED = "PENDING_TASK_CREATED";

    public static final String CASE_STATUS_CHANGED_MESSAGE = "CASE_STATUS_CHANGE_MESSAGE";

    public static final String ERROR_WHILE_FETCHING_FROM_CASE = "ERROR_WHILE_FETCHING_FROM_CASE";

    public static final String INDIVIDUAL_UTILITY_EXCEPTION = "INDIVIDUAL_UTILITY_EXCEPTION";

    public static final String ERROR_WHILE_FETCHING_FROM_ADVOCATE = "ERROR_WHILE_FETCHING_FROM_ADVOCATE";

    public static final String DUE_DATE_PATH= "$.duedate";

    public static final long ONE_DAY_DURATION_MILLIS=86400000L;

    public static final String ERROR_WHILE_FETCHING_PENDING_TASK = "Error fetching pending task.";
    public static final String ERROR_UPDATING_PENDING_TASK = "Error updating pending task.";

    public static final String MANUAL_PENDING_RESPONSE="MANUAL_PENDING_RESPONSE";
    public static final String REPRESENTATIVE_REPLACE_JOIN_CASE="update-representative-join-case";
    public static final String REPRESENTATIVE_JOIN_CASE_TOPIC = "representative-join-case";
    public static final String LITIGANT_JOIN_CASE_TOPIC = "litigant-join-case";
    public static final String COMPOSITE = "composite";
    public static final String HOME = "home";
    public static final String ADIARY = "Adiary";

    public static final String ADVOCATE = "advocate";
    public static final String LITIGANT = "litigant";

    public static final String FLOW_JAC = "flow_jac";

    public static final String INTERNALMICROSERVICEROLE_NAME = "Internal Microservice Role";

    public static final String INTERNALMICROSERVICEROLE_CODE = "INTERNAL_MICROSERVICE_ROLE";

    public static final String INTERNALMICROSERVICEUSER_NAME = "Internal Microservice User";

    public static final String INTERNALMICROSERVICEUSER_USERNAME = "INTERNAL_USER";

    public static final String INTERNALMICROSERVICEUSER_MOBILENO = "9999999999";

    public static final String INTERNALMICROSERVICEUSER_TYPE = "SYSTEM";

    public static final String msgId = "1730882648558|en_IN";

    public static final String EXCLUDED_ASSIGNED_UUIDS = "excludedAssignedUuids";

    public static final String POA_JOIN_CASE_TOPIC = "poa-join-case";

    public static final String APPEARANCE = "APPEARANCE";
    public static final String ARGUMENTS = "ARGUMENTS";
    public static final String EVIDENCE = "EVIDENCE";
    public static final String LONG_PENDING_REGISTER = "Long Pending Register";
    public static final String REFER_TO_ADR = "REFER_TO_ADR";
    public static final String ACTIVE = "ACTIVE";

    public static final String HEARING = "HEARING";
    public static final String ORDER = "ORDER";
    public static final String CASE = "CASE";
    public static final String SCHEDULE_OF_HEARING_DATE = "SCHEDULE_OF_HEARING_DATE";
    public static final String SCHEDULING_NEXT_HEARING = "SCHEDULING_NEXT_HEARING";

    public static final String RESTORE_BACKUP = "RESTORE_BACKUP";

}
