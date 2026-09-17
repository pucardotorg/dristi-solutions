package com.dristi.njdg_transformer.consumer;

import com.dristi.njdg_transformer.model.HearingDetails;
import com.dristi.njdg_transformer.model.hearing.Hearing;
import com.dristi.njdg_transformer.model.hearing.HearingRequest;
import com.dristi.njdg_transformer.model.hearing.HearingUpdateBulkRequest;
import com.dristi.njdg_transformer.service.HearingService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.egov.common.contract.request.RequestInfo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HearingConsumerTest {

    @Mock
    private HearingService hearingService;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private HearingConsumer hearingConsumer;

    private ConsumerRecord<String, Object> consumerRecord;
    private HearingRequest hearingRequest;
    private Hearing hearing;

    @BeforeEach
    void setUp() {
        hearing = new Hearing();
        hearing.setHearingId("H-001");
        hearing.setStatus("COMPLETED");

        hearingRequest = new HearingRequest();
        hearingRequest.setHearing(hearing);
        hearingRequest.setRequestInfo(RequestInfo.builder().build());

        consumerRecord = new ConsumerRecord<>("hearing-topic", 0, 0L, "key-1", "{\"hearing\":{}}");
    }

    @Test
    void testListen_CompletedHearing_NoProcessing() throws Exception {
        // Hearing processing via listen is disabled - hearings are processed via orders now
        hearingConsumer.listen(consumerRecord, "hearing-topic");

        // Verify no service interaction since processAndUpdateHearing is commented out
        verify(hearingService, never()).processAndUpdateHearings(any(Hearing.class), any(RequestInfo.class));
    }

    @Test
    void testListen_NonCompletedHearing_NoProcessing() throws Exception {
        hearing.setStatus("SCHEDULED");
        // Hearing processing via listen is disabled
        hearingConsumer.listen(consumerRecord, "hearing-topic");

        verify(hearingService, never()).processAndUpdateHearings(any(), any());
    }

    @Test
    void testListen_ExceptionHandling() throws Exception {
        // Even with any exception, listen should not throw since processing is disabled
        assertDoesNotThrow(() -> hearingConsumer.listen(consumerRecord, "hearing-topic"));
        verify(hearingService, never()).processAndUpdateHearings(any(), any());
    }

    @Test
    void testListenBulkReschedule_Success() throws Exception {
        Hearing hearing1 = new Hearing();
        hearing1.setHearingId("H-001");
        hearing1.setStatus("COMPLETED");

        Hearing hearing2 = new Hearing();
        hearing2.setHearingId("H-002");
        hearing2.setStatus("COMPLETED");

        HearingUpdateBulkRequest bulkRequest = new HearingUpdateBulkRequest();
        bulkRequest.setHearings(Arrays.asList(hearing1, hearing2));
        bulkRequest.setRequestInfo(RequestInfo.builder().build());

        when(objectMapper.convertValue(any(), eq(HearingUpdateBulkRequest.class))).thenReturn(bulkRequest);
        when(hearingService.processAndUpdateHearings(any(Hearing.class), any(RequestInfo.class)))
                .thenReturn(new HearingDetails());

        hearingConsumer.listenBulkReschedule(consumerRecord, "bulk-reschedule-topic");

        verify(hearingService, times(2)).processAndUpdateHearings(any(Hearing.class), any(RequestInfo.class));
    }

    @Test
    void testListenBulkReschedule_EmptyHearings() throws Exception {
        HearingUpdateBulkRequest bulkRequest = new HearingUpdateBulkRequest();
        bulkRequest.setHearings(Collections.emptyList());

        when(objectMapper.convertValue(any(), eq(HearingUpdateBulkRequest.class))).thenReturn(bulkRequest);

        hearingConsumer.listenBulkReschedule(consumerRecord, "bulk-reschedule-topic");

        verify(hearingService, never()).processAndUpdateHearings(any(), any());
    }

    @Test
    void testListenBulkReschedule_NullHearings() throws Exception {
        HearingUpdateBulkRequest bulkRequest = new HearingUpdateBulkRequest();
        bulkRequest.setHearings(null);

        when(objectMapper.convertValue(any(), eq(HearingUpdateBulkRequest.class))).thenReturn(bulkRequest);

        hearingConsumer.listenBulkReschedule(consumerRecord, "bulk-reschedule-topic");

        verify(hearingService, never()).processAndUpdateHearings(any(), any());
    }

    @Test
    void testListenBulkReschedule_NullRequest() throws Exception {
        when(objectMapper.convertValue(any(), eq(HearingUpdateBulkRequest.class))).thenReturn(null);

        hearingConsumer.listenBulkReschedule(consumerRecord, "bulk-reschedule-topic");

        verify(hearingService, never()).processAndUpdateHearings(any(), any());
    }

    @Test
    void testListenBulkReschedule_MixedStatuses() throws Exception {
        Hearing completedHearing = new Hearing();
        completedHearing.setHearingId("H-001");
        completedHearing.setStatus("COMPLETED");

        Hearing scheduledHearing = new Hearing();
        scheduledHearing.setHearingId("H-002");
        scheduledHearing.setStatus("SCHEDULED");

        HearingUpdateBulkRequest bulkRequest = new HearingUpdateBulkRequest();
        bulkRequest.setHearings(Arrays.asList(completedHearing, scheduledHearing));
        bulkRequest.setRequestInfo(RequestInfo.builder().build());

        when(objectMapper.convertValue(any(), eq(HearingUpdateBulkRequest.class))).thenReturn(bulkRequest);
        when(hearingService.processAndUpdateHearings(any(Hearing.class), any(RequestInfo.class)))
                .thenReturn(new HearingDetails());

        hearingConsumer.listenBulkReschedule(consumerRecord, "bulk-reschedule-topic");

        verify(hearingService, times(1)).processAndUpdateHearings(any(Hearing.class), any(RequestInfo.class));
    }

    @Test
    void testListenBulkReschedule_PartialFailure() throws Exception {
        Hearing hearing1 = new Hearing();
        hearing1.setHearingId("H-001");
        hearing1.setStatus("COMPLETED");

        Hearing hearing2 = new Hearing();
        hearing2.setHearingId("H-002");
        hearing2.setStatus("COMPLETED");

        HearingUpdateBulkRequest bulkRequest = new HearingUpdateBulkRequest();
        bulkRequest.setHearings(Arrays.asList(hearing1, hearing2));
        bulkRequest.setRequestInfo(RequestInfo.builder().build());

        when(objectMapper.convertValue(any(), eq(HearingUpdateBulkRequest.class))).thenReturn(bulkRequest);
        when(hearingService.processAndUpdateHearings(eq(hearing1), any(RequestInfo.class)))
                .thenThrow(new RuntimeException("Processing error"));
        when(hearingService.processAndUpdateHearings(eq(hearing2), any(RequestInfo.class)))
                .thenReturn(new HearingDetails());

        hearingConsumer.listenBulkReschedule(consumerRecord, "bulk-reschedule-topic");

        verify(hearingService, times(2)).processAndUpdateHearings(any(Hearing.class), any(RequestInfo.class));
    }

    @Test
    void testListenBulkReschedule_ExceptionHandling() throws Exception {
        when(objectMapper.convertValue(any(), eq(HearingUpdateBulkRequest.class)))
                .thenThrow(new RuntimeException("Conversion error"));

        assertDoesNotThrow(() -> hearingConsumer.listenBulkReschedule(consumerRecord, "bulk-reschedule-topic"));
    }

    @Test
    void testExtractMessageId_WithKey() {
        ConsumerRecord<String, Object> recordWithKey = new ConsumerRecord<>("topic", 0, 100L, "my-key", "{}");
        
        assertDoesNotThrow(() -> hearingConsumer.listen(recordWithKey, "topic"));
    }

    @Test
    void testExtractMessageId_WithoutKey() {
        ConsumerRecord<String, Object> recordWithoutKey = new ConsumerRecord<>("topic", 1, 200L, null, "{}");
        
        assertDoesNotThrow(() -> hearingConsumer.listen(recordWithoutKey, "topic"));
    }
}
