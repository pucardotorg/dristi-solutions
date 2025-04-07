package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.web.models.*;

import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SummonUtilTest {

    @Mock
    private Configuration configuration;

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private SummonUtil summonUtil;

    private TaskRequest taskRequest;
    private final String mockUri = "http://localhost/summons-svc/summons/v1/_sendSummons";

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        Task task = Task.builder()
                .taskType("APPEARANCE")
                .build();

        taskRequest = TaskRequest.builder()
                .task(task)
                .build();

        when(configuration.getSummonHost()).thenReturn("http://localhost");
        when(configuration.getSummonSendSummonPath()).thenReturn("/summons-svc/summons/v1/_sendSummons");
    }

    @Test
    void testSendSummons_Success() {
        Object fakeResponse = new Object();
        TaskResponse taskResponse = new TaskResponse();

        when(restTemplate.postForEntity(eq(mockUri), eq(taskRequest), eq(Object.class)))
                .thenReturn(ResponseEntity.ok(fakeResponse));
        when(objectMapper.convertValue(any(), eq(TaskResponse.class)))
                .thenReturn(taskResponse);

        assertDoesNotThrow(() -> summonUtil.sendSummons(taskRequest));
        verify(restTemplate, times(1)).postForEntity(eq(mockUri), eq(taskRequest), eq(Object.class));
    }

    @Test
    void testSendSummons_Failure() {
        when(restTemplate.postForEntity(anyString(), any(), eq(Object.class)))
                .thenThrow(new RuntimeException("Failed to send"));

        CustomException exception = assertThrows(CustomException.class,
                () -> summonUtil.sendSummons(taskRequest));

        assertEquals("SUMMONS_SEND_ERROR", exception.getCode());
        assertEquals("Error occurred while sending summons", exception.getMessage());
    }
}

