package com.dristi.njdg_transformer.consumer;

import com.dristi.njdg_transformer.model.AdvocateDetails;
import com.dristi.njdg_transformer.model.advocate.Advocate;
import com.dristi.njdg_transformer.model.advocate.AdvocateRequest;
import com.dristi.njdg_transformer.service.AdvocateService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.egov.common.contract.request.RequestInfo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdvocateConsumerTest {

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private AdvocateService advocateService;

    @InjectMocks
    private AdvocateConsumer advocateConsumer;

    private ConsumerRecord<String, Object> consumerRecord;
    private AdvocateRequest advocateRequest;
    private Advocate advocate;

    @BeforeEach
    void setUp() {
        advocate = new Advocate();
        advocate.setId(UUID.randomUUID());
        advocate.setStatus("ACTIVE");
        advocate.setBarRegistrationNumber("BAR-001");
        advocate.setIndividualId("IND-001");

        advocateRequest = new AdvocateRequest();
        advocateRequest.setAdvocate(advocate);
        advocateRequest.setRequestInfo(RequestInfo.builder().build());

        consumerRecord = new ConsumerRecord<>("update-advocate-application", 0, 0L, "key-1", "{\"advocate\":{}}");
    }

    @Test
    void testListen_ActiveAdvocate_Success() throws Exception {
        when(objectMapper.readValue(anyString(), eq(AdvocateRequest.class))).thenReturn(advocateRequest);
        when(advocateService.processAndUpdateAdvocates(any(AdvocateRequest.class)))
                .thenReturn(new AdvocateDetails());

        advocateConsumer.listen(consumerRecord, "update-advocate-application");

        verify(advocateService).processAndUpdateAdvocates(any(AdvocateRequest.class));
    }

    @Test
    void testListen_InactiveAdvocate_Skipped() throws Exception {
        advocate.setStatus("INACTIVE");
        when(objectMapper.readValue(anyString(), eq(AdvocateRequest.class))).thenReturn(advocateRequest);

        advocateConsumer.listen(consumerRecord, "update-advocate-application");

        verify(advocateService, never()).processAndUpdateAdvocates(any());
    }

    @Test
    void testListen_PendingAdvocate_Skipped() throws Exception {
        advocate.setStatus("PENDING");
        when(objectMapper.readValue(anyString(), eq(AdvocateRequest.class))).thenReturn(advocateRequest);

        advocateConsumer.listen(consumerRecord, "update-advocate-application");

        verify(advocateService, never()).processAndUpdateAdvocates(any());
    }

    @Test
    void testListen_NullStatus_Skipped() throws Exception {
        advocate.setStatus(null);
        when(objectMapper.readValue(anyString(), eq(AdvocateRequest.class))).thenReturn(advocateRequest);

        advocateConsumer.listen(consumerRecord, "update-advocate-application");

        verify(advocateService, never()).processAndUpdateAdvocates(any());
    }

    @Test
    void testListen_CaseInsensitiveStatus_Success() throws Exception {
        advocate.setStatus("active");
        when(objectMapper.readValue(anyString(), eq(AdvocateRequest.class))).thenReturn(advocateRequest);
        when(advocateService.processAndUpdateAdvocates(any(AdvocateRequest.class)))
                .thenReturn(new AdvocateDetails());

        advocateConsumer.listen(consumerRecord, "update-advocate-application");

        verify(advocateService).processAndUpdateAdvocates(any(AdvocateRequest.class));
    }

    @Test
    void testListen_ExceptionDuringParsing() throws Exception {
        when(objectMapper.readValue(anyString(), eq(AdvocateRequest.class)))
                .thenThrow(new RuntimeException("Parse error"));

        assertDoesNotThrow(() -> advocateConsumer.listen(consumerRecord, "update-advocate-application"));
        verify(advocateService, never()).processAndUpdateAdvocates(any());
    }

    @Test
    void testListen_ExceptionDuringProcessing() throws Exception {
        when(objectMapper.readValue(anyString(), eq(AdvocateRequest.class))).thenReturn(advocateRequest);
        when(advocateService.processAndUpdateAdvocates(any(AdvocateRequest.class)))
                .thenThrow(new RuntimeException("Processing error"));

        assertDoesNotThrow(() -> advocateConsumer.listen(consumerRecord, "update-advocate-application"));
    }

    @Test
    void testExtractMessageId_WithKey() {
        ConsumerRecord<String, Object> recordWithKey = new ConsumerRecord<>("topic", 0, 100L, "my-key", "{}");
        
        assertDoesNotThrow(() -> advocateConsumer.listen(recordWithKey, "topic"));
    }

    @Test
    void testExtractMessageId_WithoutKey() {
        ConsumerRecord<String, Object> recordWithoutKey = new ConsumerRecord<>("topic", 1, 200L, null, "{}");
        
        assertDoesNotThrow(() -> advocateConsumer.listen(recordWithoutKey, "topic"));
    }

    @Test
    void testListen_MultipleTopicPartitions() throws Exception {
        when(objectMapper.readValue(anyString(), eq(AdvocateRequest.class))).thenReturn(advocateRequest);
        when(advocateService.processAndUpdateAdvocates(any(AdvocateRequest.class)))
                .thenReturn(new AdvocateDetails());

        ConsumerRecord<String, Object> record1 = new ConsumerRecord<>("topic", 0, 0L, "key-1", "{}");
        ConsumerRecord<String, Object> record2 = new ConsumerRecord<>("topic", 1, 0L, "key-2", "{}");

        advocateConsumer.listen(record1, "topic");
        advocateConsumer.listen(record2, "topic");

        verify(advocateService, times(2)).processAndUpdateAdvocates(any(AdvocateRequest.class));
    }
}
