package org.egov.id.exception;

import lombok.extern.slf4j.Slf4j;
import org.egov.id.config.PropertiesManager;
import org.egov.id.model.Error;
import org.egov.id.model.ErrorRes;
import org.egov.id.model.ResponseInfo;
import org.egov.id.model.ResponseStatusEnum;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.context.request.ServletWebRequest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@Slf4j
@ExtendWith(MockitoExtension.class) // Replacement for @TestInstance if you don't need shared state
class GlobalExceptionHandlerTest {

    @Mock
    private PropertiesManager propertiesManager;

    @InjectMocks
    private GlobalExceptionHandler globalExceptionHandler;

    @Test // FIXED: Added missing @Test annotation
    void testUnknownException() {
        Exception ex = new Exception("An error occurred");

        // ServletWebRequest is used by Spring to wrap the request/response
        ErrorRes actualUnknownExceptionResult = globalExceptionHandler.unknownException(ex,
                new ServletWebRequest(new MockHttpServletRequest()));

        List<Error> errors = actualUnknownExceptionResult.getErrors();
        assertEquals(1, errors.size());

        ResponseInfo responseInfo = actualUnknownExceptionResult.getResponseInfo();
        assertEquals(ResponseStatusEnum.FAILED, responseInfo.getStatus());

        Error getResult = errors.get(0);
        assertEquals("An error occurred", getResult.getMessage());
        assertEquals("400 BAD_REQUEST", getResult.getCode());
    }

    @Test
    void testUnknownExceptionNull() {
        Exception ex = new Exception("nullValue");
        ErrorRes actualUnknownExceptionResult = globalExceptionHandler.unknownException(ex,
                new ServletWebRequest(new MockHttpServletRequest()));

        List<Error> errors = actualUnknownExceptionResult.getErrors();
        Error getResult = errors.get(0);
        assertEquals("nullValue", getResult.getMessage());
    }

    @Test
    void testUnknownExceptionIDSeqNotFoundException() {
        Exception ex = new Exception("IDSeqNotFoundException");
        ErrorRes actualUnknownExceptionResult = globalExceptionHandler.unknownException(ex,
                new ServletWebRequest(new MockHttpServletRequest()));

        List<Error> errors = actualUnknownExceptionResult.getErrors();
        Error getResult = errors.get(0);
        assertEquals("IDSeqNotFoundException", getResult.getMessage());
        assertEquals("400 BAD_REQUEST", getResult.getCode());
    }
}