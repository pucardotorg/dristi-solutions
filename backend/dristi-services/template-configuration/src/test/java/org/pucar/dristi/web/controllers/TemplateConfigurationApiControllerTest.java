package org.pucar.dristi.web.controllers;

import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.response.ResponseInfo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.pucar.dristi.service.TemplateConfigurationService;
import org.pucar.dristi.util.ResponseInfoFactory;
import org.pucar.dristi.web.models.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Collections;
import java.util.List;
import java.util.Objects;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TemplateConfigurationApiControllerTest {

    @InjectMocks
    private TemplateConfigurationApiController controller;

    @Mock
    private TemplateConfigurationService templateConfigurationService;

    @Mock
    private ResponseInfoFactory responseInfoFactory;

    @BeforeEach
    void setUp() {
        controller.setMockInjects(templateConfigurationService, responseInfoFactory);
    }

    // ===============================
    // CREATE SUCCESS
    // ===============================
    @Test
    void testTemplateV1CreatePost_Success() {

        TemplateConfiguration expectedTemplate = new TemplateConfiguration();
        when(templateConfigurationService.createTemplateConfiguration(any()))
                .thenReturn(expectedTemplate);

        ResponseInfo responseInfo = new ResponseInfo();
        when(responseInfoFactory.createResponseInfoFromRequestInfo(any(), any(), anyString()))
                .thenReturn(responseInfo);

        TemplateConfigurationRequest request = new TemplateConfigurationRequest();
        request.setRequestInfo(new RequestInfo());

        ResponseEntity<TemplateConfigurationResponse> response =
                controller.templateV1CreatePost(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(expectedTemplate, response.getBody().getTemplateConfiguration());
        assertEquals(responseInfo, response.getBody().getResponseInfo());
    }

    // ===============================
    // SEARCH SUCCESS (NO PAGINATION)
    // ===============================
    @Test
    void testTemplateV1SearchPost_Success_NoPagination() {

        TemplateConfigurationSearchRequest request = new TemplateConfigurationSearchRequest();
        request.setRequestInfo(new RequestInfo());

        List<TemplateConfiguration> list =
                Collections.singletonList(new TemplateConfiguration());

        when(templateConfigurationService.searchTemplateConfiguration(any()))
                .thenReturn(list);

        ResponseInfo responseInfo = new ResponseInfo();
        when(responseInfoFactory.createResponseInfoFromRequestInfo(any(), any(), anyString()))
                .thenReturn(responseInfo);

        ResponseEntity<TemplateConfigurationListResponse> response =
                controller.templateV1SearchPost(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().getTotalCount());
        assertEquals(responseInfo, response.getBody().getResponseInfo());
    }

    // ===============================
    // SEARCH SUCCESS (WITH PAGINATION)
    // ===============================
    @Test
    void testTemplateV1SearchPost_Success_WithPagination() {

        TemplateConfigurationSearchRequest request = new TemplateConfigurationSearchRequest();
        request.setRequestInfo(new RequestInfo());

        Pagination pagination = new Pagination();
        pagination.setTotalCount(5.0);
        request.setPagination(pagination);

        when(templateConfigurationService.searchTemplateConfiguration(any()))
                .thenReturn(Collections.emptyList());

        ResponseInfo responseInfo = new ResponseInfo();
        when(responseInfoFactory.createResponseInfoFromRequestInfo(any(), any(), anyString()))
                .thenReturn(responseInfo);

        ResponseEntity<TemplateConfigurationListResponse> response =
                controller.templateV1SearchPost(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(5, Objects.requireNonNull(response.getBody()).getTotalCount());
    }

    // ===============================
    // UPDATE SUCCESS
    // ===============================
    @Test
    void testTemplateV1UpdatePost_Success() {

        TemplateConfiguration expectedTemplate = new TemplateConfiguration();
        when(templateConfigurationService.updateTemplateConfiguration(any()))
                .thenReturn(expectedTemplate);

        ResponseInfo responseInfo = new ResponseInfo();
        when(responseInfoFactory.createResponseInfoFromRequestInfo(any(), any(), anyString()))
                .thenReturn(responseInfo);

        TemplateConfigurationRequest request = new TemplateConfigurationRequest();
        request.setRequestInfo(new RequestInfo());

        ResponseEntity<TemplateConfigurationResponse> response =
                controller.templateV1UpdatePost(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(expectedTemplate, Objects.requireNonNull(response.getBody()).getTemplateConfiguration());
        assertEquals(responseInfo, response.getBody().getResponseInfo());
    }

    // ===============================
    // CREATE INVALID
    // ===============================
    @Test
    void testTemplateV1CreatePost_InvalidRequest() {

        when(templateConfigurationService.createTemplateConfiguration(any()))
                .thenThrow(new IllegalArgumentException("Invalid request"));

        TemplateConfigurationRequest request = new TemplateConfigurationRequest();

        Exception exception = assertThrows(IllegalArgumentException.class, () ->
                controller.templateV1CreatePost(request));

        assertEquals("Invalid request", exception.getMessage());
    }

    // ===============================
    // SEARCH INVALID
    // ===============================
    @Test
    void testTemplateV1SearchPost_InvalidRequest() {

        when(templateConfigurationService.searchTemplateConfiguration(any()))
                .thenThrow(new IllegalArgumentException("Invalid request"));

        Exception exception = assertThrows(IllegalArgumentException.class, () ->
                controller.templateV1SearchPost(new TemplateConfigurationSearchRequest()));

        assertEquals("Invalid request", exception.getMessage());
    }

    // ===============================
    // UPDATE INVALID
    // ===============================
    @Test
    void testTemplateV1UpdatePost_InvalidRequest() {

        when(templateConfigurationService.updateTemplateConfiguration(any()))
                .thenThrow(new IllegalArgumentException("Invalid request"));

        Exception exception = assertThrows(IllegalArgumentException.class, () ->
                controller.templateV1UpdatePost(new TemplateConfigurationRequest()));

        assertEquals("Invalid request", exception.getMessage());
    }
}
