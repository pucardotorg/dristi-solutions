package com.dristi.njdg_transformer.service.impl;

import com.dristi.njdg_transformer.config.TransformerProperties;
import com.dristi.njdg_transformer.model.*;
import com.dristi.njdg_transformer.model.cases.CourtCase;
import com.dristi.njdg_transformer.model.order.OrderListResponse;
import com.dristi.njdg_transformer.producer.Producer;
import com.dristi.njdg_transformer.repository.CaseRepository;
import com.dristi.njdg_transformer.repository.HearingRepository;
import com.dristi.njdg_transformer.utils.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import net.minidev.json.JSONArray;
import org.egov.common.contract.request.RequestInfo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NJDGCaseTransformerImplTest {

    @Mock
    private CaseRepository caseRepository;

    @Mock
    private TransformerProperties properties;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private HearingRepository hearingRepository;

    @Mock
    private DateUtil dateUtil;

    @Mock
    private NumberExtractor numberExtractor;

    @Mock
    private Producer producer;

    @Mock
    private OrderUtil orderUtil;

    @Mock
    private MdmsUtil mdmsUtil;

    @Mock
    private JsonUtil jsonUtil;

    @InjectMocks
    private NJDGCaseTransformerImpl njdgCaseTransformer;

    private CourtCase courtCase;
    private RequestInfo requestInfo;
    private JudgeDetails judgeDetails;
    private DesignationMaster designationMaster;

    @BeforeEach
    void setUp() {
        courtCase = new CourtCase();
        courtCase.setCnrNumber("CNR-001");
        courtCase.setFilingNumber("KL-000001-2024");
        courtCase.setCourtCaseNumber("ST/001/2024");
        courtCase.setCaseType("ST");
        courtCase.setFilingDate(System.currentTimeMillis());
        courtCase.setRegistrationDate(System.currentTimeMillis());
        courtCase.setCourtId("COURT001");

        requestInfo = RequestInfo.builder().build();

        judgeDetails = new JudgeDetails();
        judgeDetails.setJocode("JO001");
        judgeDetails.setCourtNo(1);
        judgeDetails.setJudgeCode(101);

        designationMaster = new DesignationMaster();
        designationMaster.setDesgName("Judicial Magistrate");
        designationMaster.setDesgCode(1);
    }

    @Test
    void testTransform_Success() {
        when(caseRepository.getJudge(any(LocalDate.class))).thenReturn(Collections.singletonList(judgeDetails));
        when(caseRepository.getDesignationMaster(anyString())).thenReturn(designationMaster);
        when(caseRepository.getCaseTypeCode(anyString())).thenReturn(1);
        when(caseRepository.findByCino(anyString())).thenReturn(null);
        when(dateUtil.formatDate(anyLong())).thenReturn(LocalDate.now());
        when(numberExtractor.extractCaseNumber(anyString())).thenReturn(1);
        when(numberExtractor.extractFilingNumber(anyString())).thenReturn(1);
        when(properties.getStateCode()).thenReturn(32);
        when(properties.getCicriType()).thenReturn('1');
        when(hearingRepository.getHearingDetailsByCino(anyString())).thenReturn(Collections.emptyList());
        when(orderUtil.getOrders(any())).thenReturn(new OrderListResponse());

        NJDGTransformRecord result = njdgCaseTransformer.transform(courtCase, requestInfo);

        assertNotNull(result);
        assertEquals("CNR-001", result.getCino());
        verify(caseRepository).insertRecord(any(NJDGTransformRecord.class));
    }

    @Test
    void testTransform_NullJudgeDetails() {
        when(caseRepository.getJudge(any(LocalDate.class))).thenReturn(Collections.emptyList());
        when(caseRepository.getDesignationMaster(anyString())).thenReturn(designationMaster);
        when(caseRepository.getCaseTypeCode(anyString())).thenReturn(1);
        when(caseRepository.findByCino(anyString())).thenReturn(null);
        when(dateUtil.formatDate(anyLong())).thenReturn(LocalDate.now());
        when(numberExtractor.extractCaseNumber(anyString())).thenReturn(1);
        when(numberExtractor.extractFilingNumber(anyString())).thenReturn(1);
        when(properties.getStateCode()).thenReturn(32);
        when(properties.getCicriType()).thenReturn('1');
        when(properties.getCourtNumber()).thenReturn(1);
        when(hearingRepository.getHearingDetailsByCino(anyString())).thenReturn(Collections.emptyList());
        when(orderUtil.getOrders(any())).thenReturn(new OrderListResponse());

        NJDGTransformRecord result = njdgCaseTransformer.transform(courtCase, requestInfo);

        assertNotNull(result);
        assertEquals("CNR-001", result.getCino());
    }

    @Test
    void testTransform_ExistingRecord() {
        NJDGTransformRecord existingRecord = new NJDGTransformRecord();
        existingRecord.setCino("CNR-001");

        when(caseRepository.getJudge(any(LocalDate.class))).thenReturn(Collections.singletonList(judgeDetails));
        when(caseRepository.getDesignationMaster(anyString())).thenReturn(designationMaster);
        when(caseRepository.getCaseTypeCode(anyString())).thenReturn(1);
        when(caseRepository.findByCino(anyString())).thenReturn(existingRecord);
        when(dateUtil.formatDate(anyLong())).thenReturn(LocalDate.now());
        when(numberExtractor.extractCaseNumber(anyString())).thenReturn(1);
        when(numberExtractor.extractFilingNumber(anyString())).thenReturn(1);
        when(properties.getStateCode()).thenReturn(32);
        when(properties.getCicriType()).thenReturn('1');
        when(hearingRepository.getHearingDetailsByCino(anyString())).thenReturn(Collections.emptyList());
        when(orderUtil.getOrders(any())).thenReturn(new OrderListResponse());

        NJDGTransformRecord result = njdgCaseTransformer.transform(courtCase, requestInfo);

        assertNotNull(result);
        verify(caseRepository, never()).insertRecord(any(NJDGTransformRecord.class));
    }

    @Test
    void testTransform_WithHearingDetails() {
        HearingDetails hearingDetail = new HearingDetails();
        hearingDetail.setHearingDate(LocalDate.now());
        hearingDetail.setPurposeOfListing("1");
        hearingDetail.setNextDate(LocalDate.now().plusDays(7));

        when(caseRepository.getJudge(any(LocalDate.class))).thenReturn(Collections.singletonList(judgeDetails));
        when(caseRepository.getDesignationMaster(anyString())).thenReturn(designationMaster);
        when(caseRepository.getCaseTypeCode(anyString())).thenReturn(1);
        when(caseRepository.findByCino(anyString())).thenReturn(null);
        when(dateUtil.formatDate(anyLong())).thenReturn(LocalDate.now());
        when(numberExtractor.extractCaseNumber(anyString())).thenReturn(1);
        when(numberExtractor.extractFilingNumber(anyString())).thenReturn(1);
        when(properties.getStateCode()).thenReturn(32);
        when(properties.getCicriType()).thenReturn('1');
        when(hearingRepository.getHearingDetailsByCino(anyString())).thenReturn(Collections.singletonList(hearingDetail));
        when(orderUtil.getOrders(any())).thenReturn(new OrderListResponse());

        NJDGTransformRecord result = njdgCaseTransformer.transform(courtCase, requestInfo);

        assertNotNull(result);
        assertEquals(hearingDetail.getHearingDate(), result.getDateFirstList());
    }

    @Test
    void testTransform_WithOutcome() {
        courtCase.setOutcome("CONVICTED");

        when(caseRepository.getJudge(any(LocalDate.class))).thenReturn(Collections.singletonList(judgeDetails));
        when(caseRepository.getDesignationMaster(anyString())).thenReturn(designationMaster);
        when(caseRepository.getCaseTypeCode(anyString())).thenReturn(1);
        when(caseRepository.findByCino(anyString())).thenReturn(null);
        when(caseRepository.getDisposalStatus(anyString())).thenReturn(1);
        when(dateUtil.formatDate(anyLong())).thenReturn(LocalDate.now());
        when(numberExtractor.extractCaseNumber(anyString())).thenReturn(1);
        when(numberExtractor.extractFilingNumber(anyString())).thenReturn(1);
        when(properties.getStateCode()).thenReturn(32);
        when(properties.getCicriType()).thenReturn('1');
        when(hearingRepository.getHearingDetailsByCino(anyString())).thenReturn(Collections.emptyList());
        when(orderUtil.getOrders(any())).thenReturn(new OrderListResponse());

        NJDGTransformRecord result = njdgCaseTransformer.transform(courtCase, requestInfo);

        assertNotNull(result);
        assertEquals('D', result.getPendDisp());
    }

    @Test
    void testTransform_Exception() {
        when(caseRepository.getJudge(any(LocalDate.class))).thenThrow(new RuntimeException("Database error"));

        assertThrows(RuntimeException.class, () -> njdgCaseTransformer.transform(courtCase, requestInfo));
    }

    @Test
    void testEnrichPoliceStationDetails_Success() {
        ObjectMapper realMapper = new ObjectMapper();
        ObjectNode caseDetails = realMapper.createObjectNode();
        ObjectNode chequeDetails = realMapper.createObjectNode();
        ObjectNode formdata = realMapper.createObjectNode();
        ObjectNode data = realMapper.createObjectNode();
        ObjectNode policeStation = realMapper.createObjectNode();
        policeStation.put("code", "PS001");

        data.set("policeStationJurisDictionCheque", policeStation);
        formdata.set("data", data);
        chequeDetails.set("formdata", realMapper.createArrayNode().add(formdata));
        caseDetails.set("chequeDetails", chequeDetails);

        courtCase.setCaseDetails(caseDetails);

        PoliceStationDetails policeStationDetails = new PoliceStationDetails();
        policeStationDetails.setPoliceStationCode(1);
        policeStationDetails.setNatCode("NAT001");
        policeStationDetails.setStName("Test Station");

        NJDGTransformRecord record = new NJDGTransformRecord();
        record.setCino("CNR-001");

        when(objectMapper.convertValue(any(), eq(com.fasterxml.jackson.databind.JsonNode.class))).thenReturn(caseDetails);
        when(caseRepository.getPoliceStationDetails(anyString())).thenReturn(policeStationDetails);

        njdgCaseTransformer.enrichPoliceStationDetails(courtCase, record);

        assertEquals(1, record.getPoliceStCode());
        assertEquals("NAT001", record.getPoliceNcode());
        assertEquals("Test Station", record.getPoliceStation());
    }

    @Test
    void testEnrichPoliceStationDetails_NoCaseDetails() {
        courtCase.setCaseDetails(null);
        NJDGTransformRecord record = new NJDGTransformRecord();
        record.setCino("CNR-001");

        when(objectMapper.convertValue(any(), eq(com.fasterxml.jackson.databind.JsonNode.class))).thenReturn(null);

        njdgCaseTransformer.enrichPoliceStationDetails(courtCase, record);

        assertNull(record.getPoliceStCode());
    }

    @Test
    void testTransform_CMPCaseType() {
        courtCase.setCaseType("CMP");
        courtCase.setCmpNumber("CMP/001/2024");

        when(caseRepository.getJudge(any(LocalDate.class))).thenReturn(Collections.singletonList(judgeDetails));
        when(caseRepository.getDesignationMaster(anyString())).thenReturn(designationMaster);
        when(caseRepository.getCaseTypeCode(anyString())).thenReturn(2);
        when(caseRepository.findByCino(anyString())).thenReturn(null);
        when(dateUtil.formatDate(anyLong())).thenReturn(LocalDate.now());
        when(numberExtractor.extractCaseNumber(anyString())).thenReturn(1);
        when(numberExtractor.extractFilingNumber(anyString())).thenReturn(1);
        when(properties.getStateCode()).thenReturn(32);
        when(properties.getCicriType()).thenReturn('1');
        when(hearingRepository.getHearingDetailsByCino(anyString())).thenReturn(Collections.emptyList());
        when(orderUtil.getOrders(any())).thenReturn(new OrderListResponse());

        NJDGTransformRecord result = njdgCaseTransformer.transform(courtCase, requestInfo);

        assertNotNull(result);
        assertEquals(2, result.getCaseType());
    }
}
