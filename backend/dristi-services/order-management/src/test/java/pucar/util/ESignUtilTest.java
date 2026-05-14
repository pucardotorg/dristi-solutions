package pucar.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pucar.config.Configuration;
import pucar.repository.ServiceRequestRepository;
import pucar.web.models.Coordinate;
import pucar.web.models.CoordinateRequest;
import pucar.web.models.CoordinateResponse;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ESignUtilTest {

    @Mock
    private Configuration configuration;

    @Mock
    private ServiceRequestRepository repository;

    @Mock
    private ObjectMapper mapper;

    @InjectMocks
    private ESignUtil eSignUtil;

    private CoordinateRequest coordinateRequest;
    private CoordinateResponse coordinateResponse;

    @BeforeEach
    void setUp() {
        coordinateRequest = new CoordinateRequest();
        coordinateResponse = new CoordinateResponse();
        coordinateResponse.setCoordinates(Collections.singletonList(new Coordinate(0.0F, 0.0F, true,10, "fileStoreId1","kl")));
    }

    @Test
    void testGetCoordinateForSign_Success() throws Exception {
        String jsonResponse = "{\"coordinates\":[{\"fileStoreId\":\"fileStoreId1\", \"tenantId\":\"tenant1\", \"x\":10, \"y\":20, \"pageNumber\":1}]}";

        when(configuration.getEsignHost()).thenReturn("http://esign.com");
        when(configuration.getEsignLocationEndPoint()).thenReturn("/getCoordinates");
        when(repository.fetchResult(any(), eq(coordinateRequest))).thenReturn(coordinateResponse);
        when(mapper.writeValueAsString(any())).thenReturn(jsonResponse);
        when(mapper.readValue(jsonResponse, CoordinateResponse.class)).thenReturn(coordinateResponse);

        List<Coordinate> result = eSignUtil.getCoordinateForSign(coordinateRequest);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("fileStoreId1", result.get(0).getFileStoreId());
        verify(repository, times(1)).fetchResult(any(), eq(coordinateRequest));
    }

    @Test
    void testGetCoordinateForSign_Exception() throws Exception {
        when(configuration.getEsignHost()).thenReturn("http://esign.com");
        when(configuration.getEsignLocationEndPoint()).thenReturn("/getCoordinates");
        when(repository.fetchResult(any(), eq(coordinateRequest))).thenThrow(new RuntimeException("Service error"));

        CustomException exception = assertThrows(CustomException.class, () -> eSignUtil.getCoordinateForSign(coordinateRequest));
        assertEquals("Error occurred while getting coordinates", exception.getMessage());
    }
}
