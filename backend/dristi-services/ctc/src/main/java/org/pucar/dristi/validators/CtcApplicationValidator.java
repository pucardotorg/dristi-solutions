package org.pucar.dristi.validators;

import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.ServiceConstants;
import org.pucar.dristi.web.models.CtcApplicationRequest;
import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

@Component
public class CtcApplicationValidator {

    private static final Pattern MOBILE_PATTERN = Pattern.compile("^[6-9]\\d{9}$");
    private static final Pattern CASE_NUMBER_PATTERN = Pattern.compile("^[A-Z]+/\\d+/\\d{4}$");

    public void validateCreateRequest(CtcApplicationRequest request) {
        if (request == null) {
            throw new CustomException(ServiceConstants.CTC_VALIDATION_EXCEPTION, "Request cannot be null");
        }

        if (request.getRequestInfo() == null) {
            throw new CustomException(ServiceConstants.CTC_VALIDATION_EXCEPTION, "RequestInfo cannot be null");
        }

        if (request.getCtcApplication() == null) {
            throw new CustomException(ServiceConstants.CTC_VALIDATION_EXCEPTION, "CTC Application cannot be null");
        }

    }
}
