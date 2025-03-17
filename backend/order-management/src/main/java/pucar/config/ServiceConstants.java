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

}
