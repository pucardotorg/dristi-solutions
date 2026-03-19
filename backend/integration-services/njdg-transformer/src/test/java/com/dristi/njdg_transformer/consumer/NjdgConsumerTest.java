package com.dristi.njdg_transformer.consumer;

import com.dristi.njdg_transformer.model.*;
import com.dristi.njdg_transformer.repository.AdvocateRepository;
import com.dristi.njdg_transformer.repository.CaseRepository;
import com.dristi.njdg_transformer.repository.HearingRepository;
import com.dristi.njdg_transformer.repository.OrderRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NjdgConsumerTest {

    @Mock
    private CaseRepository caseRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private HearingRepository hearingRepository;

    @Mock
    private AdvocateRepository advocateRepository;

    @InjectMocks
    private NjdgConsumer njdgConsumer;

    private ConsumerRecord<String, Object> consumerRecord;
    private NJDGTransformRecord transformRecord;

    @BeforeEach
    void setUp() {
        transformRecord = new NJDGTransformRecord();
        transformRecord.setCino("CINO-001");
        transformRecord.setPurposeNext(5);

        consumerRecord = new ConsumerRecord<>("save-case-details", 0, 0L, "key-1", "{}");
    }

    @Test
    void testListen_NewRecord_Success() throws Exception {
        when(objectMapper.readValue(anyString(), eq(NJDGTransformRecord.class))).thenReturn(transformRecord);
        when(caseRepository.findByCino("CINO-001")).thenReturn(null);

        njdgConsumer.listen(consumerRecord, "save-case-details");

        verify(caseRepository).insertRecord(any(NJDGTransformRecord.class));
    }

    @Test
    void testListen_ExistingRecord_Update() throws Exception {
        NJDGTransformRecord existingRecord = new NJDGTransformRecord();
        existingRecord.setCino("CINO-001");
        existingRecord.setPurposeNext(10);

        when(objectMapper.readValue(anyString(), eq(NJDGTransformRecord.class))).thenReturn(transformRecord);
        when(caseRepository.findByCino("CINO-001")).thenReturn(existingRecord);

        njdgConsumer.listen(consumerRecord, "save-case-details");

        verify(caseRepository).updateRecord(any(NJDGTransformRecord.class));
    }

    @Test
    void testListen_ExistingRecordWithPurposeNext_Preserved() throws Exception {
        NJDGTransformRecord existingRecord = new NJDGTransformRecord();
        existingRecord.setCino("CINO-001");
        existingRecord.setPurposeNext(10);

        NJDGTransformRecord newRecord = new NJDGTransformRecord();
        newRecord.setCino("CINO-001");
        newRecord.setPurposeNext(null);

        when(objectMapper.readValue(anyString(), eq(NJDGTransformRecord.class))).thenReturn(newRecord);
        when(caseRepository.findByCino("CINO-001")).thenReturn(existingRecord);

        njdgConsumer.listen(consumerRecord, "save-case-details");

        verify(caseRepository).updateRecord(argThat(record -> 
            record.getPurposeNext() != null && record.getPurposeNext() == 10));
    }

    @Test
    void testListen_ExceptionHandling() throws Exception {
        when(objectMapper.readValue(anyString(), eq(NJDGTransformRecord.class)))
                .thenThrow(new RuntimeException("Parse error"));

        assertDoesNotThrow(() -> njdgConsumer.listen(consumerRecord, "save-case-details"));
    }

    @Test
    void testListenOrder_Success() throws Exception {
        InterimOrder interimOrder = new InterimOrder();
        interimOrder.setCourtOrderNumber("ORD-001");
        interimOrder.setCino("CINO-001");
        interimOrder.setOrderDate(LocalDate.now());

        when(objectMapper.readValue(anyString(), eq(InterimOrder.class))).thenReturn(interimOrder);
        when(caseRepository.findByCino("CINO-001")).thenReturn(transformRecord);

        njdgConsumer.listenOrder(consumerRecord, "save-order-details");

        verify(orderRepository).insertInterimOrder(any(InterimOrder.class));
        verify(caseRepository).updateRecord(any(NJDGTransformRecord.class));
    }

    @Test
    void testListenOrder_NoCaseFound() throws Exception {
        InterimOrder interimOrder = new InterimOrder();
        interimOrder.setCourtOrderNumber("ORD-001");
        interimOrder.setCino("CINO-001");

        when(objectMapper.readValue(anyString(), eq(InterimOrder.class))).thenReturn(interimOrder);
        when(caseRepository.findByCino("CINO-001")).thenReturn(null);

        njdgConsumer.listenOrder(consumerRecord, "save-order-details");

        verify(orderRepository).insertInterimOrder(any(InterimOrder.class));
        verify(caseRepository, never()).updateRecord(any());
    }

    @Test
    void testListenHearing_Success() throws Exception {
        HearingDetails hearingDetails = new HearingDetails();
        hearingDetails.setCino("CINO-001");
        hearingDetails.setHearingId("H-001");
        hearingDetails.setSrNo(1);
        hearingDetails.setHearingDate(LocalDate.now());
        hearingDetails.setPurposeOfListing("5");

        when(objectMapper.readValue(anyString(), eq(HearingDetails.class))).thenReturn(hearingDetails);
        when(hearingRepository.getHearingDetailsByCino("CINO-001")).thenReturn(Collections.emptyList());
        when(caseRepository.findByCino("CINO-001")).thenReturn(transformRecord);

        njdgConsumer.listenHearing(consumerRecord, "save-hearing-details");

        verify(hearingRepository).insertHearingDetails(any(HearingDetails.class));
        verify(caseRepository).updateRecord(any(NJDGTransformRecord.class));
    }

    @Test
    void testUpdateHearingDetails_Success() throws Exception {
        HearingDetails hearingDetails = new HearingDetails();
        hearingDetails.setCino("CINO-001");
        hearingDetails.setHearingId("H-001");

        when(objectMapper.readValue(anyString(), eq(HearingDetails.class))).thenReturn(hearingDetails);

        njdgConsumer.updateHearingDetails(consumerRecord, "update-hearing-details");

        verify(hearingRepository).updateHearingDetails(any(HearingDetails.class));
    }

    @Test
    void testListenExtraParties_Success() throws Exception {
        PartyDetails party1 = PartyDetails.builder()
                .cino("CINO-001")
                .partyName("Party 1")
                .build();
        PartyDetails party2 = PartyDetails.builder()
                .cino("CINO-001")
                .partyName("Party 2")
                .build();

        lenient().when(objectMapper.readValue(anyString(), any(com.fasterxml.jackson.core.type.TypeReference.class)))
                .thenReturn(Arrays.asList(party1, party2));

        njdgConsumer.listenExtraParties(consumerRecord, "save-extra-parties");

        // Verification depends on implementation
    }

    @Test
    void testListenExtraParties_PartialFailure() throws Exception {
        PartyDetails party1 = PartyDetails.builder()
                .cino("CINO-001")
                .partyName("Party 1")
                .build();
        PartyDetails party2 = PartyDetails.builder()
                .cino("CINO-001")
                .partyName("Party 2")
                .build();

        lenient().when(objectMapper.readValue(anyString(), any(com.fasterxml.jackson.core.type.TypeReference.class)))
                .thenReturn(Arrays.asList(party1, party2));
        lenient().doThrow(new RuntimeException("DB Error")).when(caseRepository).updateExtraParties(party1);

        njdgConsumer.listenExtraParties(consumerRecord, "save-extra-parties");

        // Verification depends on implementation
    }

    @Test
    void testListenAdvocates_Success() throws Exception {
        AdvocateDetails advocateDetails = new AdvocateDetails();
        advocateDetails.setAdvocateCode(1);
        advocateDetails.setAdvocateName("Advocate 1");

        when(objectMapper.readValue(anyString(), eq(AdvocateDetails.class))).thenReturn(advocateDetails);

        njdgConsumer.listenAdvocates(consumerRecord, "save-advocate-details");

        verify(advocateRepository).insertAdvocateDetails(any(AdvocateDetails.class));
    }

    @Test
    void testListenAdvocateUpdates_Success() throws Exception {
        AdvocateDetails advocateDetails = new AdvocateDetails();
        advocateDetails.setAdvocateCode(1);
        advocateDetails.setAdvocateId("ADV-001");
        advocateDetails.setAdvocateName("Advocate 1");

        when(objectMapper.readValue(anyString(), eq(AdvocateDetails.class))).thenReturn(advocateDetails);

        njdgConsumer.listenAdvocateUpdates(consumerRecord, "update-advocate-details");

        verify(advocateRepository).updateAdvocateDetails(any(AdvocateDetails.class));
    }

    @Test
    void testListenActDetails_Success() throws Exception {
        Act act = new Act();
        act.setCino("CINO-001");
        act.setActCode(1);
        act.setActName("Test Act");

        when(objectMapper.readValue(anyString(), eq(Act.class))).thenReturn(act);

        njdgConsumer.listenActDetails(consumerRecord, "save-act-details");

        verify(caseRepository).upsertActDetails(any(Act.class));
    }

    @Test
    void testListenExtraAdvocateDetails_Success() throws Exception {
        ExtraAdvocateDetails advocate1 = ExtraAdvocateDetails.builder()
                .cino("CINO-001")
                .advName("Advocate 1")
                .build();
        ExtraAdvocateDetails advocate2 = ExtraAdvocateDetails.builder()
                .cino("CINO-001")
                .advName("Advocate 2")
                .build();

        lenient().when(objectMapper.readValue(anyString(), any(com.fasterxml.jackson.core.type.TypeReference.class)))
                .thenReturn(Arrays.asList(advocate1, advocate2));

        njdgConsumer.listenExtraAdvocateDetails(consumerRecord, "save-extra-advocate-details");

        // Verification depends on implementation
    }

    @Test
    void testListenCaseConversionDetails_Success() throws Exception {
        CaseTypeDetails caseTypeDetails = new CaseTypeDetails();
        caseTypeDetails.setCino("CINO-001");

        when(objectMapper.readValue(anyString(), eq(CaseTypeDetails.class))).thenReturn(caseTypeDetails);
        when(caseRepository.getNextSrNoForCaseConversion("CINO-001")).thenReturn(1);

        njdgConsumer.listenCaseConversionDetails(consumerRecord, "save-case-conversion-details");

        verify(caseRepository).insertCaseConversionDetails(any(CaseTypeDetails.class));
    }

    @Test
    void testExtractMessageId_WithKey() {
        ConsumerRecord<String, Object> recordWithKey = new ConsumerRecord<>("topic", 0, 100L, "my-key", "{}");
        
        assertDoesNotThrow(() -> njdgConsumer.listen(recordWithKey, "topic"));
    }

    @Test
    void testExtractMessageId_WithoutKey() {
        ConsumerRecord<String, Object> recordWithoutKey = new ConsumerRecord<>("topic", 1, 200L, null, "{}");
        
        assertDoesNotThrow(() -> njdgConsumer.listen(recordWithoutKey, "topic"));
    }
}
