package pucar.config;


import org.springframework.stereotype.Component;


@Component
public class ServiceConstants {

    public static final String EXTERNAL_SERVICE_EXCEPTION = "External Service threw an Exception: ";
    public static final String SEARCHER_SERVICE_EXCEPTION = "Exception while fetching from searcher: ";

    public static final String ERROR_WHILE_FETCHING_FROM_ORDER = "";
    public static final String FILE_STORE_UTILITY_EXCEPTION = "";
    public static final String ESIGN_SERVICE_EXCEPTION = "";

    public static final String FILE_STORE_SERVICE_EXCEPTION_CODE = "";
    public static final String FILE_STORE_SERVICE_EXCEPTION_MESSAGE = "";

    public static final String RES_MSG_ID = "uief87324";
    public static final String SUCCESSFUL = "successful";
    public static final String FAILED = "failed";
    public static final String E_SIGN = "E-SIGN";
    public static final String SIGNED = "SIGNED";
    public static final String COMPOSITE = "COMPOSITE";

    public static final String COORDINATES_ERROR = "COORDINATES_ERROR";
    public static final String EMPTY_ORDERS_ERROR = "EMPTY_ORDERS_ERROR";
    public static final String ORDER_SIGN_ERROR = "ORDER_SIGN_ERROR";
    public static final String UPDATE_ORDER_SIGN_ERROR = "UPDATE_ORDER_SIGN_ERROR";
    public static final String UPDATE_ORDER_SIGN_ERROR_MESSAGE = "Error while updating order with signed doc";
    public static final String XML_CREATE_ERROR = "XML_CREATE_ERROR";
    public static final String XML_CREATE_ERROR_MESSAGE = "error while creating XML";
    public static final String INVALID_FILE_STORE_RESPONSE = "INVALID_FILE_STORE_RESPONSE";
    public static final String FILESTORE_SERVICE_EXCEPTION = "FILESTORE_SERVICE_EXCEPTION";
    public static final String FILE_STORE_UTILITY_MESSAGE_CODE = "Error occurred when getting saving document in File Store";
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

    public static final String ERROR_WHILE_FETCHING_FROM_ADVOCATE = "ERROR_WHILE_FETCHING_FROM_ADVOCATE";
    public static final String ERROR_WHILE_CREATING_DEMAND_FOR_CASE = "ERROR_WHILE_CREATING_DEMAND_FOR_CASE";

    public static final String ERROR_WHILE_FETCHING_FROM_APPLICATION_SERVICE = "";

    public static final String ERROR_WHILE_FETCHING_FROM_CASE = "";

    //

    public static final String CASE_ADMITTED = "CASE_ADMITTED";
    public static final String SCHEDULE_ADMISSION_HEARING = "SCHEDULE_ADMISSION_HEARING";

    public static final String BULK_RESCHEDULE = "BULK_RESCHEDULE";
    public static final String SETDATE = "SETDATE";
    public static final String ADMIT = "ADMIT";
    public static final String ADMISSION = "ADMISSION";
    public static final String ABANDON = "ABANDON";
    public static final String COMPLETED = "COMPLETED";
    public static final String ABATED = "ABATED";
    public static final String MANUAL = "MANUAL_";
    public static final String APPROVE = "APPROVE";
    public static final String SEND_BACK = "SEND_BACK";
    public static final String REJECT = "REJECT";
    public static final String SCHEDULED = "SCHEDULED";
    public static final String INTERMEDIATE = "INTERMEDIATE";
    public static final String RESCHEDULE = "RESCHEDULE";
    public static final String CHOOSE_DATES_FOR_RESCHEDULE_OF_HEARING_DATE = "";
    public static final Long ONE_DAY_TIME_IN_MILLIS = 86400000L;
    public static final String SCHEDULE_HEARING = "Schedule Hearing";
    public static final String PENDING_RESPONSE = "Pending Response";
    public static final String MAKE_MANDATORY_SUBMISSION = "Make Mandatory Submission";
    public static final String SUBMIT_BAIL_DOCUMENTS = "Submission Bail Document";
    public static final String PROFILE_EDIT_REQUEST = "PROFILE_EDIT_REQUEST";
    public static final String PAYMENT_PENDING_FOR_WARRANT = "PAYMENT_PENDING_FOR_WARRANT";
    public static final String PAYMENT_PENDING = "PAYMENT_PENDING_";
    public static final String MAKE_PAYMENT_FOR_SUMMONS = "MAKE_PAYMENT_FOR_SUMMONS";
    public static final String MAKE_PAYMENT_FOR_NOTICE = "MAKE_PAYMENT_FOR_NOTICE";
    public static final String SECTION_223 = "Section 223 Notice";
    public static final String PENDING_NOTICE = "PENDING_NOTICE";
    public static final String ISSUE_ORDER = "ISSUE_ORDER";
    public static final String UNSIGNED = "UNSIGNED";
    public static final String DELETE = "DELETE";
    public static final String INDIVIDUAL_UTILITY_EXCEPTION = "INDIVIDUAL_UTILITY_EXCEPTION";


    // order type
    public static final String ACCEPTANCE_REJECTION_DCA = "ACCEPTANCE_REJECTION_DCA";
    public static final String ACCEPT_BAIL = "ACCEPT_BAIL";
    public static final String ADMIT_CASE = "ADMIT_CASE";
    public static final String ADMIT_DISMISS_CASE = "ADMIT_DISMISS_CASE";
    public static final String ADVOCATE_REPLACEMENT_APPROVAL = "ADVOCATE_REPLACEMENT_APPROVAL";
    public static final String APPROVAL_REJECTION_LITIGANT_DETAILS_CHANGE = "APPROVAL_REJECTION_LITIGANT_DETAILS_CHANGE";
    public static final String APPROVE_VOLUNTARY_SUBMISSIONS = "APPROVE_VOLUNTARY_SUBMISSIONS";
    public static final String ASSIGNING_DATE_RESCHEDULED_HEARING = "ASSIGNING_DATE_RESCHEDULED_HEARING";
    public static final String BAIL = "BAIL";
    public static final String CASE_TRANSFER = "CASE_TRANSFER";
    public static final String CHECKOUT_ACCEPTANCE = "CHECKOUT_ACCEPTANCE";
    public static final String DISMISS_CASE = "DISMISS_CASE";
    public static final String EXTENSION_OF_DOCUMENT_SUBMISSION_DATE = "EXTENSION_OF_DOCUMENT_SUBMISSION_DATE";
    public static final String INITIATING_RESCHEDULING_OF_HEARING_DATE = "INITIATING_RESCHEDULING_OF_HEARING_DATE";
    public static final String JUDGEMENT = "JUDGEMENT";
    public static final String MANDATORY_SUBMISSIONS_RESPONSES = "MANDATORY_SUBMISSIONS_RESPONSES";
    public static final String NOTICE = "NOTICE";
    public static final String OTHERS = "OTHERS";
    public static final String REFERRAL_CASE_TO_ADR = "REFERRAL_CASE_TO_ADR";
    public static final String REJECT_BAIL = "REJECT_BAIL";
    public static final String REJECTION_RESCHEDULE_REQUEST = "REJECTION_RESCHEDULE_REQUEST";
    public static final String REJECT_VOLUNTARY_SUBMISSIONS = "REJECT_VOLUNTARY_SUBMISSIONS";
    public static final String RESCHEDULE_OF_HEARING_DATE = "RESCHEDULE_OF_HEARING_DATE";
    public static final String SCHEDULE_OF_HEARING_DATE = "SCHEDULE_OF_HEARING_DATE";
    public static final String SCHEDULING_NEXT_HEARING = "SCHEDULING_NEXT_HEARING";
    public static final String SECTION_202_CRPC = "SECTION_202_CRPC";
    public static final String SET_BAIL_TERMS = "SET_BAIL_TERMS";
    public static final String SETTLEMENT = "SETTLEMENT";
    public static final String SUMMONS = "SUMMONS";
    public static final String WARRANT = "WARRANT";
    public static final String WITHDRAWAL = "WITHDRAWAL";


}
