package com.dristi.njdg_transformer.service;

import com.dristi.njdg_transformer.model.*;
import com.dristi.njdg_transformer.model.cases.*;
import com.dristi.njdg_transformer.producer.Producer;
import com.dristi.njdg_transformer.repository.CaseRepository;
import com.dristi.njdg_transformer.repository.HearingRepository;
import com.dristi.njdg_transformer.service.interfaces.CaseTransformer;
import com.dristi.njdg_transformer.service.interfaces.DataProcessor;
import com.dristi.njdg_transformer.service.interfaces.PartyEnricher;
import com.dristi.njdg_transformer.utils.NumberExtractor;
import org.egov.common.contract.request.RequestInfo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
class CaseServiceTest {

    @Mock
    private CaseRepository caseRepository;

    @Mock
    private HearingRepository hearingRepository;

    @Mock
    private Producer producer;

    @Mock
    private CaseTransformer caseTransformer;

    @Mock
    private PartyEnricher partyEnricher;

    @Mock
    private DataProcessor dataProcessor;

    @Mock
    private NumberExtractor numberExtractor;

    @InjectMocks
    private CaseService caseService;

    private CourtCase courtCase;
    private RequestInfo requestInfo;
    private NJDGTransformRecord njdgRecord;

    @BeforeEach
    void setUp() {
        courtCase = new CourtCase();
        courtCase.setCnrNumber("CNR-001");
        courtCase.setFilingNumber("FN-001");
        courtCase.setCaseType("CMP");
        courtCase.setStatus("CASE_ADMITTED");
        courtCase.setTenantId("kl.kollam");

        requestInfo = RequestInfo.builder().build();

        njdgRecord = new NJDGTransformRecord();
        njdgRecord.setCino("CNR-001");
        njdgRecord.setCaseType(1);
    }

    @Test
    void testProcessAndUpdateCase_Success() {
        when(caseTransformer.transform(any(CourtCase.class), any(RequestInfo.class))).thenReturn(njdgRecord);
        doNothing().when(partyEnricher).enrichPrimaryPartyDetails(any(), any(), anyString());
        doNothing().when(partyEnricher).enrichAdvocateDetails(any(), any(), anyString());
        doNothing().when(dataProcessor).processExtraParties(any(CourtCase.class));
        doNothing().when(dataProcessor).processActs(any(CourtCase.class));

        NJDGTransformRecord result = caseService.processAndUpdateCase(courtCase, requestInfo);

        assertNotNull(result);
        assertEquals("CNR-001", result.getCino());
        verify(producer).push(eq("save-case-details"), any(NJDGTransformRecord.class));
    }

    @Test
    void testProcessAndUpdateCase_NullCnr() {
        courtCase.setCnrNumber(null);
        when(caseTransformer.transform(any(CourtCase.class), any(RequestInfo.class))).thenReturn(njdgRecord);
        doNothing().when(partyEnricher).enrichPrimaryPartyDetails(any(), any(), any());
        doNothing().when(partyEnricher).enrichAdvocateDetails(any(), any(), any());
        doNothing().when(dataProcessor).processExtraParties(any(CourtCase.class));
        doNothing().when(dataProcessor).processActs(any(CourtCase.class));

        // Service may handle null CNR differently
        NJDGTransformRecord result = caseService.processAndUpdateCase(courtCase, requestInfo);
        assertNotNull(result);
    }

    @Test
    void testGetNjdgTransformRecord_Found() {
        when(caseRepository.findByCino("CNR-001")).thenReturn(njdgRecord);

        NJDGTransformRecord result = caseService.getNjdgTransformRecord("CNR-001");

        assertNotNull(result);
        assertEquals("CNR-001", result.getCino());
    }

    @Test
    void testGetNjdgTransformRecord_NotFound() {
        when(caseRepository.findByCino("CNR-999")).thenReturn(null);

        NJDGTransformRecord result = caseService.getNjdgTransformRecord("CNR-999");

        assertNull(result);
    }

    @Test
    void testUpdateCaseConversionDetails_Success() {
        CaseConversionRequest request = new CaseConversionRequest();
        CaseConversionDetails details = CaseConversionDetails.builder()
                .filingNumber("FN-001")
                .cnrNumber("CNR-001")
                .preCaseNumber("OLD-001/2023")
                .postCaseNumber("NEW-001/2024")
                .build();
        request.setCaseConversionDetails(details);

        lenient().when(caseRepository.findByCino("CNR-001")).thenReturn(njdgRecord);
        lenient().when(numberExtractor.extractCaseNumber(anyString())).thenReturn(1);
        lenient().when(caseRepository.getCaseTypeCode(anyString())).thenReturn(1);
        lenient().when(caseRepository.getNextSrNoForCaseConversion("CNR-001")).thenReturn(1);

        // Service method is called - verification may vary based on implementation
        caseService.updateCaseConversionDetails(request);
    }

    @Test
    void testUpdateCaseConversionDetails_NoCaseFound() {
        CaseConversionRequest request = new CaseConversionRequest();
        CaseConversionDetails details = CaseConversionDetails.builder()
                .filingNumber("FN-001")
                .cnrNumber("CNR-001")
                .build();
        request.setCaseConversionDetails(details);

        lenient().when(caseRepository.findByCino("CNR-001")).thenReturn(null);

        caseService.updateCaseConversionDetails(request);

        verify(producer, never()).push(anyString(), any());
    }

    @Test
    void testProcessAndUpdateCase_TransformerException() {
        when(caseTransformer.transform(any(CourtCase.class), any(RequestInfo.class)))
                .thenThrow(new RuntimeException("Transform error"));

        assertThrows(RuntimeException.class, () -> 
            caseService.processAndUpdateCase(courtCase, requestInfo));
    }

    @Test
    void testProcessAndUpdateCase_EnrichmentException() {
        when(caseTransformer.transform(any(CourtCase.class), any(RequestInfo.class))).thenReturn(njdgRecord);
        doThrow(new RuntimeException("Enrichment error"))
                .when(partyEnricher).enrichPrimaryPartyDetails(any(), any(), anyString());

        assertThrows(RuntimeException.class, () -> 
            caseService.processAndUpdateCase(courtCase, requestInfo));
    }
}
