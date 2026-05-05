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

import java.util.HashMap;
import java.util.Map;

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
        Map<String, Object> responseMap = new HashMap<>();
        Map<String, Object> summonsDeliveryMap = new HashMap<>();
        summonsDeliveryMap.put("channelAcknowledgementId", "123");
        responseMap.put("SummonsDelivery", summonsDeliveryMap);

        SummonsDelivery expectedDelivery = SummonsDelivery.builder()
                .channelAcknowledgementId("123")
                .build();

        when(restTemplate.postForEntity(eq(mockUri), eq(taskRequest), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(responseMap));

        when(objectMapper.convertValue(summonsDeliveryMap, SummonsDelivery.class))
                .thenReturn(expectedDelivery);

        // Act
        String result = summonUtil.sendSummons(taskRequest);

        // Assert
        assertEquals("123", result);
        verify(restTemplate, times(1)).postForEntity(eq(mockUri), eq(taskRequest), eq(Map.class));
        verify(objectMapper, times(1)).convertValue(summonsDeliveryMap, SummonsDelivery.class);
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

