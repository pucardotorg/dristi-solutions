package org.pucar.dristi.util;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.UUID;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.web.models.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;
import org.egov.tracer.model.ServiceCallException;

import com.fasterxml.jackson.databind.ObjectMapper;

@ExtendWith(MockitoExtension.class)
public class HearingUtilTest {

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private ObjectMapper mapper;

    @Mock
    private Configuration configs;

    @InjectMocks
    private HearingUtil hearingUtil;

    @Mock
    private ServiceRequestRepository serviceRequestRepository;

    private final HearingSearchRequest searchRequest = mock(HearingSearchRequest.class);

    @BeforeEach
    void setUp() {
        when(configs.getHearingHost()).thenReturn("http://localhost:8080");
    }

    @Test
    void testFetchHearingDetailsSuccess() {
        HearingExistsRequest request = new HearingExistsRequest();
        Map<String, Object> response = new HashMap<>();
        response.put("criteria", List.of(Map.of("exists", true)));

        HearingExistsResponse hearingExistsResponse = HearingExistsResponse.builder()
                .order(HearingExists.builder().exists(true).build())
                .build();

        when(restTemplate.postForObject(any(String.class), eq(request), eq(Map.class)))
                .thenReturn(response);
        when(mapper.convertValue(response, HearingExistsResponse.class))
                .thenReturn(hearingExistsResponse);

        Boolean result = hearingUtil.fetchHearingDetails(request);
        assertTrue(result);
    }

    @Test
    void testFetchHearingDetailsDoesNotExist() {
        HearingExistsRequest request = new HearingExistsRequest();
        Map<String, Object> response = new HashMap<>();
        response.put("criteria", List.of(Map.of("exists", false)));

        HearingExistsResponse hearingExistsResponse = HearingExistsResponse.builder()
                .order(HearingExists.builder().exists(false).build())
                .build();

        when(restTemplate.postForObject(any(String.class), eq(request), eq(Map.class)))
                .thenReturn(response);
        when(mapper.convertValue(response, HearingExistsResponse.class))
                .thenReturn(hearingExistsResponse);

        Boolean result = hearingUtil.fetchHearingDetails(request);
        assertFalse(result);
    }

    @Test
    void testFetchHearingDetailsException() {
        HearingExistsRequest request = new HearingExistsRequest();

        when(restTemplate.postForObject(any(String.class), eq(request), eq(Map.class)))
                .thenThrow(new RuntimeException("Error"));
        assertThrows(RuntimeException.class, () -> {
            hearingUtil.fetchHearingDetails(request);
        });
    }

    @Test
    public void testFetchHearingSuccess() throws JsonProcessingException {
        HearingSearchRequest request = mock(HearingSearchRequest.class);
        String hearingHost = "http://hearing-service";
        String hearingSearchEndPoint = "/search";
        StringBuilder expectedUri = new StringBuilder(hearingHost.concat(hearingSearchEndPoint));
        Object response = new Object(); // Replace with actual object if needed
        JsonNode jsonNode = mock(JsonNode.class);
        JsonNode hearingListNode = mock(JsonNode.class);
        List<Hearing> expectedHearingList = List.of(new Hearing()); // Replace with actual Hearing list

        when(configs.getHearingHost()).thenReturn(hearingHost);
        when(configs.getHearingSearchEndPoint()).thenReturn(hearingSearchEndPoint);
        when(serviceRequestRepository.fetchResult(any(), any())).thenReturn(response);
        when(mapper.valueToTree(response)).thenReturn(jsonNode);
        when(jsonNode.get("HearingList")).thenReturn(hearingListNode);
        when(mapper.readValue(anyString(), any(TypeReference.class))).thenReturn(expectedHearingList);
        // Act
        List<Hearing> actualHearingList = hearingUtil.fetchHearing(request);

        // Assert
        assertEquals(expectedHearingList, actualHearingList);
    }

    @Test
    public void testFetchHearingException() throws JsonProcessingException {
        HearingCriteria searchCriteria = mock(HearingCriteria.class);
        searchRequest.setCriteria(searchCriteria);
        Object response = new Object();
        JsonNode jsonNode = mock(JsonNode.class);
        JsonNode hearingListNode = mock(JsonNode.class);

        when(configs.getHearingHost()).thenReturn("http://hearing-service");
        when(configs.getHearingSearchEndPoint()).thenReturn("/search");
        when(serviceRequestRepository.fetchResult(any(), any())).thenReturn(response);
        when(mapper.valueToTree(response)).thenReturn(jsonNode);
        when(jsonNode.get("HearingList")).thenReturn(hearingListNode);
        when(mapper.readValue(anyString(), any(TypeReference.class))).thenThrow(new ServiceCallException("ServiceCallException"));

        hearingUtil.fetchHearing(searchRequest);

    }
}
