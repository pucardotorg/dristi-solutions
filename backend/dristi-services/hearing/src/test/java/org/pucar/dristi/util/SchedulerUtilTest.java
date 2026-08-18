package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.web.models.*;
import org.slf4j.Logger;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class SchedulerUtilTest {

    @Mock
    private ServiceRequestRepository repository;

    @Mock
    private Configuration configuration;

    @Mock
    private ObjectMapper mapper;

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private Logger log;

    @InjectMocks
    private SchedulerUtil schedulerUtil;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testCallBulkReschedule_Success() throws Exception {
        // Arrange
        BulkRescheduleRequest request = new BulkRescheduleRequest();
        StringBuilder uri = new StringBuilder("http://localhost:8080/bulk-reschedule");
        BulkRescheduleResponse response = new BulkRescheduleResponse();
        List<ScheduleHearing> hearings = Collections.singletonList(new ScheduleHearing());
        response.setReScheduleHearings(hearings);

        when(configuration.getSchedulerHost()).thenReturn("http://localhost:8080");
        when(configuration.getBulkRescheduleEndPoint()).thenReturn("/bulk-reschedule");
        when(repository.fetchResult(any(StringBuilder.class), eq(request))).thenReturn(response);
        when(mapper.convertValue(response, BulkRescheduleResponse.class)).thenReturn(response);

        // Act
        List<ScheduleHearing> result = schedulerUtil.callBulkReschedule(request);

        // Assert
        assertNotNull(result);
        assertEquals(hearings, result);
        verify(repository, times(1)).fetchResult(any(StringBuilder.class), eq(request));
    }

    @Test
    void testCallBulkReschedule_Exception() throws Exception {
        // Arrange
        BulkRescheduleRequest request = new BulkRescheduleRequest();
        when(configuration.getSchedulerHost()).thenReturn("http://localhost:8080");
        when(configuration.getBulkRescheduleEndPoint()).thenReturn("/bulk-reschedule");
        when(repository.fetchResult(any(StringBuilder.class), eq(request))).thenThrow(new RuntimeException("Test Exception"));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> schedulerUtil.callBulkReschedule(request));
        assertEquals("Test Exception", exception.getMessage());
    }

    @Test
    void testGetScheduledHearings_Success() throws Exception {
        // Arrange
        ScheduleHearingSearchRequest request = new ScheduleHearingSearchRequest();
        ScheduleHearingSearchResponse response = new ScheduleHearingSearchResponse();
        List<ScheduleHearing> hearings = Collections.singletonList(new ScheduleHearing());
        response.setHearings(hearings);

        when(configuration.getSchedulerHost()).thenReturn("http://localhost:8080");
        when(configuration.getSchedulerSearchEndpoint()).thenReturn("/search");
        when(repository.fetchResult(any(StringBuilder.class), eq(request))).thenReturn(response);
        when(mapper.convertValue(response, ScheduleHearingSearchResponse.class)).thenReturn(response);

        // Act
        List<ScheduleHearing> result = schedulerUtil.getScheduledHearings(request);

        // Assert
        assertNotNull(result);
        assertEquals(hearings, result);
        verify(repository, times(1)).fetchResult(any(StringBuilder.class), eq(request));
    }

    @Test
    void testGetScheduledHearings_Exception() throws Exception {
        // Arrange
        ScheduleHearingSearchRequest request = new ScheduleHearingSearchRequest();
        when(configuration.getSchedulerHost()).thenReturn("http://localhost:8080");
        when(configuration.getSchedulerSearchEndpoint()).thenReturn("/search");
        when(repository.fetchResult(any(StringBuilder.class), eq(request))).thenThrow(new RuntimeException("Test Exception"));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> schedulerUtil.getScheduledHearings(request));
        assertEquals("Test Exception", exception.getMessage());
    }

    @Test
    void testUpdateScheduleHearings_Success() {
        // Arrange
        ScheduleHearingUpdateRequest request = new ScheduleHearingUpdateRequest();
        StringBuilder uri = new StringBuilder("http://localhost:8080/update");
        Map<String, Object> response = new HashMap<>();

        when(configuration.getSchedulerHost()).thenReturn("http://localhost:8080");
        when(configuration.getSchedulerUpdateEndpoint()).thenReturn("/update");
        when(restTemplate.postForEntity(eq(uri.toString()), eq(request), eq(Map.class))).thenReturn(null); // Mock successful call

        // Act
        assertDoesNotThrow(() -> schedulerUtil.updateScheduleHearings(request));

        // Assert
        verify(restTemplate, times(1)).postForEntity(eq(uri.toString()), eq(request), eq(Map.class));
    }

    @Test
    void testUpdateScheduleHearings_Exception() {
        // Arrange
        ScheduleHearingUpdateRequest request = new ScheduleHearingUpdateRequest();
        when(configuration.getSchedulerHost()).thenReturn("http://localhost:8080");
        when(configuration.getSchedulerUpdateEndpoint()).thenReturn("/update");
        when(restTemplate.postForEntity(anyString(), eq(request), eq(Map.class)))
                .thenThrow(new RuntimeException("Update Failed"));

        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () -> schedulerUtil.updateScheduleHearings(request));
        assertEquals("Error updating time for hearing in Scheduler.", exception.getCode());
        assertEquals("Update Failed", exception.getMessage());
    }
}
