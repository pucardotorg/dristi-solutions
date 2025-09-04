package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.web.models.witnessdeposition.*;

import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EvidenceUtilTest {

    @Mock
    private Configuration configuration;

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private EvidenceUtil evidenceUtil;

    @Test
    void testSearchEvidence_success() {
        // Arrange
        EvidenceSearchCriteria criteria = new EvidenceSearchCriteria();
        criteria.setTenantId("tenant1");

        RequestInfo requestInfo = new RequestInfo();

        String mockUri = "http://localhost/evidence/search";

        Map<String, Object> dummyResponse = new HashMap<>();
        EvidenceSearchResponse expectedResponse = new EvidenceSearchResponse();

        when(configuration.getEvidenceServiceHost()).thenReturn("http://localhost");
        when(configuration.getEvidenceServiceSearchEndpoint()).thenReturn("/evidence/search");
        when(restTemplate.postForObject(eq(mockUri), any(), eq(Map.class))).thenReturn(dummyResponse);
        when(objectMapper.convertValue(dummyResponse, EvidenceSearchResponse.class)).thenReturn(expectedResponse);

        // Act
        EvidenceSearchResponse actual = evidenceUtil.searchEvidence(criteria, requestInfo);

        // Assert
        assertEquals(expectedResponse, actual);
        verify(restTemplate).postForObject(eq(mockUri), any(EvidenceSearchRequest.class), eq(Map.class));
        verify(objectMapper).convertValue(dummyResponse, EvidenceSearchResponse.class);
    }

    @Test
    void testSearchEvidence_throwsException() {
        EvidenceSearchCriteria criteria = new EvidenceSearchCriteria();
        criteria.setTenantId("tenant1");

        RequestInfo requestInfo = new RequestInfo();

        when(configuration.getEvidenceServiceHost()).thenReturn("http://localhost");
        when(configuration.getEvidenceServiceSearchEndpoint()).thenReturn("/evidence/search");
        when(restTemplate.postForObject(anyString(), any(), eq(Map.class)))
                .thenThrow(new RuntimeException("Connection error"));

        CustomException ex = assertThrows(CustomException.class,
                () -> evidenceUtil.searchEvidence(criteria, requestInfo));

        assertEquals("EVIDENCE_SERVICE_ERROR", ex.getCode());
        assertTrue(ex.getMessage().contains("Connection error"));
    }

    // --- Test for updateEvidence ---

    @Test
    void testUpdateEvidence_success() {
        Artifact artifact = new Artifact();
        RequestInfo requestInfo = new RequestInfo();

        String mockUri = "http://localhost/evidence/update";

        Map<String, Object> dummyResponse = new HashMap<>();
        EvidenceResponse expectedResponse = new EvidenceResponse();

        when(configuration.getEvidenceServiceHost()).thenReturn("http://localhost");
        when(configuration.getEvidenceServiceUpdateEndpoint()).thenReturn("/evidence/update");
        when(restTemplate.postForObject(eq(mockUri), any(EvidenceRequest.class), eq(Map.class))).thenReturn(dummyResponse);
        when(objectMapper.convertValue(dummyResponse, EvidenceResponse.class)).thenReturn(expectedResponse);

        EvidenceResponse actual = evidenceUtil.updateEvidence(artifact, requestInfo);

        assertEquals(expectedResponse, actual);
        verify(restTemplate).postForObject(eq(mockUri), any(EvidenceRequest.class), eq(Map.class));
        verify(objectMapper).convertValue(dummyResponse, EvidenceResponse.class);
    }

    @Test
    void testUpdateEvidence_throwsException() {
        Artifact artifact = new Artifact();
        RequestInfo requestInfo = new RequestInfo();

        when(configuration.getEvidenceServiceHost()).thenReturn("http://localhost");
        when(configuration.getEvidenceServiceUpdateEndpoint()).thenReturn("/evidence/update");
        when(restTemplate.postForObject(anyString(), any(), eq(Map.class)))
                .thenThrow(new RuntimeException("Update failed"));

        CustomException ex = assertThrows(CustomException.class,
                () -> evidenceUtil.updateEvidence(artifact, requestInfo));

        assertEquals("EVIDENCE_SERVICE_ERROR", ex.getCode());
        assertTrue(ex.getMessage().contains("Update failed"));
    }
}
