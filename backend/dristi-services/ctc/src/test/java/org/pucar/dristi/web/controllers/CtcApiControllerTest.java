package org.pucar.dristi.web.controllers;

import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.common.contract.response.ResponseInfo;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.pucar.dristi.service.CtcApplicationService;
import org.pucar.dristi.util.ResponseInfoFactory;
import org.pucar.dristi.web.models.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CtcApiControllerTest {

    @Mock private CtcApplicationService ctcApplicationService;
    @Mock private ResponseInfoFactory responseInfoFactory;

    @InjectMocks
    private CtcApiController controller;

    private RequestInfo requestInfo;
    private ResponseInfo responseInfo;
    private CtcApplication application;

    @BeforeEach
    void setUp() {
        requestInfo = RequestInfo.builder()
                .userInfo(User.builder().uuid("user-1").build())
                .build();

        responseInfo = ResponseInfo.builder().status("successful").build();

        application = CtcApplication.builder()
                .id("app-1").ctcApplicationNumber("CA-001").tenantId("kl").build();

        lenient().when(responseInfoFactory.createResponseInfoFromRequestInfo(any(), eq(true)))
                .thenReturn(responseInfo);
    }

    // ---- createApplication tests ----

    @Test
    void createApplication_shouldReturn201WithResponse() {
        CtcApplicationRequest request = CtcApplicationRequest.builder()
                .requestInfo(requestInfo).ctcApplication(application).build();

        when(ctcApplicationService.createApplication(request)).thenReturn(application);

        ResponseEntity<CtcApplicationResponse> result = controller.createApplication(request);

        assertEquals(HttpStatus.CREATED, result.getStatusCode());
        assertNotNull(result.getBody());
        assertEquals("CA-001", result.getBody().getCtcApplication().getCtcApplicationNumber());
        assertEquals("successful", result.getBody().getResponseInfo().getStatus());
    }

    @Test
    void createApplication_shouldRethrowCustomException() {
        CtcApplicationRequest request = CtcApplicationRequest.builder()
                .requestInfo(requestInfo).ctcApplication(application).build();

        when(ctcApplicationService.createApplication(request))
                .thenThrow(new CustomException("VALIDATION", "Invalid"));

        CustomException ex = assertThrows(CustomException.class, () -> controller.createApplication(request));
        assertEquals("VALIDATION", ex.getCode());
    }

    @Test
    void createApplication_shouldWrapUnexpectedExceptionAsCustomException() {
        CtcApplicationRequest request = CtcApplicationRequest.builder()
                .requestInfo(requestInfo).ctcApplication(application).build();

        when(ctcApplicationService.createApplication(request))
                .thenThrow(new RuntimeException("unexpected"));

        CustomException ex = assertThrows(CustomException.class, () -> controller.createApplication(request));
        assertEquals("CTC_CREATE_ERROR", ex.getCode());
    }

    // ---- updateApplication tests ----

    @Test
    void updateApplication_shouldReturn200WithResponse() {
        CtcApplicationRequest request = CtcApplicationRequest.builder()
                .requestInfo(requestInfo).ctcApplication(application).build();

        when(ctcApplicationService.updateApplication(request)).thenReturn(application);

        ResponseEntity<CtcApplicationResponse> result = controller.updateApplication(request);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
        assertEquals("CA-001", result.getBody().getCtcApplication().getCtcApplicationNumber());
    }

    @Test
    void updateApplication_shouldRethrowCustomException() {
        CtcApplicationRequest request = CtcApplicationRequest.builder()
                .requestInfo(requestInfo).ctcApplication(application).build();

        when(ctcApplicationService.updateApplication(request))
                .thenThrow(new CustomException("UPDATE_ERR", "fail"));

        assertThrows(CustomException.class, () -> controller.updateApplication(request));
    }

    @Test
    void updateApplication_shouldWrapUnexpectedException() {
        CtcApplicationRequest request = CtcApplicationRequest.builder()
                .requestInfo(requestInfo).ctcApplication(application).build();

        when(ctcApplicationService.updateApplication(request))
                .thenThrow(new RuntimeException("oops"));

        CustomException ex = assertThrows(CustomException.class, () -> controller.updateApplication(request));
        assertEquals("CTC_UPDATE_ERROR", ex.getCode());
    }

    // ---- searchApplications tests ----

    @Test
    void searchApplications_shouldReturn200WithResults() {
        Pagination pagination = Pagination.builder().totalCount(1.0).build();
        CtcApplicationSearchRequest request = CtcApplicationSearchRequest.builder()
                .requestInfo(requestInfo)
                .criteria(CtcApplicationSearchCriteria.builder().tenantId("kl").build())
                .pagination(pagination)
                .build();

        when(ctcApplicationService.searchApplications(request)).thenReturn(List.of(application));

        ResponseEntity<CtcApplicationSearchResponse> result = controller.searchApplications(request);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertEquals(1, result.getBody().getCtcApplications().size());
        assertEquals(1.0, result.getBody().getTotalCount());
    }

    @Test
    void searchApplications_shouldRethrowCustomException() {
        CtcApplicationSearchRequest request = CtcApplicationSearchRequest.builder()
                .requestInfo(requestInfo)
                .criteria(CtcApplicationSearchCriteria.builder().build())
                .pagination(Pagination.builder().build())
                .build();

        when(ctcApplicationService.searchApplications(request))
                .thenThrow(new CustomException("SEARCH_ERR", "fail"));

        assertThrows(CustomException.class, () -> controller.searchApplications(request));
    }

    // ---- reviewApplications tests ----

    @Test
    void reviewApplications_shouldReturn200() {
        CtcApplicationReviewRequest request = CtcApplicationReviewRequest.builder()
                .requestInfo(requestInfo).courtId("KLKM52").action("APPROVE")
                .applications(List.of(ReviewItem.builder().ctcApplicationNumber("CA-001").build()))
                .build();

        when(ctcApplicationService.reviewApplications(request)).thenReturn(List.of(application));

        ResponseEntity<CtcApplicationSearchResponse> result = controller.reviewApplications(request);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertEquals(1, result.getBody().getCtcApplications().size());
    }

    @Test
    void reviewApplications_shouldWrapUnexpectedException() {
        CtcApplicationReviewRequest request = CtcApplicationReviewRequest.builder()
                .requestInfo(requestInfo).courtId("KLKM52").action("APPROVE")
                .applications(List.of(ReviewItem.builder().ctcApplicationNumber("CA-001").build()))
                .build();

        when(ctcApplicationService.reviewApplications(request))
                .thenThrow(new RuntimeException("fail"));

        CustomException ex = assertThrows(CustomException.class, () -> controller.reviewApplications(request));
        assertEquals("CTC_REVIEW_ERROR", ex.getCode());
    }

    // ---- markDocumentsAsIssuedOrReject tests ----

    @Test
    void markDocumentsAsIssuedOrReject_shouldReturn200() {
        DocumentActionItem item = DocumentActionItem.builder()
                .docId("doc-1").ctcApplicationNumber("CA-001").filingNumber("FIL-001").build();
        IssueCtcDocumentUpdateRequest request = IssueCtcDocumentUpdateRequest.builder()
                .requestInfo(requestInfo).courtId("KLKM52").action("ISSUE")
                .docs(List.of(item)).build();

        doNothing().when(ctcApplicationService).markDocumentsAsIssuedOrReject(request);

        ResponseEntity<IssueCtcDocumentUpdateResponse> result = controller.markDocumentsAsIssuedOrReject(request);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertEquals(1, result.getBody().getDocs().size());
    }

    @Test
    void markDocumentsAsIssuedOrReject_shouldRethrowCustomException() {
        IssueCtcDocumentUpdateRequest request = IssueCtcDocumentUpdateRequest.builder()
                .requestInfo(requestInfo).courtId("KLKM52").action("ISSUE")
                .docs(List.of(DocumentActionItem.builder().docId("d1").ctcApplicationNumber("CA-001").filingNumber("F1").build()))
                .build();

        doThrow(new CustomException("ERR", "fail")).when(ctcApplicationService).markDocumentsAsIssuedOrReject(request);

        assertThrows(CustomException.class, () -> controller.markDocumentsAsIssuedOrReject(request));
    }

    // ---- validateUser tests ----

    @Test
    void validateUser_shouldReturn200WithInfo() {
        ValidateUserRequest request = ValidateUserRequest.builder()
                .requestInfo(requestInfo).filingNumber("FIL-001")
                .mobileNumber("9876543210").tenantId("kl").courtId("KLKM52").build();

        ValidateUserInfo info = ValidateUserInfo.builder()
                .userName("John").designation("Complainant").mobileNumber("9876543210")
                .filingNumber("FIL-001").courtId("KLKM52").isPartyToCase(true).build();

        when(ctcApplicationService.validateUser(request)).thenReturn(info);

        ResponseEntity<ValidateUserResponse> result = controller.validateUser(request);

        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertEquals("John", result.getBody().getValidateUserInfo().getUserName());
    }

    @Test
    void validateUser_shouldWrapUnexpectedException() {
        ValidateUserRequest request = ValidateUserRequest.builder()
                .requestInfo(requestInfo).filingNumber("FIL-001")
                .mobileNumber("9876543210").tenantId("kl").courtId("KLKM52").build();

        when(ctcApplicationService.validateUser(request)).thenThrow(new RuntimeException("err"));

        CustomException ex = assertThrows(CustomException.class, () -> controller.validateUser(request));
        assertEquals("VALIDATE_USER_CTC_ERROR", ex.getCode());
    }
}
