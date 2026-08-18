package org.pucar.dristi.enrichment;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.web.models.*;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class TemplateConfigurationEnrichmentTest {

    @Mock
    private Configuration configuration;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private TemplateConfigurationEnrichment enrichment;

    private TemplateConfigurationRequest request;
    private TemplateConfiguration templateConfiguration;
    private RequestInfo requestInfo;
    private User userInfo;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        enrichment = new TemplateConfigurationEnrichment(configuration, objectMapper);

        templateConfiguration = new TemplateConfiguration();
        request = new TemplateConfigurationRequest();
        requestInfo = new RequestInfo();
        userInfo = new User();

        userInfo.setUuid("test-user-uuid");
        requestInfo.setUserInfo(userInfo);

        request.setRequestInfo(requestInfo);
        request.setTemplateConfiguration(templateConfiguration);
    }

    // ==============================
    // CREATE TEST
    // ==============================

    @Test
    void testEnrichTemplateConfigurationOnCreate_Success() {
        enrichment.enrichTemplateConfigurationOnCreate(request);

        assertNotNull(request.getTemplateConfiguration().getId());
        assertNotNull(request.getTemplateConfiguration().getAuditDetails());

        AuditDetails audit = request.getTemplateConfiguration().getAuditDetails();

        assertEquals("test-user-uuid", audit.getCreatedBy());
        assertEquals("test-user-uuid", audit.getLastModifiedBy());
        assertNotNull(audit.getCreatedTime());
        assertNotNull(audit.getLastModifiedTime());

        assertTrue(audit.getCreatedTime() > 0);
        assertTrue(audit.getLastModifiedTime() > 0);
    }

    // ==============================
    // UPDATE TEST
    // ==============================

    @Test
    void testEnrichTemplateConfigurationOnUpdate_Success() {
        AuditDetails auditDetails = new AuditDetails();
        templateConfiguration.setAuditDetails(auditDetails);

        enrichment.enrichTemplateConfigurationOnUpdate(request);

        assertEquals("test-user-uuid", auditDetails.getLastModifiedBy());
        assertNotNull(auditDetails.getLastModifiedTime());
        assertTrue(auditDetails.getLastModifiedTime() > 0);
    }

    // ==============================
    // EXCEPTION TESTS
    // ==============================

    @Test
    void testEnrichTemplateConfigurationOnCreate_CustomExceptionThrown() {

        TemplateConfigurationRequest spyRequest = spy(request);

        doThrow(new CustomException("ERR", "Custom error"))
                .when(spyRequest)
                .getTemplateConfiguration();

        assertThrows(CustomException.class,
                () -> enrichment.enrichTemplateConfigurationOnCreate(spyRequest));
    }

    @Test
    void testEnrichTemplateConfigurationOnCreate_GenericExceptionThrown() {

        TemplateConfigurationRequest spyRequest = spy(request);

        doThrow(new RuntimeException("Runtime error"))
                .when(spyRequest)
                .getTemplateConfiguration();

        assertThrows(RuntimeException.class,
                () -> enrichment.enrichTemplateConfigurationOnCreate(spyRequest));
    }
}
