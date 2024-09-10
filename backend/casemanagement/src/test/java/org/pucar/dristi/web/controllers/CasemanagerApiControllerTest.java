package org.pucar.dristi.web.controllers;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.response.ResponseInfo;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.pucar.dristi.service.CaseManagerService;
import org.pucar.dristi.service.ServiceUrlMapperVCService;
import org.pucar.dristi.service.ServiceUrlMappingPdfService;
import org.pucar.dristi.util.ResponseInfoFactory;
import org.pucar.dristi.web.models.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
public class CasemanagerApiControllerTest {

    @Mock
    private HttpServletRequest request;
    @Mock
    private ObjectMapper objectMapper;
    @Mock
    private CaseManagerService caseManagerService;
    @Mock
    private ResponseInfoFactory responseInfoFactory;
    @Mock
    private ServiceUrlMapperVCService serviceUrlMapperVCService;
    @Mock
    private ServiceUrlMappingPdfService serviceUrlMappingPdfService;

    @InjectMocks
    private CasemanagerApiController controller;

    @Test
    void testCasemanagerCaseV1GroupPost_WithAcceptHeader() throws Exception {
        CaseGroupRequest body = new CaseGroupRequest();
        when(request.getHeader("Accept")).thenReturn("application/json");
        when(objectMapper.readValue(anyString(), eq(CaseGroupResponse.class)))
                .thenReturn(new CaseGroupResponse());

        ResponseEntity<CaseGroupResponse> response = controller.casemanagerCaseV1GroupPost(body);

        assertEquals(HttpStatus.NOT_IMPLEMENTED, response.getStatusCode());
        assertNotNull(response.getBody());
    }

    @Test
    void testCasemanagerCaseV1GroupPost_WithoutAcceptHeader() {
        CaseGroupRequest body = new CaseGroupRequest();
        when(request.getHeader("Accept")).thenReturn(null);

        ResponseEntity<CaseGroupResponse> response = controller.casemanagerCaseV1GroupPost(body);

        assertEquals(HttpStatus.NOT_IMPLEMENTED, response.getStatusCode());
        assertNull(response.getBody());
    }

    @Test
    void testCasemanagerCaseV1HistoryPost_EmptyResponse() {
        CaseRequest body = new CaseRequest();
        RequestInfo requestInfo = new RequestInfo();
        body.setRequestInfo(requestInfo);

        when(caseManagerService.getCaseFiles(body)).thenReturn(List.of());
        when(responseInfoFactory.createResponseInfoFromRequestInfo(requestInfo, true))
                .thenReturn(new ResponseInfo());

        ResponseEntity<CaseFileResponse> response = controller.casemanagerCaseV1HistoryPost(body);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().getCaseFiles().isEmpty());
    }

    @Test
    void testCasemanagerCaseV1SummaryPost_NullResponse() {
        CaseRequest body = new CaseRequest();
        body.setPagination(mock(Pagination.class));
        RequestInfo requestInfo = new RequestInfo();
        body.setRequestInfo(requestInfo);

        when(caseManagerService.getCaseSummary(body)).thenReturn(new ArrayList<>());

        ResponseEntity<CaseSummaryResponse> response = controller.casemanagerCaseV1SummaryPost(body);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }

    @Test
    void testCasemanagerCaseV1UngroupPost_WithAcceptHeader() throws Exception {
        CaseGroupRequest body = new CaseGroupRequest();
        when(request.getHeader("Accept")).thenReturn("application/json");
        when(objectMapper.readValue(anyString(), eq(CaseGroupResponse.class)))
                .thenReturn(new CaseGroupResponse());

        ResponseEntity<CaseGroupResponse> response = controller.casemanagerCaseV1UngroupPost(body);

        assertEquals(HttpStatus.NOT_IMPLEMENTED, response.getStatusCode());
        assertNotNull(response.getBody());
    }

    @Test
    void testGenerateVc_NullResponse() {
        VcCredentialRequest request = new VcCredentialRequest();
        when(serviceUrlMapperVCService.generateVc(request)).thenReturn(null);

        ResponseEntity<VcCredentialRequest> response = controller.generateVc(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNull(response.getBody());
    }

    @Test
    void testGetPdf_NullResponse() {
        PdfRequest request = new PdfRequest();
        when(serviceUrlMappingPdfService.getSVcUrlMappingPdf(request)).thenReturn(null);

        ResponseEntity<Object> response = controller.getPdf(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNull(response.getBody());
    }
}