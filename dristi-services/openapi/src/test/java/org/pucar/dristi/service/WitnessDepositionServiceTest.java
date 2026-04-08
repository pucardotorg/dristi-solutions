package org.pucar.dristi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.util.EvidenceUtil;
import org.pucar.dristi.util.FileStoreUtil;
import org.pucar.dristi.web.models.witnessdeposition.*;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.pucar.dristi.config.ServiceConstants.EVIDENCE_SERVICE_EXCEPTION;

@ExtendWith(MockitoExtension.class)
public class WitnessDepositionServiceTest {
    @Mock
    private EvidenceUtil evidenceUtil;
    @Mock
    private FileStoreUtil fileStoreUtil;
    @Mock
    private Configuration configuration;
    @Mock
    private UserService userService;
    @Mock
    private ObjectMapper objectMapper;
    @InjectMocks
    private WitnessDepositionService witnessDepositionService;

    @Test
    void testSearchWitnessDepositionByMobileNumber_success() {
        OpenApiEvidenceSearchRequest request = new OpenApiEvidenceSearchRequest();
        request.setTenantId("tenant");
        request.setArtifactNumber("artifact");
        request.setMobileNumber("12345");

        Artifact artifact = new Artifact();
        artifact.setWitnessMobileNumbers(List.of("12345"));
        EvidenceSearchResponse searchResponse = new EvidenceSearchResponse();
        searchResponse.setArtifacts(List.of(artifact));
        OpenApiEvidenceResponse expectedResponse = new OpenApiEvidenceResponse();

        when(evidenceUtil.searchEvidence(any(), any())).thenReturn(searchResponse);
        when(objectMapper.convertValue(any(), eq(OpenApiEvidenceResponse.class))).thenReturn(expectedResponse);

        OpenApiEvidenceResponse result = witnessDepositionService.searchWitnessDepositionByMobileNumber(request);
        assertEquals(expectedResponse, result);
        assertEquals("12345", result.getMobileNumber());
    }

    @Test
    void testSearchWitnessDepositionByMobileNumber_notFound() {
        OpenApiEvidenceSearchRequest request = new OpenApiEvidenceSearchRequest();
        EvidenceSearchResponse searchResponse = new EvidenceSearchResponse();
        searchResponse.setArtifacts(Collections.emptyList());
        when(evidenceUtil.searchEvidence(any(), any())).thenReturn(searchResponse);
        CustomException ex = assertThrows(CustomException.class, () -> witnessDepositionService.searchWitnessDepositionByMobileNumber(request));
        assertEquals(EVIDENCE_SERVICE_EXCEPTION, ex.getCode());
    }

    @Test
    void testSearchWitnessDepositionByMobileNumber_noMobileMatch() {
        OpenApiEvidenceSearchRequest request = new OpenApiEvidenceSearchRequest();
        request.setMobileNumber("notfound");
        Artifact artifact = new Artifact();
        artifact.setWitnessMobileNumbers(List.of("12345"));
        EvidenceSearchResponse searchResponse = new EvidenceSearchResponse();
        searchResponse.setArtifacts(List.of(artifact));
        when(evidenceUtil.searchEvidence(any(), any())).thenReturn(searchResponse);
        OpenApiEvidenceResponse result = witnessDepositionService.searchWitnessDepositionByMobileNumber(request);
        assertNull(result);
    }

    @Test
    void testSearchWitnessDepositionByMobileNumber_exception() {
        OpenApiEvidenceSearchRequest request = new OpenApiEvidenceSearchRequest();
        when(evidenceUtil.searchEvidence(any(), any())).thenThrow(new RuntimeException("fail"));
        CustomException ex = assertThrows(CustomException.class, () -> witnessDepositionService.searchWitnessDepositionByMobileNumber(request));
        assertEquals("EVIDENCE_SERVICE_EXCEPTION", ex.getCode());
    }

    @Test
    void testUpdateWitnessDeposition_success() {
        OpenApiEvidenceUpdateRequest request = new OpenApiEvidenceUpdateRequest();
        request.setTenantId("tenant");
        request.setArtifactNumber("artifact");
        request.setPartyType("type");
        request.setMobileNumber("12345");
        request.setFileStoreId("fileStore");

        Artifact artifact = new Artifact();
        artifact.setWitnessMobileNumbers(List.of("12345"));
        EvidenceSearchResponse searchResponse = new EvidenceSearchResponse();
        searchResponse.setArtifacts(List.of(artifact));
        EvidenceResponse evidenceResponse = new EvidenceResponse();
        OpenApiEvidenceResponse expectedResponse = new OpenApiEvidenceResponse();

        when(fileStoreUtil.getFilesByFileStore(anyString(), anyString(), any())).thenReturn(null);
        when(evidenceUtil.searchEvidence(any(), any())).thenReturn(searchResponse);
        when(evidenceUtil.updateEvidence(any(), any())).thenReturn(evidenceResponse);
        when(objectMapper.convertValue(any(EvidenceResponse.class), eq(OpenApiEvidenceResponse.class))).thenReturn(expectedResponse);

        OpenApiEvidenceResponse result = witnessDepositionService.updateWitnessDeposition(request);
        assertEquals(expectedResponse, result);
        assertEquals("12345", result.getMobileNumber());
    }

    @Test
    void testUpdateWitnessDeposition_notFound() {
        OpenApiEvidenceUpdateRequest request = new OpenApiEvidenceUpdateRequest();
        EvidenceSearchResponse searchResponse = new EvidenceSearchResponse();
        searchResponse.setArtifacts(Collections.emptyList());
        when(fileStoreUtil.getFilesByFileStore(anyString(), anyString(), any())).thenReturn(null);
        when(evidenceUtil.searchEvidence(any(), any())).thenReturn(searchResponse);
        CustomException ex = assertThrows(CustomException.class, () -> witnessDepositionService.updateWitnessDeposition(request));
        assertEquals("EVIDENCE_UPDATE_EXCEPTION", ex.getCode());
    }

    @Test
    void testUpdateWitnessDeposition_noMobileMatch() {
        OpenApiEvidenceUpdateRequest request = new OpenApiEvidenceUpdateRequest();
        request.setMobileNumber("notfound");
        Artifact artifact = new Artifact();
        artifact.setWitnessMobileNumbers(List.of("12345"));
        EvidenceSearchResponse searchResponse = new EvidenceSearchResponse();
        searchResponse.setArtifacts(List.of(artifact));
        when(evidenceUtil.searchEvidence(any(), any())).thenReturn(searchResponse);
        OpenApiEvidenceResponse result = witnessDepositionService.updateWitnessDeposition(request);
        assertNull(result);
    }

    @Test
    void testUpdateWitnessDeposition_exception() {
        OpenApiEvidenceUpdateRequest request = new OpenApiEvidenceUpdateRequest();
        when(fileStoreUtil.getFilesByFileStore(anyString(), anyString(), any())).thenReturn(null);
        when(evidenceUtil.searchEvidence(any(), any())).thenThrow(new RuntimeException("fail"));
        CustomException ex = assertThrows(CustomException.class, () -> witnessDepositionService.updateWitnessDeposition(request));
        assertEquals("EVIDENCE_UPDATE_EXCEPTION", ex.getCode());
    }

    @Test
    void testUpdateWitnessDeposition_NoEvidenceFound() {
        OpenApiEvidenceUpdateRequest request = new OpenApiEvidenceUpdateRequest();
        request.setFileStoreId("fileStore");
        when(evidenceUtil.searchEvidence(any(), any())).thenReturn(null);
        CustomException ex = assertThrows(CustomException.class, () -> witnessDepositionService.updateWitnessDeposition(request));
        assertEquals("EVIDENCE_UPDATE_EXCEPTION", ex.getCode());

    }

}
