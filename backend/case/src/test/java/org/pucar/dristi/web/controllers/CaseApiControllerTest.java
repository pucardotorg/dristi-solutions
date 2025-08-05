package org.pucar.dristi.web.controllers;

import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.response.ResponseInfo;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.pucar.dristi.service.CaseService;
import org.pucar.dristi.service.WitnessService;
import org.pucar.dristi.util.ResponseInfoFactory;
import org.pucar.dristi.web.OpenApiCaseSummary;
import org.pucar.dristi.web.models.*;
import org.pucar.dristi.web.models.v2.WitnessDetails;
import org.pucar.dristi.web.models.v2.WitnessDetailsRequest;
import org.pucar.dristi.web.models.v2.WitnessDetailsResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * API tests for CaseApiController
 */
@ExtendWith(MockitoExtension.class)
public class CaseApiControllerTest {

    @InjectMocks
    private CaseApiController caseApiController;
    @Mock
    private CaseService caseService;
    @Mock
    private WitnessService witnessService;
    @Mock
    private ResponseInfoFactory responseInfoFactory;


    @Test
    public void caseV1CreatePostSuccess() {
        // Mocking request body
        CaseRequest caseRequest = new CaseRequest(); // Create a mock CaseRequest object

        // Mocking caseService.createCase method to return a CourtCase object
        CourtCase courtCase = new CourtCase(); // Create a mock CourtCase object
        when(caseService.createCase(caseRequest)).thenReturn(courtCase);

        // Mocking responseInfoFactory.createResponseInfoFromRequestInfo method to return a ResponseInfo object
        ResponseInfo responseInfo = new ResponseInfo(); // Create a mock ResponseInfo object
        when(responseInfoFactory.createResponseInfoFromRequestInfo(any(), any())).thenReturn(responseInfo);

        // Call the method under test
        ResponseEntity<CaseResponse> responseEntity = caseApiController.caseV1CreatePost(caseRequest);

        // Verify the response entity
        assertEquals(HttpStatus.OK, responseEntity.getStatusCode());
        assertEquals(courtCase, responseEntity.getBody().getCases().get(0));
    }

    @Test
    public void caseV1ExistsPostSuccess() {
        // Mocking request body
        CaseExistsRequest caseRequest = new CaseExistsRequest(); // Create a mock CaseRequest object

        // Mocking caseService.createCase method to return a CourtCase object
        CaseExists caseExists = new CaseExists(); // Create a mock CourtCase object
        when(caseService.existCases(caseRequest)).thenReturn(List.of(caseExists));

        // Mocking responseInfoFactory.createResponseInfoFromRequestInfo method to return a ResponseInfo object
        ResponseInfo responseInfo = new ResponseInfo(); // Create a mock ResponseInfo object
        when(responseInfoFactory.createResponseInfoFromRequestInfo(any(), any())).thenReturn(responseInfo);

        // Call the method under test
        ResponseEntity<CaseExistsResponse> responseEntity = caseApiController.caseV1ExistsPost(caseRequest);

        // Verify the response entity
        assertEquals(HttpStatus.OK, responseEntity.getStatusCode());
        assertEquals(caseExists, responseEntity.getBody().getCriteria().get(0));
    }

    @Test
    public void caseV1SearchPostSuccess() {
        // Mocking request body
        CaseSearchRequest caseRequest = new CaseSearchRequest(); // Create a mock CaseRequest object
        caseRequest.setCriteria(List.of(CaseCriteria.builder().cnrNumber("cnrNumber").build()));
        // Mocking caseService.createCase method to return a CourtCase object
        caseService.searchCases(caseRequest);

        // Mocking responseInfoFactory.createResponseInfoFromRequestInfo method to return a ResponseInfo object
        ResponseInfo responseInfo = new ResponseInfo(); // Create a mock ResponseInfo object
        when(responseInfoFactory.createResponseInfoFromRequestInfo(any(), any())).thenReturn(responseInfo);

        // Call the method under test
        ResponseEntity<CaseListResponse> responseEntity = caseApiController.caseV1SearchPost(caseRequest);

        // Verify the response entity
        assertEquals(HttpStatus.OK, responseEntity.getStatusCode());
        assertEquals(caseRequest.getCriteria(), responseEntity.getBody().getCriteria());
    }

    @Test
    public void addWitnessToCaseSuccess() {
        // Create test data
        WitnessDetailsRequest request = new WitnessDetailsRequest();
        RequestInfo requestInfo = new RequestInfo();
        request.setRequestInfo(requestInfo);
        
        // Create mock response
        WitnessDetailsResponse witnessDetailsResponse = new WitnessDetailsResponse();
        WitnessDetails witnessDetails = new WitnessDetails();
        witnessDetailsResponse.setWitnessDetails(Collections.singletonList(witnessDetails));
        
        // Mock the service call
        when(caseService.addWitnessToCase(request)).thenReturn(witnessDetailsResponse);
        
        // Mock the response info factory
        ResponseInfo responseInfo = new ResponseInfo();
        when(responseInfoFactory.createResponseInfoFromRequestInfo(any(), any())).thenReturn(responseInfo);
        
        // Call the method under test
        ResponseEntity<?> response = caseApiController.addWitnessToCase(request);
        
        // Verify the response
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof WitnessDetailsResponse);
        
        // Verify the service method was called with the correct parameter
        verify(caseService).addWitnessToCase(request);
        
        // Verify the response info was set correctly
        assertEquals(responseInfo, ((WitnessDetailsResponse) response.getBody()).getResponseInfo());
    }

    @Test
    public void verifyV1JoinCaseSuccess() {
        JoinCaseRequest joinCaseRequest = new JoinCaseRequest();
        RequestInfo requestInfo = new RequestInfo();
        joinCaseRequest.setRequestInfo(requestInfo);

        JoinCaseResponse joinCaseResponse = new JoinCaseResponse();
        ResponseInfo responseInfo = new ResponseInfo();
        // Mocking caseService.verifyJoinCaseRequest method to return a JoinCaseResponse object
        when(caseService.verifyJoinCaseRequest(any(JoinCaseRequest.class),any())).thenReturn(joinCaseResponse);

        // Mocking responseInfoFactory.createResponseInfoFromRequestInfo method to return a ResponseInfo object
        when(responseInfoFactory.createResponseInfoFromRequestInfo(any(RequestInfo.class), any(Boolean.class))).thenReturn(responseInfo);

        // Call the method under test
        ResponseEntity<JoinCaseResponse> responseEntity = caseApiController.verifyV1JoinCase(joinCaseRequest);

        // Verify the response entity
        assertEquals(HttpStatus.OK, responseEntity.getStatusCode());
        assertEquals(responseInfo, responseEntity.getBody().getResponseInfo());
    }

    @Test
    public void caseV1UpdatePostSuccess() {
        // Mocking request body
        CaseRequest caseRequest = new CaseRequest(); // Create a mock CaseRequest object

        // Mocking caseService.createCase method to return a CourtCase object
        CourtCase courtCase = new CourtCase(); // Create a mock CourtCase object
        when(caseService.updateCase(caseRequest)).thenReturn(courtCase);

        // Mocking responseInfoFactory.createResponseInfoFromRequestInfo method to return a ResponseInfo object
        ResponseInfo responseInfo = new ResponseInfo(); // Create a mock ResponseInfo object
        when(responseInfoFactory.createResponseInfoFromRequestInfo(any(), any())).thenReturn(responseInfo);

        // Call the method under test
        ResponseEntity<CaseResponse> responseEntity = caseApiController.caseV1UpdatePost(caseRequest);

        // Verify the response entity
        assertEquals(HttpStatus.OK, responseEntity.getStatusCode());
        assertEquals(courtCase, responseEntity.getBody().getCases().get(0));
    }

    @Test
    public void caseWitnessV1CreatePostSuccess() {
        // Mocking request body
        WitnessRequest witnessRequest = new WitnessRequest(); // Create a mock CaseRequest object

        // Mocking caseService.createCase method to return a CourtCase object
        Witness witness = new Witness(); // Create a mock CourtCase object
        when(witnessService.registerWitnessRequest(witnessRequest)).thenReturn(witness);

        // Mocking responseInfoFactory.createResponseInfoFromRequestInfo method to return a ResponseInfo object
        ResponseInfo responseInfo = new ResponseInfo(); // Create a mock ResponseInfo object
        when(responseInfoFactory.createResponseInfoFromRequestInfo(any(), any())).thenReturn(responseInfo);

        // Call the method under test
        ResponseEntity<WitnessResponse> responseEntity = caseApiController.caseWitnessV1CreatePost(witnessRequest);

        // Verify the response entity
        assertEquals(HttpStatus.OK, responseEntity.getStatusCode());
        assertEquals(witness, responseEntity.getBody().getWitnesses().get(0));
    }

    @Test
    public void caseWitnessV1SearchPostSuccess() {
        // Mocking request body
        WitnessSearchRequest witnessRequest = new WitnessSearchRequest(); // Create a mock CaseRequest object

        // Mocking caseService.createCase method to return a CourtCase object
        Witness witness = new Witness(); // Create a mock CourtCase object
        when(witnessService.searchWitnesses(witnessRequest)).thenReturn(List.of(witness));

        // Mocking responseInfoFactory.createResponseInfoFromRequestInfo method to return a ResponseInfo object
        ResponseInfo responseInfo = new ResponseInfo(); // Create a mock ResponseInfo object
        when(responseInfoFactory.createResponseInfoFromRequestInfo(any(), any())).thenReturn(responseInfo);

        // Call the method under test
        ResponseEntity<WitnessResponse> responseEntity = caseApiController.caseWitnessV1SearchPost(witnessRequest);

        // Verify the response entity
        assertEquals(HttpStatus.OK, responseEntity.getStatusCode());
        assertEquals(witness, responseEntity.getBody().getWitnesses().get(0));
    }

    @Test
    public void caseWitnessV1UpdatePostSuccess() {
        // Mocking request body
        WitnessRequest witnessRequest = new WitnessRequest(); // Create a mock CaseRequest object

        // Mocking caseService.createCase method to return a CourtCase object
        Witness witness = new Witness(); // Create a mock CourtCase object
        when(witnessService.updateWitness(witnessRequest)).thenReturn(witness);

        // Mocking responseInfoFactory.createResponseInfoFromRequestInfo method to return a ResponseInfo object
        ResponseInfo responseInfo = new ResponseInfo(); // Create a mock ResponseInfo object
        when(responseInfoFactory.createResponseInfoFromRequestInfo(any(), any())).thenReturn(responseInfo);

        // Call the method under test
        ResponseEntity<WitnessResponse> responseEntity = caseApiController.caseWitnessV1UpdatePost(witnessRequest);

        // Verify the response entity
        assertEquals(HttpStatus.OK, responseEntity.getStatusCode());
        assertEquals(witness, responseEntity.getBody().getWitnesses().get(0));
    }



    @Test
    public void caseV1SummaryPost_withEmptyResponse() {
        CaseSummaryRequest caseSummaryRequest = new CaseSummaryRequest();
        RequestInfo requestInfo = new RequestInfo();
        caseSummaryRequest.setRequestInfo(requestInfo);
        caseSummaryRequest.setPagination(new Pagination());


        ResponseEntity<CaseSummaryResponse> responseEntity = caseApiController.caseV1SummaryPost(caseSummaryRequest);

        assertEquals(HttpStatus.OK, responseEntity.getStatusCode());
        assertTrue(responseEntity.getBody().getCases().isEmpty());
    }

    @Test
    public void caseV1SummaryPostSuccessV1() {
        CaseSummaryRequest caseSummaryRequest = new CaseSummaryRequest();
        RequestInfo requestInfo = new RequestInfo();
        caseSummaryRequest.setRequestInfo(requestInfo);
        caseSummaryRequest.setPagination(new Pagination());

        List<CaseSummary> emptyCaseList = Collections.emptyList();
        when(caseService.getCaseSummary(any())).thenReturn(emptyCaseList);

        ResponseInfo mockResponseInfo = new ResponseInfo();
        when(responseInfoFactory.createResponseInfoFromRequestInfo(any(), any())).thenReturn(mockResponseInfo);

        ResponseEntity<CaseSummaryResponse> responseEntity = caseApiController.caseV1SummaryPost(caseSummaryRequest);

        assertEquals(HttpStatus.OK, responseEntity.getStatusCode());
        assertEquals(0, responseEntity.getBody().getCases().size());
        assertEquals(mockResponseInfo, responseEntity.getBody().getResponseInfo());
        verify(caseService).getCaseSummary(caseSummaryRequest);
        verify(responseInfoFactory).createResponseInfoFromRequestInfo(eq(requestInfo), eq(true));
    }

    @Test
    public void caseV1SearchCnrNumberPostSuccess() {

        OpenApiCaseSummaryRequest openApiCaseSummary = new OpenApiCaseSummaryRequest();
        openApiCaseSummary.setCnrNumber("cnrNumber");
        ResponseEntity<OpenApiCaseSummaryResponse> responseEntity = caseApiController.caseV1SearchCnrNumber(openApiCaseSummary);
        assertEquals(HttpStatus.OK, responseEntity.getStatusCode());
    }

    @Test
    public void caseV1SearchCaseTypeSuccess() {

        OpenApiCaseSummaryRequest openApiCaseSummary = new OpenApiCaseSummaryRequest();
        openApiCaseSummary.setCaseType("caseType");
        ResponseEntity<OpenApiCaseListResponse> responseEntity = caseApiController.caseV1SearchCaseType(openApiCaseSummary);
        assertEquals(HttpStatus.OK, responseEntity.getStatusCode());
    }

    @Test
    public void caseV1caseSearchCaseNumberSuccess() {

        OpenApiCaseSummaryRequest openApiCaseSummary = new OpenApiCaseSummaryRequest();
        openApiCaseSummary.setCaseNumber(10);
        ResponseEntity<OpenApiCaseSummaryResponse> responseEntity = caseApiController.caseV1SearchCaseNumber(openApiCaseSummary);
        assertEquals(HttpStatus.OK, responseEntity.getStatusCode());
    }


    @Test
    public void updateCaseWithoutWorkflowSuccess() {
        // Mocking request body
        CaseRequest caseRequest = new CaseRequest();
        RequestInfo requestInfo = new RequestInfo();
        caseRequest.setRequestInfo(requestInfo);

        // Mocking caseService.updateCaseWithoutWorkflow method to return a CourtCase object
        CourtCase courtCase = new CourtCase();
        courtCase.setId(UUID.randomUUID());
        courtCase.setCaseNumber("CASE-2024-001");
        when(caseService.updateCaseWithoutWorkflow(caseRequest)).thenReturn(courtCase);

        // Mocking responseInfoFactory.createResponseInfoFromRequestInfo method to return a ResponseInfo object
        ResponseInfo responseInfo = new ResponseInfo();
        responseInfo.setApiId("case-services");
        responseInfo.setVer("1.0");
        responseInfo.setTs(System.currentTimeMillis());
        when(responseInfoFactory.createResponseInfoFromRequestInfo(requestInfo, true)).thenReturn(responseInfo);

        // Call the method under test
        ResponseEntity<CaseResponse> responseEntity = caseApiController.updateCaseWithoutWorkflow(caseRequest);

        // Verify the response entity
        assertEquals(HttpStatus.OK, responseEntity.getStatusCode());
        assertEquals(courtCase, responseEntity.getBody().getCases().get(0));
        assertEquals(responseInfo, responseEntity.getBody().getResponseInfo());
        assertEquals(1, responseEntity.getBody().getCases().size());

        // Verify service method was called
        verify(caseService).updateCaseWithoutWorkflow(caseRequest);
        verify(responseInfoFactory).createResponseInfoFromRequestInfo(requestInfo, true);
    }
}
