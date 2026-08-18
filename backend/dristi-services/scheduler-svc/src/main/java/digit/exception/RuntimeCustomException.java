package digit.exception;

import org.egov.tracer.model.CustomException;

/**
 * Custom exception for CauseList related operations
 */
public class RuntimeCustomException extends CustomException {

    public RuntimeCustomException(String code, String message) {
        super(code, message);
    }

}
