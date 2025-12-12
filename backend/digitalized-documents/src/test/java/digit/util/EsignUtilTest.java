package digit.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import digit.config.Configuration;
import digit.repository.ServiceRequestRepository;
import digit.web.models.CoordinateRequest;
import digit.web.models.CoordinateResponse;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;

import static digit.config.ServiceConstants.ESIGN_SERVICE_EXCEPTION;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ESignUtilTest {

    @Mock
    private Configuration configuration;

    @Mock
    private ServiceRequestRepository repository;

    @Mock
    private ObjectMapper mapper;

    @InjectMocks
    private ESignUtil util;

    @Test
    void getCoordinateForSign_ReturnsEmptyList() throws JsonProcessingException {
        var req = CoordinateRequest.builder().criteria(new java.util.ArrayList<>()).build();
        CoordinateResponse emptyCoordinateResponse = new CoordinateResponse();
        emptyCoordinateResponse.setCoordinates(new ArrayList<>());
        when(repository.fetchResult(any(), any())).thenReturn(emptyCoordinateResponse);
        when(mapper.writeValueAsString(any())).thenReturn("{}");
        when(mapper.readValue("{}", CoordinateResponse.class)).thenReturn(emptyCoordinateResponse);
        assertTrue(util.getCoordinateForSign(req).isEmpty());
    }


    @Test
    void getCoordinateForSign_WhenNullRequest_ThrowsCustomException() {
        CustomException ex = assertThrows(CustomException.class, () -> util.getCoordinateForSign(null));
        assertEquals(ESIGN_SERVICE_EXCEPTION, ex.getCode());
    }
}
