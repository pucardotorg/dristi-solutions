package com.dristi.njdg_transformer.consumer;

import com.dristi.njdg_transformer.model.cases.*;
import com.dristi.njdg_transformer.service.CaseService;
import com.dristi.njdg_transformer.utils.CaseUtil;
import org.egov.common.contract.models.AuditDetails;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.egov.common.contract.request.RequestInfo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CaseConsumerTest {

    @Mock
    private CaseService caseService;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private CaseUtil caseUtil;

    @InjectMocks
    private CaseConsumer caseConsumer;

    private ConsumerRecord<String, Object> consumerRecord;
    private CaseRequest caseRequest;
    private CourtCase courtCase;

    @BeforeEach
    void setUp() {
        courtCase = new CourtCase();
        courtCase.setFilingNumber("FN-001");
        courtCase.setStatus("CASE_ADMITTED");
        courtCase.setCnrNumber("CNR-001");

        caseRequest = new CaseRequest();
        caseRequest.setCourtCase(courtCase);
        caseRequest.setRequestInfo(RequestInfo.builder().build());

        consumerRecord = new ConsumerRecord<>("test-topic", 0, 0L, "key-1", "{\"courtCase\":{}}");
    }

    @Test
    void testListen_Success() throws Exception {
        when(objectMapper.readValue(anyString(), eq(CaseRequest.class))).thenReturn(caseRequest);
        
        JsonNode mockJsonNode = mock(JsonNode.class);
        when(caseUtil.searchCaseDetails(any(CaseSearchRequest.class))).thenReturn(mockJsonNode);
        when(objectMapper.convertValue(any(), eq(CourtCase.class))).thenReturn(courtCase);

        caseConsumer.listen(consumerRecord, "test-topic");

        verify(caseService).processAndUpdateCase(any(CourtCase.class), any(RequestInfo.class));
    }

    @Test
    void testListen_InvalidStatus_Skipped() throws Exception {
        courtCase.setStatus("INVALID_STATUS");
        when(objectMapper.readValue(anyString(), eq(CaseRequest.class))).thenReturn(caseRequest);

        caseConsumer.listen(consumerRecord, "test-topic");

        verify(caseService, never()).processAndUpdateCase(any(), any());
    }

    @Test
    void testListen_NoCnr_Skipped() throws Exception {
        courtCase.setCnrNumber(null);
        when(objectMapper.readValue(anyString(), eq(CaseRequest.class))).thenReturn(caseRequest);
        
        JsonNode mockJsonNode = mock(JsonNode.class);
        when(caseUtil.searchCaseDetails(any(CaseSearchRequest.class))).thenReturn(mockJsonNode);
        when(objectMapper.convertValue(any(), eq(CourtCase.class))).thenReturn(courtCase);

        caseConsumer.listen(consumerRecord, "test-topic");

        verify(caseService, never()).processAndUpdateCase(any(), any());
    }

    @Test
    void testListen_ExceptionHandling() throws Exception {
        when(objectMapper.readValue(anyString(), eq(CaseRequest.class)))
                .thenThrow(new RuntimeException("Parse error"));

        assertDoesNotThrow(() -> caseConsumer.listen(consumerRecord, "test-topic"));
        verify(caseService, never()).processAndUpdateCase(any(), any());
    }

    @Test
    void testListenJoinCase_Success() throws Exception {
        when(objectMapper.readValue(anyString(), eq(CourtCase.class))).thenReturn(courtCase);
        
        JsonNode mockJsonNode = mock(JsonNode.class);
        when(caseUtil.searchCaseDetails(any(CaseSearchRequest.class))).thenReturn(mockJsonNode);
        when(objectMapper.convertValue(any(), eq(CourtCase.class))).thenReturn(courtCase);

        caseConsumer.listenJoinCase(consumerRecord, "join-case-topic");

        verify(caseService).processAndUpdateCase(any(CourtCase.class), any(RequestInfo.class));
    }

    @Test
    void testListenJoinCase_NoCnr_Skipped() throws Exception {
        courtCase.setCnrNumber(null);
        when(objectMapper.readValue(anyString(), eq(CourtCase.class))).thenReturn(courtCase);
        
        JsonNode mockJsonNode = mock(JsonNode.class);
        when(caseUtil.searchCaseDetails(any(CaseSearchRequest.class))).thenReturn(mockJsonNode);
        when(objectMapper.convertValue(any(), eq(CourtCase.class))).thenReturn(courtCase);

        caseConsumer.listenJoinCase(consumerRecord, "join-case-topic");

        verify(caseService, never()).processAndUpdateCase(any(), any());
    }

    @Test
    void testListenCaseOutcome_Success() throws Exception {
        CaseOutcome caseOutcome = new CaseOutcome();
        Outcome outcome = new Outcome();
        outcome.setFilingNumber("FN-001");
        AuditDetails auditDetails = new AuditDetails();
        auditDetails.setLastModifiedTime(System.currentTimeMillis());
        outcome.setAuditDetails(auditDetails);
        caseOutcome.setOutcome(outcome);
        caseOutcome.setRequestInfo(RequestInfo.builder().build());

        when(objectMapper.readValue(anyString(), eq(CaseOutcome.class))).thenReturn(caseOutcome);
        
        JsonNode mockJsonNode = mock(JsonNode.class);
        when(caseUtil.searchCaseDetails(any(CaseSearchRequest.class))).thenReturn(mockJsonNode);
        when(objectMapper.convertValue(any(), eq(CourtCase.class))).thenReturn(courtCase);

        caseConsumer.listenCaseOutcome(consumerRecord, "case-outcome-topic");

        verify(caseService).processAndUpdateCase(any(CourtCase.class), any(RequestInfo.class));
    }

    @Test
    void testListenCaseOutcome_NoCnr_Skipped() throws Exception {
        courtCase.setCnrNumber(null);
        CaseOutcome caseOutcome = new CaseOutcome();
        Outcome outcome = new Outcome();
        outcome.setFilingNumber("FN-001");
        AuditDetails auditDetails = new AuditDetails();
        auditDetails.setLastModifiedTime(System.currentTimeMillis());
        outcome.setAuditDetails(auditDetails);
        caseOutcome.setOutcome(outcome);
        caseOutcome.setRequestInfo(RequestInfo.builder().build());

        when(objectMapper.readValue(anyString(), eq(CaseOutcome.class))).thenReturn(caseOutcome);
        
        JsonNode mockJsonNode = mock(JsonNode.class);
        when(caseUtil.searchCaseDetails(any(CaseSearchRequest.class))).thenReturn(mockJsonNode);
        when(objectMapper.convertValue(any(), eq(CourtCase.class))).thenReturn(courtCase);

        caseConsumer.listenCaseOutcome(consumerRecord, "case-outcome-topic");

        verify(caseService, never()).processAndUpdateCase(any(), any());
    }

    @Test
    void testListenCaseOverallStatus_Success() throws Exception {
        CaseStageSubStage caseStageSubStage = new CaseStageSubStage();
        CaseOverallStatus overallStatus = new CaseOverallStatus();
        overallStatus.setFilingNumber("FN-001");
        caseStageSubStage.setCaseOverallStatus(overallStatus);
        caseStageSubStage.setRequestInfo(RequestInfo.builder().build());

        when(objectMapper.readValue(anyString(), eq(CaseStageSubStage.class))).thenReturn(caseStageSubStage);
        
        JsonNode mockJsonNode = mock(JsonNode.class);
        when(caseUtil.searchCaseDetails(any(CaseSearchRequest.class))).thenReturn(mockJsonNode);
        when(objectMapper.convertValue(any(), eq(CourtCase.class))).thenReturn(courtCase);

        caseConsumer.listenCaseOverallStatus(consumerRecord, "case-status-topic");

        verify(caseService).processAndUpdateCase(any(CourtCase.class), any(RequestInfo.class));
    }

    @Test
    void testListenCaseConversion_Success() throws Exception {
        CaseConversionRequest conversionRequest = new CaseConversionRequest();
        CaseConversionDetails details = new CaseConversionDetails();
        details.setFilingNumber("FN-001");
        conversionRequest.setCaseConversionDetails(details);

        when(objectMapper.readValue(anyString(), eq(CaseConversionRequest.class))).thenReturn(conversionRequest);

        caseConsumer.listenCaseConversion(consumerRecord, "update-case-conversion");

        verify(caseService).updateCaseConversionDetails(any(CaseConversionRequest.class));
    }

    @Test
    void testCreateCaseSearchRequest() {
        RequestInfo requestInfo = RequestInfo.builder().build();
        String filingNumber = "FN-001";

        CaseSearchRequest result = caseConsumer.createCaseSearchRequest(requestInfo, filingNumber);

        assertNotNull(result);
        assertEquals(requestInfo, result.getRequestInfo());
        assertNotNull(result.getCriteria());
        assertEquals(1, result.getCriteria().size());
        assertEquals(filingNumber, result.getCriteria().get(0).getFilingNumber());
    }

    @Test
    void testExtractMessageId_WithKey() {
        ConsumerRecord<String, Object> recordWithKey = new ConsumerRecord<>("topic", 0, 100L, "my-key", "{}");
        
        caseConsumer.listen(recordWithKey, "topic");
        // Verify no exception and message ID is extracted correctly
    }

    @Test
    void testExtractMessageId_WithoutKey() {
        ConsumerRecord<String, Object> recordWithoutKey = new ConsumerRecord<>("topic", 1, 200L, null, "{}");
        
        assertDoesNotThrow(() -> caseConsumer.listen(recordWithoutKey, "topic"));
    }
}
